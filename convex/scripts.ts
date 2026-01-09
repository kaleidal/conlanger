import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const scriptType = v.union(
  v.literal("alphabet"),
  v.literal("abjad"),
  v.literal("abugida"),
  v.literal("syllabary"),
  v.literal("logographic"),
  v.literal("featural"),
  v.literal("mixed")
);

const scriptSettings = v.object({
  fontSize: v.optional(v.number()),
  lineHeight: v.optional(v.number()),
  letterSpacing: v.optional(v.number()),
  customFont: v.optional(v.string()),
});

const glyphVariant = v.object({
  position: v.string(),
  form: v.string(),
  svgPath: v.optional(v.string()),
});

// Scripts
export const getScripts = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scripts")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

export const getScript = query({
  args: { scriptId: v.id("scripts") },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) return null;

    const glyphs = await ctx.db
      .query("glyphs")
      .withIndex("by_script", (q) => q.eq("scriptId", args.scriptId))
      .collect();

    const romanizationRules = await ctx.db
      .query("romanizationRules")
      .withIndex("by_script", (q) => q.eq("scriptId", args.scriptId))
      .collect();

    return { ...script, glyphs, romanizationRules };
  },
});

export const createScript = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    name: v.string(),
    type: scriptType,
    description: v.optional(v.string()),
    direction: v.optional(v.string()),
    baselinePosition: v.optional(v.string()),
    settings: v.optional(scriptSettings),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("scripts", {
      ...data,
      direction: data.direction ?? "ltr",
    });

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "script",
      entityId: id,
      details: `Added script "${args.name}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const updateScript = mutation({
  args: {
    scriptId: v.id("scripts"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    type: v.optional(scriptType),
    description: v.optional(v.string()),
    direction: v.optional(v.string()),
    baselinePosition: v.optional(v.string()),
    settings: v.optional(scriptSettings),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) throw new Error("Script not found");

    const { scriptId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(scriptId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: script.languageId,
      userId,
      action: "update",
      entityType: "script",
      entityId: scriptId,
      details: `Updated script "${script.name}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(script.languageId, { updatedAt: Date.now() });
  },
});

export const deleteScript = mutation({
  args: {
    scriptId: v.id("scripts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) throw new Error("Script not found");

    // Delete glyphs
    const glyphs = await ctx.db
      .query("glyphs")
      .withIndex("by_script", (q) => q.eq("scriptId", args.scriptId))
      .collect();
    for (const glyph of glyphs) {
      await ctx.db.delete(glyph._id);
    }

    // Delete romanization rules
    const rules = await ctx.db
      .query("romanizationRules")
      .withIndex("by_script", (q) => q.eq("scriptId", args.scriptId))
      .collect();
    for (const rule of rules) {
      await ctx.db.delete(rule._id);
    }

    await ctx.db.delete(args.scriptId);

    await ctx.db.insert("activityLog", {
      languageId: script.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "script",
      entityId: args.scriptId,
      details: `Deleted script "${script.name}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(script.languageId, { updatedAt: Date.now() });
  },
});

// Glyphs
export const getGlyphs = query({
  args: { scriptId: v.id("scripts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("glyphs")
      .withIndex("by_script", (q) => q.eq("scriptId", args.scriptId))
      .collect();
  },
});

export const createGlyph = mutation({
  args: {
    scriptId: v.id("scripts"),
    userId: v.id("users"),
    character: v.optional(v.string()),
    svgPath: v.optional(v.string()),
    unicodePoint: v.optional(v.string()),
    phonemeMapping: v.optional(v.string()),
    name: v.optional(v.string()),
    variants: v.optional(v.array(glyphVariant)),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) throw new Error("Script not found");

    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("glyphs", {
      ...data,
      sortOrder: data.sortOrder ?? 0,
    });

    await ctx.db.insert("activityLog", {
      languageId: script.languageId,
      userId,
      action: "create",
      entityType: "glyph",
      entityId: id,
      details: `Added glyph "${args.character || args.name || 'unnamed'}"`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(script.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const updateGlyph = mutation({
  args: {
    glyphId: v.id("glyphs"),
    userId: v.id("users"),
    character: v.optional(v.string()),
    svgPath: v.optional(v.string()),
    unicodePoint: v.optional(v.string()),
    phonemeMapping: v.optional(v.string()),
    name: v.optional(v.string()),
    variants: v.optional(v.array(glyphVariant)),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const glyph = await ctx.db.get(args.glyphId);
    if (!glyph) throw new Error("Glyph not found");

    const script = await ctx.db.get(glyph.scriptId);
    if (!script) throw new Error("Script not found");

    const { glyphId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(glyphId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: script.languageId,
      userId,
      action: "update",
      entityType: "glyph",
      entityId: glyphId,
      details: `Updated glyph`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(script.languageId, { updatedAt: Date.now() });
  },
});

export const deleteGlyph = mutation({
  args: {
    glyphId: v.id("glyphs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const glyph = await ctx.db.get(args.glyphId);
    if (!glyph) throw new Error("Glyph not found");

    const script = await ctx.db.get(glyph.scriptId);
    if (!script) throw new Error("Script not found");

    await ctx.db.delete(args.glyphId);

    await ctx.db.insert("activityLog", {
      languageId: script.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "glyph",
      entityId: args.glyphId,
      details: `Deleted glyph`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(script.languageId, { updatedAt: Date.now() });
  },
});

// Romanization Rules
export const getRomanizationRules = query({
  args: { scriptId: v.id("scripts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("romanizationRules")
      .withIndex("by_script", (q) => q.eq("scriptId", args.scriptId))
      .collect();
  },
});

export const createRomanizationRule = mutation({
  args: {
    scriptId: v.id("scripts"),
    userId: v.id("users"),
    nativeForm: v.string(),
    romanizedForm: v.string(),
    environment: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) throw new Error("Script not found");

    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("romanizationRules", {
      ...data,
      priority: data.priority ?? 0,
    });

    await ctx.db.insert("activityLog", {
      languageId: script.languageId,
      userId,
      action: "create",
      entityType: "romanizationRule",
      entityId: id,
      details: `Added romanization rule: ${args.nativeForm} -> ${args.romanizedForm}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(script.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const deleteRomanizationRule = mutation({
  args: {
    ruleId: v.id("romanizationRules"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new Error("Rule not found");

    const script = await ctx.db.get(rule.scriptId);
    if (!script) throw new Error("Script not found");

    await ctx.db.delete(args.ruleId);

    await ctx.db.insert("activityLog", {
      languageId: script.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "romanizationRule",
      entityId: args.ruleId,
      details: `Deleted romanization rule`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(script.languageId, { updatedAt: Date.now() });
  },
});
