import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Create room
export const createRoom = mutation({
  args: {
    objectId: v.id("objects"),
    name: v.string(),
    flooring: v.string(),
    walls: v.string(),
    outlets: v.number(),
    lightSwitches: v.number(),
    windows: v.number(),
    radiators: v.number(),
    condition: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const object = await ctx.db.get(args.objectId);
    if (!object) {
      throw new Error("Object not found");
    }
    
    // Check permissions
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    const isOwner = object.createdBy === userId;
    
    if (!isAdmin && !isOwner) {
      throw new Error("Not authorized");
    }
    
    // Don't allow editing released objects unless admin
    if (object.isReleased && !isAdmin) {
      throw new Error("Cannot edit released object");
    }
    console.log(args)
    const roomId = await ctx.db.insert("rooms", {
      ...args,
      createdAt: Date.now(),
    });
    
    return roomId;
  },
});

// Update room
export const updateRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.optional(v.string()),
    flooring: v.optional(v.string()),
    walls: v.optional(v.string()),
    outlets: v.optional(v.number()),
    lightSwitches: v.optional(v.number()),
    windows: v.optional(v.number()),
    radiators: v.optional(v.number()),
    condition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    
    const object = await ctx.db.get(room.objectId);
    if (!object) {
      throw new Error("Object not found");
    }
    
    // Check permissions
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    const isOwner = object.createdBy === userId;
    
    if (!isAdmin && !isOwner) {
      throw new Error("Not authorized");
    }
    
    // Don't allow editing released objects unless admin
    if (object.isReleased && !isAdmin) {
      throw new Error("Cannot edit released object");
    }
    
    const { roomId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(args.roomId, filteredUpdates);
    return null;
  },
});

// Delete room
export const deleteRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    
    const object = await ctx.db.get(room.objectId);
    if (!object) {
      throw new Error("Object not found");
    }
    
    // Check permissions
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    const isOwner = object.createdBy === userId;
    
    if (!isAdmin && !isOwner) {
      throw new Error("Not authorized");
    }
    
    // Don't allow editing released objects unless admin
    if (object.isReleased && !isAdmin) {
      throw new Error("Cannot edit released object");
    }
    
    // Delete all images for this room
    const images = await ctx.db
      .query("roomImages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    for (const image of images) {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }
    
    await ctx.db.delete(args.roomId);
    return null;
  },
});

// Generate upload URL for room image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});

// Add image to room
export const addRoomImage = mutation({
  args: {
    roomId: v.id("rooms"),
    storageId: v.id("_storage"),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    
    const object = await ctx.db.get(room.objectId);
    if (!object) {
      throw new Error("Object not found");
    }
    
    // Check permissions
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    const isOwner = object.createdBy === userId;
    
    if (!isAdmin && !isOwner) {
      throw new Error("Not authorized");
    }
    
    // Don't allow editing released objects unless admin
    if (object.isReleased && !isAdmin) {
      throw new Error("Cannot edit released object");
    }
    
    const imageId = await ctx.db.insert("roomImages", {
      roomId: args.roomId,
      storageId: args.storageId,
      filename: args.filename,
      createdAt: Date.now(),
    });
    
    return imageId;
  },
});

// Delete room image
export const deleteRoomImage = mutation({
  args: {
    imageId: v.id("roomImages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }
    
    const room = await ctx.db.get(image.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    
    const object = await ctx.db.get(room.objectId);
    if (!object) {
      throw new Error("Object not found");
    }
    
    // Check permissions
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    const isOwner = object.createdBy === userId;
    
    if (!isAdmin && !isOwner) {
      throw new Error("Not authorized");
    }
    
    // Don't allow editing released objects unless admin
    if (object.isReleased && !isAdmin) {
      throw new Error("Cannot edit released object");
    }
    
    await ctx.storage.delete(image.storageId);
    await ctx.db.delete(args.imageId);
    
    return null;
  },
});
