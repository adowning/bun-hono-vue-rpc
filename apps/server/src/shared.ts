import { z } from 'zod'
import type { RedisClient } from 'bun'
import { SupabaseClient, type User as AuthUser } from '@supabase/supabase-js'
import { CurrentUser as _CurrentUser } from './db'
export type { CurrentUser, Game, BetLog, DepositLog, WithdrawalLog } from './db'
import { hc } from 'hono/client'
export * as constants from './core/constants'
export type { AppType } from './app'
export interface AppBindings {
  // Variables: {
  user: _CurrentUser
  authUser: AuthUser
  sessionCache: RedisClient
  gameSessionCache: RedisClient
  supabase: SupabaseClient
  // };
}
/**
 * Zod schema for validating the response of the GET user route.
 * Validates essential user fields: id (UUID), name, email (email format), createdAt, updatedAt.
 * Includes optional fields for completeness.
 */
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

// export type TransactionType = z.infer<typeof TransactionLogSelectSchema>;

// Pagination interfaces and types
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
