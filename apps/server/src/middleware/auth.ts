import { createMiddleware } from 'hono/factory'
// import { createClient } from "@supabase/supabase-js";
import { db } from '@/db'
import {
  userTable,
  userBalanceTable,
  gameSessionTable,
  type User,
  type UserBalance,
  type GameSession as GameSessionType
  // Direct imports to resolve type issues
} from '@/db'

import { eq, and, sql } from 'drizzle-orm'
import type { CurrentUser } from '@/db'
import 'dotenv/config'
import { supabase } from '@/core/supabase'
import { Session, SupabaseClient } from '@supabase/supabase-js'
let { SUPABASE_URL, SUPABASE_SERVICE_KEY } = Bun.env
if (!SUPABASE_URL) SUPABASE_URL = 'https://crqbazcsrncvbnapuxcp.supabase.co'
if (!SUPABASE_SERVICE_KEY)
  SUPABASE_SERVICE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8'
const SUPABASE_PUBLISHABLE_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8`
// Initialize Supabase admin client (uses service key)
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// if (!supabaseUrl || !supabaseServiceKey) {
//   throw new Error("Supabase URL or Service Key is not defined in .env");
// }

// const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// This is the enhanced Environment definition for our app
export type AppEnv = {
  Variables: {
    currentUser: import('@/db').CurrentUser // The comprehensive currentUser object
    authUser: any // This is the Supabase Auth User object
    supabase: SupabaseClient
  }
}

/**
 * Builds a comprehensive currentUser object from multiple data sources
 */
async function buildCurrentUser(session: Session, sessionId: string): Promise<CurrentUser> {
  const authUser = session.user
  if (!authUser?.id) {
    throw new Error('Invalid auth user: missing ID')
  }

  try {
    // 1. Find or create local DB user
    const [dbUser] = (await db
      .select()
      .from(userTable)
      .where((eq as any)(userTable.authId, authUser.id))
      .limit(1)) as [User | undefined]

    let userRecord = dbUser

    // If user doesn't exist in local DB, create them
    if (!userRecord) {
      const [newUser] = await db
        .insert(userTable)
        .values({
          id: authUser.id,
          operatorId: authUser.user_metadata.operatorId,
          authId: authUser.id,
          email: authUser.email!,
          displayName: authUser.user_metadata?.full_name || authUser.email
        })
        .returning()
      userRecord = newUser
    }

    // 2. Get or create user balance
    const [balance] = (await db
      .select()
      .from(userBalanceTable)
      .where((eq as any)(userBalanceTable.userId, userRecord.authId))
      .limit(1)) as [UserBalance | undefined]

    let balanceRecord = balance

    // If balance doesn't exist, create a default one
    if (!balanceRecord) {
      const [newBalance] = (await db
        .insert(userBalanceTable)
        .values({
          id: crypto.randomUUID(),
          userId: userRecord.authId,
          realBalance: 0,
          bonusBalance: 0,
          freeSpinsRemaining: 0,
          depositWageringRemaining: 0,
          bonusWageringRemaining: 0,
          totalDepositedReal: 0,
          totalDepositedBonus: 0,
          totalWithdrawn: 0,
          totalWagered: 0,
          totalWon: 0,
          totalBonusGranted: 0,
          totalFreeSpinWins: 0
        } as any)
        .returning()) as [UserBalance]
      balanceRecord = newBalance
    }

    // 3. Find active game session (if any)
    const [activeSession] = (await db
      .select()
      .from(gameSessionTable)
      .where(
        and(
          (eq as any)(gameSessionTable.userId, userRecord.authId),
          (eq as any)(gameSessionTable.status, 'ACTIVE')
        )
      )
      .limit(1)) as [GameSessionType | undefined]
    //console.log(authUser)
    // 4. Extract session information from auth user
    // const sessionId = sessionId || authUser.id;
    const sessionExpiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null
    const sessionRefreshToken = session?.refresh_token || null

    // 5. Find operator (if any)
    // const [operator] = await db
    //   .select()
    //   .from(operatorTable)
    //   .where(eq(operatorTable.id, authUser.user_metadata.operatorId))
    //   .limit(1) as [any];

    // 6. Build the comprehensive currentUser object
    const currentUser: CurrentUser = {
      user: {
        id: userRecord.id,
        status: 'ONLINE',
        roles: authUser.user_metadata.roles || ['USER'],
        authId: userRecord.authId,
        email: userRecord.email,
        avatar: authUser.user_metadata.avatar || 'avatar-6.webp',
        operatorId: authUser.user_metadata.operatorId,
        operatorIdNew: authUser.user_metadata.operatorId,
        displayName: userRecord.displayName,
        createdAt: userRecord.createdAt
      },
      activeBonuses: [],
      sessionId,
      sessionExpiresAt,
      sessionRefreshToken,
      operatorId: authUser.user_metadata.operatorId,
      balance: balanceRecord,
      // balance: {
      //   id: balanceRecord.id,
      //   userId: balanceRecord.userId,
      //   realBalance: balanceRecord.realBalance,
      //   bonusBalance: balanceRecord.bonusBalance,
      //   freeSpinsRemaining: balanceRecord.freeSpinsRemaining,
      //   depositWageringRemaining: balanceRecord.depositWageringRemaining,
      //   bonusWageringRemaining: balanceRecord.bonusWageringRemaining,
      //   totalDepositedReal: balanceRecord.totalDepositedReal,
      //   totalDepositedBonus: balanceRecord.totalDepositedBonus,
      //   totalWithdrawn: balanceRecord.totalWithdrawn,
      //   totalWagered: balanceRecord.totalWagered,
      //   totalWon: balanceRecord.totalWon,
      //   totalBonusGranted: balanceRecord.totalBonusGranted,
      //   totalFreeSpinWins: balanceRecord.totalFreeSpinWins,
      //   createdAt: balanceRecord.createdAt || new Date(),
      //   updatedAt: balanceRecord.updatedAt || new Date()
      // },
      activeGameSession: activeSession
        ? {
            ...activeSession,
            // status: activeSession.status as "ACTIVE" | "COMPLETED" | "EXPIRED" | "ABANDONED" | "TIMEOUT" | "OTP_PENDING" | "SHUTDOWN",
            totalWagered: activeSession.totalWagered || 0,
            totalWon: activeSession.totalWon || 0,
            totalBets: activeSession.totalBets || 0,
            gameSessionRtp: activeSession.gameSessionRtp || 0,
            // playerStartingBalance: activeSession.playerStartingBalance,
            // playerEndingBalance: activeSession.playerEndingBalance,
            duration: activeSession.duration || 0,
            createdAt: activeSession.createdAt || new Date(),
            updatedAt: activeSession.updatedAt || new Date()
          }
        : null,
      // ? {
      //   id: operator.id,
      //   name: operator.name,
      //   ownerId: operator.ownerId,
      //   isActive: operator.isActive,
      //   createdAt: operator.createdAt,
      //   updatedAt: operator.updatedAt
      // } : null,
      lastUpdated: new Date()
    }

    return currentUser
  } catch (error) {
    console.error('Error building currentUser:', error)
    throw new Error(
      `Failed to build currentUser: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validates that the session is still active and not expired
 */
function isSessionValid(session: any): boolean {
  if (!session) return false

  const now = Math.floor(Date.now() / 1000)
  const expiresAt = session.expires_at

  // If no expiration time, consider valid
  if (!expiresAt) return true

  // Check if session is expired
  return expiresAt > now
}

export const authMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const authHeader = c.req.header('Authorization')
    const refreshHeader = c.req.header('X-State-Refresh')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: No token headers' }, 401)
    }
    const token = authHeader.split(' ')[1]
    try {
      if (!token || !refreshHeader) {
        return c.json({ error: 'Unauthorized: No token provided' }, 401)
      }
      // 1. Verify the token with Supabase
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshHeader as string
      })
      const { data: claims, error: cerror } = await supabase.auth.getClaims()
      if (claims == null) {
        return c.json({ error: 'Bad claims data' }, 401)
      }
      // console.log(JSON.parse(JSON.stringify(claims?.claims)))
      c.set('supabase', supabase as SupabaseClient)
      const { data: user, error } = await supabase.auth.getUser()
      const { data: session, error: serror } = await supabase.auth.getSession()

      if (session.session == null) return c.json({ error: 'Unauthorized: No user found' }, 401)

      if (error || serror) {
        console.error('Supabase auth error:', error)
        return c.json({ error: 'Unauthorized: Invalid token' }, 401)
      }

      const authUser = user.user
      if (!authUser) {
        return c.json({ error: 'Unauthorized: No user found' }, 401)
      }

      // 2. Validate session
      if (!isSessionValid(session)) {
        return c.json({ error: 'Unauthorized: Session expired' }, 401)
      }

      // Set the raw auth user in context (for potential debugging)
      c.set('authUser', authUser)

      // 3. Build comprehensive currentUser object
      const currentUser = await buildCurrentUser(session.session, claims.claims.session_id)

      // Set the currentUser in context
      c.set('currentUser', currentUser)

      await next()
    } catch (err: any) {
      console.error('Authentication error:', err.message)
      return c.json(
        {
          error: 'Authentication failed',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        },
        500
      )
    }
  })

/**
 * Helper function to refresh the currentUser object with latest data
 * This can be used when balance changes or game session status updates
 */
export async function refreshCurrentUser(currentUser: CurrentUser): Promise<CurrentUser> {
  try {
    // Get fresh balance data
    const [balance] = (await (db as any)
      .select()
      .from(userBalanceTable)
      .where((eq as any)(userBalanceTable.userId, currentUser.user.authId))
      .limit(1)) as [UserBalance | undefined]

    if (!balance) {
      throw new Error('User balance not found during refresh')
    }

    // Check for active game session
    const [activeSession] = (await (db as any)
      .select()
      .from(gameSessionTable)
      .where(
        and(
          (eq as any)(gameSessionTable.userId, currentUser.user.authId),
          (eq as any)(gameSessionTable.status, 'ACTIVE')
        )
      )
      .limit(1)) as [GameSessionType | undefined]

    // Return updated currentUser with fresh data
    return {
      ...currentUser,
      balance: {
        id: balance.id,
        userId: balance.userId,
        realBalance: balance.realBalance,
        bonusBalance: balance.bonusBalance,
        freeSpinsRemaining: balance.freeSpinsRemaining,
        depositWageringRemaining: balance.depositWageringRemaining,
        bonusWageringRemaining: balance.bonusWageringRemaining,
        totalDepositedReal: balance.totalDepositedReal,
        totalDepositedBonus: balance.totalDepositedBonus,
        totalWithdrawn: balance.totalWithdrawn,
        totalWagered: balance.totalWagered,
        totalWon: balance.totalWon,
        totalBonusGranted: balance.totalBonusGranted,
        totalFreeSpinWins: balance.totalFreeSpinWins,
        createdAt: balance.createdAt || new Date(),
        updatedAt: balance.updatedAt || new Date()
      },
      activeGameSession: activeSession
        ? {
            id: activeSession.id,
            isBot: activeSession.isBot,
            authSessionId: activeSession.authSessionId,
            userId: activeSession.userId,
            gameId: activeSession.gameId,
            gameName: activeSession.gameName,
            status: activeSession.status as
              | 'ACTIVE'
              | 'COMPLETED'
              | 'EXPIRED'
              | 'ABANDONED'
              | 'TIMEOUT'
              | 'OTP_PENDING'
              | 'SHUTDOWN',
            totalWagered: activeSession.totalWagered || 0,
            totalWon: activeSession.totalWon || 0,
            totalBets: activeSession.totalBets || 0,
            gameSessionRtp: activeSession.gameSessionRtp || 0,
            playerStartingBalance: activeSession.playerStartingBalance,
            playerEndingBalance: activeSession.playerEndingBalance,
            duration: activeSession.duration || 0,
            createdAt: activeSession.createdAt || new Date(),
            updatedAt: activeSession.updatedAt || new Date()
          }
        : null,
      operatorId: currentUser.operatorId, // Keep the existing operator
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error refreshing currentUser:', error)
    throw new Error(
      `Failed to refresh currentUser: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
