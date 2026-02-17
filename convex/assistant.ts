import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const DEFAULT_ASSISTANT_MODEL = "anthropic/claude-sonnet-4.5";
const IRIS_HTTP_URL = process.env.IRIS_HTTP_URL || process.env.VITE_IRIS_HTTP_URL || "";
const AVE_TOKEN_URL = process.env.AVE_TOKEN_URL || "https://api.aveid.net/api/oauth/token";
const AVE_CLIENT_ID =
  process.env.VITE_AVE_CLIENT_ID || "app_410708d4acd03edd8eeb8a8eb88ecfe7";
const AVE_CLIENT_SECRET = process.env.AVE_CLIENT_SECRET;

type ToolExecution = { tool: string; ok: boolean; result: unknown };

const WORD_CLASSES = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "determiner",
  "preposition",
  "postposition",
  "conjunction",
  "interjection",
  "particle",
  "numeral",
  "classifier",
  "auxiliary",
  "copula",
  "other",
] as const;

const TOOL_NAMES = [
  "get_full_snapshot",
  "search_words",
  "create_word",
  "update_word",
  "delete_word",
  "create_phoneme",
  "update_phoneme",
  "delete_phoneme",
] as const;

type ToolName = (typeof TOOL_NAMES)[number];

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

function tryParseJsonObject(text: string): any | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch {
      return null;
    }
  }
  return null;
}

function definitionsToObjects(defs?: string[]) {
  if (!defs || defs.length === 0) return undefined;
  return defs.map((meaning) => ({ meaning }));
}

async function ensureLanguageAccess(ctx: any, args: { languageId: string; userId: string }) {
  const language = await ctx.db.get(args.languageId as any);
  if (!language) throw new Error("Language not found.");

  let canRead = false;
  let canWrite = false;

  if (language.ownerId === args.userId) {
    canRead = true;
    canWrite = true;
  } else if (language.isPublic) {
    canRead = true;
  }

  const collab = await ctx.db
    .query("collaborators")
    .withIndex("by_language_user", (q: any) =>
      q.eq("languageId", args.languageId).eq("userId", args.userId),
    )
    .first();

  if (collab) {
    canRead = true;
    if (collab.role === "editor") canWrite = true;
  }

  if (!canRead) throw new Error("You don't have access to this language.");
  return { language, canWrite };
}

async function loadSnapshot(ctx: any, languageId: string) {
  const [language, words, phonemes, morphemes, syntaxRules] = await Promise.all([
    ctx.db.get(languageId as any),
    ctx.runQuery(api.lexicon.getWords, { languageId: languageId as any }),
    ctx.runQuery(api.phonology.getPhonemes, { languageId: languageId as any }),
    ctx.runQuery(api.morphology.getMorphemes, { languageId: languageId as any }),
    ctx.runQuery(api.syntax.getSyntaxRules, { languageId: languageId as any }),
  ]);

  return {
    language: language
      ? {
          id: language._id,
          name: language.name,
          nativeName: language.nativeName,
          description: language.description,
          isPublic: language.isPublic,
        }
      : null,
    counts: {
      words: words.length,
      phonemes: phonemes.length,
      morphemes: morphemes.length,
      syntaxRules: syntaxRules.length,
    },
    words: words.slice(0, 240).map((w: any) => ({
      _id: w._id,
      lemma: w.lemma,
      ipa: w.ipa,
      wordClass: w.wordClass,
    })),
    phonemes: phonemes.slice(0, 240).map((p: any) => ({
      _id: p._id,
      symbol: p.symbol,
      ipa: p.ipa,
      type: p.type,
    })),
    morphemes: morphemes.slice(0, 120).map((m: any) => ({
      _id: m._id,
      form: m.form,
      gloss: m.gloss,
      type: m.type,
    })),
    syntaxRules: syntaxRules.slice(0, 120).map((s: any) => ({
      _id: s._id,
      name: s.name,
      ruleType: s.ruleType,
    })),
  };
}

function buildSystemPrompt(snapshotSummary: any, canWrite: boolean) {
  return [
    "You are Conlanger Assistant inside a language workspace.",
    "All model inference is delegated through Iris.",
    `Current model default: ${DEFAULT_ASSISTANT_MODEL}.`,
    canWrite
      ? "User has write access. You may propose and execute direct edits when requested."
      : "User is read-only. Do not perform mutating actions.",
    "You must respond with STRICT JSON only (no markdown):",
    '{"assistant_reply":"string","actions":[{"tool":"tool_name","args":{}}]}',
    "If no edits are needed, use actions: []",
    `Allowed tools: ${TOOL_NAMES.join(", ")}`,
    "Data constraints:",
    `- wordClass: ${WORD_CLASSES.join(", ")}`,
    "- phoneme type: consonant | vowel",
    "- Never invent IDs. Use IDs from snapshot/search.",
    "Keep assistant_reply concise and practical.",
    `Language summary: ${JSON.stringify(snapshotSummary)}`,
  ].join("\n");
}

async function exchangeDelegatedToken(input: {
  subjectToken: string;
  requestedResource: string;
  requestedScope: string;
}) {
  if (!AVE_CLIENT_SECRET) {
    throw new Error("AVE_CLIENT_SECRET is required for delegated token refresh.");
  }

  const response = await fetch(AVE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      subjectToken: input.subjectToken,
      requestedResource: input.requestedResource,
      requestedScope: input.requestedScope,
      clientId: AVE_CLIENT_ID,
      clientSecret: AVE_CLIENT_SECRET,
    }),
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok || !payload?.access_token) {
    const details =
      payload?.error_description || payload?.error || payload?.message || "Unknown error";
    throw new Error(`Delegated token exchange failed (${response.status}): ${details}`);
  }

  return {
    delegatedAccessToken: String(payload.access_token),
    delegatedExpiresIn: Number(payload.expires_in ?? 600),
  };
}

async function ensureDelegatedGrant(ctx: any, userId: string) {
  const grant = await ctx.runQuery(api.connector.getConnectorGrant, {
    userId: userId as any,
    resource: "iris:inference",
  });

  if (!grant) {
    throw new Error("Iris connector is not connected. Connect Iris first.");
  }

  let delegatedToken = grant.delegatedAccessToken;
  let delegatedExpiresAt = grant.delegatedExpiresAt;
  const now = Date.now();

  if (delegatedExpiresAt <= now + 30_000) {
    const refreshed = await exchangeDelegatedToken({
      subjectToken: grant.sourceAccessToken,
      requestedResource: grant.resource,
      requestedScope: grant.scope,
    });
    delegatedToken = refreshed.delegatedAccessToken;
    delegatedExpiresAt = now + refreshed.delegatedExpiresIn * 1000;
    await ctx.runMutation(api.connector.updateConnectorGrantInternal, {
      grantId: grant._id,
      sourceAccessToken: grant.sourceAccessToken,
      delegatedAccessToken: delegatedToken,
      delegatedExpiresAt,
      scope: grant.scope,
      mode: grant.mode,
      updatedAt: now,
    });
  }

  return delegatedToken;
}

async function askIris(input: {
  delegatedToken: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
}) {
  const response = await fetch(`${IRIS_HTTP_URL}/delegated/infer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.delegatedToken}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      userPresent: true,
    }),
  });

  const payload = await parseJsonSafe(response);

  if (response.status === 409 && payload?.error === "runtime_required") {
    throw new Error(
      "Your Iris account requires protected runtime (BYOK) for delegated inference. Assistant sidebar cannot run until runtime support is added here.",
    );
  }

  if (!response.ok) {
    const details =
      payload?.error_description || payload?.details || payload?.error || "Unknown error";
    throw new Error(`Iris delegated inference failed (${response.status}): ${details}`);
  }

  return String(payload?.content || "");
}

async function runTool(
  ctx: any,
  toolName: string,
  input: any,
  context: { languageId: string; userId: string; canWrite: boolean },
): Promise<ToolExecution> {
  try {
    if (!TOOL_NAMES.includes(toolName as ToolName)) {
      return { tool: toolName, ok: false, result: { error: `Unknown tool: ${toolName}` } };
    }
    if (!context.canWrite && /^(create_|update_|delete_)/.test(toolName)) {
      return { tool: toolName, ok: false, result: { error: "Read-only access: mutation denied." } };
    }

    switch (toolName) {
      case "get_full_snapshot": {
        const snapshot = await loadSnapshot(ctx, context.languageId);
        return { tool: toolName, ok: true, result: snapshot };
      }
      case "search_words": {
        const query = String(input?.query || "");
        const words = await ctx.runQuery(api.lexicon.searchWords, {
          languageId: context.languageId as any,
          searchTerm: query,
        });
        const limit = Math.max(1, Math.min(100, Number(input?.limit || 20)));
        return { tool: toolName, ok: true, result: words.slice(0, limit) };
      }
      case "create_word": {
        const id = await ctx.runMutation(api.lexicon.createWord, {
          languageId: context.languageId as any,
          userId: context.userId as any,
          lemma: String(input.lemma),
          wordClass: input.wordClass,
          ipa: input.ipa || undefined,
          romanization: input.romanization || undefined,
          definitions: definitionsToObjects(input.definitions),
          etymology: input.etymologyOrigin ? { origin: String(input.etymologyOrigin) } : undefined,
          morphologicalAnalysis: input.morphologicalAnalysis || undefined,
          notes: input.notes || undefined,
          tags: Array.isArray(input.tags) ? input.tags : undefined,
          semanticFields: Array.isArray(input.semanticFields) ? input.semanticFields : undefined,
          usageNotes: input.usageNotes || undefined,
        } as any);
        return { tool: toolName, ok: true, result: { id } };
      }
      case "update_word": {
        await ctx.runMutation(api.lexicon.updateWord, {
          wordId: String(input.wordId) as any,
          userId: context.userId as any,
          lemma: input.lemma || undefined,
          wordClass: input.wordClass || undefined,
          ipa: input.ipa || undefined,
          romanization: input.romanization || undefined,
          definitions: definitionsToObjects(input.definitions),
          etymology: input.etymologyOrigin ? { origin: String(input.etymologyOrigin) } : undefined,
          morphologicalAnalysis: input.morphologicalAnalysis || undefined,
          notes: input.notes || undefined,
          tags: Array.isArray(input.tags) ? input.tags : undefined,
          semanticFields: Array.isArray(input.semanticFields) ? input.semanticFields : undefined,
          usageNotes: input.usageNotes || undefined,
        } as any);
        return { tool: toolName, ok: true, result: { updated: true, wordId: input.wordId } };
      }
      case "delete_word": {
        await ctx.runMutation(api.lexicon.deleteWord, {
          wordId: String(input.wordId) as any,
          userId: context.userId as any,
        });
        return { tool: toolName, ok: true, result: { deleted: true, wordId: input.wordId } };
      }
      case "create_phoneme": {
        const id = await ctx.runMutation(api.phonology.createPhoneme, {
          languageId: context.languageId as any,
          userId: context.userId as any,
          symbol: String(input.symbol),
          ipa: String(input.ipa),
          type: input.type,
          romanization: input.romanization || undefined,
          description: input.description || undefined,
          sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : undefined,
        } as any);
        return { tool: toolName, ok: true, result: { id } };
      }
      case "update_phoneme": {
        await ctx.runMutation(api.phonology.updatePhoneme, {
          phonemeId: String(input.phonemeId) as any,
          userId: context.userId as any,
          symbol: input.symbol || undefined,
          ipa: input.ipa || undefined,
          type: input.type || undefined,
          romanization: input.romanization || undefined,
          description: input.description || undefined,
          sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : undefined,
        } as any);
        return { tool: toolName, ok: true, result: { updated: true, phonemeId: input.phonemeId } };
      }
      case "delete_phoneme": {
        await ctx.runMutation(api.phonology.deletePhoneme, {
          phonemeId: String(input.phonemeId) as any,
          userId: context.userId as any,
        });
        return { tool: toolName, ok: true, result: { deleted: true, phonemeId: input.phonemeId } };
      }
    }

    return { tool: toolName, ok: false, result: { error: `Unhandled tool: ${toolName}` } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tool error";
    return { tool: toolName, ok: false, result: { error: message } };
  }
}

export const chat = action({
  args: {
    userId: v.id("users"),
    languageId: v.id("languages"),
    model: v.optional(v.string()),
    messages: v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() })),
  },
  handler: async (ctx, args) => {
    if (!IRIS_HTTP_URL) {
      throw new Error("IRIS_HTTP_URL is not configured.");
    }

    const selectedModel = (args.model || DEFAULT_ASSISTANT_MODEL).trim();

    const { language, canWrite } = await ensureLanguageAccess(ctx, {
      languageId: args.languageId as any,
      userId: args.userId as any,
    });

    const delegatedToken = await ensureDelegatedGrant(ctx, args.userId as any);
    const snapshot = await loadSnapshot(ctx, args.languageId as any);
    const systemPrompt = buildSystemPrompt(
      {
        id: language._id,
        name: language.name,
        nativeName: language.nativeName,
        counts: snapshot.counts,
      },
      canWrite,
    );

    const dialogue: Array<{ role: "user" | "assistant"; content: string }> = [
      ...args.messages.slice(-12),
    ];

    const toolExecutions: ToolExecution[] = [];

    for (let step = 0; step < 5; step++) {
      const planningInstruction =
        step === 0
          ? "Process the user request now. Return STRICT JSON."
          : "Given the tool results, continue. Return STRICT JSON. If done, set actions to [].";

      const content = await askIris({
        delegatedToken,
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...dialogue.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: planningInstruction },
        ],
      });

      const planned = tryParseJsonObject(content);
      if (!planned || typeof planned !== "object") {
        return { reply: content, model: selectedModel, toolExecutions };
      }

      const assistantReply =
        typeof planned.assistant_reply === "string" ? planned.assistant_reply : "";
      const actions = Array.isArray(planned.actions) ? planned.actions : [];

      if (actions.length === 0) {
        return { reply: assistantReply || "Done.", model: selectedModel, toolExecutions };
      }

      const stepResults: ToolExecution[] = [];
      for (const actionItem of actions) {
        const tool = String(actionItem?.tool || "");
        const input = actionItem?.args && typeof actionItem.args === "object" ? actionItem.args : {};
        const result = await runTool(ctx, tool, input, {
          languageId: args.languageId as any,
          userId: args.userId as any,
          canWrite,
        });
        toolExecutions.push(result);
        stepResults.push(result);
      }

      dialogue.push({
        role: "assistant",
        content: assistantReply || "Applying requested changes.",
      });
      dialogue.push({
        role: "user",
        content: `Tool results:\n${JSON.stringify(stepResults)}\nNow continue and return STRICT JSON.`,
      });
    }

    return {
      reply:
        "I reached the planning step limit after applying some actions. Ask me to continue if you want more changes.",
      model: selectedModel,
      toolExecutions,
    };
  },
});
