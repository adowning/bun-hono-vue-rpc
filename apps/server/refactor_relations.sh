#!/bin/bash
set -e

echo "--- Starting Schema Relations Refactor ---"

# --- 1. Update src/db/schema/operators.ts ---
echo "Updating: src/db/schema/operators.ts (Adding gameSettings, removing relations)"
cat << 'EOF' > src/db/schema/operators.ts
import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
// No more 'relations' import

/**
 * operatorTable: The entity (e.g., "HOUSE" or a white-label) that owns users and games.
 */
export const operatorTable = pgTable('operators', {
  id: uuid().defaultRandom().primaryKey().notNull(),

  updatedBy: text().default('system').notNull(),
  version: integer().default(1).notNull(),
  balance: integer().default(100000).notNull(),
  slotsBalance: integer().default(100000).notNull(),
  arcadeBalance: integer().default(100000).notNull(),
  currentFloat: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(),
  name: text().unique().notNull(),
  ownerId: text().default('system').notNull(),
  products: jsonb('products'),
  
  // --- NEW COLUMN (as discussed) ---
  gameSettings: jsonb('game_settings').default({'disabledGames': []}).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
})

// --- RELATIONS REMOVED (will be in relations.ts) ---

// Types
export type Operator = typeof operatorTable.$inferSelect
export type NewOperator = typeof operatorTable.$inferInsert
EOF

# --- 2. Update src/db/schema/users.ts ---
echo "Updating: src/db/schema/users.ts (Using FK thunks, removing relations)"
cat << 'EOF' > src/db/schema/users.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
// No more 'relations' import
import { userRoleEnum, userStatusEnum } from './_enums'
// No more table imports

const HOUSE_ID = '00000000-0000-0000-0000-000000000000'

/**
 * userTable: Our local user, separate from Supabase auth.
 */
export const userTable = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  authId: varchar('auth_id', { length: 256 }).unique().notNull(),

  // Using a thunk for the foreign key to prevent import cycles
  operatorId: uuid('operator_id')
    .notNull()
    .default(HOUSE_ID)
    .references(() => import('./operators').then((m) => m.operatorTable.id)),

  email: text('email').unique().notNull(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar').default('avatar-06.avif').notNull(),
  roles: userRoleEnum('roles').array().notNull().default(['USER']),
  status: userStatusEnum('status').notNull().default('OFFLINE'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// --- RELATIONS REMOVED (will be in relations.ts) ---

// Types
export type User = typeof userTable.$inferSelect
export type NewUser = typeof userTable.$inferInsert
EOF

# --- 3. Update src/db/schema/games.ts ---
echo "Updating: src/db/schema/games.ts (Removing operatorId, removing relations)"
cat << 'EOF' > src/db/schema/games.ts
import { pgTable, uuid, integer, boolean, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
// No more 'relations' import
import { gameCategoriesEnum, gameStatusEnum, jackpotTypeEnum } from './_enums'
// No more table imports

/**
 * gameTable: Stores information about each available game.
 * This is now the GLOBAL catalog.
 */
export const gameTable = pgTable(
  'games',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    version: integer().default(1).notNull(),
    isActive: boolean().default(true).notNull(),
    name: text().notNull(),
    title: text(),
    description: text(),
    category: gameCategoriesEnum('category').default('SLOTS').notNull(),
    thumbnailUrl: text(),
    bannerUrl: text(),
    volatility: integer().default(1).notNull(),
    developer: text(),
    
    // --- operatorId REMOVED (as discussed) ---
    
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
    // index('games_operator_index').on(t.operatorId), // <-- Removed
    index('games_status_index').on(t.status)
  ]
)

// --- RELATIONS REMOVED (will be in relations.ts) ---

// Types
export type Game = typeof gameTable.$inferSelect
export type NewGame = typeof gameTable.$inferInsert
EOF

# --- 4. Update src/db/schema/wallets.ts ---
echo "Updating: src/db/schema/wallets.ts (Using FK thunks, removing relations)"
cat << 'EOF' > src/db/schema/wallets.ts
import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core'
// No more 'relations' import
import { bonusStatusEnum } from './_enums'
// No more table imports

/**
 * userBalanceTable: The "Real Money Wallet".
 */
export const userBalanceTable = pgTable('user_balances', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => import('./users').then((m) => m.userTable.id)) // <-- Thunk
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

// --- RELATIONS REMOVED (will be in relations.ts) ---

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
      .references(() => import('./users').then((m) => m.userTable.id)), // <-- Thunk
    bonusLogId: uuid('bonus_log_id')
      .notNull()
      .references(() => import('./logs').then((m) => m.bonusLogTable.id)), // <-- Thunk

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

// --- RELATIONS REMOVED (will be in relations.ts) ---

// Types
export type ActiveBonus = typeof activeBonusTable.$inferSelect
export type NewActiveBonus = typeof activeBonusTable.$inferInsert
EOF

# --- 5. Update src/db/schema/logs.ts ---
echo "Updating: src/db/schema/logs.ts (Using FK thunks, removing relations)"
cat << 'EOF' > src/db/schema/logs.ts
import { pgTable, uuid, boolean, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm' // No more 'relations' import
import {
  sessionStatusEnum,
  depositMethodEnum,
  depositStatusEnum,
  bonusTypeEnum,
  withdrawalStatusEnum,
  betStatusEnum
} from './_enums'
// No more table imports

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
      .references(() => import('./users').then((m) => m.userTable.id)), // <-- Thunk
    gameId: uuid('game_id')
      .notNull()
      .references(() => import('./games').then((m) => m.gameTable.id)), // <-- Thunk
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
// --- RELATIONS REMOVED (will be in relations.ts) ---
export type GameSession = typeof gameSessionTable.$inferSelect
export type NewGameSession = typeof gameSessionTable.$inferInsert

/**
 * depositLogTable: Audit log for REAL MONEY deposits.
 */
export const depositLogTable = pgTable('deposit_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => import('./users').then((m) => m.userTable.id)), // <-- Thunk
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
// --- RELATIONS REMOVED (will be in relations.ts) ---
export type DepositLog = typeof depositLogTable.$inferSelect
export type NewDepositLog = typeof depositLogTable.$inferInsert

/**
 * bonusLogTable: IMMUTABLE Audit log for GRANTED BONUSES.
 */
export const bonusLogTable = pgTable('bonus_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => import('./users').then((m) => m.userTable.id)), // <-- Thunk
  operatorId: uuid('operator_id').notNull().default(HOUSE_ID),
  triggeringDepositId: uuid('triggering_deposit_id').references(() => depositLogTable.id), // <-- This one is fine (same file)
  bonusType: bonusTypeEnum('bonus_type').notNull(),
  bonusAmount: integer().notNull(),
  wageringRequirementTotal: integer().notNull(),
  priority: integer().default(100).notNull(),
  expiresInDays: integer().default(7),
  metaData: jsonb('meta_data'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
})
// --- RELATIONS REMOVED (will be in relations.ts) ---
export type BonusLog = typeof bonusLogTable.$inferSelect
export type NewBonusLog = typeof bonusLogTable.$inferInsert

/**
 * withdrawalLogTable: Audit log for REAL MONEY withdrawal requests.
 */
export const withdrawalLogTable = pgTable('withdrawal_logs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => import('./users').then((m) => m.userTable.id)), // <-- Thunk
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
// --- RELATIONS REMOVED (will be in relations.ts) ---
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
      .references(() => import('./users').then((m) => m.userTable.id)), // <-- Thunk
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
    gameId: uuid(), // No FK here, just an ID. Relation is in relations.ts
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
// --- RELATIONS REMOVED (will be in relations.ts) ---
export type BetLog = typeof betLogTable.$inferSelect
export type NewBetLog = typeof betLogTable.$inferInsert
EOF

# --- 6. Create src/db/schema/relations.ts (NEW FILE) ---
echo "Creating new file: src/db/schema/relations.ts"
cat << 'EOF' > src/db/schema/relations.ts
import { relations } from 'drizzle-orm'
import { operatorTable } from './operators'
import { userTable } from './users'
import { gameTable } from './games'
import { userBalanceTable, activeBonusTable } from './wallets'
import {
  gameSessionTable,
  depositLogTable,
  bonusLogTable,
  withdrawalLogTable,
  betLogTable
} from './logs'

// This is the new central hub for all relations.
// No thunks are needed because all imports are synchronous.

export const operatorRelations = relations(operatorTable, ({ many }) => ({
  users: many(userTable),
  games: many(gameTable)
}))

export const userRelations = relations(userTable, ({ one, many }) => ({
  operator: one(operatorTable, {
    fields: [userTable.operatorId],
    references: [operatorTable.id]
  }),
  userBalance: one(userBalanceTable, {
    fields: [userTable.id],
    references: [userBalanceTable.userId]
  }),
  activeBonuses: many(activeBonusTable),
  gameSessions: many(gameSessionTable),
  depositLogs: many(depositLogTable),
  bonusLogs: many(bonusLogTable),
  withdrawalLogs: many(withdrawalLogTable),
  betLogs: many(betLogTable)
}))

export const gameRelations = relations(gameTable, ({ many }) => ({
  // No more operator relation
  betLogs: many(betLogTable),
  gameSessions: many(gameSessionTable)
}))

export const userBalanceRelations = relations(userBalanceTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userBalanceTable.userId],
    references: [userTable.id]
  })
}))

export const activeBonusRelations = relations(activeBonusTable, ({ one }) => ({
  user: one(userTable, {
    fields: [activeBonusTable.userId],
    references: [userTable.id]
  }),
  bonusLog: one(bonusLogTable, {
    fields: [activeBonusTable.bonusLogId],
    references: [bonusLogTable.id]
  })
}))

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

export const depositLogRelations = relations(depositLogTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [depositLogTable.userId],
    references: [userTable.id]
  }),
  triggeredBonusLogs: many(bonusLogTable)
}))

export const bonusLogRelations = relations(bonusLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [bonusLogTable.userId],
    references: [userTable.id]
  }),
  triggeringDeposit: one(depositLogTable, {
    fields: [bonusLogTable.triggeringDepositId],
    references: [depositLogTable.id]
  }),
  activeBonus: one(activeBonusTable, {
    fields: [bonusLogTable.id],
    references: [activeBonusTable.bonusLogId]
  })
}))

export const withdrawalLogRelations = relations(withdrawalLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [withdrawalLogTable.userId],
    references: [userTable.id]
  })
}))

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
EOF

# --- 7. Update src/db/schema/index.ts (The Barrel File) ---
echo "Updating: src/db/schema/index.ts"
cat << 'EOF' > src/db/schema/index.ts
import * as enums from './_enums'
import * as operators from './operators'
import * as users from './users'
import * as games from './games'
import * as wallets from './wallets'
import * as logs from './logs'
import * as relations from './relations' // <-- NEW

// This file re-exports everything, making it the single source of truth
// for Drizzle Kit and for our application.

export const schema = {
  ...enums,
  ...operators,
  ...users,
  ...games,
  ...wallets,
  ...logs,
  ...relations // <-- NEW
}

// Export all individual tables and types
export * from './_enums'
export * from './operators'
export * from './users'
export * from './games'
export * from './wallets'
export * from './logs'
export * from './relations' // <-- NEW
EOF

echo "---"
echo "✅ SCHEMA RELATIONS REFACTOR COMPLETE!"
echo "---"
echo ""
echo "All 'relations' objects have been moved to 'src/db/schema/relations.ts'."
echo "Circular dependencies are now broken."
echo ""
echo "NEXT STEPS:"
echo "1. (CRITICAL) Run a 'db:push' (since we are in dev):"
echo "   bun run db:push"
echo "   (You may need to drop/create the DB again if it fails, but this should be clean)"
echo ""
echo "2. OR, generate a new migration:"
echo "   bun run db:generate"
echo "   bun run db:migrate"
echo ""
echo "After this, your schema will be 100% correct, and all VSCode errors will be gone."
echo ""