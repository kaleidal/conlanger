import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Helper to check if user can access language
async function canAccessLanguage(
  ctx: any,
  languageId: Id<"languages">,
  userId: Id<"users"> | null
): Promise<{ canRead: boolean; canWrite: boolean; isOwner: boolean }> {
  const language = await ctx.db.get(languageId);
  if (!language) {
    return { canRead: false, canWrite: false, isOwner: false };
  }

  if (language.isPublic) {
    const isOwner = userId ? language.ownerId === userId : false;
    if (isOwner) {
      return { canRead: true, canWrite: true, isOwner: true };
    }

    if (userId) {
      const collab = await ctx.db
        .query("collaborators")
        .withIndex("by_language_user", (q: any) =>
          q.eq("languageId", languageId).eq("userId", userId)
        )
        .first();
      if (collab) {
        return {
          canRead: true,
          canWrite: collab.role === "editor",
          isOwner: false,
        };
      }
    }

    return { canRead: true, canWrite: false, isOwner: false };
  }

  // Private language
  if (!userId) {
    return { canRead: false, canWrite: false, isOwner: false };
  }

  if (language.ownerId === userId) {
    return { canRead: true, canWrite: true, isOwner: true };
  }

  const collab = await ctx.db
    .query("collaborators")
    .withIndex("by_language_user", (q: any) =>
      q.eq("languageId", languageId).eq("userId", userId)
    )
    .first();

  if (collab) {
    return {
      canRead: true,
      canWrite: collab.role === "editor",
      isOwner: false,
    };
  }

  return { canRead: false, canWrite: false, isOwner: false };
}

// List all languages for current user (owned + collaborated + public)
export const listLanguages = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) {
      // Return only public languages for anonymous users
      const publicLanguages = await ctx.db
        .query("languages")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .collect();

      return await Promise.all(
        publicLanguages.map(async (lang) => {
          const owner = await ctx.db.get(lang.ownerId);
          return {
            ...lang,
            owner: owner
              ? { displayName: owner.displayName, handle: owner.handle }
              : null,
            role: "viewer" as const,
          };
        })
      );
    }

    // Get owned languages
    const ownedLanguages = await ctx.db
      .query("languages")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId!))
      .collect();

    // Get collaborated languages
    const collaborations = await ctx.db
      .query("collaborators")
      .withIndex("by_user", (q) => q.eq("userId", args.userId!))
      .collect();

    const collaboratedLanguages = await Promise.all(
      collaborations.map(async (collab) => {
        const lang = await ctx.db.get(collab.languageId);
        return lang ? { ...lang, role: collab.role } : null;
      })
    );

    // Get public languages not already included
    const publicLanguages = await ctx.db
      .query("languages")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    const ownedIds = new Set(ownedLanguages.map((l) => l._id));
    const collabIds = new Set(collaborations.map((c) => c.languageId));

    const otherPublic = publicLanguages.filter(
      (l) => !ownedIds.has(l._id) && !collabIds.has(l._id)
    );

    const allLanguages = [
      ...ownedLanguages.map((l) => ({ ...l, role: "owner" as const })),
      ...collaboratedLanguages.filter(Boolean),
      ...otherPublic.map((l) => ({ ...l, role: "viewer" as const })),
    ];

    return await Promise.all(
      allLanguages.map(async (lang) => {
        if (!lang) return null;
        const owner = await ctx.db.get(lang.ownerId);
        return {
          ...lang,
          owner: owner
            ? { displayName: owner.displayName, handle: owner.handle }
            : null,
        };
      })
    );
  },
});

// Get a single language with full data
export const getLanguage = query({
  args: {
    languageId: v.id("languages"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const access = await canAccessLanguage(
      ctx,
      args.languageId,
      args.userId ?? null
    );
    if (!access.canRead) {
      return null;
    }

    const language = await ctx.db.get(args.languageId);
    if (!language) return null;

    const owner = await ctx.db.get(language.ownerId);

    return {
      ...language,
      owner: owner
        ? { displayName: owner.displayName, handle: owner.handle, avatarUrl: owner.avatarUrl }
        : null,
      access,
    };
  },
});

// Create a new language
export const createLanguage = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    nativeName: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("languages", {
      ownerId: args.userId,
      name: args.name,
      nativeName: args.nativeName,
      description: args.description,
      isPublic: args.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a language
export const updateLanguage = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    nativeName: v.optional(v.string()),
    description: v.optional(v.string()),
    isoCode: v.optional(v.string()),
    settings: v.optional(v.any()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const access = await canAccessLanguage(ctx, args.languageId, args.userId);
    if (!access.canWrite) {
      throw new Error("No permission to edit this language");
    }

    const { languageId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(languageId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      languageId,
      userId,
      action: "update",
      entityType: "language",
      entityId: languageId,
      details: `Updated language settings`,
      timestamp: Date.now(),
    });
  },
});

// Delete a language
export const deleteLanguage = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const access = await canAccessLanguage(ctx, args.languageId, args.userId);
    if (!access.isOwner) {
      throw new Error("Only the owner can delete this language");
    }

    // Delete all related data
    const tables = [
      "phonemes",
      "allophones",
      "phonotactics",
      "soundChanges",
      "grammarCategories",
      "morphemes",
      "inflectionClasses",
      "syntaxRules",
      "words",
      "scripts",
      "texts",
      "collaborators",
      "presence",
      "activityLog",
    ] as const;

    for (const table of tables) {
      const items = await ctx.db
        .query(table)
        .withIndex("by_language", (q: any) => q.eq("languageId", args.languageId))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
    }

    // Delete inflected forms and word relationships for words
    const words = await ctx.db
      .query("words")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
    for (const word of words) {
      const forms = await ctx.db
        .query("inflectedForms")
        .withIndex("by_word", (q) => q.eq("wordId", word._id))
        .collect();
      for (const form of forms) {
        await ctx.db.delete(form._id);
      }
      const relationsFrom = await ctx.db
        .query("wordRelationships")
        .withIndex("by_from_word", (q) => q.eq("fromWordId", word._id))
        .collect();
      for (const rel of relationsFrom) {
        await ctx.db.delete(rel._id);
      }
    }

    // Delete glyphs and romanization rules for scripts
    const scripts = await ctx.db
      .query("scripts")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
    for (const script of scripts) {
      const glyphs = await ctx.db
        .query("glyphs")
        .withIndex("by_script", (q) => q.eq("scriptId", script._id))
        .collect();
      for (const glyph of glyphs) {
        await ctx.db.delete(glyph._id);
      }
      const rules = await ctx.db
        .query("romanizationRules")
        .withIndex("by_script", (q) => q.eq("scriptId", script._id))
        .collect();
      for (const rule of rules) {
        await ctx.db.delete(rule._id);
      }
    }

    await ctx.db.delete(args.languageId);
  },
});

// Add collaborator
export const addCollaborator = mutation({
  args: {
    languageId: v.id("languages"),
    ownerId: v.id("users"),
    userHandle: v.string(),
    role: v.union(v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const access = await canAccessLanguage(ctx, args.languageId, args.ownerId);
    if (!access.isOwner) {
      throw new Error("Only the owner can add collaborators");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", args.userHandle))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existing = await ctx.db
      .query("collaborators")
      .withIndex("by_language_user", (q) =>
        q.eq("languageId", args.languageId).eq("userId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }

    return await ctx.db.insert("collaborators", {
      languageId: args.languageId,
      userId: user._id,
      role: args.role,
      addedAt: Date.now(),
    });
  },
});

// Remove collaborator
export const removeCollaborator = mutation({
  args: {
    languageId: v.id("languages"),
    ownerId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const access = await canAccessLanguage(ctx, args.languageId, args.ownerId);
    if (!access.isOwner) {
      throw new Error("Only the owner can remove collaborators");
    }

    const collab = await ctx.db
      .query("collaborators")
      .withIndex("by_language_user", (q) =>
        q.eq("languageId", args.languageId).eq("userId", args.userId)
      )
      .first();

    if (collab) {
      await ctx.db.delete(collab._id);
    }
  },
});

// Get collaborators for a language
export const getCollaborators = query({
  args: {
    languageId: v.id("languages"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return [];

    const access = await canAccessLanguage(ctx, args.languageId, args.userId);
    if (!access.canRead) {
      return [];
    }

    const collaborators = await ctx.db
      .query("collaborators")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();

    return await Promise.all(
      collaborators.map(async (collab) => {
        const user = await ctx.db.get(collab.userId);
        return {
          ...collab,
          user: user
            ? {
                displayName: user.displayName,
                handle: user.handle,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );
  },
});
