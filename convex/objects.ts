import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get objects for current user
export const getUserObjects = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    if (args.search) {
      return await ctx.db
        .query("objects")
        .withSearchIndex("search_name", (q) =>
          q.search("name", args.search!).eq("createdBy", userId)
        )
        .collect();
    }
    
    return await ctx.db
      .query("objects")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
  },
});

// Admin: Get all objects with optional filters
export const getAllObjects = query({
  args: {
    search: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (profile?.role !== "admin") {
      throw new Error("Not authorized");
    }
    
    let objects;
    
    if (args.search) {
      const searchQuery = ctx.db
        .query("objects")
        .withSearchIndex("search_name", (q) => q.search("name", args.search!));
      
      if (args.createdBy) {
        objects = await searchQuery
          .filter((q) => q.eq(q.field("createdBy"), args.createdBy))
          .collect();
      } else {
        objects = await searchQuery.collect();
      }
    } else {
      const query = ctx.db.query("objects");
      
      if (args.createdBy) {
        objects = await query
          .withIndex("by_creator", (q) => q.eq("createdBy", args.createdBy!))
          .order("desc")
          .collect();
      } else {
        objects = await query.order("desc").collect();
      }
    }
    
    // Get creator names
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map(u => [u._id, u.name || u.email]));
    
    return objects.map(obj => ({
      ...obj,
      creatorName: userMap.get(obj.createdBy) || "Unknown",
    }));
  },
});

// Get single object with rooms and images
export const getObject = query({
  args: {
    objectId: v.id("objects"),
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
    
    // Get rooms
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_object", (q) => q.eq("objectId", args.objectId))
      .collect();
    
    // Get images for each room
    const roomsWithImages = await Promise.all(
      rooms.map(async (room) => {
        const images = await ctx.db
          .query("roomImages")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        
        const imagesWithUrls = await Promise.all(
          images.map(async (img) => ({
            ...img,
            url: await ctx.storage.getUrl(img.storageId),
          }))
        );
        
        return {
          ...room,
          images: imagesWithUrls,
        };
      })
    );
    
    // Get object images for keys, counters, and miscellaneous
    const objectImages = await ctx.db
      .query("objectImages")
      .withIndex("by_object_section", (q) => q.eq("objectId", args.objectId))
      .collect();

    const objectImagesWithUrls = await Promise.all(
      objectImages.map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );

    // Group images by section
    const imagesBySection = {
      keys: objectImagesWithUrls.filter(img => img.section === "keys"),
      counters: objectImagesWithUrls.filter(img => img.section === "counters"),
      miscellaneous: objectImagesWithUrls.filter(img => img.section === "miscellaneous"),
    };
    
    return {
      ...object,
      rooms: roomsWithImages,
      images: imagesBySection,
    };
  },
});

// Create new object
export const createObject = mutation({
  args: {
    name: v.string(),
    addressSupplement: v.optional(v.string()),
    street: v.string(),
    postalCode: v.string(),
    city: v.string(),
    party1Name: v.string(),
    party1Function: v.string(),
    party1Address: v.string(),
    party1Phone: v.string(),
    party1Email: v.string(),
    party2Name: v.string(),
    party2Function: v.string(),
    party2Address: v.string(),
    party2Phone: v.string(),
    party2Email: v.string(),
    keys: v.array(v.object({
      type: v.string(),
      quantity: v.number(),
    })),
    counters: v.array(v.object({
      number: v.string(),
      currentReading: v.number(),
    })),
    miscellaneous: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const objectId = await ctx.db.insert("objects", {
      ...args,
      isReleased: false,
      createdBy: userId,
      createdAt: Date.now(),
    });
    
    return objectId;
  },
});

// Update object
export const updateObject = mutation({
  args: {
    objectId: v.id("objects"),
    name: v.optional(v.string()),
    addressSupplement: v.optional(v.string()),
    street: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
    party1Name: v.optional(v.string()),
    party1Function: v.optional(v.string()),
    party1Address: v.optional(v.string()),
    party1Phone: v.optional(v.string()),
    party1Email: v.optional(v.string()),
    party2Name: v.optional(v.string()),
    party2Function: v.optional(v.string()),
    party2Address: v.optional(v.string()),
    party2Phone: v.optional(v.string()),
    party2Email: v.optional(v.string()),
    keys: v.optional(v.array(v.object({
      type: v.string(),
      quantity: v.number(),
    }))),
    counters: v.optional(v.array(v.object({
      number: v.string(),
      currentReading: v.number(),
    }))),
    miscellaneous: v.optional(v.string()),
    notes: v.optional(v.string()),
    signature: v.optional(v.string()),
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
    
    const { objectId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(args.objectId, filteredUpdates);
    return null;
  },
});

// Release object
export const releaseObject = mutation({
  args: {
    objectId: v.id("objects"),
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
    
    await ctx.db.patch(args.objectId, {
      isReleased: true,
      releasedAt: Date.now(),
    });
    
    return null;
  },
});

// Delete object (admin only)
export const deleteObject = mutation({
  args: {
    objectId: v.id("objects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (profile?.role !== "admin") {
      throw new Error("Not authorized");
    }
    
    // Delete all rooms and their images
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_object", (q) => q.eq("objectId", args.objectId))
      .collect();
    
    for (const room of rooms) {
      const images = await ctx.db
        .query("roomImages")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();
      
      for (const image of images) {
        await ctx.storage.delete(image.storageId);
        await ctx.db.delete(image._id);
      }
      
      await ctx.db.delete(room._id);
    }
    
    // Delete object images
    const objectImages = await ctx.db
      .query("objectImages")
      .withIndex("by_object_section", (q) => q.eq("objectId", args.objectId))
      .collect();
    
    for (const image of objectImages) {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }

    await ctx.db.delete(args.objectId);
    return null;
  },
});


