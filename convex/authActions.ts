'use node'

import { internalAction } from './_generated/server'
import { v } from 'convex/values'
import { pbkdf2Sync, randomBytes } from 'crypto'

// Password hashing utilities
function hashPasswordInternal(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}

function generateSaltInternal(): string {
  return randomBytes(32).toString('hex')
}

function verifyPasswordInternal(
  password: string,
  hash: string,
  salt: string
): boolean {
  const hashedPassword = hashPasswordInternal(password, salt)
  return hashedPassword === hash
}

function generateTempPasswordInternal(): string {
  return (
    Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
  )
}

// Hash password action
export const hashPassword = internalAction({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const salt = generateSaltInternal()
    const passwordHash = hashPasswordInternal(args.password, salt)
    return { passwordHash, salt }
  },
})

// Verify password action
export const verifyPassword = internalAction({
  args: {
    password: v.string(),
    hash: v.string(),
    salt: v.string(),
  },
  handler: async (ctx, args) => {
    return verifyPasswordInternal(args.password, args.hash, args.salt)
  },
})

// Generate temp password action
export const generateTempPassword = internalAction({
  args: {},
  handler: async (ctx, args) => {
    const tempPassword = generateTempPasswordInternal()
    const salt = generateSaltInternal()
    const passwordHash = hashPasswordInternal(tempPassword, salt)
    return { tempPassword, passwordHash, salt }
  },
})
