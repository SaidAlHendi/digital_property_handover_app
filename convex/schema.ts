import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Extended user profile with roles
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("manager")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Property objects
  objects: defineTable({
    // Object details
    name: v.string(),
    addressSupplement: v.optional(v.string()),
    street: v.string(),
    postalCode: v.string(),
    city: v.string(),
    
    // Involved parties (two parties)
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
    
    // Key handover
    keys: v.array(v.object({
      type: v.string(),
      quantity: v.number(),
    })),
    
    // Counter data
    counters: v.array(v.object({
      number: v.string(),
      currentReading: v.number(),
    })),
    
    // Miscellaneous and notes
    miscellaneous: v.optional(v.string()),
    notes: v.optional(v.string()),
    
    // Signature
    signature: v.optional(v.string()),
    
    // Status and metadata
    isReleased: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    releasedAt: v.optional(v.number()),
  })
    .index("by_creator", ["createdBy"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["createdBy", "isReleased"],
    }),

  // Rooms for each object
  rooms: defineTable({
    objectId: v.id("objects"),
    name: v.string(),
    
    // Equipment details
    flooring: v.string(),
    walls: v.string(),
    outlets: v.number(),
    lightSwitches: v.number(),
    windows: v.number(),
    radiators: v.number(),
    
    // Condition
    condition: v.string(),
    
    createdAt: v.number(),
  }).index("by_object", ["objectId"]),

  // Images for rooms
  roomImages: defineTable({
    roomId: v.id("rooms"),
    storageId: v.id("_storage"),
    filename: v.string(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),

  // Images for object sections (keys, counters, miscellaneous)
  objectImages: defineTable({
    objectId: v.id("objects"),
    section: v.union(v.literal("keys"), v.literal("counters"), v.literal("miscellaneous")),
    storageId: v.id("_storage"),
    filename: v.string(),
    createdAt: v.number(),
  }).index("by_object_section", ["objectId", "section"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
