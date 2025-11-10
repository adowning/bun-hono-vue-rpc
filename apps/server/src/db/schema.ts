import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  uuid,
  pgEnum,
  jsonb,
  index,
  boolean,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import z from 'zod'

// --- CONSTANTS ---
const HOUSE_ID = '00000000-0000-0000-0000-000000000000'

// --- ENUMS ---

export const userRoleEnum = pgEnum('user_role_enum', [
  'USER',
  'AFFILIATE',
  'ADMIN',
  'OPERATOR',
  'BOT'
])
export const userStatusEnum = pgEnum('user_status_enum', ['ONLINE', 'OFFLINE', 'BANNED', 'INGAME'])

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

// Status for an active bonus in the "bonus wallet"
export const bonusStatusEnum = pgEnum('bonus_status_enum', [
  'ACTIVE', // Wagering can be completed
  'COMPLETED', // Wagering is finished, any remaining balance is (usually) converted to real
  'EXPIRED', // Bonus expired before completion
  'CANCELLED' // User manually cancelled
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

export const gameCategoriesEnum = pgEnum('game_categories_enum', [
  'SLOTS',
  'FISH',
  'TABLE',
  'LIVE',
  'OTHER'
])

export const gameStatusEnum = pgEnum('game_status_enum', ['ACTIVE', 'INACTIVE', 'MAINTENANCE'])

export const jackpotTypeEnum = pgEnum('type_of_jackpot_enum', ['MINOR', 'MAJOR', 'MEGA', 'NONE'])

export const sessionStatusEnum = pgEnum('session_status_enum', [
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'ABANDONED',
  'TIMEOUT',
  'OTP_PENDING',
  'SHUTDOWN'
])

// --- CORE TABLES ---

/**
 * userTable: Our local user, separate from Supabase auth.
 */
export const userTable = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  authId: varchar('auth_id', { length: 256 }).unique().notNull(),
  operatorId: text('operator_id').default(HOUSE_ID).notNull(),
  operatorIdNew: uuid('operator_id_new').default(HOUSE_ID).notNull(),
  email: text('email').unique().notNull(),
  displayName: text('display_name'),
  avatar: text('avatar').default('avatar-06.avif'),
  roles: userRoleEnum('roles').array().notNull().default(['USER']),
  status: userStatusEnum('status').notNull().default('OFFLINE'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

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

// --- USER STATE & FINANCIALS ---

/**
 * userBalanceTable: The "Real Money Wallet".
 * This table is UPDATED by transactions. It only holds REAL money.
 * Bonus money is stored in `activeBonusTable`.
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

/**
 * activeBonusTable: The "Bonus Wallet".
 * Each row is a separate, active bonus for a user.
 * The user's "Total Bonus Balance" is the SUM of `currentBonusBalance` from this table.
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

// --- FINANCIAL EVENT LOGS (AUDIT TRAIL) ---

/**
 * depositLogTable: Audit log for REAL MONEY deposits.
 * This creates a new row for every deposit attempt.
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

/**
 * bonusLogTable: IMMUTABLE Audit log for GRANTED BONUSES.
 * This is the "event" of a bonus being created.
 * It creates one row in `activeBonusTable` when it's created.
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

/**
 * betLogTable: Audit log for individual bets (spins, hands, etc.).
 * Stores *how* the bet was paid for, which is critical for the new model.
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

    // --- How the bet was paid (for auditing) ---
    // wagerAmount = wagerPaidFromReal + wagerPaidFromBonus
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

// --- ZOD SCHEMAS & TYPES ---

// User
export const userSelectSchema = createSelectSchema(userTable)
export const userInsertSchema = createInsertSchema(userTable)
export type User = typeof userTable.$inferSelect
export type NewUser = typeof userTable.$inferInsert

// Operator
export const operatorSelectSchema = createSelectSchema(operatorTable)
export const operatorInsertSchema = createInsertSchema(operatorTable)
export type Operator = typeof operatorTable.$inferSelect
export type NewOperator = typeof operatorTable.$inferInsert

// UserBalance (The Real Money Wallet)
export const userBalanceSelectSchema = createSelectSchema(userBalanceTable)
export const userBalanceInsertSchema = createInsertSchema(userBalanceTable)
export type UserBalance = typeof userBalanceTable.$inferSelect
export type NewUserBalance = typeof userBalanceTable.$inferInsert

// Active Bonus (The Bonus Wallet Entry)
export const activeBonusSelectSchema = createSelectSchema(activeBonusTable)
export const activeBonusInsertSchema = createInsertSchema(activeBonusTable)
export type ActiveBonus = typeof activeBonusTable.$inferSelect
export type NewActiveBonus = typeof activeBonusTable.$inferInsert

// Game Session
export const gameSessionSelectSchema = createSelectSchema(gameSessionTable)
export const gameSessionInsertSchema = createInsertSchema(gameSessionTable)
export type GameSession = typeof gameSessionTable.$inferSelect
export type NewGameSession = typeof gameSessionTable.$inferInsert

// Game
export const GameSelectSchema = createSelectSchema(gameTable)
export const GameInsertSchema = createInsertSchema(gameTable)
export type Game = typeof gameTable.$inferSelect
export type NewGame = typeof gameTable.$inferInsert

// Deposit Log
export const depositLogSelectSchema = createSelectSchema(depositLogTable)
export const depositLogInsertSchema = createInsertSchema(depositLogTable)
export type DepositLog = typeof depositLogTable.$inferSelect
export type NewDepositLog = typeof depositLogTable.$inferInsert

// Bonus Log (Grant Event)
export const bonusLogSelectSchema = createSelectSchema(bonusLogTable)
export const bonusLogInsertSchema = createInsertSchema(bonusLogTable)
export type BonusLog = typeof bonusLogTable.$inferSelect
export type NewBonusLog = typeof bonusLogTable.$inferInsert

// Withdrawal Log
export const withdrawalLogSelectSchema = createSelectSchema(withdrawalLogTable)
export const withdrawalLogInsertSchema = createInsertSchema(withdrawalLogTable)
export type WithdrawalLog = typeof withdrawalLogTable.$inferSelect
export type NewWithdrawalLog = typeof withdrawalLogTable.$inferInsert

// Bet Log
export const betLogSelectSchema = createSelectSchema(betLogTable)
export const betLogInsertSchema = createInsertSchema(betLogTable)
export type BetLog = typeof betLogTable.$inferSelect
export type NewBetLog = typeof betLogTable.$inferInsert

// --- CurrentUser (Composite Zod Schema) ---
// This schema aggregates all state for the logged-in user.

export const CurrentUserSchema = z.object({
  // Core user information
  user: userSelectSchema,

  // Supabase session information
  sessionId: z.uuid(),
  sessionExpiresAt: z.date().nullable(),
  sessionRefreshToken: z.string().nullable(),

  // User's Real Money Wallet
  balance: userBalanceSelectSchema,

  // User's Bonus Wallet (all their active bonuses)
  activeBonuses: z.array(activeBonusSelectSchema),

  // Active game session (optional - nullable)
  activeGameSession: gameSessionSelectSchema.nullable(),

  // Operator information (optional - nullable)
  operatorId: z.string(),

  // Metadata
  lastUpdated: z.date()
})

export const CurrentUserUpdateSchema = z.object({
  user: userSelectSchema.partial().optional(),
  sessionExpiresAt: z.date().nullable().optional(),
  sessionRefreshToken: z.string().nullable().optional(),
  balance: userBalanceSelectSchema.optional(),
  activeBonuses: z.array(activeBonusSelectSchema).optional(),
  lastUpdated: z.date().optional()
})

// Type definitions for CurrentUser
export type CurrentUser = z.infer<typeof CurrentUserSchema>
export type CurrentUserUpdate = z.infer<typeof CurrentUserUpdateSchema>
export type PartialCurrentUser = Partial<CurrentUser>
export type CurrentUserBalance = CurrentUser['balance']
export type CurrentUserActiveGameSession = NonNullable<CurrentUser['activeGameSession']>

// --- RELATIONS ---

export const operatorRelations = relations(operatorTable, ({ many }) => ({
  users: many(userTable),
  games: many(gameTable)
}))

export const userRelations = relations(userTable, ({ one, many }) => ({
  operator: one(operatorTable, {
    fields: [userTable.operatorIdNew],
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

export const userBalanceRelations = relations(userBalanceTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userBalanceTable.userId],
    references: [userTable.id]
  })
}))

// Game Relations
export const gameRelations = relations(gameTable, ({ one, many }) => ({
  operator: one(operatorTable, {
    fields: [gameTable.operatorId],
    references: [operatorTable.id]
  }),
  betLogs: many(betLogTable),
  gameSessions: many(gameSessionTable)
}))

// Game Session Relations
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

// Financial Log Relations
export const depositLogRelations = relations(depositLogTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [depositLogTable.userId],
    references: [userTable.id]
  }),
  // A deposit can trigger one or more bonus *grants*
  triggeredBonusLogs: many(bonusLogTable)
}))

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
  activeBonus: one(activeBonusTable, {
    fields: [bonusLogTable.id],
    references: [activeBonusTable.bonusLogId]
  })
}))

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
