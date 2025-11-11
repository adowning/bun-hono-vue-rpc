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
