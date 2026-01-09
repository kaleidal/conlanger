import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const interlinearMorpheme = v.object({
  surface: v.string(),
  underlying: v.optional(v.string()),
  gloss: v.string(),
  wordId: v.optional(v.string()),
});

const interlinearData = v.object({
  morphemes: v.array(interlinearMorpheme),
  translation: v.string(),
});

// Texts
export const getTexts = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("texts")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

export const getText = query({
  args: { textId: v.id("texts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.textId);
  },
});

export const createText = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    title: v.string(),
    originalText: v.optional(v.string()),
    translatedText: v.optional(v.string()),
    interlinearData: v.optional(v.array(interlinearData)),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    const now = Date.now();
    
    const id = await ctx.db.insert("texts", {
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "text",
      entityId: id,
      details: `Added text "${args.title}"`,
      timestamp: now,
    });

    await ctx.db.patch(args.languageId, { updatedAt: now });

    return id;
  },
});

export const updateText = mutation({
  args: {
    textId: v.id("texts"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    originalText: v.optional(v.string()),
    translatedText: v.optional(v.string()),
    interlinearData: v.optional(v.array(interlinearData)),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const text = await ctx.db.get(args.textId);
    if (!text) throw new Error("Text not found");

    const { textId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const now = Date.now();
    await ctx.db.patch(textId, { ...filteredUpdates, updatedAt: now });

    await ctx.db.insert("activityLog", {
      languageId: text.languageId,
      userId,
      action: "update",
      entityType: "text",
      entityId: textId,
      details: `Updated text "${text.title}"`,
      timestamp: now,
    });

    await ctx.db.patch(text.languageId, { updatedAt: now });
  },
});

export const deleteText = mutation({
  args: {
    textId: v.id("texts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const text = await ctx.db.get(args.textId);
    if (!text) throw new Error("Text not found");

    await ctx.db.delete(args.textId);

    await ctx.db.insert("activityLog", {
      languageId: text.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "text",
      entityId: args.textId,
      details: `Deleted text "${text.title}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(text.languageId, { updatedAt: Date.now() });
  },
});
