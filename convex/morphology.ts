import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const affixType = v.union(
  v.literal("prefix"),
  v.literal("suffix"),
  v.literal("infix"),
  v.literal("circumfix"),
  v.literal("interfix"),
  v.literal("suprafix"),
  v.literal("transfix")
);

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

const grammarValue = v.object({
  name: v.string(),
  abbreviation: v.string(),
  description: v.optional(v.string()),
});

const allomorph = v.object({
  form: v.string(),
  condition: v.string(),
  description: v.optional(v.string()),
});

const paradigmCell = v.object({
  features: v.any(),
  form: v.string(),
  isRegular: v.boolean(),
});

// Grammar Categories
export const getGrammarCategories = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("grammarCategories")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

export const createGrammarCategory = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    name: v.string(),
    abbreviation: v.optional(v.string()),
    description: v.optional(v.string()),
    values: v.optional(v.array(grammarValue)),
    appliesTo: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("grammarCategories", data);

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "grammarCategory",
      entityId: id,
      details: `Added grammar category ${args.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const updateGrammarCategory = mutation({
  args: {
    grammarCategoryId: v.id("grammarCategories"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    description: v.optional(v.string()),
    values: v.optional(v.array(grammarValue)),
    appliesTo: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.grammarCategoryId);
    if (!category) throw new Error("Grammar category not found");

    const { grammarCategoryId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(grammarCategoryId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: category.languageId,
      userId,
      action: "update",
      entityType: "grammarCategory",
      entityId: grammarCategoryId,
      details: `Updated grammar category ${category.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(category.languageId, { updatedAt: Date.now() });
  },
});

export const deleteGrammarCategory = mutation({
  args: {
    grammarCategoryId: v.id("grammarCategories"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.grammarCategoryId);
    if (!category) throw new Error("Grammar category not found");

    await ctx.db.delete(args.grammarCategoryId);

    await ctx.db.insert("activityLog", {
      languageId: category.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "grammarCategory",
      entityId: args.grammarCategoryId,
      details: `Deleted grammar category ${category.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(category.languageId, { updatedAt: Date.now() });
  },
});

// Morphemes
export const getMorphemes = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("morphemes")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

export const createMorpheme = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    form: v.string(),
    gloss: v.string(),
    type: affixType,
    allomorphs: v.optional(v.array(allomorph)),
    grammaticalMeaning: v.optional(v.any()),
    phonologicalCondition: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("morphemes", data);

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "morpheme",
      entityId: id,
      details: `Added morpheme ${args.form}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const updateMorpheme = mutation({
  args: {
    morphemeId: v.id("morphemes"),
    userId: v.id("users"),
    form: v.optional(v.string()),
    gloss: v.optional(v.string()),
    type: v.optional(affixType),
    allomorphs: v.optional(v.array(allomorph)),
    grammaticalMeaning: v.optional(v.any()),
    phonologicalCondition: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const morpheme = await ctx.db.get(args.morphemeId);
    if (!morpheme) throw new Error("Morpheme not found");

    const { morphemeId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(morphemeId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: morpheme.languageId,
      userId,
      action: "update",
      entityType: "morpheme",
      entityId: morphemeId,
      details: `Updated morpheme ${morpheme.form}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(morpheme.languageId, { updatedAt: Date.now() });
  },
});

export const deleteMorpheme = mutation({
  args: {
    morphemeId: v.id("morphemes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const morpheme = await ctx.db.get(args.morphemeId);
    if (!morpheme) throw new Error("Morpheme not found");

    await ctx.db.delete(args.morphemeId);

    await ctx.db.insert("activityLog", {
      languageId: morpheme.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "morpheme",
      entityId: args.morphemeId,
      details: `Deleted morpheme ${morpheme.form}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(morpheme.languageId, { updatedAt: Date.now() });
  },
});

// Inflection Classes
export const getInflectionClasses = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inflectionClasses")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

export const createInflectionClass = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    name: v.string(),
    wordClass: wordClass,
    description: v.optional(v.string()),
    paradigm: v.optional(v.array(paradigmCell)),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("inflectionClasses", data);

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "inflectionClass",
      entityId: id,
      details: `Added inflection class ${args.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const updateInflectionClass = mutation({
  args: {
    inflectionClassId: v.id("inflectionClasses"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    wordClass: v.optional(wordClass),
    description: v.optional(v.string()),
    paradigm: v.optional(v.array(paradigmCell)),
  },
  handler: async (ctx, args) => {
    const inflectionClass = await ctx.db.get(args.inflectionClassId);
    if (!inflectionClass) throw new Error("Inflection class not found");

    const { inflectionClassId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(inflectionClassId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: inflectionClass.languageId,
      userId,
      action: "update",
      entityType: "inflectionClass",
      entityId: inflectionClassId,
      details: `Updated inflection class ${inflectionClass.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(inflectionClass.languageId, { updatedAt: Date.now() });
  },
});

export const deleteInflectionClass = mutation({
  args: {
    inflectionClassId: v.id("inflectionClasses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const inflectionClass = await ctx.db.get(args.inflectionClassId);
    if (!inflectionClass) throw new Error("Inflection class not found");

    await ctx.db.delete(args.inflectionClassId);

    await ctx.db.insert("activityLog", {
      languageId: inflectionClass.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "inflectionClass",
      entityId: args.inflectionClassId,
      details: `Deleted inflection class ${inflectionClass.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(inflectionClass.languageId, { updatedAt: Date.now() });
  },
});
