import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Presence colors for users
const PRESENCE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

// Update user presence
export const updatePresence = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    sessionId: v.string(),
    currentPage: v.string(),
    currentElement: v.optional(v.string()),
    cursorPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    const color = getColorForUser(args.userId);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentPage: args.currentPage,
        currentElement: args.currentElement,
        cursorPosition: args.cursorPosition,
        lastSeen: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("presence", {
      languageId: args.languageId,
      userId: args.userId,
      sessionId: args.sessionId,
      currentPage: args.currentPage,
      currentElement: args.currentElement,
      cursorPosition: args.cursorPosition,
      lastSeen: now,
      color,
    });
  },
});

// Remove presence (when user leaves)
export const removePresence = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (presence) {
      await ctx.db.delete(presence._id);
    }
  },
});

// Get all active presence for a language
export const getPresence = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    // Get presence entries from last 30 seconds
    const cutoff = Date.now() - 30000;
    
    const presenceList = await ctx.db
      .query("presence")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();

    const activePresence = presenceList.filter((p) => p.lastSeen > cutoff);

    return await Promise.all(
      activePresence.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
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

// Cleanup stale presence entries
export const cleanupStalePresence = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 60000; // 1 minute
    
    const stalePresence = await ctx.db
      .query("presence")
      .filter((q) => q.lt(q.field("lastSeen"), cutoff))
      .collect();

    for (const p of stalePresence) {
      await ctx.db.delete(p._id);
    }

    return stalePresence.length;
  },
});

// Get activity log for a language
export const getActivityLog = query({
  args: {
    languageId: v.id("languages"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activityLog")
      .withIndex("by_language_time", (q) => q.eq("languageId", args.languageId))
      .order("desc")
      .take(args.limit ?? 50);

    return await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
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

// Log activity
export const logActivity = mutation({
  args: {
    languageId: v.id("languages"),
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activityLog", {
      languageId: args.languageId,
      userId: args.userId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      details: args.details,
      timestamp: Date.now(),
    });
  },
});
