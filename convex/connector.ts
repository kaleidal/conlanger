import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

const AVE_TOKEN_URL = process.env.AVE_TOKEN_URL || "https://api.aveid.net/api/oauth/token";
const AVE_CLIENT_ID =
  process.env.VITE_AVE_CLIENT_ID || "app_410708d4acd03edd8eeb8a8eb88ecfe7";
const AVE_CLIENT_SECRET = process.env.AVE_CLIENT_SECRET;
const IRIS_HTTP_URL =
  process.env.IRIS_HTTP_URL || process.env.VITE_IRIS_HTTP_URL || "";
const IRIS_CONNECTOR_RESOURCE =
  process.env.IRIS_CONNECTOR_RESOURCE ||
  process.env.VITE_IRIS_CONNECTOR_RESOURCE ||
  "iris:inference";
const LEGACY_IRIS_CONNECTOR_RESOURCE = "iris:inference";

async function findConnectorGrant(ctx: any, userId: string, resource?: string) {
  const targets = resource
    ? [resource]
    : [IRIS_CONNECTOR_RESOURCE, LEGACY_IRIS_CONNECTOR_RESOURCE];

  for (const target of targets) {
    const existing = await ctx.db
      .query("connectorGrants")
      .withIndex("by_user_resource", (q: any) => q.eq("userId", userId).eq("resource", target))
      .first();
    if (existing) return existing;
  }

  return null;
}

function parseScopes(scope: string): string[] {
  return scope
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function parseJsonSafe(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return { raw };
  }
}

function tokenExchangeBody(input: {
  subjectToken: string;
  requestedResource: string;
  requestedScope: string;
}) {
  return {
    grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
    subjectToken: input.subjectToken,
    requestedResource: input.requestedResource,
    requestedScope: input.requestedScope,
    clientId: AVE_CLIENT_ID,
    clientSecret: AVE_CLIENT_SECRET,
  };
}

async function exchangeDelegatedToken(input: {
  subjectToken: string;
  requestedResource: string;
  requestedScope: string;
}) {
  const response = await fetch(AVE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokenExchangeBody(input)),
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok || !payload?.access_token) {
    const details =
      payload?.error_description || payload?.error || payload?.message || "Unknown error";
    throw new Error(`Delegated token exchange failed (${response.status}): ${details}`);
  }

  return {
    delegatedAccessToken: payload.access_token as string,
    delegatedExpiresIn: Number(payload.expires_in ?? 600),
    communicationMode: (payload.communication_mode ?? "user_present") as
      | "user_present"
      | "background",
  };
}

function normalizeSourceTokenPayload(payload: any) {
  const sourceAccessToken = String(payload?.access_token_jwt || payload?.access_token || "");
  const sourceRefreshToken = payload?.refresh_token ? String(payload.refresh_token) : undefined;
  const sourceAccessExpiresAt = payload?.expires_in
    ? Date.now() + Number(payload.expires_in) * 1000
    : undefined;

  if (!sourceAccessToken) {
    throw new Error("Source access token missing from Ave token response.");
  }

  return { sourceAccessToken, sourceRefreshToken, sourceAccessExpiresAt };
}

function isSubjectTokenInvalidError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("subject token is invalid") || message.includes("invalid_grant");
}

async function refreshSourceAccessToken(refreshToken: string) {
  if (!AVE_CLIENT_SECRET) {
    throw new Error("AVE_CLIENT_SECRET is required for source token refresh.");
  }

  const response = await fetch(AVE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grantType: "refresh_token",
      refreshToken,
      clientId: AVE_CLIENT_ID,
      clientSecret: AVE_CLIENT_SECRET,
    }),
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    const details = payload?.error_description || payload?.error || payload?.message || "Unknown error";
    throw new Error(`Source token refresh failed (${response.status}): ${details}`);
  }

  return normalizeSourceTokenPayload(payload);
}

function isResourceNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("requested resource not found") || message.includes("resource not found");
}

export const getConnectorGrant = query({
  args: {
    userId: v.id("users"),
    resource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await findConnectorGrant(ctx, args.userId, args.resource);
  },
});

export const getLanguageContext = query({
  args: {
    userId: v.id("users"),
    languageId: v.id("languages"),
  },
  handler: async (ctx, args) => {
    const language = await ctx.db.get(args.languageId);
    if (!language) throw new Error("Language not found.");

    let canWrite = language.ownerId === args.userId;

    if (language.ownerId !== args.userId) {
      const collab = await ctx.db
        .query("collaborators")
        .withIndex("by_language_user", (q) =>
          q.eq("languageId", args.languageId).eq("userId", args.userId),
        )
        .first();
      if (!collab && !language.isPublic) throw new Error("You don't have access to this language.");
      if (collab?.role === "editor") canWrite = true;
    }

    const words = await ctx.db
      .query("words")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .take(240);

    return {
      language: {
        id: language._id,
        name: language.name,
        nativeName: language.nativeName,
        description: language.description,
        isPublic: language.isPublic,
      },
      canWrite,
      words: words.map((w) => ({
        _id: w._id,
        lemma: w.lemma,
        ipa: w.ipa,
        wordClass: w.wordClass,
      })),
    };
  },
});

export const disconnectConnectorGrant = mutation({
  args: {
    userId: v.id("users"),
    resource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targets = args.resource
      ? [args.resource]
      : [IRIS_CONNECTOR_RESOURCE, LEGACY_IRIS_CONNECTOR_RESOURCE];

    for (const target of targets) {
      const existing = await ctx.db
        .query("connectorGrants")
        .withIndex("by_user_resource", (q) =>
          q.eq("userId", args.userId).eq("resource", target),
        )
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }

    return { disconnected: true };
  },
});

export const completeConnectorGrant = action({
  args: {
    userId: v.id("users"),
    code: v.string(),
    codeVerifier: v.optional(v.string()),
    redirectUri: v.string(),
    resource: v.string(),
    scope: v.string(),
    mode: v.optional(v.union(v.literal("user_present"), v.literal("background"))),
  },
  handler: async (ctx, args) => {
    if (!AVE_CLIENT_SECRET) {
      throw new Error(
        "Connector setup requires AVE_CLIENT_SECRET in Convex environment for token exchange.",
      );
    }

    const user = await ctx.runQuery(api.auth.getUser, { userId: args.userId });
    if (!user) throw new Error("User not found.");

    const codeExchangeResponse = await fetch(AVE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantType: "authorization_code",
        code: args.code,
        redirectUri: args.redirectUri,
        clientId: AVE_CLIENT_ID,
        clientSecret: AVE_CLIENT_SECRET,
        codeVerifier: args.codeVerifier,
      }),
    });

    const codeExchangePayload = await parseJsonSafe(codeExchangeResponse);
    if (!codeExchangeResponse.ok || !codeExchangePayload?.access_token) {
      const details =
        codeExchangePayload?.error_description ||
        codeExchangePayload?.error ||
        codeExchangePayload?.message ||
        "Unknown error";
      throw new Error(`Connector auth code exchange failed (${codeExchangeResponse.status}): ${details}`);
    }

    const normalizedSource = normalizeSourceTokenPayload(codeExchangePayload);
    let sourceAccessToken = normalizedSource.sourceAccessToken;
    let sourceRefreshToken = normalizedSource.sourceRefreshToken;
    let sourceAccessExpiresAt = normalizedSource.sourceAccessExpiresAt;
    let effectiveResource = args.resource;
    let delegated;
    try {
      delegated = await exchangeDelegatedToken({
        subjectToken: sourceAccessToken,
        requestedResource: effectiveResource,
        requestedScope: args.scope,
      });
    } catch (error) {
      if (isSubjectTokenInvalidError(error) && sourceRefreshToken) {
        const refreshedSource = await refreshSourceAccessToken(sourceRefreshToken);
        sourceAccessToken = refreshedSource.sourceAccessToken;
        sourceRefreshToken = refreshedSource.sourceRefreshToken || sourceRefreshToken;
        sourceAccessExpiresAt = refreshedSource.sourceAccessExpiresAt;
        delegated = await exchangeDelegatedToken({
          subjectToken: sourceAccessToken,
          requestedResource: effectiveResource,
          requestedScope: args.scope,
        });
      } else {
      if (!isResourceNotFoundError(error) || effectiveResource === LEGACY_IRIS_CONNECTOR_RESOURCE) {
        throw error;
      }

      effectiveResource = LEGACY_IRIS_CONNECTOR_RESOURCE;
      delegated = await exchangeDelegatedToken({
        subjectToken: sourceAccessToken,
        requestedResource: effectiveResource,
        requestedScope: args.scope,
      });
      }
    }

    const now = Date.now();
    const delegatedExpiresAt = now + delegated.delegatedExpiresIn * 1000;
    const mode = args.mode || delegated.communicationMode;
    const normalizedScope = parseScopes(args.scope).join(" ");

    const existing = await ctx.runQuery(api.connector.getConnectorGrant, {
      userId: args.userId,
      resource: effectiveResource,
    });

    if (existing) {
      await ctx.runMutation(api.connector.updateConnectorGrantInternal, {
        grantId: existing._id,
        sourceAccessToken,
        sourceRefreshToken,
        sourceAccessExpiresAt,
        delegatedAccessToken: delegated.delegatedAccessToken,
        delegatedExpiresAt,
        scope: normalizedScope,
        mode,
        updatedAt: now,
      });
      return { connected: true, resource: effectiveResource, mode };
    }

    await ctx.runMutation(api.connector.createConnectorGrantInternal, {
      userId: args.userId,
      resource: effectiveResource,
      scope: normalizedScope,
      mode,
      sourceAccessToken,
      sourceRefreshToken,
      sourceAccessExpiresAt,
      delegatedAccessToken: delegated.delegatedAccessToken,
      delegatedExpiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return { connected: true, resource: effectiveResource, mode };
  },
});

export const createConnectorGrantInternal = mutation({
  args: {
    userId: v.id("users"),
    resource: v.string(),
    scope: v.string(),
    mode: v.union(v.literal("user_present"), v.literal("background")),
    sourceAccessToken: v.string(),
    sourceRefreshToken: v.optional(v.string()),
    sourceAccessExpiresAt: v.optional(v.number()),
    delegatedAccessToken: v.string(),
    delegatedExpiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("connectorGrants", args);
  },
});

export const updateConnectorGrantInternal = mutation({
  args: {
    grantId: v.id("connectorGrants"),
    sourceAccessToken: v.string(),
    sourceRefreshToken: v.optional(v.string()),
    sourceAccessExpiresAt: v.optional(v.number()),
    delegatedAccessToken: v.string(),
    delegatedExpiresAt: v.number(),
    scope: v.string(),
    mode: v.union(v.literal("user_present"), v.literal("background")),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { grantId, ...patch } = args;
    await ctx.db.patch(grantId, patch);
  },
});

export const inferWithIris = action({
  args: {
    userId: v.id("users"),
    languageId: v.id("languages"),
    prompt: v.string(),
    history: v.optional(v.array(v.object({ role: v.string(), content: v.string() }))),
    model: v.optional(v.string()),
    userPresent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!IRIS_HTTP_URL) {
      throw new Error("IRIS_HTTP_URL is not configured in Convex environment.");
    }

    const context = await ctx.runQuery(api.connector.getLanguageContext, {
      userId: args.userId,
      languageId: args.languageId,
    });

    const grant = await ctx.runQuery(api.connector.getConnectorGrant, {
      userId: args.userId,
      resource: IRIS_CONNECTOR_RESOURCE,
    });

    if (!grant) {
      throw new Error("Iris connector is not connected. Connect Iris first.");
    }

    const now = Date.now();
    let delegatedToken = grant.delegatedAccessToken;
    let sourceToken = grant.sourceAccessToken;
    let sourceRefreshToken = grant.sourceRefreshToken as string | undefined;
    let sourceAccessExpiresAt = grant.sourceAccessExpiresAt as number | undefined;
    let delegatedExpiresAt = grant.delegatedExpiresAt;

    if (sourceAccessExpiresAt && sourceAccessExpiresAt <= now + 30_000 && sourceRefreshToken) {
      const refreshedSource = await refreshSourceAccessToken(sourceRefreshToken);
      sourceToken = refreshedSource.sourceAccessToken;
      sourceRefreshToken = refreshedSource.sourceRefreshToken || sourceRefreshToken;
      sourceAccessExpiresAt = refreshedSource.sourceAccessExpiresAt;
    }

    if (delegatedExpiresAt <= now + 30_000) {
      let refreshed;
      try {
        refreshed = await exchangeDelegatedToken({
          subjectToken: sourceToken,
          requestedResource: grant.resource,
          requestedScope: grant.scope,
        });
      } catch (error) {
        if (isSubjectTokenInvalidError(error) && sourceRefreshToken) {
          const refreshedSource = await refreshSourceAccessToken(sourceRefreshToken);
          sourceToken = refreshedSource.sourceAccessToken;
          sourceRefreshToken = refreshedSource.sourceRefreshToken || sourceRefreshToken;
          sourceAccessExpiresAt = refreshedSource.sourceAccessExpiresAt;
          refreshed = await exchangeDelegatedToken({
            subjectToken: sourceToken,
            requestedResource: grant.resource,
            requestedScope: grant.scope,
          });
        } else {
          throw error;
        }
      }
      delegatedToken = refreshed.delegatedAccessToken;
      delegatedExpiresAt = now + refreshed.delegatedExpiresIn * 1000;
      await ctx.runMutation(api.connector.updateConnectorGrantInternal, {
        grantId: grant._id,
        sourceAccessToken: sourceToken,
        sourceRefreshToken,
        sourceAccessExpiresAt,
        delegatedAccessToken: delegatedToken,
        delegatedExpiresAt,
        mode: refreshed.communicationMode,
        scope: grant.scope,
        updatedAt: now
      });
    }

    const sample = context.words
      .slice(0, 20)
      .map((w) => `${w.lemma}${w.ipa ? ` /${w.ipa}/` : ""}${w.wordClass ? ` (${w.wordClass})` : ""}`)
      .join(", ");

    const systemPrompt = [
      "You are Iris assisting inside Conlanger.",
      "Focus on linguistics and conlang construction support.",
      "Use concise, practical suggestions and examples.",
      `Language: ${context.language.name}${context.language.nativeName ? ` (${context.language.nativeName})` : ""}.`,
      sample ? `Lexicon sample: ${sample}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const history = (args.history || [])
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    const payload = {
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: args.prompt },
      ],
      model: args.model || "openai/gpt-4o-mini",
      userPresent: args.userPresent !== false,
    };

    const response = await fetch(`${IRIS_HTTP_URL}/delegated/infer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${delegatedToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await parseJsonSafe(response);

    if (response.status === 409 && body?.error === "runtime_required") {
      return {
        requiresRuntime: true,
        message:
          "Your Iris account requires protected runtime (BYOK). Run this request through Ave connector runtime in-browser.",
      };
    }

    if (!response.ok) {
      const details =
        body?.error_description || body?.details || body?.error || "Unknown error";
      throw new Error(`Iris delegated inference failed (${response.status}): ${details}`);
    }

    return {
      content: String(body?.content || ""),
      delegated: true,
      persistence: body?.persistence || "none",
    };
  },
});
