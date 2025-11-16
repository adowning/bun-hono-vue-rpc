import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { productsSchema, gameSettingsSchema } from './_custom-types'
import z from 'zod'

const products = [
  {
    title: 'Package One',
    productType: 'DEPOSIT_PACKAGE',
    bonusTotalInCredits: 0,
    discountInCents: 100,
    bestValue: 0,
    amountToReceiveInCredits: 500,
    totalDiscountInCents: 300,
    bonusSpins: 1,
    isPromo: false,
    description: 'blah blah ',
    url: 'https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png',
    priceInCents: 200
  },
  {
    title: 'Package Two',
    productType: 'DEPOSIT_PACKAGE',
    bonusTotalInCredits: 0,
    amountToReceiveInCredits: 1000,
    discountInCents: 100,
    bestValue: 0,
    totalDiscountInCents: 500,
    bonusSpins: 2,
    isPromo: false,
    description: 'blah blah ',
    url: 'https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png',
    priceInCents: 500
  },
  {
    title: 'Package Three',
    productType: 'DEPOSIT_PACKAGE',
    amountToReceiveInCredits: 1500,
    bonusTotalInCredits: 0,
    bestValue: 0,
    totalDiscountInCents: 500,
    discountInCents: 100,
    bonusSpins: 3,
    isPromo: false,
    description: 'blah blah ',
    url: 'https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png',
    priceInCents: 1000
  },
  {
    title: 'Package Four',
    productType: 'DEPOSIT_PACKAGE',
    bestValue: 0,
    amountToReceiveInCredits: 2000,
    bonusTotalInCredits: 0,
    discountInCents: 100,
    totalDiscountInCents: 500,
    bonusSpins: 5,
    isPromo: false,
    description: 'blah blah ',
    url: 'https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png',
    priceInCents: 1500
  }
]
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

  // --- UPDATED COLUMN ---
  products: jsonb('products').$type<z.infer<typeof productsSchema>>().default(products),

  // --- UPDATED COLUMN ---
  gameSettings: jsonb('game_settings')
    .$type<z.infer<typeof gameSettingsSchema>>()
    .default({ disabledGames: [] })
    .notNull(),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
})

// Types
export type Operator = typeof operatorTable.$inferSelect
export type NewOperator = typeof operatorTable.$inferInsert
