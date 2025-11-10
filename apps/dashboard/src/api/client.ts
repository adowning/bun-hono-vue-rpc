// type GetMeReturnType = AsyncReturnType<typeof getMe>
import { hc } from 'hono/client'
// import type {
//   AppType, Game,
//   PaginationParams,
//   TGetAllUsersType,
//   TransactionType,
//   // TGetTransactionsParams
// } from '../../../../shared/types'
import type {
  AppType,
  // PaginationParams,
  CurrentUser,
  Game,
  TGetAllUsersType,
  PaginatedResponse, // Assuming a generic paginated type
  BetLog, // You'll need to export BetLog from shared.ts
  PaginationParams
} from 'server/shared'

export { constants } from 'server/shared'
type GetMeDataType = Awaited<ReturnType<typeof getMe>> // This gives us Api.Auth.UserInfo
type GetAllUsersDataType = Awaited<ReturnType<typeof getAllUsersWithBalance>> // This gives us
// Api.Auth.UserInfo
type GetAllGamesDataType = Awaited<ReturnType<typeof getAllGames>> // This gives us Api.Auth.UserInfo
// export {constants} from 'server/shared'
// Helper function to get Supabase auth token
export const getSupabaseAuthHeaders = () => {
  const _token = localStorage.getItem('sb-crqbazcsrncvbnapuxcp-auth-token')
  let token

  if (_token) token = JSON.parse(_token)
  const access_token = token?.access_token
  const refresh_token = token?.refresh_token
  return access_token
    ? {
        Authorization: `Bearer ${access_token}`,
        'X-State-Refresh': `${refresh_token}`
      }
    : { Authorization: `Bearer ` }
}

export type { GetMeDataType }

export const client = hc<AppType>('http://localhost:3006/api')

export const getUserDetails = async (id: string): Promise<any> => {
  // Using 'any' for now, but you should use a Zod schema or type
  const authHeaders = getSupabaseAuthHeaders()
  const res = await client.api.users.single[':id'].$get(
    { param: { id } }, // <-- Pass 'id' as a 'param' object
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  return data
}
export const getPlayerBetLogs = async (id: string, params: PaginationParams) => {
  const authHeaders = getSupabaseAuthHeaders()
  const res = await client.api.users[':id']['bet-logs'].$get(
    {
      param: { id },
      query: {
        page: String(params.page),
        perPage: String(params.perPage)
      }
    },
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch bet logs')
  }

  // This type should match the response from your new endpoint
  return (await res.json()) as PaginatedResponse<BetLog>
}
export const getMe = async (): Promise<CurrentUser> => {
  const authHeaders = getSupabaseAuthHeaders()

  const res = await client.api.users.me.$get(
    {},
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch user') // Changed from 'course'
    // return null
  }

  const data = await res.json()
  return data
}
export type { GetAllUsersDataType }

export const getAllUsersWithBalance = async (
  { query, page, perPage }: TGetAllUsersType // Removed: Promise<UserWithBalance[]>
) => {
  const authHeaders = getSupabaseAuthHeaders()

  const res = await client.api.users.list.$get(
    {
      query: {
        query,
        page: String(page),
        perPage: String(perPage)
      }
    },
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch users') // Changed from 'courses'
  }

  const users = await res.json()
  // FIX: No `as unknown` needed! The type is inferred.
  // The return type of this function will be PaginatedResponse<UserWithBalance>
  return users
}

export type { GetAllGamesDataType }

export const getAllGames = async ({ query, page, perPage, category }: any): Promise<Game[]> => {
  const authHeaders = getSupabaseAuthHeaders()
  const res = await client.api.games.$get(
    {
      query: {
        query,
        page: String(page),
        perPage: String(perPage),
        category
      }
    },
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch games')
  }

  const games = (await res.json()) as { data: Game[] }
  return games.data
}

// /**
//  * Fetches a paginated list of transactions.
//  * The Hono client ensures the `query` param is type-safe.
//  */
// export const getTransactions = async (params: PaginationParams) => {
//   const authHeaders = getSupabaseAuthHeaders()

//   // Transform PaginationParams to match Hono client expectations
//   // Only use fields that exist in PaginationParams interface
//   const queryParams: any = {}
//   if (params.page !== undefined) queryParams.page = String(params.page)
//   if (params.perPage !== undefined) queryParams.perPage = String(params.perPage)

//   const res = await client.api.transactions.$get(
//     { query: queryParams },
//     { headers: authHeaders }
//   )

//   if (!res.ok) {
//     throw new Error('Failed to fetch transactions')
//   }
//   // The return type is fully inferred from AppType!
//   // It will be: PaginatedResponse<TransactionLog>
//   return await res.json()
// }
