#!/bin/bash
set -e

echo "--- Starting Schema CamelCase Refactor ---"

# --- 1. Update src/db/schema/operators.ts ---
echo "Updating: src/db/schema/operators.ts"
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

# --- 2. Update src/db/schema/users.ts ---
echo "Updating: src/db/schema/users.ts"
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

# --- 3. Update src/db/schema/games.ts ---
echo "Updating: src/db/schema/games.ts"
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
    isActive: boolean().default(true).notNull(),
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

# --- 4. Update src/db/schema/wallets.ts ---
echo "Updating: src/db/schema/wallets.ts"
cat << 'EOF' > src/db/schema/wallets.ts
import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { bonusStatusEnum } from './_enums'
import { userTable } from './users'
import { bonusLogTable } from './logs'

/**
 * userBalanceTable: The "Real Money Wallet".
 */
export const userBalanceTable = pgTable('user_balances', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id)
    .unique(), // One balance sheet per user

  // --- Current State ---
  realBalance: integer().default(0).notNull(), // Real cash
  freeSpinsRemaining: integer().default(0).notNull(),
  depositWageringRemaining: integer().default(0).notNull(),

  // --- Lifetime Stats ---
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

# --- 5. Update src/db/schema/logs.ts ---
echo "Updating: src/db/schema/logs.ts"
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
    isBot: boolean().default(false).notNull(),
    authSessionId: uuid(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userTable.id),
    gameId: uuid('game_id')
      .notNull()
      .references(() => gameTable.id),
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

// Co-locate relations
export const depositLogRelations = relations(depositLogTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [depositLogTable.userId],
    references: [userTable.id]
  }),
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

  triggeringDepositId: uuid('triggering_deposit_id').references(() => depositLogTable.id),

  bonusType: bonusTypeEnum('bonus_type').notNull(),
  bonusAmount: integer().notNull(),
  wageringRequirementTotal: integer().notNull(),

  priority: integer().default(100).notNull(),
  expiresInDays: integer().default(7),

  metaData: jsonb('meta_data'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
})

// Co-locate relations
export const bonusLogRelations = relations(bonusLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [bonusLogTable.userId],
    references: [userTable.id]
  }),
  triggeringDeposit: one(depositLogTable, {
    fields: [bonusLogTable.triggeringDepositId],
    references: [depositLogTable.id]
  }),
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
  amount: integer().notNull(),

  realAmountBefore: integer().notNull(),
  realAmountAfter: integer().notNull(),

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
    gameSessionId: uuid(),
    operatorId: uuid(),
    status: betStatusEnum('status').default('COMPLETED').notNull(),

    wagerAmount: integer().notNull(),
    winAmount: integer().notNull(),
    wagerPaidFromReal: integer().default(0).notNull(),
    wagerPaidFromBonus: integer().default(0).notNull(),

    // IMPORTANT: The generated column *must* refer to the snake_case
    // database column names, as this is raw SQL.
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

echo "---"
echo "✅ SCHEMA CAMELCASE REFACTOR COMPLETE!"
echo "---"
echo ""
echo "The schema files in 'src/db/schema/' have been updated to use camelCase."
echo ""
echo "NEXT STEPS:"
echo "1. (CRITICAL) Generate a new migration:"
echo "   bun run db:generate"
echo "   (Drizzle Kit will analyze the changes and see them as renames.)"
echo ""
echo "2. Apply the new migration to your database:"
echo "   bun run db:migrate"
echo ""
echo "After this, your schema will be fully aligned with the modern Drizzle pattern."
echo ""