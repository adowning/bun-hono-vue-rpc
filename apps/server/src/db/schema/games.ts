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
