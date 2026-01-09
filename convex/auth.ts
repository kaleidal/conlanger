import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current user from session token
export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    
    return await ctx.db.get(session.userId);
  },
});

// Create or update user from Ave OAuth
export const upsertUser = mutation({
  args: {
    aveId: v.string(),
    handle: v.string(),
    displayName: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_ave_id", (q) => q.eq("aveId", args.aveId))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        handle: args.handle,
        displayName: args.displayName,
        email: args.email,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("users", {
        aveId: args.aveId,
        handle: args.handle,
        displayName: args.displayName,
        email: args.email,
        avatarUrl: args.avatarUrl,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Create session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

// Delete session (logout)
export const deleteSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Clean up expired sessions
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query("sessions")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }
    
    return expiredSessions.length;
  },
});
