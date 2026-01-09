import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const syntaxCondition = v.object({
  type: v.string(),
  value: v.string(),
  operator: v.optional(v.string()),
});

const syntaxExample = v.object({
  input: v.string(),
  output: v.string(),
  gloss: v.optional(v.string()),
  translation: v.optional(v.string()),
});

// Syntax Rules
export const getSyntaxRules = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("syntaxRules")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

export const createSyntaxRule = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    name: v.string(),
    ruleType: v.string(),
    pattern: v.string(),
    output: v.optional(v.string()),
    conditions: v.optional(v.array(syntaxCondition)),
    description: v.optional(v.string()),
    examples: v.optional(v.array(syntaxExample)),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("syntaxRules", {
      ...data,
      orderIndex: data.orderIndex ?? 0,
    });

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "syntaxRule",
      entityId: id,
      details: `Added syntax rule ${args.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return id;
  },
});

export const updateSyntaxRule = mutation({
  args: {
    syntaxRuleId: v.id("syntaxRules"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    ruleType: v.optional(v.string()),
    pattern: v.optional(v.string()),
    output: v.optional(v.string()),
    conditions: v.optional(v.array(syntaxCondition)),
    description: v.optional(v.string()),
    examples: v.optional(v.array(syntaxExample)),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.syntaxRuleId);
    if (!rule) throw new Error("Syntax rule not found");

    const { syntaxRuleId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(syntaxRuleId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: rule.languageId,
      userId,
      action: "update",
      entityType: "syntaxRule",
      entityId: syntaxRuleId,
      details: `Updated syntax rule ${rule.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(rule.languageId, { updatedAt: Date.now() });
  },
});

export const deleteSyntaxRule = mutation({
  args: {
    syntaxRuleId: v.id("syntaxRules"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.syntaxRuleId);
    if (!rule) throw new Error("Syntax rule not found");

    await ctx.db.delete(args.syntaxRuleId);

    await ctx.db.insert("activityLog", {
      languageId: rule.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "syntaxRule",
      entityId: args.syntaxRuleId,
      details: `Deleted syntax rule ${rule.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(rule.languageId, { updatedAt: Date.now() });
  },
});
