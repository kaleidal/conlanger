import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const wordClass = v.union(
  v.literal("noun"),
  v.literal("verb"),
  v.literal("adjective"),
  v.literal("adverb"),
  v.literal("pronoun"),
  v.literal("determiner"),
  v.literal("preposition"),
  v.literal("postposition"),
  v.literal("conjunction"),
  v.literal("interjection"),
  v.literal("particle"),
  v.literal("numeral"),
  v.literal("classifier"),
  v.literal("auxiliary"),
  v.literal("copula"),
  v.literal("other")
);

const wordRelationType = v.union(
  v.literal("synonym"),
  v.literal("antonym"),
  v.literal("hypernym"),
  v.literal("hyponym"),
  v.literal("meronym"),
  v.literal("holonym"),
  v.literal("derived"),
  v.literal("compound"),
  v.literal("cognate"),
  v.literal("doublet")
);

const definition = v.object({
  meaning: v.string(),
  partOfSpeech: v.optional(v.string()),
  examples: v.optional(v.array(v.string())),
  register: v.optional(v.string()),
  domain: v.optional(v.string()),
});

const cognateInfo = v.object({
  language: v.string(),
  form: v.string(),
  meaning: v.optional(v.string()),
});

const etymology = v.object({
  origin: v.optional(v.string()),
  protoForm: v.optional(v.string()),
  borrowedFrom: v.optional(v.string()),
  cognates: v.optional(v.array(cognateInfo)),
  soundChanges: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
});

// Words
export const getWords = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    const words = await ctx.db
      .query("words")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();

    if (words.length === 0) {
      return words;
    }

    const relationships = await ctx.db.query("wordRelationships").collect();
    const wordIds = new Set(words.map((word) => String(word._id)));

    const byFrom = new Map<string, any[]>();
    const byTo = new Map<string, any[]>();

    for (const relationship of relationships) {
      const fromWordId = String(relationship.fromWordId);
      const toWordId = String(relationship.toWordId);

      if (wordIds.has(fromWordId)) {
        const existing = byFrom.get(fromWordId) || [];
        existing.push(relationship);
        byFrom.set(fromWordId, existing);
      }

      if (wordIds.has(toWordId)) {
        const existing = byTo.get(toWordId) || [];
        existing.push(relationship);
        byTo.set(toWordId, existing);
      }
    }

    return words.map((word) => ({
      ...word,
      relationsFrom: byFrom.get(String(word._id)) || [],
      relationsTo: byTo.get(String(word._id)) || [],
    }));
  },
});

export const searchWords = query({
  args: {
    languageId: v.id("languages"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return await ctx.db
        .query("words")
        .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
        .take(100);
    }

    return await ctx.db
      .query("words")
      .withSearchIndex("search_words", (q) =>
        q.search("lemma", args.searchTerm).eq("languageId", args.languageId)
      )
      .take(100);
  },
});

export const getWord = query({
  args: { wordId: v.id("words") },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.wordId);
    if (!word) return null;

    // Get inflected forms
    const inflectedForms = await ctx.db
      .query("inflectedForms")
      .withIndex("by_word", (q) => q.eq("wordId", args.wordId))
      .collect();

    // Get relationships
    const relationsFrom = await ctx.db
      .query("wordRelationships")
      .withIndex("by_from_word", (q) => q.eq("fromWordId", args.wordId))
      .collect();

    const relationsTo = await ctx.db
      .query("wordRelationships")
      .withIndex("by_to_word", (q) => q.eq("toWordId", args.wordId))
      .collect();

    // Get related words
    const relatedWordIds = [
      ...relationsFrom.map((r) => r.toWordId),
      ...relationsTo.map((r) => r.fromWordId),
    ];

    const relatedWords = await Promise.all(
      relatedWordIds.map((id) => ctx.db.get(id))
    );

    return {
      ...word,
      inflectedForms,
      relationships: [...relationsFrom, ...relationsTo],
      relatedWords: relatedWords.filter(Boolean),
    };
  },
});

export const createWord = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    lemma: v.string(),
    ipa: v.optional(v.string()),
    romanization: v.optional(v.string()),
    wordClass: wordClass,
    inflectionClassId: v.optional(v.id("inflectionClasses")),
    definitions: v.optional(v.array(definition)),
    etymology: v.optional(etymology),
    morphologicalAnalysis: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    semanticFields: v.optional(v.array(v.string())),
    usageNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    const now = Date.now();
    
    const id = await ctx.db.insert("words", {
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "word",
      entityId: id,
      details: `Added word "${args.lemma}"`,
      timestamp: now,
    });

    await ctx.db.patch(args.languageId, { updatedAt: now });

    return id;
  },
});

export const updateWord = mutation({
  args: {
    wordId: v.id("words"),
    userId: v.id("users"),
    lemma: v.optional(v.string()),
    ipa: v.optional(v.string()),
    romanization: v.optional(v.string()),
    wordClass: v.optional(wordClass),
    inflectionClassId: v.optional(v.id("inflectionClasses")),
    definitions: v.optional(v.array(definition)),
    etymology: v.optional(etymology),
    morphologicalAnalysis: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    semanticFields: v.optional(v.array(v.string())),
    usageNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.wordId);
    if (!word) throw new Error("Word not found");

    const { wordId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const now = Date.now();
    await ctx.db.patch(wordId, { ...filteredUpdates, updatedAt: now });

    await ctx.db.insert("activityLog", {
      languageId: word.languageId,
      userId,
      action: "update",
      entityType: "word",
      entityId: wordId,
      details: `Updated word "${word.lemma}"`,
      timestamp: now,
    });

    await ctx.db.patch(word.languageId, { updatedAt: now });
  },
});

export const deleteWord = mutation({
  args: {
    wordId: v.id("words"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.wordId);
    if (!word) throw new Error("Word not found");

    // Delete inflected forms
    const forms = await ctx.db
      .query("inflectedForms")
      .withIndex("by_word", (q) => q.eq("wordId", args.wordId))
      .collect();
    for (const form of forms) {
      await ctx.db.delete(form._id);
    }

    // Delete relationships
    const relationsFrom = await ctx.db
      .query("wordRelationships")
      .withIndex("by_from_word", (q) => q.eq("fromWordId", args.wordId))
      .collect();
    for (const rel of relationsFrom) {
      await ctx.db.delete(rel._id);
    }

    const relationsTo = await ctx.db
      .query("wordRelationships")
      .withIndex("by_to_word", (q) => q.eq("toWordId", args.wordId))
      .collect();
    for (const rel of relationsTo) {
      await ctx.db.delete(rel._id);
    }

    await ctx.db.delete(args.wordId);

    await ctx.db.insert("activityLog", {
      languageId: word.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "word",
      entityId: args.wordId,
      details: `Deleted word "${word.lemma}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(word.languageId, { updatedAt: Date.now() });
  },
});

// Inflected Forms
export const getInflectedForms = query({
  args: { wordId: v.id("words") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inflectedForms")
      .withIndex("by_word", (q) => q.eq("wordId", args.wordId))
      .collect();
  },
});

export const createInflectedForm = mutation({
  args: {
    wordId: v.id("words"),
    userId: v.id("users"),
    form: v.string(),
    ipa: v.optional(v.string()),
    grammaticalFeatures: v.optional(v.any()),
    isIrregular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.wordId);
    if (!word) throw new Error("Word not found");

    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("inflectedForms", {
      ...data,
      isIrregular: data.isIrregular ?? false,
    });

    await ctx.db.insert("activityLog", {
      languageId: word.languageId,
      userId,
      action: "create",
      entityType: "inflectedForm",
      entityId: id,
      details: `Added inflected form "${args.form}" to "${word.lemma}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(word.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const deleteInflectedForm = mutation({
  args: {
    inflectedFormId: v.id("inflectedForms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.inflectedFormId);
    if (!form) throw new Error("Inflected form not found");

    const word = await ctx.db.get(form.wordId);
    if (!word) throw new Error("Word not found");

    await ctx.db.delete(args.inflectedFormId);

    await ctx.db.insert("activityLog", {
      languageId: word.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "inflectedForm",
      entityId: args.inflectedFormId,
      details: `Deleted inflected form "${form.form}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(word.languageId, { updatedAt: Date.now() });
  },
});

// Word Relationships
export const createWordRelationship = mutation({
  args: {
    fromWordId: v.id("words"),
    toWordId: v.id("words"),
    userId: v.id("users"),
    relationType: wordRelationType,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fromWord = await ctx.db.get(args.fromWordId);
    if (!fromWord) throw new Error("From word not found");

    const toWord = await ctx.db.get(args.toWordId);
    if (!toWord) throw new Error("To word not found");

    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("wordRelationships", data);

    await ctx.db.insert("activityLog", {
      languageId: fromWord.languageId,
      userId,
      action: "create",
      entityType: "wordRelationship",
      entityId: id,
      details: `Created ${args.relationType} relationship: "${fromWord.lemma}" -> "${toWord.lemma}"`,
      timestamp: Date.now(),
    });

    return id;
  },
});

export const deleteWordRelationship = mutation({
  args: {
    relationshipId: v.id("wordRelationships"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rel = await ctx.db.get(args.relationshipId);
    if (!rel) throw new Error("Relationship not found");

    const fromWord = await ctx.db.get(rel.fromWordId);

    await ctx.db.delete(args.relationshipId);

    if (fromWord) {
      await ctx.db.insert("activityLog", {
        languageId: fromWord.languageId,
        userId: args.userId,
        action: "delete",
        entityType: "wordRelationship",
        entityId: args.relationshipId,
        details: `Deleted word relationship`,
        timestamp: Date.now(),
      });
    }
  },
});
