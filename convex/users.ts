import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get current user with role
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    return {
      ...user,
      role: profile?.role || "user",
    };
  },
});

// Admin only: Get all users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (currentUserProfile?.role !== "admin") {
      throw new Error("Not authorized");
    }
    
    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("userProfiles").collect();
    
    return users.map(user => {
      const profile = profiles.find(p => p.userId === user._id);
      return {
        ...user,
        role: profile?.role || "user",
      };
    });
  },
});

// Set email verification time when user signs up for the first time
export const setEmailVerificationTime = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    if (user && !user.emailVerificationTime) {
      await ctx.db.patch(user._id, {
        emailVerificationTime: Date.now(),
      });
    }
    
    return null;
  },
});

// Admin only: Create user placeholder (user must still sign up themselves)
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("manager")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (currentUserProfile?.role !== "admin") {
      throw new Error("Not authorized");
    }
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    
    // Create user record without password (user will set password during sign up)
    const newUserId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      // Don't set emailVerificationTime yet - will be set when user actually signs up
    });
    
    // Create user profile with the specified role
    await ctx.db.insert("userProfiles", {
      userId: newUserId,
      role: args.role,
      createdAt: Date.now(),
    });
    
    return { 
      success: true, 
      userId: newUserId,
      message: `Benutzer "${args.name}" wurde erstellt. Der Benutzer muss sich jetzt mit "Sign up" registrieren, um sein Konto zu aktivieren.`
    };
  },
});

// Admin only: Update user role
export const updateUserRole = mutation({
  args: {
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("user"), v.literal("manager")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (currentUserProfile?.role !== "admin") {
      throw new Error("Not authorized");
    }
    
    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();
    
    if (targetProfile) {
      await ctx.db.patch(targetProfile._id, {
        role: args.newRole,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.targetUserId,
        role: args.newRole,
        createdAt: Date.now(),
      });
    }
    
    return null;
  },
});

// Admin only: Delete user
export const deleteUser = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (currentUserProfile?.role !== "admin") {
      throw new Error("Not authorized");
    }
    
    // Don't allow deleting yourself
    if (args.targetUserId === userId) {
      throw new Error("Cannot delete your own account");
    }
    
    // Delete user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();
    
    if (profile) {
      await ctx.db.delete(profile._id);
    }
    
    // Delete user
    await ctx.db.delete(args.targetUserId);
    
    return null;
  },
});

// Update own profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const updates: any = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
    
    return null;
  },
});