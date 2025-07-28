import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Initialize admin user (creates admin profile if none exists)
export const initializeAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if any admin exists
    const existingAdmin = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdmin) {
      return null; // Admin already exists
    }

    // Get the first user (should be the initial user)
    const firstUser = await ctx.db.query("users").first();
    if (!firstUser) {
      return null; // No users exist yet
    }

    // Create admin profile for the first user
    await ctx.db.insert("userProfiles", {
      userId: firstUser._id,
      role: "admin",
      createdAt: Date.now(),
    });

    return null;
  },
});

// Create user profile for current user after registration
export const createUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      return null; // Profile already exists
    }

    // Create user profile with default "user" role
    await ctx.db.insert("userProfiles", {
      userId: userId,
      role: "user",
      createdAt: Date.now(),
    });

    return null;
  },
});
