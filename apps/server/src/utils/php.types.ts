import
{
  GamesSchema,
  JackpotsSchema,
  UserSchema,
} from "@/types";
import { z } from '@hono/zod-openapi';

/**
 * Schema for the raw client-side request data.
 * This validates the payload coming directly from the user's browser.
 */
export const PostDataSchema = z
  .object({
    slotEvent: z
      .enum(["bet", "freespin", "respin", "init", "paytable", "initfreespin"])
      .optional(),
    "bet.betlevel": z.number().int().positive().optional(),
    "bet.denomination": z.number().positive().optional(),
    // Catches other potential client-side parameters
  })
  .passthrough();

export type PostData = z.infer<typeof PostDataSchema>;

/**
 * Schema for the `user` object within the game state sent to PHP.
 * Based on `BaseSlotSettings.php`.
 */
export const PhpUserSchema = UserSchema.pick({
  id: true,
  phpId: true,
}).extend({
  shop_id: z.number().int().optional(),
  count_balance: z.number().optional(),
  balance: z.number().optional(),
  address: z.number().default(0),
  status: z.string().default(""),
  is_blocked: z.number().default(0),
  name: z.string(),
  shop: z.object({ currency: z.string().default("USD") }),
});

/**
 * Schema for the `game` object within the game state sent to PHP.
 * Reflects properties from `BaseSlotSettings` and game-specific settings.
 */
export const PhpGameSchema = GamesSchema.pick({
  name: true,
  id: true,
})
  .extend({
    denominations: z.union([z.array(z.number()), z.string()]).optional(),
    denomination: z.number().optional(),
    lines_values: z
      .union([z.array(z.array(z.number().int())), z.string()])
      .optional(),
    bet_values: z.union([z.array(z.number()), z.string()]).optional(),
    rezerv: z.number().optional(), // Corresponds to 'WinGamble' in PHP
    get_gamebank: z.number().optional(),
    // Allows passing through all other `goldsvetData` properties
  })
  .passthrough();

/**
 * Schema for the `shop` object within the game state sent to PHP.
 */
export const PhpShopSchema = z.object({
  id: z.string(),
  percent: z.number().optional(),
  balance: z.number(),
  max_win: z.number().optional(),
  currency: z.string().optional(),
  is_blocked: z.number().default(0),
  name: z.string(),
  lines_percent_config_spin: z.string(),
  lines_percent_config_bonus: z.string(),
  lines_percent_config_spin_bonus: z.string(),
  lines_percent_config_bonus_bonus: z.string(),
});

/**
 * Schema for the main `gameState` object, which contains all the server-side
 * information the PHP engine needs to process a request.
 */
export const GameStateSchema = z.object({
  playerId: z.string().nullable(),
  balance: z.number(),
  bank: z.number(),
  gameData: z.record(z.any()), // The persistent session state for the game
  gameDataStatic: z.record(z.any()).optional(),
  user: PhpUserSchema.partial(),
  shop: PhpShopSchema.partial(),
  game: PhpGameSchema.partial(),
  jpgs: z.array(JackpotsSchema.partial()).optional(),
  currency: z.string().optional(),
  desiredWinType: z.enum(["win", "bonus", "none"]),
});

export type GameState = z.infer<typeof GameStateSchema>;

/**
 * Schema for the top-level payload sent to the PHP server.
 * This structure is based on the newer `wings_server.php` handle method.
 */
export const TopLevelPayloadSchema = z.object({
  action: z.string(),
  postData: PostDataSchema,
  user: PhpUserSchema.partial(),
  shop: PhpShopSchema.partial(),
  game: PhpGameSchema.partial(),
  jpgs: z.array(JackpotsSchema.partial()).optional(),
});

export type TopLevelPayload = z.infer<typeof TopLevelPayloadSchema>;

/**
 * Schema for the JSON response from the PHP game engine.
 * Updated to match the detailed response from the new `Server.php` files.
 */
export const PhpApiResponseSchema = z
  .object({
    newBalance: z.number(),
    newBalanceCents: z.number().optional(),
    newBank: z.number().optional(),
    totalWin: z.number(),
    totalWinCents: z.number().optional(),
    reels: z.record(z.array(z.any())).optional(), // Reels can be complex
    newGameData: z.record(z.any()),
    winLines: z.array(z.any()),
    bonusWin: z.number().optional(),
    totalFreeGames: z.number().int().optional(),
    currentFreeGames: z.number().int().optional(),
    freeSpinState: z
      .object({
        totalFreeSpins: z.number().int().optional(),
        remainingFreeSpins: z.number().int().optional(),
        currentMultiplier: z.number().optional(),
        currentWinCoins: z.number().optional(),
        currentWinCents: z.number().optional(),
        monsterHealth: z.number().int().optional(),
        freeLevel: z.number().int().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    isRespin: z.boolean().optional(),
    stringResponse: z.string().optional(), // For legacy or init responses
  })
  .passthrough(); // Allow other fields from PHP

export type PhpApiResponse = z.infer<typeof PhpApiResponseSchema>;

/**
 * Schema for the final spin response sent back to the game client.
 */
export const SpinResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    winAmount: z.number(),
    balance: z.number(),
    reels: z.record(z.array(z.any())).optional(),
    winLines: z.array(z.any()),
    isBonus: z.boolean(),
    freeSpinState: z.any().optional(),
    isRespin: z.boolean().optional(),
  }),
});
export type SpinResponse = z.infer<typeof SpinResponseSchema>;
