import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

const DEFAULT_ASSISTANT_MODEL = "anthropic/claude-sonnet-4.5";
const IRIS_HTTP_URL = process.env.IRIS_HTTP_URL || process.env.VITE_IRIS_HTTP_URL || "";
const AVE_TOKEN_URL = process.env.AVE_TOKEN_URL || "https://api.aveid.net/api/oauth/token";
const AVE_CLIENT_ID =
  process.env.VITE_AVE_CLIENT_ID || "app_410708d4acd03edd8eeb8a8eb88ecfe7";
const AVE_CLIENT_SECRET = process.env.AVE_CLIENT_SECRET;
const IRIS_CONNECTOR_RESOURCE =
  process.env.IRIS_CONNECTOR_RESOURCE ||
  process.env.VITE_IRIS_CONNECTOR_RESOURCE ||
  "iris:inference";
const LEGACY_IRIS_CONNECTOR_RESOURCE = "iris:inference";

type ToolExecution = { tool: string; ok: boolean; result: unknown };
type RunStatus = "queued" | "running" | "completed" | "failed";

type DelegatedGrantState = {
  grantId: string;
  sourceAccessToken: string;
  resource: string;
  scope: string;
  mode: "user_present" | "background";
  delegatedToken: string;
};

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

const GUIDE_TOPICS: Record<string, { title: string; description: string }> = {
  phonology: {
    title: "Phonology",
    description:
      "Define phonemes, allophones, phonotactics, and sound changes. Keep contrasts clear with minimal pairs and ensure phonotactic patterns are internally consistent.",
  },
  morphology: {
    title: "Morphology",
    description:
      "Use grammatical categories plus morphemes and inflection classes. Keep gloss abbreviations consistent and map each affix to explicit feature values.",
  },
  syntax: {
    title: "Syntax",
    description:
      "Model clause structure with explicit syntax rules and examples. Document default word order, then separate transformational rules (questions, focus, topicalization).",
  },
  lexicon: {
    title: "Lexicon",
    description:
      "Each entry should include lemma, word class, pronunciation, and definitions. Track derivation and relations so words stay connected to morphology and etymology.",
  },
  scripts: {
    title: "Scripts",
    description:
      "Define scripts, glyphs, and romanization rules together. Keep writing direction, glyph ordering, and transliteration priorities explicit.",
  },
  texts: {
    title: "Texts",
    description:
      "Use texts to validate grammar and style in context. Prefer examples with interlinear gloss and free translation to surface hidden inconsistencies.",
  },
  collaboration: {
    title: "Collaboration",
    description:
      "Use collaborators and activity logs to coordinate edits. Keep high-impact structural changes small and documented to reduce merge conflicts.",
  },
};

const TOOL_NAMES = [
  "get_full_snapshot",
  "get_language_summary",
  "get_lexicon",
  "get_phonology",
  "get_morphology",
  "get_syntax",
  "get_scripts",
  "get_texts",
  "search_words",
  "search_phonemes",
  "create_word",
  "update_word",
  "delete_word",
  "create_phoneme",
  "update_phoneme",
  "delete_phoneme",
  "guide_topics",
  "guide_lookup",
  "dashboard_call",
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

function definitionMeanings(definitions: any[] | undefined): string[] {
  if (!Array.isArray(definitions)) return [];
  return definitions
    .map((item) => (item && typeof item.meaning === "string" ? item.meaning.trim() : ""))
    .filter(Boolean);
}

function normalizeToolArgs(raw: unknown, context: { languageId: string; userId: string }) {
  const args = raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {};
  if ("languageId" in args) args.languageId = context.languageId;
  if ("userId" in args) args.userId = context.userId;
  return args;
}

async function ensureLanguageAccess(ctx: any, args: { languageId: string; userId: string }) {
  const context = await ctx.runQuery(api.connector.getLanguageContext, {
    languageId: args.languageId as any,
    userId: args.userId as any,
  });
  if (!context?.language) {
    throw new Error("Language not found.");
  }
  return { language: context.language, canWrite: !!context.canWrite };
}

async function loadSnapshot(ctx: any, languageId: string, userId: string) {
  const [languageContext, words, phonemes, morphemes, syntaxRules, scripts, texts] = await Promise.all([
    ctx.runQuery(api.connector.getLanguageContext, {
      languageId: languageId as any,
      userId: userId as any,
    }),
    ctx.runQuery(api.lexicon.getWords, { languageId: languageId as any }),
    ctx.runQuery(api.phonology.getPhonemes, { languageId: languageId as any }),
    ctx.runQuery(api.morphology.getMorphemes, { languageId: languageId as any }),
    ctx.runQuery(api.syntax.getSyntaxRules, { languageId: languageId as any }),
    ctx.runQuery(api.scripts.getScripts, { languageId: languageId as any }),
    ctx.runQuery(api.texts.getTexts, { languageId: languageId as any }),
  ]);

  return {
    language: languageContext?.language
      ? {
          id: languageContext.language.id,
          name: languageContext.language.name,
          nativeName: languageContext.language.nativeName,
          description: languageContext.language.description,
          isPublic: languageContext.language.isPublic,
        }
      : null,
    counts: {
      words: words.length,
      phonemes: phonemes.length,
      morphemes: morphemes.length,
      syntaxRules: syntaxRules.length,
      scripts: scripts.length,
      texts: texts.length,
    },
    words: words.slice(0, 240).map((w: any) => ({
      _id: w._id,
      lemma: w.lemma,
      ipa: w.ipa,
      wordClass: w.wordClass,
      definitions: definitionMeanings(w.definitions).slice(0, 3),
      usageNotes: w.usageNotes || null,
      notes: w.notes || null,
      semanticFields: Array.isArray(w.semanticFields) ? w.semanticFields.slice(0, 8) : [],
      tags: Array.isArray(w.tags) ? w.tags.slice(0, 8) : [],
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

async function loadLanguageSummary(ctx: any, languageId: string, userId: string) {
  const snapshot = await loadSnapshot(ctx, languageId, userId);
  return {
    language: snapshot.language,
    counts: snapshot.counts,
  };
}

async function loadLexiconSlice(ctx: any, languageId: string, limit = 200) {
  const words = await ctx.runQuery(api.lexicon.getWords, { languageId: languageId as any });
  const size = Math.max(1, Math.min(400, Number(limit || 200)));
  return words.slice(0, size).map((word: any) => ({
    _id: word._id,
    lemma: word.lemma,
    ipa: word.ipa,
    wordClass: word.wordClass,
    definitions: definitionMeanings(word.definitions).slice(0, 4),
    tags: Array.isArray(word.tags) ? word.tags.slice(0, 10) : [],
    semanticFields: Array.isArray(word.semanticFields) ? word.semanticFields.slice(0, 10) : [],
  }));
}

async function loadPhonologySlice(ctx: any, languageId: string, limit = 250) {
  const phonemes = await ctx.runQuery(api.phonology.getPhonemes, { languageId: languageId as any });
  const size = Math.max(1, Math.min(500, Number(limit || 250)));
  return phonemes.slice(0, size).map((phoneme: any) => ({
    _id: phoneme._id,
    symbol: phoneme.symbol,
    ipa: phoneme.ipa,
    type: phoneme.type,
    romanization: phoneme.romanization || null,
  }));
}

async function loadMorphologySlice(ctx: any, languageId: string, limit = 180) {
  const morphemes = await ctx.runQuery(api.morphology.getMorphemes, { languageId: languageId as any });
  const size = Math.max(1, Math.min(300, Number(limit || 180)));
  return morphemes.slice(0, size).map((morpheme: any) => ({
    _id: morpheme._id,
    form: morpheme.form,
    gloss: morpheme.gloss,
    type: morpheme.type,
  }));
}

async function loadSyntaxSlice(ctx: any, languageId: string, limit = 180) {
  const syntaxRules = await ctx.runQuery(api.syntax.getSyntaxRules, { languageId: languageId as any });
  const size = Math.max(1, Math.min(300, Number(limit || 180)));
  return syntaxRules.slice(0, size).map((rule: any) => ({
    _id: rule._id,
    name: rule.name,
    ruleType: rule.ruleType,
    pattern: rule.pattern,
    output: rule.output || null,
  }));
}

async function loadScriptsSlice(ctx: any, languageId: string, limit = 120) {
  const scripts = await ctx.runQuery(api.scripts.getScripts, { languageId: languageId as any });
  const size = Math.max(1, Math.min(200, Number(limit || 120)));
  return scripts.slice(0, size).map((script: any) => ({
    _id: script._id,
    name: script.name,
    type: script.type,
    direction: script.direction,
  }));
}

async function loadTextsSlice(ctx: any, languageId: string, limit = 120) {
  const texts = await ctx.runQuery(api.texts.getTexts, { languageId: languageId as any });
  const size = Math.max(1, Math.min(200, Number(limit || 120)));
  return texts.slice(0, size).map((text: any) => ({
    _id: text._id,
    title: text.title,
    source: text.source || null,
    updatedAt: text.updatedAt,
  }));
}

function buildSystemPrompt(snapshotSummary: any, canWrite: boolean) {
  return [
    "You are Conlanger Agent inside a language workspace.",
    "Work like an autonomous coding assistant: plan briefly, call tools, and continue until done.",
    "All model inference is delegated through Iris.",
    `Current model default: ${DEFAULT_ASSISTANT_MODEL}.`,
    canWrite
      ? "User has write access. You may execute direct data edits requested by the user."
      : "User is read-only. Never perform mutating actions.",
    "You must respond with STRICT JSON only (no markdown):",
    '{"assistant_reply":"string","actions":[{"tool":"tool_name","args":{}}]}',
    "If no actions are needed, use actions: []",
    `Allowed tools: ${TOOL_NAMES.join(", ")}`,
    "Tool usage guidelines:",
    "- Prefer targeted read tools (get_phonology, get_lexicon, get_morphology, get_syntax, get_scripts, get_texts) before get_full_snapshot.",
    "- Use get_language_summary first for broad context.",
    "- Use get_full_snapshot only when broad context is truly required.",
    "- Prefer dashboard_call only for operations not covered by dedicated tools.",
    "- Use guide_topics/guide_lookup when the user asks for explanations or learning help.",
    "Data constraints:",
    `- wordClass: ${WORD_CLASSES.join(", ")}`,
    "- phoneme type: consonant | vowel",
    "- Never invent IDs. Use IDs returned by snapshot/search/tools.",
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

async function ensureDelegatedGrant(ctx: any, userId: string): Promise<DelegatedGrantState> {
  let grant =
    (await ctx.runQuery(api.connector.getConnectorGrant, {
      userId: userId as any,
      resource: IRIS_CONNECTOR_RESOURCE,
    })) ||
    (await ctx.runQuery(api.connector.getConnectorGrant, {
      userId: userId as any,
      resource: LEGACY_IRIS_CONNECTOR_RESOURCE,
    }));

  if (!grant) {
    throw new Error("Iris connector is not connected. Connect Iris first.");
  }

  if (String(grant.resource) !== IRIS_CONNECTOR_RESOURCE) {
    let migrated;
    try {
      migrated = await exchangeDelegatedToken({
        subjectToken: String(grant.sourceAccessToken),
        requestedResource: IRIS_CONNECTOR_RESOURCE,
        requestedScope: String(grant.scope),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const isResourceNotFound =
        message.includes("requested resource not found") || message.includes("resource not found");
      if (!isResourceNotFound) throw error;
      migrated = null;
    }

    if (!migrated) {
      return {
        grantId: String(grant._id),
        sourceAccessToken: String(grant.sourceAccessToken),
        resource: String(grant.resource),
        scope: String(grant.scope),
        mode: grant.mode,
        delegatedToken: String(grant.delegatedAccessToken),
      };
    }

    const now = Date.now();
    const delegatedExpiresAt = now + migrated.delegatedExpiresIn * 1000;
    const preferredGrant = await ctx.runQuery(api.connector.getConnectorGrant, {
      userId: userId as any,
      resource: IRIS_CONNECTOR_RESOURCE,
    });

    if (preferredGrant) {
      await ctx.runMutation(api.connector.updateConnectorGrantInternal, {
        grantId: preferredGrant._id,
        sourceAccessToken: String(grant.sourceAccessToken),
        delegatedAccessToken: migrated.delegatedAccessToken,
        delegatedExpiresAt,
        scope: String(grant.scope),
        mode: grant.mode,
        updatedAt: now,
      });
      grant = {
        ...preferredGrant,
        resource: IRIS_CONNECTOR_RESOURCE,
        sourceAccessToken: String(grant.sourceAccessToken),
        delegatedAccessToken: migrated.delegatedAccessToken,
        delegatedExpiresAt,
        scope: String(grant.scope),
      };
    } else {
      const createdId = await ctx.runMutation(api.connector.createConnectorGrantInternal, {
        userId: userId as any,
        resource: IRIS_CONNECTOR_RESOURCE,
        scope: String(grant.scope),
        mode: grant.mode,
        sourceAccessToken: String(grant.sourceAccessToken),
        delegatedAccessToken: migrated.delegatedAccessToken,
        delegatedExpiresAt,
        createdAt: now,
        updatedAt: now,
      });
      grant = {
        ...grant,
        _id: createdId,
        resource: IRIS_CONNECTOR_RESOURCE,
        delegatedAccessToken: migrated.delegatedAccessToken,
        delegatedExpiresAt,
      };
    }
  }

  let delegatedToken = String(grant.delegatedAccessToken);
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
      sourceAccessToken: String(grant.sourceAccessToken),
      delegatedAccessToken: delegatedToken,
      delegatedExpiresAt,
      scope: String(grant.scope),
      mode: grant.mode,
      updatedAt: now,
    });
  }

  return {
    grantId: String(grant._id),
    sourceAccessToken: String(grant.sourceAccessToken),
    resource: String(grant.resource),
    scope: String(grant.scope),
    mode: grant.mode,
    delegatedToken,
  };
}

async function refreshDelegatedGrant(
  ctx: any,
  grant: DelegatedGrantState,
): Promise<DelegatedGrantState> {
  const refreshed = await exchangeDelegatedToken({
    subjectToken: grant.sourceAccessToken,
    requestedResource: grant.resource,
    requestedScope: grant.scope,
  });
  const now = Date.now();
  const delegatedExpiresAt = now + refreshed.delegatedExpiresIn * 1000;

  await ctx.runMutation(api.connector.updateConnectorGrantInternal, {
    grantId: grant.grantId as any,
    sourceAccessToken: grant.sourceAccessToken,
    delegatedAccessToken: refreshed.delegatedAccessToken,
    delegatedExpiresAt,
    scope: grant.scope,
    mode: grant.mode,
    updatedAt: now,
  });

  return {
    ...grant,
    delegatedToken: refreshed.delegatedAccessToken,
  };
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
    const err = new Error(`Iris delegated inference failed (${response.status}): ${details}`) as Error & {
      status?: number;
      details?: string;
    };
    err.status = response.status;
    err.details = String(details);
    throw err;
  }

  return String(payload?.content || "");
}

async function askIrisStream(input: {
  delegatedToken: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  onToken?: (token: string) => Promise<void>;
}) {
  const response = await fetch(`${IRIS_HTTP_URL}/delegated/infer/stream`, {
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

  if (!response.ok || !response.body) {
    const payload = await parseJsonSafe(response);
    const details = payload?.error_description || payload?.details || payload?.error || "Unknown error";
    const err = new Error(`Iris delegated streaming failed (${response.status}): ${details}`) as Error & {
      status?: number;
      details?: string;
    };
    err.status = response.status;
    err.details = String(details);
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const line = event
        .split("\n")
        .find((entry) => entry.startsWith("data:"));

      if (!line) continue;

      const payloadRaw = line.slice(5).trim();
      if (!payloadRaw) continue;

      try {
        const payload = JSON.parse(payloadRaw);
        const token = typeof payload?.token === "string" ? payload.token : "";
        if (token) {
          content += token;
          if (input.onToken) {
            await input.onToken(token);
          }
        }
      } catch {
        // Ignore malformed chunks.
      }
    }
  }

  return content;
}

async function runDashboardCall(
  ctx: any,
  input: any,
  context: { languageId: string; userId: string; canWrite: boolean },
): Promise<ToolExecution> {
  const op = String(input?.op || "").trim();
  const kind = String(input?.kind || "query").trim();

  if (!op.includes(":")) {
    return {
      tool: "dashboard_call",
      ok: false,
      result: { error: "Invalid op. Use 'module:function' format." },
    };
  }

  const [moduleName, functionName] = op.split(":");
  const isMutation = kind === "mutation";
  const isQuery = kind === "query";

  if (!isMutation && !isQuery) {
    return {
      tool: "dashboard_call",
      ok: false,
      result: { error: "Invalid kind. Use 'query' or 'mutation'." },
    };
  }

  if (["assistant", "auth"].includes(moduleName)) {
    return {
      tool: "dashboard_call",
      ok: false,
      result: { error: `Forbidden module: ${moduleName}` },
    };
  }

  if (!context.canWrite && isMutation) {
    return {
      tool: "dashboard_call",
      ok: false,
      result: { error: "Read-only access: mutation denied." },
    };
  }

  const fnRef = (api as any)?.[moduleName]?.[functionName];
  if (!fnRef) {
    return {
      tool: "dashboard_call",
      ok: false,
      result: { error: `Unknown operation: ${op}` },
    };
  }

  try {
    const args = normalizeToolArgs(input?.args, context);
    const result = isMutation
      ? await ctx.runMutation(fnRef, args)
      : await ctx.runQuery(fnRef, args);

    return {
      tool: "dashboard_call",
      ok: true,
      result: {
        op,
        kind,
        result,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard call failed.";
    return {
      tool: "dashboard_call",
      ok: false,
      result: { error: message, op, kind },
    };
  }
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
        const snapshot = await loadSnapshot(ctx, context.languageId, context.userId);
        return { tool: toolName, ok: true, result: snapshot };
      }
      case "get_language_summary": {
        const summary = await loadLanguageSummary(ctx, context.languageId, context.userId);
        return { tool: toolName, ok: true, result: summary };
      }
      case "get_lexicon": {
        const data = await loadLexiconSlice(ctx, context.languageId, Number(input?.limit || 200));
        return { tool: toolName, ok: true, result: data };
      }
      case "get_phonology": {
        const data = await loadPhonologySlice(ctx, context.languageId, Number(input?.limit || 250));
        return { tool: toolName, ok: true, result: data };
      }
      case "get_morphology": {
        const data = await loadMorphologySlice(ctx, context.languageId, Number(input?.limit || 180));
        return { tool: toolName, ok: true, result: data };
      }
      case "get_syntax": {
        const data = await loadSyntaxSlice(ctx, context.languageId, Number(input?.limit || 180));
        return { tool: toolName, ok: true, result: data };
      }
      case "get_scripts": {
        const data = await loadScriptsSlice(ctx, context.languageId, Number(input?.limit || 120));
        return { tool: toolName, ok: true, result: data };
      }
      case "get_texts": {
        const data = await loadTextsSlice(ctx, context.languageId, Number(input?.limit || 120));
        return { tool: toolName, ok: true, result: data };
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
      case "search_phonemes": {
        const query = String(input?.query || "").trim().toLowerCase();
        const limit = Math.max(1, Math.min(120, Number(input?.limit || 40)));
        const phonemes = await ctx.runQuery(api.phonology.getPhonemes, {
          languageId: context.languageId as any,
        });
        const result = !query
          ? phonemes.slice(0, limit)
          : phonemes
              .filter((phoneme: any) => {
                const symbol = String(phoneme.symbol || "").toLowerCase();
                const ipa = String(phoneme.ipa || "").toLowerCase();
                const type = String(phoneme.type || "").toLowerCase();
                return symbol.includes(query) || ipa.includes(query) || type.includes(query);
              })
              .slice(0, limit);
        return { tool: toolName, ok: true, result };
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
      case "guide_topics": {
        return {
          tool: toolName,
          ok: true,
          result: Object.keys(GUIDE_TOPICS).map((key) => ({ key, title: GUIDE_TOPICS[key].title })),
        };
      }
      case "guide_lookup": {
        const queryText = String(input?.query || "").toLowerCase().trim();
        const topic = String(input?.topic || "").toLowerCase().trim();
        const entries = Object.entries(GUIDE_TOPICS)
          .filter(([key, value]) => {
            if (topic) return key === topic;
            if (!queryText) return true;
            return (
              key.includes(queryText) ||
              value.title.toLowerCase().includes(queryText) ||
              value.description.toLowerCase().includes(queryText)
            );
          })
          .map(([key, value]) => ({ key, ...value }))
          .slice(0, 6);

        return { tool: toolName, ok: true, result: entries };
      }
      case "dashboard_call": {
        return await runDashboardCall(ctx, input, context);
      }
    }

    return { tool: toolName, ok: false, result: { error: `Unhandled tool: ${toolName}` } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tool error";
    return { tool: toolName, ok: false, result: { error: message } };
  }
}

async function runAgentLoop(
  ctx: any,
  args: {
    userId: string;
    languageId: string;
    model?: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  },
  hooks?: {
    onThought?: (message: string) => Promise<void>;
    onStream?: (message: string) => Promise<void>;
    onToolStart?: (tool: string, input: unknown) => Promise<void>;
    onToolResult?: (result: ToolExecution) => Promise<void>;
  },
) {
  if (!IRIS_HTTP_URL) {
    throw new Error("IRIS_HTTP_URL is not configured.");
  }

  const selectedModel = (args.model || DEFAULT_ASSISTANT_MODEL).trim();

  const { language, canWrite } = await ensureLanguageAccess(ctx, {
    languageId: args.languageId,
    userId: args.userId,
  });

  let grant = await ensureDelegatedGrant(ctx, args.userId);
  const snapshot = await loadSnapshot(ctx, args.languageId, args.userId);
  const systemPrompt = buildSystemPrompt(
    {
      id: language._id,
      name: language.name,
      nativeName: language.nativeName,
      counts: snapshot.counts,
    },
    canWrite,
  );

  const dialogue: Array<{ role: "user" | "assistant"; content: string }> = [...args.messages.slice(-12)];
  const toolExecutions: ToolExecution[] = [];

  for (let step = 0; step < 7; step++) {
    const planningInstruction =
      step === 0
        ? "Process the user request now. Return STRICT JSON. Use tools if needed."
        : "Given tool results, continue autonomously. Return STRICT JSON. If complete, set actions to [].";

    let content: string;
    try {
      let streamedReply = "";
      let lastStreamEmitLength = 0;

      content = await askIrisStream({
        delegatedToken: grant.delegatedToken,
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...dialogue.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: planningInstruction },
        ],
        onToken: async (token) => {
          streamedReply += token;
          if (!hooks?.onStream) return;
          if (streamedReply.length - lastStreamEmitLength < 48) return;
          lastStreamEmitLength = streamedReply.length;
          await hooks.onStream(streamedReply);
        },
      });

      if (hooks?.onStream && streamedReply && streamedReply.length !== lastStreamEmitLength) {
        await hooks.onStream(streamedReply);
      }

      if (!content.trim()) {
        content = streamedReply;
      }
    } catch (error) {
      const irisError = error as Error & { status?: number; details?: string };
      const detail = (irisError.details || irisError.message || "").toLowerCase();
      const isInvalidToken = irisError.status === 401 || detail.includes("invalid_token");

      if (!isInvalidToken) {
        content = await askIris({
          delegatedToken: grant.delegatedToken,
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...dialogue.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: planningInstruction },
          ],
        });
      } else {
        try {
          grant = await refreshDelegatedGrant(ctx, grant);
        } catch {
          throw new Error(
            "Iris connector authorization is expired or invalid. Please reconnect to Iris and try again.",
          );
        }

        content = await askIris({
          delegatedToken: grant.delegatedToken,
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...dialogue.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: planningInstruction },
          ],
        });
      }
    }

    const planned = tryParseJsonObject(content);
    if (!planned || typeof planned !== "object") {
      return { reply: content, model: selectedModel, toolExecutions };
    }

    const assistantReply =
      typeof planned.assistant_reply === "string" ? planned.assistant_reply.trim() : "";
    const actions = Array.isArray(planned.actions) ? planned.actions : [];

    if (assistantReply && hooks?.onThought) {
      await hooks.onThought(assistantReply);
    }

    if (actions.length === 0) {
      return { reply: assistantReply || "Done.", model: selectedModel, toolExecutions };
    }

    const stepResults: ToolExecution[] = [];
    for (const actionItem of actions) {
      const tool = String(actionItem?.tool || "");
      const input = actionItem?.args && typeof actionItem.args === "object" ? actionItem.args : {};

      if (hooks?.onToolStart) {
        await hooks.onToolStart(tool, input);
      }

      const result = await runTool(ctx, tool, input, {
        languageId: args.languageId,
        userId: args.userId,
        canWrite,
      });

      toolExecutions.push(result);
      stepResults.push(result);

      if (hooks?.onToolResult) {
        await hooks.onToolResult(result);
      }
    }

    dialogue.push({
      role: "assistant",
      content: assistantReply || "Applying requested actions.",
    });
    dialogue.push({
      role: "user",
      content: `Tool results:\n${JSON.stringify(stepResults)}\nContinue and return STRICT JSON.`,
    });
  }

  return {
    reply:
      "I reached the planning step limit after applying some actions. Ask me to continue if you want more changes.",
    model: selectedModel,
    toolExecutions,
  };
}

export const appendRunEventInternal = internalMutation({
  args: {
    runId: v.id("assistantRuns"),
    kind: v.union(
      v.literal("status"),
      v.literal("assistant_thought"),
      v.literal("assistant_stream"),
      v.literal("tool_start"),
      v.literal("tool_result"),
      v.literal("final"),
      v.literal("error"),
    ),
    message: v.optional(v.string()),
    tool: v.optional(v.string()),
    ok: v.optional(v.boolean()),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found.");

    const now = Date.now();
    const sequence = (run.nextSequence || 0) + 1;

    await ctx.db.patch(args.runId, {
      nextSequence: sequence,
      updatedAt: now,
    });

    await ctx.db.insert("assistantRunEvents", {
      runId: args.runId,
      sequence,
      kind: args.kind,
      message: args.message,
      tool: args.tool,
      ok: args.ok,
      payload: args.payload,
      createdAt: now,
    });
  },
});

export const updateRunStatusInternal = internalMutation({
  args: {
    runId: v.id("assistantRuns"),
    status: v.union(v.literal("queued"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    finalReply: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found.");

    const now = Date.now();
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "running") patch.startedAt = now;
    if (args.status === "completed" || args.status === "failed") patch.completedAt = now;
    if (args.finalReply !== undefined) patch.finalReply = args.finalReply;
    if (args.error !== undefined) patch.error = args.error;

    await ctx.db.patch(args.runId, patch as any);
  },
});

export const getRun = query({
  args: {
    runId: v.id("assistantRuns"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== args.userId) return null;
    return run;
  },
});

export const getRunEvents = query({
  args: {
    runId: v.id("assistantRuns"),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== args.userId) return [];

    const all = await ctx.db
      .query("assistantRunEvents")
      .withIndex("by_run_sequence", (q) => q.eq("runId", args.runId))
      .collect();

    const limit = Math.max(20, Math.min(500, Number(args.limit || 200)));
    return all.slice(-limit);
  },
});

export const processRunInternal = internalAction({
  args: {
    runId: v.id("assistantRuns"),
    userId: v.id("users"),
    languageId: v.id("languages"),
    model: v.optional(v.string()),
    messages: v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() })),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.assistant.updateRunStatusInternal, {
      runId: args.runId,
      status: "running",
    });

    await ctx.runMutation(internal.assistant.appendRunEventInternal, {
      runId: args.runId,
      kind: "status",
      message: "Agent run started.",
    });

    try {
      const result = await runAgentLoop(
        ctx,
        {
          userId: args.userId as any,
          languageId: args.languageId as any,
          model: args.model,
          messages: args.messages,
        },
        {
          onThought: async (message) => {
            await ctx.runMutation(internal.assistant.appendRunEventInternal, {
              runId: args.runId,
              kind: "assistant_thought",
              message,
            });
          },
          onStream: async (message) => {
            await ctx.runMutation(internal.assistant.appendRunEventInternal, {
              runId: args.runId,
              kind: "assistant_stream",
              message,
            });
          },
          onToolStart: async (tool, input) => {
            await ctx.runMutation(internal.assistant.appendRunEventInternal, {
              runId: args.runId,
              kind: "tool_start",
              tool,
              payload: input,
            });
          },
          onToolResult: async (toolResult) => {
            await ctx.runMutation(internal.assistant.appendRunEventInternal, {
              runId: args.runId,
              kind: "tool_result",
              tool: toolResult.tool,
              ok: toolResult.ok,
              payload: toolResult.result,
            });
          },
        },
      );

      await ctx.runMutation(internal.assistant.updateRunStatusInternal, {
        runId: args.runId,
        status: "completed",
        finalReply: result.reply,
      });

      await ctx.runMutation(internal.assistant.appendRunEventInternal, {
        runId: args.runId,
        kind: "final",
        message: result.reply,
        payload: {
          model: result.model,
          toolExecutions: result.toolExecutions,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Assistant run failed.";

      await ctx.runMutation(internal.assistant.updateRunStatusInternal, {
        runId: args.runId,
        status: "failed",
        error: message,
      });

      await ctx.runMutation(internal.assistant.appendRunEventInternal, {
        runId: args.runId,
        kind: "error",
        message,
      });
    }
  },
});

export const startRun = mutation({
  args: {
    userId: v.id("users"),
    languageId: v.id("languages"),
    model: v.optional(v.string()),
    messages: v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() })),
  },
  handler: async (ctx, args) => {
    const selectedModel = (args.model || DEFAULT_ASSISTANT_MODEL).trim();

    await ctx.runQuery(api.connector.getLanguageContext, {
      userId: args.userId,
      languageId: args.languageId,
    });

    const now = Date.now();
    const runId = await ctx.db.insert("assistantRuns", {
      userId: args.userId,
      languageId: args.languageId,
      model: selectedModel,
      status: "queued",
      nextSequence: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.assistant.processRunInternal, {
      runId,
      userId: args.userId,
      languageId: args.languageId,
      model: selectedModel,
      messages: args.messages,
    });

    return { runId };
  },
});

export const chat = action({
  args: {
    userId: v.id("users"),
    languageId: v.id("languages"),
    model: v.optional(v.string()),
    messages: v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() })),
  },
  handler: async (ctx, args) => {
    return await runAgentLoop(ctx, {
      userId: args.userId as any,
      languageId: args.languageId as any,
      model: args.model,
      messages: args.messages,
    });
  },
});
