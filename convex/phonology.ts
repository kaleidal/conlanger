import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const phonemeType = v.union(v.literal("consonant"), v.literal("vowel"));

const phonemeFeatures = v.object({
  manner: v.optional(v.string()),
  place: v.optional(v.string()),
  voicing: v.optional(v.string()),
  height: v.optional(v.string()),
  backness: v.optional(v.string()),
  roundedness: v.optional(v.string()),
  length: v.optional(v.string()),
  nasalization: v.optional(v.boolean()),
  aspiration: v.optional(v.boolean()),
  palatalization: v.optional(v.boolean()),
  labialization: v.optional(v.boolean()),
  pharyngealization: v.optional(v.boolean()),
  glottalization: v.optional(v.boolean()),
  tone: v.optional(v.string()),
});

// Get all phonemes for a language
export const getPhonemes = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("phonemes")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

// Create a phoneme
export const createPhoneme = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    symbol: v.string(),
    type: phonemeType,
    ipa: v.string(),
    romanization: v.optional(v.string()),
    features: v.optional(phonemeFeatures),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const phonemeId = await ctx.db.insert("phonemes", {
      ...data,
      sortOrder: data.sortOrder ?? 0,
    });

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "phoneme",
      entityId: phonemeId,
      details: `Added phoneme ${args.symbol}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return phonemeId;
  },
});

// Update a phoneme
export const updatePhoneme = mutation({
  args: {
    phonemeId: v.id("phonemes"),
    userId: v.id("users"),
    symbol: v.optional(v.string()),
    type: v.optional(phonemeType),
    ipa: v.optional(v.string()),
    romanization: v.optional(v.string()),
    features: v.optional(phonemeFeatures),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const phoneme = await ctx.db.get(args.phonemeId);
    if (!phoneme) throw new Error("Phoneme not found");

    const { phonemeId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(phonemeId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: phoneme.languageId,
      userId,
      action: "update",
      entityType: "phoneme",
      entityId: phonemeId,
      details: `Updated phoneme ${phoneme.symbol}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(phoneme.languageId, { updatedAt: Date.now() });
  },
});

// Delete a phoneme
export const deletePhoneme = mutation({
  args: {
    phonemeId: v.id("phonemes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const phoneme = await ctx.db.get(args.phonemeId);
    if (!phoneme) throw new Error("Phoneme not found");

    // Delete associated allophones
    const allophones = await ctx.db
      .query("allophones")
      .withIndex("by_phoneme", (q) => q.eq("phonemeId", args.phonemeId))
      .collect();
    
    for (const allophone of allophones) {
      await ctx.db.delete(allophone._id);
    }

    await ctx.db.delete(args.phonemeId);

    await ctx.db.insert("activityLog", {
      languageId: phoneme.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "phoneme",
      entityId: args.phonemeId,
      details: `Deleted phoneme ${phoneme.symbol}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(phoneme.languageId, { updatedAt: Date.now() });
  },
});

// Get all allophones for a language
export const getAllophones = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("allophones")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

// Create an allophone
export const createAllophone = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    phonemeId: v.id("phonemes"),
    symbol: v.string(),
    ipa: v.string(),
    environment: v.string(),
    environmentDescription: v.optional(v.string()),
    features: v.optional(phonemeFeatures),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const allophoneId = await ctx.db.insert("allophones", data);

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "allophone",
      entityId: allophoneId,
      details: `Added allophone ${args.symbol}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return allophoneId;
  },
});

// Update an allophone
export const updateAllophone = mutation({
  args: {
    allophoneId: v.id("allophones"),
    userId: v.id("users"),
    symbol: v.optional(v.string()),
    ipa: v.optional(v.string()),
    environment: v.optional(v.string()),
    environmentDescription: v.optional(v.string()),
    features: v.optional(phonemeFeatures),
  },
  handler: async (ctx, args) => {
    const allophone = await ctx.db.get(args.allophoneId);
    if (!allophone) throw new Error("Allophone not found");

    const { allophoneId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(allophoneId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: allophone.languageId,
      userId,
      action: "update",
      entityType: "allophone",
      entityId: allophoneId,
      details: `Updated allophone ${allophone.symbol}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(allophone.languageId, { updatedAt: Date.now() });
  },
});

// Delete an allophone
export const deleteAllophone = mutation({
  args: {
    allophoneId: v.id("allophones"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const allophone = await ctx.db.get(args.allophoneId);
    if (!allophone) throw new Error("Allophone not found");

    await ctx.db.delete(args.allophoneId);

    await ctx.db.insert("activityLog", {
      languageId: allophone.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "allophone",
      entityId: args.allophoneId,
      details: `Deleted allophone ${allophone.symbol}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(allophone.languageId, { updatedAt: Date.now() });
  },
});

// Get all phonotactics for a language
export const getPhonotactics = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("phonotactics")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

// Create a phonotactic rule
export const createPhonotactic = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    name: v.string(),
    pattern: v.string(),
    description: v.optional(v.string()),
    syllablePosition: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    examples: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("phonotactics", {
      ...data,
      isRequired: data.isRequired ?? false,
    });

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "phonotactic",
      entityId: id,
      details: `Added phonotactic rule ${args.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return id;
  },
});

// Update a phonotactic rule
export const updatePhonotactic = mutation({
  args: {
    phonotacticId: v.id("phonotactics"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    pattern: v.optional(v.string()),
    description: v.optional(v.string()),
    syllablePosition: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    examples: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const phonotactic = await ctx.db.get(args.phonotacticId);
    if (!phonotactic) throw new Error("Phonotactic rule not found");

    const { phonotacticId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(phonotacticId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: phonotactic.languageId,
      userId,
      action: "update",
      entityType: "phonotactic",
      entityId: phonotacticId,
      details: `Updated phonotactic rule ${phonotactic.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(phonotactic.languageId, { updatedAt: Date.now() });
  },
});

// Delete a phonotactic rule
export const deletePhonotactic = mutation({
  args: {
    phonotacticId: v.id("phonotactics"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const phonotactic = await ctx.db.get(args.phonotacticId);
    if (!phonotactic) throw new Error("Phonotactic rule not found");

    await ctx.db.delete(args.phonotacticId);

    await ctx.db.insert("activityLog", {
      languageId: phonotactic.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "phonotactic",
      entityId: args.phonotacticId,
      details: `Deleted phonotactic rule ${phonotactic.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(phonotactic.languageId, { updatedAt: Date.now() });
  },
});

// Get all sound changes for a language
export const getSoundChanges = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("soundChanges")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

// Create a sound change
export const createSoundChange = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    name: v.string(),
    fromPattern: v.string(),
    toPattern: v.string(),
    environment: v.optional(v.string()),
    description: v.optional(v.string()),
    orderIndex: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    era: v.optional(v.string()),
    exceptions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    
    const id = await ctx.db.insert("soundChanges", {
      ...data,
      orderIndex: data.orderIndex ?? 0,
      isActive: data.isActive ?? true,
    });

    await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId,
      action: "create",
      entityType: "soundChange",
      entityId: id,
      details: `Added sound change ${args.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.languageId, { updatedAt: Date.now() });

    return id;
  },
});

// Update a sound change
export const updateSoundChange = mutation({
  args: {
    soundChangeId: v.id("soundChanges"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    fromPattern: v.optional(v.string()),
    toPattern: v.optional(v.string()),
    environment: v.optional(v.string()),
    description: v.optional(v.string()),
    orderIndex: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    era: v.optional(v.string()),
    exceptions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const soundChange = await ctx.db.get(args.soundChangeId);
    if (!soundChange) throw new Error("Sound change not found");

    const { soundChangeId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(soundChangeId, filteredUpdates);

    await ctx.db.insert("activityLog", {
      languageId: soundChange.languageId,
      userId,
      action: "update",
      entityType: "soundChange",
      entityId: soundChangeId,
      details: `Updated sound change ${soundChange.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(soundChange.languageId, { updatedAt: Date.now() });
  },
});

// Delete a sound change
export const deleteSoundChange = mutation({
  args: {
    soundChangeId: v.id("soundChanges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const soundChange = await ctx.db.get(args.soundChangeId);
    if (!soundChange) throw new Error("Sound change not found");

    await ctx.db.delete(args.soundChangeId);

    await ctx.db.insert("activityLog", {
      languageId: soundChange.languageId,
      userId: args.userId,
      action: "delete",
      entityType: "soundChange",
      entityId: args.soundChangeId,
      details: `Deleted sound change ${soundChange.name}`,
      timestamp: Date.now(),
    });

    await ctx.db.patch(soundChange.languageId, { updatedAt: Date.now() });
  },
});
