import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

const applicationTables = {
  // Extended user profile with roles
  userProfiles: defineTable({
    userId: v.id('users'),
    createdAt: v.number(), // ✅ wieder hinzufügen
    role: v.union(
      v.literal('admin'),
      v.literal('user'),
      v.literal('manager') // ← muss vorhanden sein, sonst Error
    ),
    isTempPassword: v.boolean(),
    createdBy: v.optional(v.id('users')), // Admin who created this user
    lastLogin: v.optional(v.number()),
    passwordHash: v.optional(v.string()),
    salt: v.optional(v.string()),
    email: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_email', ['email']),

  resetRequests: defineTable({
    email: v.string(),
    requestedAt: v.number(),
    status: v.union(v.literal('pending'), v.literal('resolved')),
  })
    .index('by_email', ['email'])
    .index('by_status', ['status']),

  // Property objects
  objects: defineTable({
    // Object details (admin fills these)
    name: v.string(),
    addressSupplement: v.optional(v.string()),
    street: v.string(),
    postalCode: v.string(),
    city: v.string(),
    room: v.optional(v.string()), // Room/Floor information
    floor: v.optional(v.string()), // Floor information

    // Assignment and status
    assignedTo: v.optional(v.id('users')), // Single user assignment (legacy)
    assignedUsers: v.optional(v.array(v.id('users'))), // Multiple user assignments
    status: v.union(
      v.literal('draft'), // Admin created, not assigned
      v.literal('assigned'), // Assigned to user, not completed
      v.literal('completed'), // User completed the form
      v.literal('released') // Released/finalized
    ),

    // Involved parties - user fills these
    parties: v.optional(
      v.array(
        v.object({
          name: v.string(),
          function: v.string(),
          address: v.string(),
          phone: v.string(),
          email: v.string(),
        })
      )
    ),

    // Key handover - user fills these
    keys: v.optional(
      v.array(
        v.object({
          type: v.string(),
          customType: v.optional(v.string()),
          quantity: v.number(),
        })
      )
    ),

    // Counter data - user fills these
    counters: v.optional(
      v.array(
        v.object({
          number: v.string(),
          customNumber: v.optional(v.string()),
          currentReading: v.number(),
        })
      )
    ),

    // Miscellaneous and notes - user fills these
    miscellaneous: v.optional(v.string()),
    notes: v.optional(v.string()),

    // Signature - user fills this
    signature: v.optional(v.string()),

    // Status and metadata
    isReleased: v.boolean(),
    createdBy: v.id('users'),
    createdAt: v.number(),
    assignedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    releasedAt: v.optional(v.number()),
  })
    .index('by_creator', ['createdBy'])
    .index('by_assigned', ['assignedTo'])
    .index('by_status', ['status'])
    .index('by_name', ['name'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['createdBy', 'assignedTo', 'status', 'isReleased'],
    }),

  // Rooms for each object
  rooms: defineTable({
    objectId: v.id('objects'),
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
  }).index('by_object', ['objectId']),

  // Images for rooms
  roomImages: defineTable({
    roomId: v.id('rooms'),
    storageId: v.id('_storage'),
    filename: v.string(),
    createdAt: v.number(),
  }).index('by_room', ['roomId']),

  // Images for object sections (keys, counters, miscellaneous)
  objectImages: defineTable({
    objectId: v.id('objects'),
    section: v.union(
      v.literal('keys'),
      v.literal('counters'),
      v.literal('miscellaneous')
    ),
    storageId: v.id('_storage'),
    filename: v.string(),
    createdAt: v.number(),
  }).index('by_object_section', ['objectId', 'section']),
}

export default defineSchema({
  ...authTables,
  ...applicationTables,
})
