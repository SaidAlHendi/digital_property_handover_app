import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Generate upload URL for object images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Add image to object section
export const addObjectImage = mutation({
  args: {
    objectId: v.id("objects"),
    section: v.union(v.literal("keys"), v.literal("counters"), v.literal("miscellaneous")),
    storageId: v.id("_storage"),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    const isOwner = object.createdBy === userId;
    
    if (!isAdmin && !isOwner) throw new Error("Not authorized");
    if (object.isReleased && !isAdmin) throw new Error("Cannot edit released object");

    await ctx.db.insert("objectImages", {
      objectId: args.objectId,
      section: args.section,
      storageId: args.storageId,
      filename: args.filename,
      createdAt: Date.now(),
    });

    return null;
  },
});

// Delete object image
export const deleteObjectImage = mutation({
  args: {
    imageId: v.id("objectImages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");

    const object = await ctx.db.get(image.objectId);
    if (!object) throw new Error("Object not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    const isOwner = object.createdBy === userId;
    
    if (!isAdmin && !isOwner) throw new Error("Not authorized");
    if (object.isReleased && !isAdmin) throw new Error("Cannot edit released object");

    await ctx.storage.delete(image.storageId);
    await ctx.db.delete(args.imageId);

    return null;
  },
});
