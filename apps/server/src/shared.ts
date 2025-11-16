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
import { IWebSocketRouteHandler } from '@thanhhoajs/websocket'

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

export interface PhPGameData {
  user?: {
    id: string
    balance: number
    count_balance: number
    address: number
  }
  game: {
    id: string
    name: string
    denomination: number
    rtp?: number | { spinChance: number; bonusChance: number }
    stat_in?: number
    stat_out?: number
    bet?: string[]
    slotBonus?: boolean
    slotWildMpl?: number
    slotFreeMpl?: number
    increaseRTP?: number
  }
  shop: {
    percent: number
    max_win?: number
  }
  bank?: number
}

export interface ReelStrips {
  [key: string]: string[] // e.g., 'reelStrip1': ['0', '1', '2', ...], 'reelStripBonus1': ['0', '1', '2', ...]
}

export interface ReelStripCollection {
  reelStrip1: string[]
  reelStrip2: string[]
  reelStrip3: string[]
  reelStrip4: string[]
  reelStrip5: string[]
  reelStripBonus1?: string[]
  reelStripBonus2?: string[]
  reelStripBonus3?: string[]
  reelStripBonus4?: string[]
  reelStripBonus5?: string[]
  reelStripBonus6?: string[] // For games with 6 reels
}

interface CalculateSpinResult {
  totalWin: number
  reels?: {
    [key: string]: string[] // e.g., 'reel1': ['0', '1', '2'], 'reel2': ['3', '4', '5'], 'rp': number[]
  }
  reelsSymbols?: {
    [key: string]: string[] // Alternative naming in some calculators
  }
  winLines?: string[] // JSON-encoded win line objects
  lineWins?: any[] // Alternative naming
  bonusInfo?: any[]
  Jackpots?: any[]
  winString?: string // JSON-encoded win data
  gameState?: string // e.g., 'Ready', 'FreeSpins'
  scattersCount?: number
  symb?: string // 2D array as JSON string
}
export interface IThanhHoaWebSocketData {
  routeHandler: IWebSocketRouteHandler
  path: string
  query?: Record<string, string>
  params?: Record<string, string>
  headers: Headers
  custom?: Record<string, any>
  clientId: string
}
