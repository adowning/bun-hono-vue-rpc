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
