#!/bin/bash
set -e

echo "--- Starting Database Schema Refactor ---"

# --- 1. Remove Old Schema and 'x' Files ---
echo "Removing old schema.ts, auth-schema.ts, and db/x/ directory..."
rm -f src/db/schema.ts
rm -f src/db/auth-schema.ts
rm -rf src/db/x

# --- 2. Create New Schema Directory ---
echo "Creating new directory structure at src/db/schema/..."
mkdir -p src/db/schema

# --- 3. Create src/db/schema/_enums.ts ---
echo "Creating: src/db/schema/_enums.ts"
cat << 'EOF' > src/db/schema/_enums.ts
import { pgEnum } from 'drizzle-orm/pg-core'

// --- USER ENUMS ---
export const userRoleEnum = pgEnum('user_role_enum', [
  'USER',
  'AFFILIATE',
  'ADMIN',
  'OPERATOR',
  'BOT'
])
export const userStatusEnum = pgEnum('user_status_enum', ['ONLINE', 'OFFLINE', 'BANNED', 'INGAME'])

// --- FINANCIAL ENUMS ---
export const depositMethodEnum = pgEnum('deposit_method_enum', [
  'DEPOSIT_CASHAPP',
  'DEPOSIT_INSTORE_CASH',
  'DEPOSIT_INSTORE_CARD'
])
export const depositStatusEnum = pgEnum('deposit_status_enum', ['PENDING', 'COMPLETED', 'FAILED'])

export const bonusTypeEnum = pgEnum('bonus_type_enum', [
  'DEPOSIT_MATCH',
  'LONG_BONUS_DAY_1',
  'LONG_BONUS_DAY_2',
  'VIP_LEVEL_UP',
  'FREE_SPINS_AWARD'
])

export const bonusStatusEnum = pgEnum('bonus_status_enum', [
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED'
])

export const withdrawalStatusEnum = pgEnum('withdrawal_status_enum', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED'
])

export const betStatusEnum = pgEnum('bet_status_enum', [
  'NSF', // Not Sufficient Funds
  'GAME_CHECK_FAILED',
  'COMPLETED',
  'CANCELLED_BY_USER',
  'CANCELLED_BY_SYSTEM',
  'SERVER_SHUTDOWN',
  'EXPIRED'
])

// --- GAME ENUMS ---
export const gameCategoriesEnum = pgEnum('game_categories_enum', [
  'SLOTS',
  'FISH',
  'TABLE',
  'LIVE',
  'OTHER'
])
export const gameStatusEnum = pgEnum('game_status_enum', ['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
export const jackpotTypeEnum = pgEnum('type_of_jackpot_enum', ['MINOR', 'MAJOR', 'MEGA', 'NONE'])

// --- SESSION ENUMS ---
export const sessionStatusEnum = pgEnum('session_status_enum', [
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'ABANDONED',
  'TIMEOUT',
  'OTP_PENDING',
  'SHUTDOWN'
])
EOF

# --- 4. Create src/db/schema/operators.ts ---
echo "Creating: src/db/schema/operators.ts"
cat << 'EOF' > src/db/schema/operators.ts
import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userTable } from './users'
import { gameTable } from './games'

/**
 * operatorTable: The entity (e.g., "HOUSE" or a white-label) that owns users and games.
 */
export const operatorTable = pgTable('operators', {
  id: uuid().defaultRandom().primaryKey().notNull(),

  updatedBy: text('updated_by').default('system').notNull(),
  version: integer('version').default(1).notNull(),
  balance: integer('balance').default(100000).notNull(),
  slotsBalance: integer('slots_balance').default(100000).notNull(),
  arcadeBalance: integer('arcade_balance').default(100000).notNull(),
  currentFloat: integer('current_float').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  name: text('name').unique().notNull(),
  ownerId: text('owner_id').default('system').notNull(),
  products: jsonb('products'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
})

// Co-locate relations
export const operatorRelations = relations(operatorTable, ({ many }) => ({
  users: many(userTable),
  games: many(gameTable)
}))

// Types
export type Operator = typeof operatorTable.$inferSelect
export type NewOperator = typeof operatorTable.$inferInsert
EOF

# --- 5. Create src/db/schema/users.ts ---
echo "Creating: src/db/schema/users.ts"
cat << 'EOF' > src/db/schema/users.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userRoleEnum, userStatusEnum } from './_enums'
import { operatorTable } from './operators'
import { userBalanceTable, activeBonusTable } from './wallets'
import {
  gameSessionTable,
  depositLogTable,
  bonusLogTable,
  withdrawalLogTable,
  betLogTable
} from './logs'

const HOUSE_ID = '00000000-0000-0000-0000-000000000000'

/**
 * userTable: Our local user, separate from Supabase auth.
 * This is the "Platform Profile" that persists across operators.
 */
export const userTable = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  authId: varchar('auth_id', { length: 256 }).unique().notNull(),

  // This is the link to the *current* operator.
  // This is the key that enables the "switch operator" feature.
  operatorId: uuid('operator_id')
    .notNull()
    .default(HOUSE_ID)
    .references(() => operatorTable.id),

  email: text('email').unique().notNull(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar').default('avatar-06.avif').notNull(),
  roles: userRoleEnum('roles').array().notNull().default(['USER']),
  status: userStatusEnum('status').notNull().default('OFFLINE'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Co-locate relations
export const userRelations = relations(userTable, ({ one, many }) => ({
  // The operator this user is *currently* linked to
  operator: one(operatorTable, {
    fields: [userTable.operatorId],
    references: [operatorTable.id]
  }),

  // A user has one "real money" balance sheet
  userBalance: one(userBalanceTable, {
    fields: [userTable.id],
    references: [userBalanceTable.userId]
  }),

  // A user has many active bonuses (their "bonus wallet")
  activeBonuses: many(activeBonusTable),

  // A user has many logs
  gameSessions: many(gameSessionTable),
  depositLogs: many(depositLogTable),
  bonusLogs: many(bonusLogTable),
  withdrawalLogs: many(withdrawalLogTable),
  betLogs: many(betLogTable)
}))

// Types
export type User = typeof userTable.$inferSelect
export type NewUser = typeof userTable.$inferInsert
EOF

# --- 6. Create src/db/schema/games.ts ---
echo "Creating: src/db/schema/games.ts"
cat << 'EOF' > src/db/schema/games.ts
import { pgTable, uuid, integer, boolean, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { gameCategoriesEnum, gameStatusEnum, jackpotTypeEnum } from './_enums'
import { operatorTable } from './operators'
import { betLogTable, gameSessionTable } from './logs'

/**
 * gameTable: Stores information about each available game.
 */
export const gameTable = pgTable(
  'games',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    version: integer().default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    name: text().notNull(),
    title: text(),
    description: text(),
    category: gameCategoriesEnum('category').default('SLOTS').notNull(),
    thumbnailUrl: text(),
    bannerUrl: text(),
    volatility: integer().default(1).notNull(),
    developer: text(),
    operatorId: uuid().references(() => operatorTable.id),
    currentRtp: integer().default(0),
    targetRtp: integer(),
    status: gameStatusEnum('status').default('ACTIVE').notNull(),
    totalBetAmount: integer().default(0),
    totalWonAmount: integer().default(0),
    totalBets: integer().default(0),
    totalWins: integer().default(0),
    hitPercentage: integer().default(0),
    totalPlayers: integer().default(0),
    totalMinutesPlayed: integer().default(0),
    distinctPlayers: jsonb(),
    startedAt: timestamp({ withTimezone: true, mode: 'date' }).defaultNow(),
    minBet: integer().default(100),
    maxBet: integer().default(100000),
    isFeatured: boolean().default(false),
    jackpotGroup: jackpotTypeEnum('jackpot_group').default('NONE'),
    goldsvetData: jsonb(),
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (t) => [
    index('category_index').on(t.category),
    index('games_operator_index').on(t.operatorId),
    index('games_status_index').on(t.status)
  ]
)

// Co-locate relations
export const gameRelations = relations(gameTable, ({ one, many }) => ({
  operator: one(operatorTable, {
    fields: [gameTable.operatorId],
    references: [operatorTable.id]
  }),
  betLogs: many(betLogTable),
  gameSessions: many(gameSessionTable)
}))

// Types
export type Game = typeof gameTable.$inferSelect
export type NewGame = typeof gameTable.$inferInsert
EOF

# --- 7. Create src/db/schema/wallets.ts ---
echo "Creating: src/db/schema/wallets.ts"
cat << 'EOF' > src/db/schema/wallets.ts
import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { bonusStatusEnum } from './_enums'
import { userTable } from './users'
import { bonusLogTable } from './logs'

/**
 * userBalanceTable: The "Real Money Wallet".
 * This table is UPDATED by transactions. It only holds REAL money.
 * It is specific to a user *and* their current operator.
 */
export const userBalanceTable = pgTable('user_balances', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id)
    .unique(), // One balance sheet per user

  // --- Current State ---
  realBalance: integer('real_balance').default(0).notNull(), // Real cash
  freeSpinsRemaining: integer('free_spins_remaining').default(0).notNull(),
  depositWageringRemaining: integer('deposit_wagering_remaining').default(0).notNull(),

  // --- Lifetime Stats ---
  totalDepositedReal: integer('total_deposited_real').default(0).notNull(),
  totalWithdrawn: integer('total_withdrawn').default(0).notNull(),
  totalWagered: integer('total_wagered').default(0).notNull(),
  totalWon: integer('total_won').default(0).notNull(),
  totalBonusGranted: integer('total_bonus_granted').default(0).notNull(), // Still useful
  totalFreeSpinWins: integer('total_free_spin_wins').default(0).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
})

// Co-locate relations
export const userBalanceRelations = relations(userBalanceTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userBalanceTable.userId],
    references: [userTable.id]
  })
}))

// Types
export type UserBalance = typeof userBalanceTable.$inferSelect
export type NewUserBalance = typeof userBalanceTable.$inferInsert

/**
 * activeBonusTable: The "Bonus Wallet".
 * Each row is a separate, active bonus for a user.
 */
export const activeBonusTable = pgTable(
  'active_bonuses',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userTable.id),
    // Link to the log entry that created this bonus
    bonusLogId: uuid('bonus_log_id')
      .notNull()
      .references(() => bonusLogTable.id),

    status: bonusStatusEnum('status').default('ACTIVE').notNull(),
    // For sorting which bonus to use first (lower = sooner)
    priority: integer('priority').default(100).notNull(),

    // The current spendable balance of *this* bonus
    currentBonusBalance: integer('current_bonus_balance').default(0).notNull(),
    // The current wagering remaining on *this* bonus
    currentWageringRemaining: integer('current_wagering_remaining').default(0).notNull(),

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

// Co-locate relations
export const activeBonusRelations = relations(activeBonusTable, ({ one }) => ({
  user: one(userTable, {
    fields: [activeBonusTable.userId],
    references: [userTable.id]
  }),
  // An active bonus entry links back to the *grant* event
  bonusLog: one(bonusLogTable, {
    fields: [activeBonusTable.bonusLogId],
    references: [bonusLogTable.id]
  })
}))

// Types
export type ActiveBonus = typeof activeBonusTable.$inferSelect
export type NewActiveBonus = typeof activeBonusTable.$inferInsert
EOF

# --- 8. Create src/db/schema/logs.ts ---
echo "Creating: src/db/schema/logs.ts"
cat << 'EOF' > src/db/schema/logs.ts
import { pgTable, uuid, boolean, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import {
  sessionStatusEnum,
  depositMethodEnum,
  depositStatusEnum,
  bonusTypeEnum,
  withdrawalStatusEnum,
  betStatusEnum
} from './_enums'
import { userTable } from './users'
import { gameTable } from './games'

const HOUSE_ID = '00000000-0000-0000-0000-000000000000'

/**
 * gameSessionTable: Tracks a user's session in a specific game.
 */
export const gameSessionTable = pgTable(
  'game_sessions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    isBot: boolean('is_bot').default(false).notNull(),
    authSessionId: uuid('auth_session_id'),
    userId: uuid('user_id')
      .notNull()
      .references(() => userTable.id),
    gameId: uuid('game_id')
      .notNull()
      .references(() => gameTable.id),
    gameName: text('game_name'),
    status: sessionStatusEnum('status').default('ACTIVE').notNull(),
    totalWagered: integer('total_wagered').default(0),
    totalWon: integer('total_won').default(0),
    totalBets: integer('total_bets').default(0),
    gameSessionRtp: integer('game_session_rtp').default(0),
    playerStartingBalance: integer('player_starting_balance'),
    playerEndingBalance: integer('player_ending_balance'),
    duration: integer('duration').default(0),
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

// Co-locate relations
export const gameSessionRelations = relations(gameSessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [gameSessionTable.userId],
    references: [userTable.id]
  }),
  game: one(gameTable, {
    fields: [gameSessionTable.gameId],
    references: [gameTable.id]
  })
}))

// Types
export type GameSession = typeof gameSessionTable.$inferSelect
export type NewGameSession = typeof gameSessionTable.$inferInsert

/**
 * depositLogTable: Audit log for REAL MONEY deposits.
 */
export const depositLogTable = pgTable('deposit_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id),
  operatorId: uuid('operator_id').notNull().default(HOUSE_ID),
  amount: integer('amount').notNull(), // The actual cash value deposited
  method: depositMethodEnum('method').notNull(),
  status: depositStatusEnum('status').default('PENDING').notNull(),

  realAmountBefore: integer('real_amount_before'),
  realAmountAfter: integer('real_amount_after'),
  depositWageringRequiredBefore: integer('deposit_wagering_required_before'),
  depositWageringRequiredAfter: integer('deposit_wagering_required_after'),

  metaData: jsonb('meta_data'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { precision: 3 })
})

// Co-locate relations
export const depositLogRelations = relations(depositLogTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [depositLogTable.userId],
    references: [userTable.id]
  }),
  // A deposit can trigger one or more bonus *grants*
  triggeredBonusLogs: many(bonusLogTable)
}))

// Types
export type DepositLog = typeof depositLogTable.$inferSelect
export type NewDepositLog = typeof depositLogTable.$inferInsert

/**
 * bonusLogTable: IMMUTABLE Audit log for GRANTED BONUSES.
 */
export const bonusLogTable = pgTable('bonus_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id),
  operatorId: uuid('operator_id').notNull().default(HOUSE_ID),

  // Links a 'DEPOSIT_MATCH' bonus to the deposit that triggered it
  triggeringDepositId: uuid('triggering_deposit_id').references(() => depositLogTable.id),

  bonusType: bonusTypeEnum('bonus_type').notNull(),
  // The *initial* amount granted
  bonusAmount: integer('bonus_awarded_amount').notNull(),
  // The *initial* total wagering required
  wageringRequirementTotal: integer('wagering_requirement_total').notNull(),

  // Config passed to activeBonusTable on creation
  priority: integer('priority').default(100).notNull(),
  expiresInDays: integer('expires_in_days').default(7),

  metaData: jsonb('meta_data'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
})

// Co-locate relations
export const bonusLogRelations = relations(bonusLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [bonusLogTable.userId],
    references: [userTable.id]
  }),
  // A bonus *grant* can be triggered by one deposit
  triggeringDeposit: one(depositLogTable, {
    fields: [bonusLogTable.triggeringDepositId],
    references: [depositLogTable.id]
  }),
  // A bonus *grant* creates one active bonus entry
  activeBonus: one(
    () => import('./wallets').then((m) => m.activeBonusTable),
    {
      fields: [bonusLogTable.id],
      references: [
        () => import('./wallets').then((m) => m.activeBonusTable.bonusLogId)
      ]
    }
  )
}))

// Types
export type BonusLog = typeof bonusLogTable.$inferSelect
export type NewBonusLog = typeof bonusLogTable.$inferInsert

/**
 * withdrawalLogTable: Audit log for REAL MONEY withdrawal requests.
 */
export const withdrawalLogTable = pgTable('withdrawal_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id),
  operatorId: uuid('operator_id').notNull().default(HOUSE_ID),
  status: withdrawalStatusEnum('status').default('PENDING').notNull(),
  amount: integer('amount').notNull(),

  realAmountBefore: integer('real_amount_before').notNull(),
  realAmountAfter: integer('real_amount_after').notNull(),

  metaData: jsonb('meta_data'),
  requestedAt: timestamp('requested_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  completedAt: timestamp('completed_at', { precision: 3 })
})

// Co-locate relations
export const withdrawalLogRelations = relations(withdrawalLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [withdrawalLogTable.userId],
    references: [userTable.id]
  })
}))

// Types
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
      .references(() => userTable.id),
    gameSessionId: uuid('game_session_id'),
    operatorId: uuid('operator_id'),
    status: betStatusEnum('status').default('COMPLETED').notNull(),

    // --- The simple bet event ---
    wagerAmount: integer('wager_amount').notNull(), // Total wager (real + bonus)
    winAmount: integer('win_amount').notNull(),

    /*
     * --- How the bet was paid (for auditing) ---
     * wagerAmount = wagerPaidFromReal + wagerPaidFromBonus
     */
    wagerPaidFromReal: integer('wager_paid_from_real').default(0).notNull(),
    wagerPaidFromBonus: integer('wager_paid_from_bonus').default(0).notNull(),

    hit: boolean('is_hit').generatedAlwaysAs(
      sql`win_amount > wager_amount` // The SQL expression
    ),
    gameId: uuid('game_id'),
    gameName: text('game_name'),
    jackpotContribution: integer('jackpot_contribution'),
    vipPointsAdded: integer('vip_points_added'),
    processingTime: integer('processing_time'),
    metadata: jsonb('metadata'),
    affiliateId: uuid('affiliate_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
  },
  (t) => [
    index('bet_log_user_id_index').on(t.userId),
    index('bet_log_status_index').on(t.status),
    index('bet_log_game_id_index').on(t.gameId)
  ]
)

// Co-locate relations
export const betLogRelations = relations(betLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [betLogTable.userId],
    references: [userTable.id]
  }),
  game: one(gameTable, {
    fields: [betLogTable.gameId],
    references: [gameTable.id]
  })
}))

// Types
export type BetLog = typeof betLogTable.$inferSelect
export type NewBetLog = typeof betLogTable.$inferInsert
EOF

# --- 9. Create src/db/schema/index.ts (The Barrel File) ---
echo "Creating: src/db/schema/index.ts"
cat << 'EOF' > src/db/schema/index.ts
import * as enums from './_enums'
import * as operators from './operators'
import * as users from './users'
import * as games from './games'
import * as wallets from './wallets'
import * as logs from './logs'

// This file re-exports everything, making it the single source of truth
// for Drizzle Kit and for our application.

export const schema = {
  ...enums,
  ...operators,
  ...users,
  ...games,
  ...wallets,
  ...logs
}

// Export all individual tables and types
export * from './_enums'
export * from './operators'
export * from './users'
export * from './games'
export * from './wallets'
export * from './logs'
EOF

# --- 10. Update src/db/index.ts ---
echo "Updating: src/db/index.ts"
cat << 'EOF' > src/db/index.ts
import 'dotenv/config' // Load .env file at the top
export { and, eq, gt, sql } from 'drizzle-orm'
export { db } from './db'

// This now exports everything from our new /schema directory
export * from './schema'
EOF

# --- 11. Update src/db/db.ts ---
echo "Updating: src/db/db.ts"
cat << 'EOF' > src/db/db.ts
import { drizzle } from 'drizzle-orm/bun-sql' // Use the bun-sql adapter
import { SQL } from 'bun' // Use bun:sql for runtime
import { schema } from '@/db/schema'

/*
 * 1. Create the native bun:sql client
 * Removed '!' as the check above handles it
 */
if (!process_env_DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const client = new SQL(process_env_DATABASE_URL)
// 2. Pass the client and the *combined* schema object to Drizzle
export const db = drizzle({ client, schema, casing: 'snake_case' })
EOF

# --- 12. Update drizzle.config.ts ---
echo "Updating: drizzle.config.ts"
cat << 'EOF' > drizzle.config.ts
import 'dotenv/config' // Load .env file
import type { Config } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

export default {
  // Point to the new barrel file
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql', // Changed from 'sqlite'
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL // Use the env variable
  }
} satisfies Config
EOF

# --- 13. Update src/db/seed.ts imports ---
echo "Updating: src/db/seed.ts"
cat << 'EOF' > src/db/seed.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { faker } from '@faker-j'
import * as schema from '@/db/schema' // <-- UPDATED IMPORT
import {
  NewUser,
  NewUserBalance,
  NewDepositLog,
  NewBonusLog,
  NewActiveBonus,
  NewBetLog,
  NewWithdrawalLog,
  UserBalance,
  ActiveBonus,
  NewGame,
  NewGameSession
} from '@/db/schema' // <-- UPDATED IMPORT
import { sql } from 'drizzle-orm'
import fs from 'fs' // We'll need this to read the games.json
import path from 'path'

// --- CONFIGURATION ---
const USER_COUNT = 100
const HOUSE_ID = '00000000-0000-0000-0000-000000000000'
const SIMULATION_START_DATE = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
const SIMULATION_END_DATE = new Date()
const CHANCE_TO_PLAY_PER_DAY = 0.5 // 50% chance a user will play on a given day
const SESSIONS_PER_DAY = 1 // Max sessions per day if they do play
const MIN_BETS_PER_SESSION = 10
const MAX_BETS_PER_SESSION = 150
const MIN_TIME_PER_BET_MS = 3000 // 3 seconds
const MAX_TIME_PER_BET_MS = 10000 // 10 seconds

// (Other financial configs remain the same)
const MIN_DEPOSIT = 2000
const MAX_DEPOSIT = 10000
const DEPOSIT_MATCH_PERCENT = 1.0
const DEPOSIT_WAGERING_MULTIPLIER = 1
const BONUS_WAGERING_MULTIPLIER = 10
const BONUS_PRIORITY = 100
const BONUS_EXPIRES_DAYS = 7
const MIN_BET = 50
const MAX_BET = 500
const CHANCE_TO_WIN = 0.4
const MIN_WIN_MULTIPLIER = 1.5
const MAX_WIN_MULTIPLIER = 2.75
const CHANCE_TO_DEPOSIT_AGAIN = 0.1
const CHANCE_TO_WITHDRAW = 0.2
const AUTOWITHDRAW_MULTIPLIER = 4

// --- FIX: Define a batch size to prevent parameter limit errors ---
const BATCH_SIZE = 500 // Insert 500 records at a time

// --- Database Connection ---
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.')
}
const client = postgres(connectionString, { max: 1 })
const db = drizzle(client, { schema, casing: 'snake_case' })

// --- HELPER FUNCTIONS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
const addMsToDate = (date: Date, ms: number) => new Date(date.getTime() + ms)

/**
 * Type for the game data from games.json
 */
type GameJson = {
  id: string
  created_at: string
  updated_at: string
  version: number
  is_active: boolean
  name: string
  title: string
  description: string | null
  category: string // Will be cast to enum
  thumbnail_url: string | null
  banner_url: string | null
  developer: string
  operator_id: string | null
  target_rtp: number
  status: string // Will be cast to enum
  min_bet: number
  max_bet: number
  is_featured: boolean
  jackpot_group: string | null
  goldsvet_data: any // It's a complex JSON object
  total_bet_amount: number
  total_won_amount: number
  volatility: number
  current_rtp: number
  total_bets: number
  total_wins: number
  hit_percentage: number
  total_players: number
  total_minutes_played: number
  distinct_players: string[] | null
  started_at: string
}

/**
 * In-memory stats tracker for games, to be flushed to DB at the end.
 */
class GameStatsTracker {
  totalBetAmount: number = 0
  totalWonAmount: number = 0
  totalBets: number = 0
  totalWins: number = 0
  totalMinutesPlayed: number = 0
  distinctPlayers: Set<string> = new Set()

  constructor(baseline: GameJson) {
    this.totalBetAmount = baseline.total_bet_amount || 0
    this.totalWonAmount = baseline.total_won_amount || 0
    this.totalBets = baseline.total_bets || 0
    this.totalWins = baseline.total_wins || 0
    this.totalMinutesPlayed = baseline.total_minutes_played || 0
    this.distinctPlayers = new Set(baseline.distinct_players || [])
  }
}

/**
 * Stateful User Simulator
 */
class UserSimulator {
  private userId: string
  private games: schema.Game[] // List of all available games
  private createdAt: Date

  // In-Memory State
  private balance: UserBalance
  private activeBonuses: ActiveBonus[] = []
  private totalDeposited = 0

  // Log Arrays
  private depositLogs: NewDepositLog[] = []
  private bonusLogs: NewBonusLog[] = []
  private activeBonusInserts: NewActiveBonus[] = []
  private betLogs: NewBetLog[] = []
  private withdrawalLogs: NewWithdrawalLog[] = []
  private gameSessions: NewGameSession[] = []

  constructor(
    userId: string,
    initialBalance: UserBalance, // Expects the full "Select" type
    games: schema.Game[],
    createdAt: Date
  ) {
    this.userId = userId
    this.balance = { ...initialBalance } // Clone the full state
    this.games = games
    this.createdAt = createdAt
  }

  // --- Financial Event Helpers (Unchanged) ---

  private processInitialDeposit(simDate: Date) {
    const depositAmount = randomInt(MIN_DEPOSIT, MAX_DEPOSIT)
    const bonusAmount = Math.floor(depositAmount * DEPOSIT_MATCH_PERCENT)
    const depositWagering = depositAmount * DEPOSIT_WAGERING_MULTIPLIER
    const bonusWagering = bonusAmount * BONUS_WAGERING_MULTIPLIER
    const depositId = faker.string.uuid()
    const bonusLogId = faker.string.uuid()
    const expiresAt = new Date(simDate)
    expiresAt.setDate(expiresAt.getDate() + BONUS_EXPIRES_DAYS)

    this.depositLogs.push({
      id: depositId,
      userId: this.userId,
      operatorId: HOUSE_ID,
      amount: depositAmount,
      method: 'DEPOSIT_CASHAPP',
      status: 'COMPLETED',
      realAmountBefore: this.balance.realBalance,
      realAmountAfter: this.balance.realBalance + depositAmount,
      depositWageringRequiredBefore: this.balance.depositWageringRemaining,
      depositWageringRequiredAfter: this.balance.depositWageringRemaining + depositWagering,
      createdAt: simDate,
      completedAt: simDate
    })
    this.bonusLogs.push({
      id: bonusLogId,
      userId: this.userId,
      operatorId: HOUSE_ID,
      triggeringDepositId: depositId,
      bonusType: 'DEPOSIT_MATCH',
      bonusAmount,
      wageringRequirementTotal: bonusWagering,
      priority: BONUS_PRIORITY,
      expiresInDays: BONUS_EXPIRES_DAYS,
      createdAt: simDate
    })
    const activeBonus: ActiveBonus = {
      id: faker.string.uuid(),
      userId: this.userId,
      bonusLogId,
      status: 'ACTIVE',
      priority: BONUS_PRIORITY,
      currentBonusBalance: bonusAmount,
      currentWageringRemaining: bonusWagering,
      expiresAt,
      createdAt: simDate,
      updatedAt: simDate
    }
    this.activeBonusInserts.push(activeBonus)
    this.activeBonuses.push(activeBonus)
    this.balance.realBalance += depositAmount
    this.balance.depositWageringRemaining += depositWagering
    this.balance.totalDepositedReal += depositAmount
    this.balance.totalBonusGranted += bonusAmount
    this.totalDeposited += depositAmount
  }

  private processDeposit(simDate: Date) {
    const depositAmount = randomInt(MIN_DEPOSIT, MAX_DEPOSIT)
    const depositWagering = depositAmount * DEPOSIT_WAGERING_MULTIPLIER
    this.depositLogs.push({
      id: faker.string.uuid(),
      userId: this.userId,
      operatorId: HOUSE_ID,
      amount: depositAmount,
      method: 'DEPOSIT_CASHAPP',
      status: 'COMPLETED',
      realAmountBefore: this.balance.realBalance,
      realAmountAfter: this.balance.realBalance + depositAmount,
      depositWageringRequiredBefore: this.balance.depositWageringRemaining,
      depositWageringRequiredAfter: this.balance.depositWageringRemaining + depositWagering,
      createdAt: simDate,
      completedAt: simDate
    })
    this.balance.realBalance += depositAmount
    this.balance.depositWageringRemaining += depositWagering
    this.balance.totalDepositedReal += depositAmount
    this.totalDeposited += depositAmount
  }

  private processBet(game: schema.Game, gameSessionId: string, simDate: Date) {
    const wagerAmount = randomInt(
      Math.max(MIN_BET, game.minBet || MIN_BET),
      Math.min(MAX_BET, game.maxBet || MAX_BET)
    )
    const totalAvailableBonus = this.activeBonuses.reduce(
      (sum, b) => (b.status === 'ACTIVE' ? sum + b.currentBonusBalance : sum),
      0
    )
    if (this.balance.realBalance + totalAvailableBonus < wagerAmount) {
      return { nsf: true, wagerAmount: 0, winAmount: 0 }
    }
    const isWin = Math.random() < CHANCE_TO_WIN
    const winAmount = isWin
      ? Math.floor(
          wagerAmount *
            (Math.random() * (MAX_WIN_MULTIPLIER - MIN_WIN_MULTIPLIER) + MIN_WIN_MULTIPLIER)
        )
      : 0
    let wagerPaidFromReal = 0
    let wagerPaidFromBonus = 0
    let wagerToPay = wagerAmount
    if (this.balance.realBalance > 0) {
      const paidReal = Math.min(this.balance.realBalance, wagerToPay)
      this.balance.realBalance -= paidReal
      wagerPaidFromReal += paidReal
      wagerToPay -= paidReal
    }
    if (wagerToPay > 0) {
      this.activeBonuses.sort((a, b) => a.priority - b.priority)
      for (const bonus of this.activeBonuses) {
        if (wagerToPay === 0) break
        if (bonus.status !== 'ACTIVE' || bonus.currentBonusBalance === 0) continue
        const paidBonus = Math.min(bonus.currentBonusBalance, wagerToPay)
        bonus.currentBonusBalance -= paidBonus
        wagerPaidFromBonus += paidBonus
        wagerToPay -= paidBonus
        bonus.updatedAt = simDate
      }
    }
    let wagerForWROnly = wagerAmount
    if (wagerPaidFromReal > 0 && this.balance.depositWageringRemaining > 0) {
      const cleared = Math.min(this.balance.depositWageringRemaining, wagerPaidFromReal)
      this.balance.depositWageringRemaining -= cleared
    }
    for (const bonus of this.activeBonuses) {
      if (wagerForWROnly === 0) break
      if (bonus.status !== 'ACTIVE' || bonus.currentWageringRemaining === 0) continue
      const cleared = Math.min(bonus.currentWageringRemaining, wagerForWROnly)
      bonus.currentWageringRemaining -= cleared
      wagerForWROnly -= cleared
      bonus.updatedAt = simDate
      if (bonus.currentWageringRemaining === 0) {
        this.completeBonus(bonus, simDate)
      }
    }
    if (winAmount > 0) {
      this.balance.realBalance += winAmount
    }
    this.betLogs.push({
      userId: this.userId,
      operatorId: HOUSE_ID,
      status: 'COMPLETED',
      wagerAmount,
      winAmount,
      wagerPaidFromReal,
      wagerPaidFromBonus,
      gameId: game.id,
      gameName: game.name,
      gameSessionId,
      createdAt: simDate
    })
    this.balance.totalWagered += wagerAmount
    this.balance.totalWon += winAmount
    return { nsf: false, wagerAmount, winAmount }
  }

  private processWithdrawal(simDate: Date) {
    const totalBonusWR = this.activeBonuses.reduce((sum, b) => sum + b.currentWageringRemaining, 0)
    if (
      this.balance.depositWageringRemaining > 0 ||
      totalBonusWR > 0 ||
      this.balance.realBalance < MIN_DEPOSIT
    ) {
      return
    }
    const isAutoWithdraw = this.balance.realBalance > this.totalDeposited * AUTOWITHDRAW_MULTIPLIER
    if (!isAutoWithdraw && Math.random() > CHANCE_TO_WITHDRAW) {
      return
    }
    const withdrawalAmount = isAutoWithdraw
      ? this.balance.realBalance - this.totalDeposited * (AUTOWITHDRAW_MULTIPLIER - 1)
      : Math.floor(this.balance.realBalance * (Math.random() * 0.5 + 0.1))
    if (withdrawalAmount <= 0) return
    this.withdrawalLogs.push({
      userId: this.userId,
      operatorId: HOUSE_ID,
      status: 'COMPLETED',
      amount: withdrawalAmount,
      realAmountBefore: this.balance.realBalance,
      realAmountAfter: this.balance.realBalance - withdrawalAmount,
      requestedAt: simDate,
      completedAt: simDate
    })
    this.balance.realBalance -= withdrawalAmount
    this.balance.totalWithdrawn += withdrawalAmount
  }

  private completeBonus(bonus: ActiveBonus, simDate: Date) {
    bonus.status = 'COMPLETED'
    bonus.updatedAt = simDate
    if (bonus.currentBonusBalance > 0) {
      this.balance.realBalance += bonus.currentBonusBalance
      bonus.currentBonusBalance = 0
    }
  }

  private getTotalBalance() {
    return (
      this.balance.realBalance +
      this.activeBonuses.reduce(
        (sum, b) => (b.status === 'ACTIVE' ? sum + b.currentBonusBalance : 0),
        0
      )
    )
  }

  // --- Main Simulation Loop (Refactored for Sessions) ---
  public simulate() {
    let currentDate = new Date(this.createdAt)

    // 1. Initial Deposit
    this.processInitialDeposit(currentDate)

    const daysSinceJoined = Math.floor(
      (SIMULATION_END_DATE.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    // 2. Daily Activity Loop
    for (let i = 0; i <= daysSinceJoined; i++) {
      // A. Check for bonus expiration
      for (const bonus of this.activeBonuses) {
        if (bonus.status === 'ACTIVE' && bonus.expiresAt && currentDate > bonus.expiresAt) {
          bonus.status = 'EXPIRED'
          bonus.currentBonusBalance = 0
          bonus.updatedAt = currentDate
        }
      }

      // B. Check for Withdrawal (can happen even if not playing)
      this.processWithdrawal(currentDate)

      // C. Chance to play today?
      if (Math.random() > CHANCE_TO_PLAY_PER_DAY) {
        currentDate.setDate(currentDate.getDate() + 1) // Advance to next day
        continue
      }

      // D. Check for re-deposit if low on funds
      if (this.getTotalBalance() < MIN_DEPOSIT && Math.random() < CHANCE_TO_DEPOSIT_AGAIN) {
        this.processDeposit(currentDate)
      }

      // E. Run Game Sessions for the day
      for (let j = 0; j < SESSIONS_PER_DAY; j++) {
        if (this.getTotalBalance() < MIN_BET) {
          break // Stop playing if out of money
        }

        const game = this.games[randomInt(0, this.games.length - 1)]!
        const sessionStartTime = new Date(currentDate)
        const gameSessionId = faker.string.uuid()

        const session: NewGameSession = {
          id: gameSessionId,
          userId: this.userId,
          gameId: game.id,
          gameName: game.name,
          status: 'ACTIVE', // Will be COMPLETED
          playerStartingBalance: this.getTotalBalance(),
          createdAt: sessionStartTime,
          // Will be set at end
          totalWagered: 0,
          totalWon: 0,
          totalBets: 0,
          playerEndingBalance: 0,
          duration: 0,
          updatedAt: sessionStartTime
        }

        const numberOfBets = randomInt(MIN_BETS_PER_SESSION, MAX_BETS_PER_SESSION)
        let sessionWagered = 0
        let sessionWon = 0

        for (let k = 0; k < numberOfBets; k++) {
          const betTime = randomInt(MIN_TIME_PER_BET_MS, MAX_TIME_PER_BET_MS)
          currentDate = addMsToDate(currentDate, betTime) // Advance time per bet

          const betResult = this.processBet(game, gameSessionId, currentDate)

          if (betResult.nsf) {
            break // End session if NSF
          }

          sessionWagered += betResult.wagerAmount
          sessionWon += betResult.winAmount
          session.totalBets!++
        }

        // Complete the session
        session.status = 'COMPLETED'
        session.totalWagered = sessionWagered
        session.totalWon = sessionWon
        session.playerEndingBalance = this.getTotalBalance()
        session.updatedAt = new Date(currentDate)
        session.duration = Math.round(
          (session.updatedAt.getTime() - session.createdAt!.getTime()) / 60000
        ) // in minutes

        this.gameSessions.push(session)
      }

      // Advance to next day (or what's left of it)
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(randomInt(0, 5), randomInt(0, 59)) // Start next day at a random early time
    }

    // 3. Return all logs and the final state
    this.balance.updatedAt = new Date()

    return {
      finalBalance: this.balance,
      depositLogs: this.depositLogs,
      bonusLogs: this.bonusLogs,
      activeBonusInserts: this.activeBonusInserts,
      activeBonusUpdates: this.activeBonuses, // The full final state
      betLogs: this.betLogs,
      withdrawalLogs: this.withdrawalLogs,
      gameSessions: this.gameSessions
    }
  }
}

/**
 * Main Seed Function
 */
const main = async () => {
  console.log('--- SEEDING STARTED (Session-Based Model) ---')

  // 1. Clean database
  console.log('Cleaning database...')
  await db.delete(schema.betLogTable)
  await db.delete(schema.gameSessionTable)
  await db.delete(schema.activeBonusTable)
  await db.delete(schema.bonusLogTable)
  await db.delete(schema.depositLogTable)
  await db.delete(schema.withdrawalLogTable)
  await db.delete(schema.userBalanceTable)
  await db.delete(schema.userTable)
  await db.delete(schema.gameTable)
  await db.delete(schema.operatorTable)

  // 2. Create HOUSE operator
  console.log('Creating HOUSE operator...')
  const [house] = await db
    .insert(schema.operatorTable)
    .values({
      id: HOUSE_ID,
      name: 'HOUSE',
      ownerId: 'system'
    })
    .returning()
  if (!house) throw new Error(' you have no house operator')
  // 3. Load and Insert Games from JSON
  console.log('Loading games from games.json...')
  // Assumes games.json is in the root, parallel to 'apps'
  const gamesJsonPath = path.join(__dirname, '../../../../games.json')
  let gameInserts: NewGame[] = []
  const gameBaselineStats = new Map<string, GameStatsTracker>()

  try {
    const gamesString = fs.readFileSync(gamesJsonPath, 'utf-8')
    const gamesData: GameJson[] = JSON.parse(gamesString)

    gameInserts = gamesData
      .filter((g) => g.status === 'ACTIVE') // Only seed active games
      .map((game) => {
        gameBaselineStats.set(game.id, new GameStatsTracker(game))
        // Map snake_case to camelCase
        return {
          id: game.id,
          name: game.name,
          title: game.title,
          category: game.category as NewGame['category'],
          developer: game.developer,
          operatorId: house.id, // Assign to HOUSE
          status: 'ACTIVE',
          minBet: game.min_bet,
          maxBet: game.max_bet,
          isFeatured: game.is_featured,
          volatility: game.volatility,
          targetRtp: game.target_rtp,
          goldsvetData: game.goldsvet_data,
          totalBetAmount: game.total_bet_amount || 0,
          totalWonAmount: game.total_won_amount || 0,
          totalBets: game.total_bets || 0,
          totalWins: game.total_wins || 0,
          currentRtp: Math.round(game.current_rtp || 0),
          hitPercentage: Math.round(game.hit_percentage || 0),
          totalPlayers: game.total_players || 0,
          totalMinutesPlayed: game.total_minutes_played || 0,
          distinctPlayers: game.distinct_players || [],
          createdAt: new Date(game.created_at),
          updatedAt: new Date(game.updated_at),
          startedAt: new Date(game.started_at)
        }
      })

    console.log(`Inserting ${gameInserts.length} active games...`)
    await db.insert(schema.gameTable).values(gameInserts)
  } catch (err) {
    console.error(
      `Failed to load or insert games.json. Make sure it's at the root of the 'bun-hono-vue-rpc' project.`,
      err
    )
    process.exit(1)
  }

  // Get all games we just inserted (to pass to simulator)
  const allGames = await db.query.gameTable.findMany({
    where: sql`${schema.gameTable.operatorId} = ${house.id}`
  })

  // 4. Create users and simulate
  console.log(`Creating and simulating ${USER_COUNT} users...`)

  const users: NewUser[] = []
  const userBalances: NewUserBalance[] = []
  const allSimOutputs = []

  for (let i = 0; i < USER_COUNT; i++) {
    const createdAt = randomDate(SIMULATION_START_DATE, SIMULATION_END_DATE)
    const email = faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    })

    const user: NewUser = {
      id: faker.string.uuid(),
      authId: faker.string.uuid(),
      operatorId: house.id,
      email,
      displayName: faker.internet.username(),
      roles: ['USER'],
      createdAt
    }
    users.push(user)

    const balanceId = faker.string.uuid()

    // This is the "Insert" type
    const newBalance: NewUserBalance = {
      id: balanceId,
      userId: user.id!,
      createdAt
    }
    userBalances.push(newBalance)

    // This is the full "Select" type object for the simulator's initial state
    const initialSimState: UserBalance = {
      id: balanceId,
      userId: user.id!,
      createdAt,
      updatedAt: createdAt,
      realBalance: 0,
      freeSpinsRemaining: 0,
      depositWageringRemaining: 0,
      totalDepositedReal: 0,
      totalWithdrawn: 0,
      totalWagered: 0,
      totalWon: 0,
      totalBonusGranted: 0,
      totalFreeSpinWins: 0
    }

    // Pass the full state object to the simulator
    const simulator = new UserSimulator(user.id!, initialSimState, allGames, createdAt)
    allSimOutputs.push(simulator.simulate())

    if ((i + 1) % 10 === 0) {
      console.log(`Simulated user ${i + 1}/${USER_COUNT}`)
    }
  }

  // 5. Aggregate all logs
  console.log('Aggregating all simulation data...')
  const allDepositLogs = allSimOutputs.flatMap((o) => o.depositLogs)
  const allBonusLogs = allSimOutputs.flatMap((o) => o.bonusLogs)
  const allActiveBonusInserts = allSimOutputs.flatMap((o) => o.activeBonusInserts)
  const allBetLogs = allSimOutputs.flatMap((o) => o.betLogs)
  const allWithdrawalLogs = allSimOutputs.flatMap((o) => o.withdrawalLogs)
  const allGameSessions = allSimOutputs.flatMap((o) => o.gameSessions)
  const finalBalanceUpdates = allSimOutputs.map((o) => o.finalBalance)
  const finalActiveBonusUpdates = allSimOutputs.flatMap((o) => o.activeBonusUpdates)

  // 6. Aggregate Game Stats
  console.log('Aggregating game stats...')

  // Add new session data to the baseline stats
  for (const session of allGameSessions) {
    const stats = gameBaselineStats.get(session.gameId!)
    if (!stats) continue
    stats.totalMinutesPlayed += session.duration || 0
    stats.distinctPlayers.add(session.userId)
  }

  // Add new bet data
  for (const bet of allBetLogs) {
    const stats = gameBaselineStats.get(bet.gameId!)
    if (!stats) continue
    stats.totalBetAmount += bet.wagerAmount
    stats.totalWonAmount += bet.winAmount
    stats.totalBets++
    if (bet.winAmount > 0) {
      stats.totalWins++
    }
  }

  // 7. Run Final Transaction
  console.log('Inserting all data into database...')
  try {
    await db.transaction(async (tx) => {
      // Insert foundational data
      if (users.length) await tx.insert(schema.userTable).values(users)
      if (userBalances.length) await tx.insert(schema.userBalanceTable).values(userBalances)

      // --- FIX: BATCH INSERT ALL LOGS ---
      console.log(`Inserting ${allDepositLogs.length} deposit logs...`)
      for (let i = 0; i < allDepositLogs.length; i += BATCH_SIZE) {
        const batch = allDepositLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.depositLogTable).values(batch)
      }

      console.log(`Inserting ${allBonusLogs.length} bonus logs...`)
      for (let i = 0; i < allBonusLogs.length; i += BATCH_SIZE) {
        const batch = allBonusLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.bonusLogTable).values(batch)
      }

      console.log(`Inserting ${allActiveBonusInserts.length} active bonuses...`)
      for (let i = 0; i < allActiveBonusInserts.length; i += BATCH_SIZE) {
        const batch = allActiveBonusInserts.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.activeBonusTable).values(batch)
      }

      console.log(`Inserting ${allGameSessions.length} game sessions...`)
      for (let i = 0; i < allGameSessions.length; i += BATCH_SIZE) {
        const batch = allGameSessions.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.gameSessionTable).values(batch)
      }

      console.log(`Inserting ${allBetLogs.length} bet logs...`)
      for (let i = 0; i < allBetLogs.length; i += BATCH_SIZE) {
        const batch = allBetLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.betLogTable).values(batch)
      }

      console.log(`Inserting ${allWithdrawalLogs.length} withdrawal logs...`)
      for (let i = 0; i < allWithdrawalLogs.length; i += BATCH_SIZE) {
        const batch = allWithdrawalLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.withdrawalLogTable).values(batch)
      }

      // --- Apply final state updates ---
      console.log('Applying final state updates...')

      // Update User Balances (Real Wallets)
      for (const balance of finalBalanceUpdates) {
        await tx
          .update(schema.userBalanceTable)
          .set({
            realBalance: balance.realBalance,
            depositWageringRemaining: balance.depositWageringRemaining,
            totalDepositedReal: balance.totalDepositedReal,
            totalWithdrawn: balance.totalWithdrawn,
            totalWagered: balance.totalWagered,
            totalWon: balance.totalWon,
            totalBonusGranted: balance.totalBonusGranted,
            updatedAt: balance.updatedAt
          })
          .where(sql`${schema.userBalanceTable.id} = ${balance.id}`)
      }

      // Update Active Bonuses (Bonus Wallets)
      for (const bonus of finalActiveBonusUpdates) {
        await tx
          .update(schema.activeBonusTable)
          .set({
            status: bonus.status,
            currentBonusBalance: bonus.currentBonusBalance,
            currentWageringRemaining: bonus.currentWageringRemaining,
            updatedAt: bonus.updatedAt
          })
          .where(sql`${schema.activeBonusTable.id} = ${bonus.id}`)
      }

      // Update Game Stats
      for (const [gameId, stats] of gameBaselineStats.entries()) {
        const newRtp =
          stats.totalBetAmount > 0 ? (stats.totalWonAmount / stats.totalBetAmount) * 100 : 0
        const newHitPercentage = stats.totalBets > 0 ? (stats.totalWins / stats.totalBets) * 100 : 0

        await tx
          .update(schema.gameTable)
          .set({
            totalBetAmount: stats.totalBetAmount,
            totalWonAmount: stats.totalWonAmount,
            totalBets: stats.totalBets,
            totalWins: stats.totalWins,
            totalMinutesPlayed: stats.totalMinutesPlayed,
            totalPlayers: stats.distinctPlayers.size,
            distinctPlayers: Array.from(stats.distinctPlayers),
            currentRtp: Math.round(newRtp),
            hitPercentage: Math.round(newHitPercentage),
            updatedAt: new Date()
          })
          .where(sql`${schema.gameTable.id} = ${gameId}`)
      }
    })
  } catch (err) {
    console.error('--- SEEDING FAILED ---')
    console.error(err)
    process.exit(1)
  }

  console.log('--- SEEDING FINISHED ---')
  process.exit(0)
}

main().catch((err) => {
  console.error('--- SEEDING FAILED (uncaught) ---')
  console.error(err)
  process.exit(1)
})
EOF

# --- 14. Update src/db/reset.ts imports ---
echo "Updating: src/db/reset.ts"
cat << 'EOF' > src/db/reset.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import *s schema from '@/db/schema' // <-- UPDATED IMPORT

/**
 * This script will delete ALL data from the simulation tables.
 * It respects foreign key constraints by deleting in the correct order.
 */
const main = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.')
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client, { schema })

  console.log('--- RESETTING DATABASE ---')

  try {
    // We must delete in reverse order of creation to respect foreign keys
    console.log('Deleting bet logs...')
    await db.delete(schema.betLogTable)

    console.log('Deleting game sessions...')
    await db.delete(schema.gameSessionTable)

    console.log('Deleting active bonuses...')
    await db.delete(schema.activeBonusTable)

    /*
     * bonusLogTable and depositLogTable can have a circular-like dependency
     * (bonus references deposit, but we need to delete both)
     * We can break the link by setting the foreign key to null first (if it's nullable)
     * or just delete the logs that depend on deposits.
     * In our schema, bonusLog references depositLog, so we delete bonusLog first.
     */
    console.log('Deleting bonus logs...')
    await db.delete(schema.bonusLogTable)

    console.log('Deleting deposit logs...')
    await db.delete(schema.depositLogTable)

    console.log('Deleting withdrawal logs...')
    await db.delete(schema.withdrawalLogTable)

    console.log('Deleting user balances...')
    await db.delete(schema.userBalanceTable)

    // Users and Games must be deleted before the Operator
    console.log('Deleting users...')
    await db.delete(schema.userTable)

    console.log('Deleting games...')
    await db.delete(schema.gameTable)

    // Operator is last
    console.log('Deleting operator...')
    await db.delete(schema.operatorTable)

    console.log('--- DATABASE RESET SUCCESSFULLY ---')
    process.exit(0)
  } catch (err) {
    console.error('--- DATABASE RESET FAILED ---')
    console.error(err)
    process.exit(1)
  }
}

main()
EOF

# --- 15. Update src/shared.ts ---
echo "Updating: src/shared.ts"
cat << 'EOF' > src/shared.ts
import { z } from 'zod'
import type { RedisClient } from 'bun'
import { SupabaseClient, type User as AuthUser } from '@supabase/supabase-js'
import { hc } from 'hono/client'

// --- CORE TYPE EXPORTS ---
// We now export the $inferSelect types directly from our new schema structure.
// This is the new Single Source of Truth.
export type {
  User,
  Operator,
  Game,
  UserBalance,
  ActiveBonus,
  BetLog,
  DepositLog,
  WithdrawalLog,
  GameSession
} from './db/schema'

// --- FULL USER TYPE (for server-side use) ---
// This will be built by our new user.service.ts
// We define it here so our client-facing `getMe` can use it.
import type { User, UserBalance, ActiveBonus, GameSession } from './db/schema'

export type CurrentUser = User & {
  balance: UserBalance
  activeBonuses: ActiveBonus[]
  activeGameSession: GameSession | null
  // Fields from Supabase session
  sessionId: string
  sessionExpiresAt: Date | null
  sessionRefreshToken: string | null
  lastUpdated: Date
}

// --- CONSTANTS & APP TYPE ---
export * as constants from './core/constants'
export type { AppType } from './app'

// --- BINDINGS (Unchanged) ---
export interface AppBindings {
  // Variables: {
  user: User // This will be the *lean* user from our new auth middleware
  authUser: AuthUser
  sessionCache: RedisClient
  gameSessionCache: RedisClient
  supabase: SupabaseClient
  // };
}

// --- ZOD SCHEMAS (for API validation) ---
export const ZGetUserSchema = z.object({
  id: z.string()
})
export const ZGetAllUsersSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  perPage: z.coerce.number().min(1).optional().default(4)
})
export type TGetUserType = z.infer<typeof ZGetUserSchema>
export type TGetAllUsersType = z.infer<typeof ZGetAllUsersSchema>

// --- PAGINATION (Unchanged) ---
export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface PaginationParams {
  page?: number
  perPage?: number
  category?: string
}
EOF

# --- 16. Update src/middleware/auth.ts (Imports only) ---
echo "Updating imports in: src/middleware/auth.ts"
# We only update the import paths, the logic stays for now.
# We have to use 'sed' for this in-place edit.
sed -i.bak 's|from ''\''@/db''\''|from ''\''@/db/schema''\''|g' src/middleware/auth.ts
sed -i.bak 's|from ''\''../db/schema''\''|from ''\''@/db/schema''\''|g' src/middleware/auth.ts
rm src/middleware/auth.ts.bak

echo "---"
echo "✅ SCHEMA REFACTOR COMPLETE!"
echo "---"
echo ""
echo "All schema files have been refactored into the 'src/db/schema/' directory."
echo "Imports in 'seed.ts', 'reset.ts', 'db.ts', and 'drizzle.config.ts' have been updated."
echo ""
echo "NEXT STEPS:"
echo "1. (Recommended) Review the changes: 'git diff'"
echo "2. Install dependencies: 'bun install'"
echo "3. Generate a new migration: 'bun run db:generate'"
echo "   (Drizzle will see the old schema.ts deleted and all the new tables created)"
echo "4. Apply the migration: 'bun run db:migrate'"
echo ""
echo "After this, we can begin refactoring the 'auth.ts' middleware into services."
echo ""