import { pgTable, uuid, boolean, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import {
  sessionStatusEnum,
  depositMethodEnum,
  depositStatusEnum,
  bonusTypeEnum,
  withdrawalStatusEnum,
  betStatusEnum
} from './_enums'
import { userTable } from './users' // <-- Synchronous import
import { gameTable } from './games' // <-- Synchronous import

const HOUSE_ID = '00000000-0000-0000-0000-000000000000'

/**
 * gameSessionTable: Tracks a user's session in a specific game.
 */
export const gameSessionTable = pgTable(
  'game_sessions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    isBot: boolean().default(false).notNull(),
    authSessionId: uuid(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userTable.id), // <-- Synchronous thunk
    gameId: uuid('game_id')
      .notNull()
      .references(() => gameTable.id), // <-- Synchronous thunk
    gameName: text(),
    status: sessionStatusEnum('status').default('ACTIVE').notNull(),
    totalWagered: integer().default(0),
    totalWon: integer().default(0),
    totalBets: integer().default(0),
    gameSessionRtp: integer().default(0),
    playerStartingBalance: integer(),
    playerEndingBalance: integer(),
    duration: integer().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (t) => [
    index('game_sessions_user_id_index').on(t.userId),
    index('game_sessions_status_index').on(t.status)
  ]
)
export type GameSession = typeof gameSessionTable.$inferSelect
export type NewGameSession = typeof gameSessionTable.$inferInsert

/**
 * depositLogTable: Audit log for REAL MONEY deposits.
 */
export const depositLogTable = pgTable('deposit_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id), // <-- Synchronous thunk
  operatorId: uuid('operator_id').notNull().default(HOUSE_ID),
  amount: integer().notNull(),
  method: depositMethodEnum('method').notNull(),
  status: depositStatusEnum('status').default('PENDING').notNull(),
  realAmountBefore: integer(),
  realAmountAfter: integer(),
  depositWageringRequiredBefore: integer(),
  depositWageringRequiredAfter: integer(),
  metaData: jsonb('meta_data'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { precision: 3 })
})
export type DepositLog = typeof depositLogTable.$inferSelect
export type NewDepositLog = typeof depositLogTable.$inferInsert

/**
 * bonusLogTable: IMMUTABLE Audit log for GRANTED BONUSES.
 */
export const bonusLogTable = pgTable('bonus_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id), // <-- Synchronous thunk
  operatorId: uuid('operator_id').notNull().default(HOUSE_ID),
  triggeringDepositId: uuid('triggering_deposit_id').references(() => depositLogTable.id), // <-- This is fine (same file)
  bonusType: bonusTypeEnum('bonus_type').notNull(),
  bonusAmount: integer().notNull(),
  wageringRequirementTotal: integer().notNull(),
  priority: integer().default(100).notNull(),
  expiresInDays: integer().default(7),
  metaData: jsonb('meta_data'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
})
export type BonusLog = typeof bonusLogTable.$inferSelect
export type NewBonusLog = typeof bonusLogTable.$inferInsert

/**
 * withdrawalLogTable: Audit log for REAL MONEY withdrawal requests.
 */
export const withdrawalLogTable = pgTable('withdrawal_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id), // <-- Synchronous thunk
  operatorId: uuid('operator_id').notNull().default(HOUSE_ID),
  status: withdrawalStatusEnum('status').default('PENDING').notNull(),
  amount: integer().notNull(),
  realAmountBefore: integer().notNull(),
  realAmountAfter: integer().notNull(),
  metaData: jsonb('meta_data'),
  requestedAt: timestamp('requested_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  completedAt: timestamp('completed_at', { precision: 3 })
})
export type WithdrawalLog = typeof withdrawalLogTable.$inferSelect
export type NewWithdrawalLog = typeof withdrawalLogTable.$inferInsert

/**
 * betLogTable: Audit log for individual bets (spins, hands, etc.).
 */
export const betLogTable = pgTable(
  'bet_logs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userTable.id), // <-- Synchronous thunk
    gameSessionId: uuid(),
    operatorId: uuid(),
    status: betStatusEnum('status').default('COMPLETED').notNull(),
    wagerAmount: integer().notNull(),
    winAmount: integer().notNull(),
    wagerPaidFromReal: integer().default(0).notNull(),
    wagerPaidFromBonus: integer().default(0).notNull(),
    hit: boolean('is_hit').generatedAlwaysAs(
      sql`win_amount > wager_amount`
    ),
    gameId: uuid(),
    gameName: text(),
    jackpotContribution: integer(),
    vipPointsAdded: integer(),
    processingTime: integer(),
    metadata: jsonb('metadata'),
    affiliateId: uuid(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
  },
  (t) => [
    index('bet_log_user_id_index').on(t.userId),
    index('bet_log_status_index').on(t.status),
    index('bet_log_game_id_index').on(t.gameId)
  ]
)
export type BetLog = typeof betLogTable.$inferSelect
export type NewBetLog = typeof betLogTable.$inferInsert
