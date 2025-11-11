import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { bonusStatusEnum } from './_enums'
import { userTable } from './users' // <-- Synchronous import
import { bonusLogTable } from './logs' // <-- Synchronous import

/**
 * userBalanceTable: The "Real Money Wallet".
 */
export const userBalanceTable = pgTable('user_balances', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id) // <-- Synchronous thunk
    .unique(),

  realBalance: integer().default(0).notNull(),
  freeSpinsRemaining: integer().default(0).notNull(),
  depositWageringRemaining: integer().default(0).notNull(),
  totalDepositedReal: integer().default(0).notNull(),
  totalWithdrawn: integer().default(0).notNull(),
  totalWagered: integer().default(0).notNull(),
  totalWon: integer().default(0).notNull(),
  totalBonusGranted: integer().default(0).notNull(),
  totalFreeSpinWins: integer().default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
})

// Types
export type UserBalance = typeof userBalanceTable.$inferSelect
export type NewUserBalance = typeof userBalanceTable.$inferInsert

/**
 * activeBonusTable: The "Bonus Wallet".
 */
export const activeBonusTable = pgTable(
  'active_bonuses',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userTable.id), // <-- Synchronous thunk
    bonusLogId: uuid('bonus_log_id')
      .notNull()
      .references(() => bonusLogTable.id), // <-- Synchronous thunk

    status: bonusStatusEnum('status').default('ACTIVE').notNull(),
    priority: integer().default(100).notNull(),
    currentBonusBalance: integer().default(0).notNull(),
    currentWageringRemaining: integer().default(0).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (t) => [
    index('active_bonus_user_id_index').on(t.userId),
    index('active_bonus_status_index').on(t.status)
  ]
)

// Types
export type ActiveBonus = typeof activeBonusTable.$inferSelect
export type NewActiveBonus = typeof activeBonusTable.$inferInsert
