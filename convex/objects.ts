import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get objects for current user (assigned to them or created by them)
export const getUserObjects = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get user's role
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const isAdmin = profile?.role === "admin";
    
    if (isAdmin) {
      // Admins see all objects they created
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
    } else {
      // Regular users see objects assigned to them (either single or multiple assignment)
      let objects;
      
      if (args.search) {
        objects = await ctx.db
          .query("objects")
          .withSearchIndex("search_name", (q) =>
            q.search("name", args.search!)
          )
          .collect();
      } else {
        objects = await ctx.db
          .query("objects")
          .order("desc")
          .collect();
      }
      
      // Filter objects where user is assigned (either single or multiple)
      return objects.filter(obj => 
        obj.assignedTo === userId || 
        (obj.assignedUsers && obj.assignedUsers.includes(userId))
      );
    }
  },
});

// Admin: Get all objects with optional filters
export const getAllObjects = query({
  args: {
    search: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('assigned'),
      v.literal('completed'),
      v.literal('released')
    )),
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
      } else if (args.assignedTo) {
        objects = await searchQuery
          .filter((q) => q.eq(q.field("assignedTo"), args.assignedTo))
          .collect();
      } else {
        objects = await searchQuery.collect();
      }
    } else {
      let query = ctx.db.query("objects");
      
      if (args.createdBy) {
        objects = await query
          .withIndex("by_creator", (q) => q.eq("createdBy", args.createdBy!))
          .order("desc")
          .collect();
      } else if (args.assignedTo) {
        objects = await query
          .withIndex("by_assigned", (q) => q.eq("assignedTo", args.assignedTo!))
          .order("desc")
          .collect();
      } else if (args.status) {
        objects = await query
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect();
      } else {
        objects = await query.order("desc").collect();
      }
    }
    
    // Filter by status if specified
    if (args.status) {
      objects = objects.filter(obj => obj.status === args.status);
    }
    
    // Get creator and assignee names
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map(u => [u._id, u.name || u.email]));
    
    return objects.map(obj => ({
      ...obj,
      creatorName: userMap.get(obj.createdBy) || "Unknown",
      assigneeName: obj.assignedTo ? userMap.get(obj.assignedTo) || "Unknown" : null,
    }));
  },
});

// Get all users for admin assignment
export const getAllUsers = query({
  args: {},
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
      return []; // Return empty array for non-admins instead of throwing error
    }
    
    const users = await ctx.db.query("users").collect();
    const userProfiles = await ctx.db.query("userProfiles").collect();
    
    const profileMap = new Map(userProfiles.map(p => [p.userId, p.role]));
    
    return users.map(user => ({
      _id: user._id,
      name: user.name || user.email,
      email: user.email,
      role: profileMap.get(user._id) || "user",
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
    const isAssigned = object.assignedTo === userId;
    const isAssignedMultiple = object.assignedUsers && object.assignedUsers.includes(userId);
    
    if (!isAdmin && !isOwner && !isAssigned && !isAssignedMultiple) {
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

// Admin: Create new object with basic data
export const createObject = mutation({
  args: {
    name: v.string(),
    addressSupplement: v.optional(v.string()),
    street: v.string(),
    postalCode: v.string(),
    city: v.string(),
    room: v.optional(v.string()),
    floor: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    assignedUsers: v.optional(v.array(v.id("users"))),
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
    
    // Determine status based on assignments
    let status: "draft" | "assigned";
    let assignedAt: number | undefined;
    
    if (args.assignedUsers && args.assignedUsers.length > 0) {
      status = "assigned";
      assignedAt = Date.now();
    } else if (args.assignedTo) {
      status = "assigned";
      assignedAt = Date.now();
    } else {
      status = "draft";
    }
    
    const objectId = await ctx.db.insert("objects", {
      name: args.name,
      addressSupplement: args.addressSupplement,
      street: args.street,
      postalCode: args.postalCode,
      city: args.city,
      room: args.room,
      floor: args.floor,
      assignedTo: args.assignedTo,
      assignedUsers: args.assignedUsers,
      status,
      assignedAt,
      isReleased: false,
      createdBy: userId,
      createdAt: Date.now(),
    });
    
    return objectId;
  },
});

// Admin: Assign object to user
export const assignObject = mutation({
  args: {
    objectId: v.id("objects"),
    assignedTo: v.id("users"),
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
    
    const object = await ctx.db.get(args.objectId);
    if (!object) {
      throw new Error("Object not found");
    }
    
    await ctx.db.patch(args.objectId, {
      assignedTo: args.assignedTo,
      status: "assigned",
      assignedAt: Date.now(),
    });
    
    return null;
  },
});

// User: Complete object (mark as completed)
export const completeObject = mutation({
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
    const isAssigned = object.assignedTo === userId;
    const isAssignedMultiple = object.assignedUsers && object.assignedUsers.includes(userId);
    
    if (!isAdmin && !isOwner && !isAssigned && !isAssignedMultiple) {
      throw new Error("Not authorized");
    }
    
    if (object.status === "released") {
      throw new Error("Cannot complete released object");
    }
    
    await ctx.db.patch(args.objectId, {
      status: "completed",
      completedAt: Date.now(),
    });
    
    return null;
  },
});

// Update object (different behavior for admin vs user)
export const updateObject = mutation({
  args: {
    objectId: v.id("objects"),
    name: v.optional(v.string()),
    addressSupplement: v.optional(v.string()),
    street: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
    room: v.optional(v.string()),
    floor: v.optional(v.string()),
    assignedUsers: v.optional(v.array(v.id("users"))),
    parties: v.optional(v.array(v.object({
      name: v.string(),
      function: v.string(),
      address: v.string(),
      phone: v.string(),
      email: v.string(),
    }))),
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
    const isAssigned = object.assignedTo === userId;
    
    if (!isAdmin && !isOwner && !isAssigned) {
      throw new Error("Not authorized");
    }
    
    // Don't allow editing released objects unless admin
    if (object.status === "released" && !isAdmin) {
      throw new Error("Cannot edit released object");
    }
    
    // Admins can edit basic data, users can edit form data
    const { objectId, ...updates } = args;
    const filteredUpdates: any = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    // If user is completing the form, update status
    if (!isAdmin && isAssigned && object.status === "assigned") {
      filteredUpdates.status = "completed";
      filteredUpdates.completedAt = Date.now();
    }
    
    await ctx.db.patch(args.objectId, filteredUpdates);
    return null;
  },
});

// Release object (admin only)
export const releaseObject = mutation({
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
    
    const object = await ctx.db.get(args.objectId);
    if (!object) {
      throw new Error("Object not found");
    }
    
    await ctx.db.patch(args.objectId, {
      status: "released",
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


