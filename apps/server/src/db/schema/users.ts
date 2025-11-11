import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { userRoleEnum, userStatusEnum } from './_enums'
import { operatorTable } from './operators' // <-- Synchronous import

const HOUSE_ID = '00000000-0000-0000-0000-000000000000'

/**
 * userTable: Our local user, separate from Supabase auth.
 */
export const userTable = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  authId: varchar('auth_id', { length: 256 }).unique().notNull(),

  // Using a synchronous thunk for the foreign key
  operatorId: uuid('operator_id')
    .notNull()
    .default(HOUSE_ID)
    .references(() => operatorTable.id), // <-- Synchronous thunk

  email: text('email').unique().notNull(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar').default('avatar-06.avif').notNull(),
  roles: userRoleEnum('roles').array().notNull().default(['USER']),
  status: userStatusEnum('status').notNull().default('OFFLINE'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Types
export type User = typeof userTable.$inferSelect
export type NewUser = typeof userTable.$inferInsert
