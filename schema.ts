import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

const applicationTables = {
  // Extended user profile with roles and password management
  userProfiles: defineTable({
    userId: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('user')),
    isTempPassword: v.boolean(),
    createdBy: v.optional(v.id('users')), // Admin who created this user
    lastLogin: v.optional(v.number()),
    passwordHash: v.string(),
    salt: v.string(),
    email: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_email', ['email']),

  // Password reset requests
  passwordResetRequests: defineTable({
    email: v.string(),
    requestedAt: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('cancelled')
    ),
  })
    .index('by_email', ['email'])
    .index('by_status', ['status']),

  // Properties/Objects
  properties: defineTable({
    // General information
    name: v.string(),
    address: v.object({
      street: v.string(),
      postalCode: v.string(),
      city: v.string(),
      additional: v.optional(v.string()),
    }),

    // Status and workflow
    status: v.union(
      v.literal('entwurf'),
      v.literal('zugewiesen'),
      v.literal('freigegeben'),
      v.literal('in_überprüfung'),
      v.literal('zurückgewiesen'),
      v.literal('abgeschlossen'),
      v.literal('gelöscht')
    ),

    // Ownership and assignment
    createdBy: v.id('users'),
    assignedUsers: v.array(v.id('users')),

    // Additional fields
    notes: v.optional(v.string()),
    signatureImageId: v.optional(v.id('_storage')),
  })
    .index('by_creator', ['createdBy'])
    .index('by_status', ['status'])
    .searchIndex('search_properties', {
      searchField: 'name',
      filterFields: ['status', 'createdBy'],
    }),

  // Property assignment tracking
  propertyAssignments: defineTable({
    propertyId: v.id('properties'),
    userId: v.id('users'),
    assignedBy: v.id('users'),
    assignedAt: v.number(),
  })
    .index('by_property', ['propertyId'])
    .index('by_user', ['userId']),

  // Involved persons
  involvedPersons: defineTable({
    propertyId: v.id('properties'),
    name: v.string(),
    function: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index('by_property', ['propertyId']),

  // Key handover
  keyHandovers: defineTable({
    propertyId: v.id('properties'),
    type: v.string(),
    quantity: v.number(),
    imageIds: v.array(v.id('_storage')),
  }).index('by_property', ['propertyId']),

  // Rooms
  rooms: defineTable({
    propertyId: v.id('properties'),
    name: v.string(),
    equipment: v.optional(v.string()),
    condition: v.optional(v.string()),
    imageIds: v.array(v.id('_storage')),
  }).index('by_property', ['propertyId']),

  // Meter readings
  meterReadings: defineTable({
    propertyId: v.id('properties'),
    name: v.string(),
    number: v.optional(v.string()),
    currentReading: v.optional(v.string()),
    imageIds: v.array(v.id('_storage')),
  }).index('by_property', ['propertyId']),
}

export default defineSchema({
  ...authTables,
  ...applicationTables,
})
