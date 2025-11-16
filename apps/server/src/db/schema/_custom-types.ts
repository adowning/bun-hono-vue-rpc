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
