import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const migrateExistingObjects = mutation({
  args: {},
  handler: async (ctx) => {
    // === MIGRATION: OBJECTS ===
    const objects = await ctx.db.query('objects').collect()
    let migratedObjectsCount = 0

    for (const object of objects) {
      if (!object.status) {
        let status: 'draft' | 'assigned' | 'completed' | 'released'

        if (object.isReleased) {
          status = 'released'
        } else if ((object as any).party1Name && (object as any).party1Email) {
          status = 'completed'
        } else {
          status = 'draft'
        }

        const parties = []

        if (
          (object as any).party1Name ||
          (object as any).party1Function ||
          (object as any).party1Address ||
          (object as any).party1Phone ||
          (object as any).party1Email
        ) {
          parties.push({
            name: (object as any).party1Name || '',
            function: (object as any).party1Function || '',
            address: (object as any).party1Address || '',
            phone: (object as any).party1Phone || '',
            email: (object as any).party1Email || '',
          })
        }

        if (
          (object as any).party2Name ||
          (object as any).party2Function ||
          (object as any).party2Address ||
          (object as any).party2Phone ||
          (object as any).party2Email
        ) {
          parties.push({
            name: (object as any).party2Name || '',
            function: (object as any).party2Function || '',
            address: (object as any).party2Address || '',
            phone: (object as any).party2Phone || '',
            email: (object as any).party2Email || '',
          })
        }

        await ctx.db.patch(object._id, {
          status,
          assignedTo: undefined,
          assignedUsers: undefined,
          assignedAt: undefined,
          completedAt: undefined,
          room: undefined,
          floor: undefined,
          parties: parties.length > 0 ? parties : undefined,
          keys: object.keys && object.keys.length > 0 ? object.keys : undefined,
          counters:
            object.counters && object.counters.length > 0
              ? object.counters
              : undefined,
          miscellaneous: object.miscellaneous || undefined,
          notes: object.notes || undefined,
          signature: object.signature || undefined,
        })

        migratedObjectsCount++
      }
    }

    // === MIGRATION: USER PROFILES ===
    const userProfiles = await ctx.db.query('userProfiles').collect()
    let migratedUsersCount = 0

    for (const user of userProfiles) {
      const updates: any = {}

      if (!('email' in user)) updates.email = 'migrated@example.com'
      if (!('salt' in user)) updates.salt = 'migrated_salt'
      if (!('passwordHash' in user)) updates.passwordHash = 'migrated_hash'
      if (!('isTempPassword' in user)) updates.isTempPassword = false
      if (!('lastLogin' in user)) updates.lastLogin = Date.now()
      if (!('createdBy' in user)) updates.createdBy = undefined

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates)
        migratedUsersCount++
      }
    }

    return {
      migratedObjectsCount,
      migratedUsersCount,
    }
  },
})

export const checkMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const objects = await ctx.db.query('objects').collect()
    const userProfiles = await ctx.db.query('userProfiles').collect()

    const needsObjectMigration = objects.some((obj) => !obj.status)
    const totalObjects = objects.length
    const migratedObjects = objects.filter((obj) => obj.status).length

    const needsUserMigration = userProfiles.some(
      (user) =>
        !('email' in user) ||
        !('salt' in user) ||
        !('passwordHash' in user) ||
        !('isTempPassword' in user)
    )

    const totalUsers = userProfiles.length
    const migratedUsers = userProfiles.filter(
      (user) =>
        'email' in user &&
        'salt' in user &&
        'passwordHash' in user &&
        'isTempPassword' in user
    ).length

    return {
      objects: {
        needsMigration: needsObjectMigration,
        total: totalObjects,
        migrated: migratedObjects,
      },
      userProfiles: {
        needsMigration: needsUserMigration,
        total: totalUsers,
        migrated: migratedUsers,
      },
    }
  },
})

// Schnelle Lösung für Schema-Probleme
export const fixUserProfilesSchema = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('Starting user profiles schema fix...')

    const userProfiles = await ctx.db.query('userProfiles').collect()
    let fixedCount = 0

    console.log(`Found ${userProfiles.length} user profiles to check`)

    for (const user of userProfiles) {
      const updates: any = {}

      // Prüfe jedes erforderliche Feld
      if (!user.email) {
        updates.email = `user-${user.userId}@temp.com`
        console.log(`Adding email for user ${user.userId}`)
      }

      if (!user.salt) {
        updates.salt =
          'temp_salt_' + Math.random().toString(36).substring(2, 15)
        console.log(`Adding salt for user ${user.userId}`)
      }

      if (!user.passwordHash) {
        updates.passwordHash =
          'temp_hash_' + Math.random().toString(36).substring(2, 15)
        console.log(`Adding passwordHash for user ${user.userId}`)
      }

      if (user.isTempPassword === undefined || user.isTempPassword === null) {
        updates.isTempPassword = true
        console.log(`Adding isTempPassword for user ${user.userId}`)
      }

      if (Object.keys(updates).length > 0) {
        console.log(
          `Updating user ${user.userId} with updates:`,
          Object.keys(updates)
        )
        await ctx.db.patch(user._id, updates)
        fixedCount++
      }
    }

    console.log(`Fixed ${fixedCount} user profiles`)
    return { fixedCount, totalChecked: userProfiles.length }
  },
})
