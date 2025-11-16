#!/bin/bash
set -e

echo "--- Starting JSONB Custom Type Refactor ---"

# --- 1. Create db/schema/_custom-types.ts (NEW FILE) ---
echo "Creating: src/db/schema/_custom-types.ts"
cat << 'EOF' > src/db/schema/_custom-types.ts
import { z } from 'zod'

/**
 * Zod schema for the 'goldsvetData' jsonb column in 'gameTable'
 * Based on the sample JSON provided.
 */
export const goldsvetDataSchema = z.object({
  title: z.string().optional(),
  shop_id: z.string().optional(),
  jpg_id: z.string().optional(),
  label: z.string().optional(),
  device: z.string().optional(),
  gamebank: z.string().optional(),
  lines_percent_config_spin: z.string().optional(),
  lines_percent_config_spin_bonus: z.string().optional(),
  lines_percent_config_bonus: z.string().optional(),
  lines_percent_config_bonus_bonus: z.string().optional(),
  rezerv: z.string().optional(),
  cask: z.string().optional(),
  advanced: z.string().optional(),
  bet: z.string().optional(),
  scalemode: z.string().optional(),
  slotviewstate: z.string().optional(),
  view: z.string().optional(),
  denomination: z.string().optional(),
  category_temp: z.string().optional(),
  original_id: z.string().optional(),
  bids: z.string().optional(),
  stat_in: z.string().optional(),
  stat_out: z.string().optional(),
})
export type GoldsvetData = z.infer<typeof goldsvetDataSchema>


/**
 * Zod schema for a single Product in the 'products' jsonb array in 'operatorTable'
 */
export const productSchema = z.object({
  title: z.string(),
  productType: z.string(), // e.g., "DEPOSIT_PACKAGE"
  bonusTotalInCredits: z.number().int(),
  discountInCents: z.number().int(),
  bestValue: z.number().int(), // Or z.boolean() if 0/1
  amountToReceiveInCredits: z.number().int(),
  totalDiscountInCents: z.number().int(),
  bonusSpins: z.number().int(),
  isPromo: z.boolean(),
  description: z.string(),
  url: z.string().url(),
  priceInCents: z.number().int().positive(),
})
export type Product = z.infer<typeof productSchema>

/**
 * Zod schema for the 'products' column, which is an array of Product objects.
 */
export const productsSchema = z.array(productSchema)
export type Products = z.infer<typeof productsSchema>


/**
 * Zod schema for the 'distinctPlayers' jsonb column in 'gameTable'.
 * Based on seed.ts, this is an array of user UUIDs.
 */
export const distinctPlayersSchema = z.array(z.string().uuid())
export type DistinctPlayers = z.infer<typeof distinctPlayersSchema>


/**
 * Zod schema for the 'gameSettings' jsonb column in 'operatorTable'.
 * Based on our discussion, this stores a denylist of game UUIDs.
 */
export const gameSettingsSchema = z.object({
  disabledGames: z.array(z.string().uuid())
})
export type GameSettings = z.infer<typeof gameSettingsSchema>
EOF

# --- 2. Update db/schema/games.ts ---
echo "Updating: src/db/schema/games.ts (to use new custom types)"
cat << 'EOF' > src/db/schema/games.ts
import { pgTable, uuid, integer, boolean, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { gameCategoriesEnum, gameStatusEnum, jackpotTypeEnum } from './_enums'
import { goldsvetDataSchema, distinctPlayersSchema } from './_custom-types'

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
    
    // --- UPDATED COLUMN ---
    distinctPlayers: jsonb('distinct_players').$type<z.infer<typeof distinctPlayersSchema>>().default([]),
    
    startedAt: timestamp({ withTimezone: true, mode: 'date' }).defaultNow(),
    minBet: integer().default(100),
    maxBet: integer().default(100000),
    isFeatured: boolean().default(false),
    jackpotGroup: jackpotTypeEnum('jackpot_group').default('NONE'),
    
    // --- UPDATED COLUMN ---
    goldsvetData: jsonb('goldsvet_data').$type<z.infer<typeof goldsvetDataSchema>>(),
    
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (t) => [
    index('category_index').on(t.category),
    index('games_status_index').on(t.status)
  ]
)

// Types
export type Game = typeof gameTable.$inferSelect
export type NewGame = typeof gameTable.$inferInsert
EOF

# --- 3. Update db/schema/operators.ts ---
echo "Updating: src/db/schema/operators.ts (to use new custom types)"
cat << 'EOF' > src/db/schema/operators.ts
import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { productsSchema, gameSettingsSchema } from './_custom-types'

/**
 * operatorTable: The entity (e.g., "HOUSE" or a white-label) that owns users and games.
 */
export const operatorTable = pgTable('operators', {
  id: uuid().defaultRandom().primaryKey().notNull(),

  updatedBy: text().default('system').notNull(),
  version: integer().default(1_).notNull(),
  balance: integer().default(100000).notNull(),
  slotsBalance: integer().default(100000).notNull(),
  arcadeBalance: integer().default(100000).notNull(),
  currentFloat: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(),
  name: text().unique().notNull(),
  ownerId: text().default('system').notNull(),
  
  // --- UPDATED COLUMN ---
  products: jsonb('products').$type<z.infer<typeof productsSchema>>().default([]),
  
  // --- UPDATED COLUMN ---
  gameSettings: jsonb('game_settings').$type<z.infer<typeof gameSettingsSchema>>().default({'disabledGames': []}).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
})

// Types
export type Operator = typeof operatorTable.$inferSelect
export type NewOperator = typeof operatorTable.$inferInsert
EOF

# --- 4. Update db/schema/index.ts ---
echo "Updating: src/db/schema/index.ts (to export new types)"
cat << 'EOF' > src/db/schema/index.ts
// This file just re-exports all parts for our application.
// Drizzle Kit will no longer even read this file.

export * from './_enums'
export * from './_custom-types' // <-- NEW
export * from './operators'
export * from './users'
export * from './games'
export * from './wallets'
export * from './logs'
export * from './relations'
EOF

# --- 5. Update db/db.ts ---
echo "Updating: src/db/db.ts (to include new types in runtime schema)"
cat << 'EOF' > src/db/db.ts
import { drizzle } from 'drizzle-orm/bun-sql' // Use the bun-sql adapter
import { SQL } from 'bun' // Use bun:sql for runtime
// Import all the parts of our schema explicitly
import * as enums from '@/db/schema/_enums'
import * as customTypes from '@/db/schema/_custom-types' // <-- NEW
import * as operators from '@/db/schema/operators'
import * as users from '@/db/schema/users'
import * as games from '@/db/schema/games'
import * as wallets from '@/db/schema/wallets'
import * as logs from '@/db/schema/logs'
import * as relations from '@/db/schema/relations'

// Combine them into the schema object for the RUNTIME
const schema = {
  ...enums,
  ...customTypes, // <-- NEW
  ...operators,
  ...users,
  ...games,
  ...wallets,
  ...logs,
  ...relations
}
const connectionString = process.env.DATABASE_URL

/*
 * 1. Create the native bun:sql client
 * Removed '!' as the check above handles it
 */
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const client = new SQL(connectionString)
// 2. Pass the client and the *combined* schema object to Drizzle
export const db = drizzle({ client, schema, casing: 'snake_case' })
EOF

# --- 6. Update drizzle.config.ts ---
echo "Updating: drizzle.config.ts (to include new types file)"
cat << 'EOF' > drizzle.config.ts
import 'dotenv/config' // Load .env file
import type { Config } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

export default {
  schema: [
    './src/db/schema/_enums.ts',
    './src/db/schema/_custom-types.ts', // <-- NEW
    './src/db/schema/operators.ts',
    './src/db/schema/users.ts',
    './src/db/schema/games.ts',
    './src/db/schema/wallets.ts',
    './src/db/schema/logs.ts'
  ],
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL // Use the env variable
  }
} satisfies Config
EOF

echo "---"
echo "✅ JSONB Custom Types Refactor Complete!"
echo "---"
echo ""
echo "A new file 'db/schema/_custom-types.ts' has been created."
echo "'games.ts' and 'operators.ts' have been updated to use these types."
echo "Your config files have been updated to include the new file."
echo ""
echo "NEXT STEPS:"
echo "1. Run 'bun run db:push' (or db:generate + db:migrate) to apply these"
echo "   schema changes (Drizzle will alter the columns to use 'jsonb')."
echo ""