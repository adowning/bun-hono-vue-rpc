#!/bin/bash
set -e

echo "--- Starting Service Layer Refactor ---"

# --- 1. Create services directory ---
echo "Creating: src/services/..."
mkdir -p src/services

# --- 2. Create src/services/cache.service.ts ---
echo "Creating: src/services/cache.service.ts"
cat << 'EOF' > src/services/cache.service.ts
import { KV } from '@cross/kv'
import type { CurrentUser, User } from '@/db'

/**
 * Cross-KV based cache
 */
export class CrossKVCache<T = any> {
  private kv: any
  private namespace: string

  constructor(
    options: {
      namespace?: string
    } = {}
  ) {
    this.namespace = options.namespace || 'cache'
    this.kv = new KV()
    this.openDB()
  }
  
  private async openDB() {
    // TODO: Make this path configurable
    await this.kv.open('data/cache.db') 
  }

  private getKey(key: string | string[]): string[] {
    const keyArray = Array.isArray(key) ? key : [key]
    return [this.namespace, ...keyArray]
  }

  async get(key: string | string[]): Promise<T | null> {
    try {
      const result = await this.kv.get(this.getKey(key))
      return (result as T) || null
    } catch (error) {
      console.error('CrossKVCache get error:', error)
      return null
    }
  }

  async set(key: string | string[], value: T, ttl?: number): Promise<void> {
    // TODO: Implement TTL logic if @cross/kv doesn't support it natively
    try {
      await this.kv.set(this.getKey(key), value)
    } catch (error) {
      console.error('CrossKVCache set error:', error)
    }
  }

  async delete(key: string | string[]): Promise<boolean> {
    try {
      await this.kv.delete(this.getKey(key))
      return true
    } catch (error) {
      console.error('CrossKVCache delete error:', error)
      return false
    }
  }
}

// --- Singleton Cache Instances ---

// Cache for lean User objects, used by auth middleware
export const authCache = new CrossKVCache<User>({
  namespace: 'auth-user'
})

// Cache for "fat" CurrentUser objects, used by user service
export const userStateCache = new CrossKVCache<CurrentUser>({
  namespace: 'user-state'
})
EOF

# --- 3. Create src/services/auth.service.ts ---
echo "Creating: src/services/auth.service.ts"
cat << 'EOF' > src/services/auth.service.ts
import { supabase } from '@/core/supabase'
import { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'

// Extracted from auth.ts
abstract class AuthError extends Error {
  abstract statusCode: number
  abstract code: string
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
export class AuthenticationError extends AuthError {
  statusCode = 401
  code = 'AUTHENTICATION_FAILED'
  constructor(message: string) { super(message) }
}
export class SessionError extends AuthError {
  statusCode = 401
  code = 'SESSION_ERROR'
  constructor(message: string) { super(message) }
}

export interface AuthResult {
  authUser: SupabaseUser
  sessionId: string
  session: Session
}

class AuthService {
  private supabaseClient: SupabaseClient = supabase

  async authenticateSession(accessToken: string, refreshToken: string): Promise<AuthResult> {
    try {
      const { error: setSessionError } = await this.supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      if (setSessionError) {
        throw new AuthenticationError(`Failed to set session: ${setSessionError.message}`)
      }

      const { data: claims, error: claimsError } = await this.supabaseClient.auth.getClaims()
      if (claimsError || !claims) {
        throw new AuthenticationError('Invalid or missing claims')
      }

      const { data: userData, error: userError } = await this.supabaseClient.auth.getUser()
      if (userError || !userData.user) {
        throw new AuthenticationError('Failed to retrieve authenticated user')
      }

      const { data: sessionData, error: getSessionError } =
        await this.supabaseClient.auth.getSession()
      if (getSessionError || !sessionData.session) {
        throw new AuthenticationError('No active session found')
      }

      if (!this.isSessionValid(sessionData.session)) {
        throw new SessionError('Session has expired')
      }

      return {
        authUser: userData.user,
        sessionId: claims.claims.session_id,
        session: sessionData.session
      }
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthenticationError(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private isSessionValid(session: Session): boolean {
    if (!session) return false
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at
    return !expiresAt || expiresAt > now
  }
}

// Export singleton
export const authService = new AuthService()
EOF

# --- 4. Create src/services/balance.service.ts ---
echo "Creating: src/services/balance.service.ts"
cat << 'EOF' > src/services/balance.service.ts
import { db, eq, userBalanceTable, UserBalance } from '@/db'

class BalanceService {
  private db = db

  async getOrCreateUserBalance(userId: string): Promise<UserBalance> {
    try {
      const existingBalance = await this.db.query.userBalanceTable.findFirst({
         where: eq(userBalanceTable.userId, userId)
      })

      if (existingBalance) {
        return existingBalance
      }

      // Create default balance
      const [newBalance] = await this.db
        .insert(userBalanceTable)
        .values({
          id: crypto.randomUUID(),
          userId,
          // All other fields have defaults in the schema
        })
        .returning()

      if (!newBalance) {
        throw new Error('Failed to create user balance')
      }
      return newBalance
      
    } catch (error) {
      console.error('Balance operation failed:', error)
      throw new Error('Failed to get or create user balance')
    }
  }
}

// Export singleton
export const balanceService = new BalanceService()
EOF

# --- 5. Create src/services/session.service.ts ---
echo "Creating: src/services/session.service.ts"
cat << 'EOF' > src/services/session.service.ts
import { db, eq, and, gameSessionTable, GameSession } from '@/db'

class GameSessionService {
  private db = db

  async getActiveGameSession(userId: string): Promise<GameSession | null> {
    try {
      const activeSession = await this.db.query.gameSessionTable.findFirst({
        where: and(
          eq(gameSessionTable.userId, userId), 
          eq(gameSessionTable.status, 'ACTIVE')
        )
      })
      return activeSession || null
    } catch (error) {
      console.error('Failed to get active game session:', error)
      throw new Error('Failed to get active game session')
    }
  }
}

// Export singleton
export const gameSessionService = new GameSessionService()
EOF

# --- 6. Create src/services/user.service.ts ---
echo "Creating: src/services/user.service.ts (with new logic)"
cat << 'EOF' > src/services/user.service.ts
import { db, eq, userTable, User, CurrentUser } from '@/db'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { balanceService } from './balance.service'
import { sessionService } from './session.service'
import { userStateCache } from './cache.service'

interface UserRecord {
  user: User
  isNewUser: boolean
}

class UserService {
  private db = db

  /**
   * Finds our local user or creates one if it's their first time.
   */
  async findOrCreateUser(authUser: SupabaseUser): Promise<UserRecord> {
    try {
      const existingUser = await this.db.query.userTable.findFirst({
        where: eq(userTable.authId, authUser.id)
      })

      if (existingUser) {
        return { user: existingUser, isNewUser: false }
      }

      // Create new user
      const [newUser] = await this.db
        .insert(userTable)
        .values({
          id: authUser.id, // Use Supabase ID as our primary key
          authId: authUser.id,
          operatorId: authUser.user_metadata.operatorId, // Comes from Supabase metadata
          email: authUser.email!,
          displayName: authUser.user_metadata?.full_name || authUser.email || 'User',
          roles: authUser.user_metadata.roles || ['USER']
        })
        .returning()

      if (!newUser) {
        throw new Error('Failed to create user record')
      }

      // IMPORTANT: Create their balance sheet at the same time
      await balanceService.getOrCreateUserBalance(newUser.id)

      return { user: newUser, isNewUser: true }
    } catch (error) {
      console.error('User operation failed:', error)
      throw new Error('User operation failed')
    }
  }
  
  /**
   * Gets the full "CurrentUser" object for the client.
   * This is the "on-demand aggregator" we discussed.
   */
  async getFullUserById(
    userId: string,
    session: { id: string; expiresAt: Date | null; refreshToken: string | null }
  ): Promise<CurrentUser> {
    
    // 1. Check cache first
    const cachedUser = await userStateCache.get(userId)
    if (cachedUser) {
      return cachedUser
    }

    // 2. Cache miss: Fetch from DB (ONE query)
    const userWithRelations = await this.db.query.userTable.findFirst({
      where: eq(userTable.id, userId),
      with: {
        userBalance: true,
        activeBonuses: {
          where: eq(schema.activeBonusTable.status, 'ACTIVE')
        },
        // We only get the *active* session
        gameSessions: {
          where: eq(schema.gameSessionTable.status, 'ACTIVE'),
          limit: 1
        }
      }
    })

    if (!userWithRelations || !userWithRelations.userBalance) {
      throw new Error(`User or user balance not found for ID: ${userId}`)
    }

    // 3. Build the CurrentUser object
    const { userBalance, activeBonuses, gameSessions, ...user } = userWithRelations
    
    const currentUser: CurrentUser = {
      ...user,
      balance: userBalance,
      activeBonuses: activeBonuses || [],
      activeGameSession: gameSessions?.[0] || null,
      sessionId: session.id,
      sessionExpiresAt: session.expiresAt,
      sessionRefreshToken: session.refreshToken,
      lastUpdated: new Date()
    }

    // 4. Save to cache and return
    await userStateCache.set(userId, currentUser, 60) // Cache for 60 seconds
    return currentUser
  }
}

// Export singleton
export const userService = new UserService()
EOF

# --- 7. REWRITE src/middleware/auth.ts (Lean Middleware) ---
echo "REWRITING: src/middleware/auth.ts (to be lean)"
cat << 'EOF' > src/middleware/auth.ts
import 'dotenv/config'
import { createMiddleware } from 'hono/factory'
import { User } from '@/db'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { authCache } from '@/services/cache.service'
import { authService, AuthenticationError } from '@/services/auth.service'
import { userService } from '@/services/user.service'

/**
 * Define the new "lean" environment for Hono.
 * It only contains the authenticated Supabase user and our lean local User.
 */
export type AppEnv = {
  Variables: {
    user: User
    authUser: SupabaseUser
  }
}

export const authMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization')
      const refreshToken = c.req.header('X-State-Refresh')

      if (!authHeader || !authHeader.startsWith('Bearer ') || !refreshToken) {
        return c.json({ error: 'Unauthorized: Missing token headers' }, 401)
      }

      const accessToken = authHeader.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Invalid authorization header' }, 401)
      }

      // --- 1. Check Cache for LEAN User ---
      const cachedUser = await authCache.get(refreshToken)
      if (cachedUser) {
        c.set('user', cachedUser)
        // We still set authUser from a "fast" Supabase call
        const { data: { user: authUser } } = await supabase.auth.getUser(accessToken)
        if (authUser) c.set('authUser', authUser)
        await next()
        return
      }

      // --- 2. Cache Miss: Authenticate with Supabase ---
      const { authUser } = await authService.authenticateSession(
        accessToken,
        refreshToken
      )

      // --- 3. Find or Create LEAN Local User ---
      const { user: localUser } = await userService.findOrCreateUser(authUser)

      // --- 4. Set in Context and Cache ---
      c.set('user', localUser)
      c.set('authUser', authUser)
      await authCache.set(refreshToken, localUser, 3600) // Cache for 1 hour

      await next()
      
    } catch (error) {
      console.error('Authentication error:', error)
      if (error instanceof AuthenticationError) {
        return c.json({ error: error.message, code: error.code }, error.statusCode)
      }
      return c.json({ error: 'Authentication failed' }, 500)
    }
  })
EOF

# --- 8. Update src/routes/user.routes.ts ---
echo "Updating: src/routes/user.routes.ts"
cat << 'EOF' > src/routes/user.routes.ts
import { Hono } from 'hono'
import { AppEnv, authMiddleware } from '@/middleware/auth'
import { desc, eq, sql } from 'drizzle-orm'
import {
  db,
  betLogTable,
  depositLogTable,
  withdrawalLogTable,
  userTable,
  activeBonusTable,
  gameSessionTable
} from '@/db'
import { getPaginationParams } from '@/utils/pagination'
import { userService } from '@/services/user.service' // <-- Import new service
import { authService } from '@/services/auth.service' // <-- Import new service

export const userRoutes = new Hono<AppEnv>()

  /**
   * GET /api/users/me
   * This is now the "on-demand aggregator"
   */
  .get('/me', authMiddleware(), async (c) => {
    const user = c.get('user') // <-- Get the LEAN user
    const authUser = c.get('authUser')

    if (!user || !authUser) {
      return c.json({ error: 'No user found' }, 401)
    }

    try {
      // Get session details from Supabase authUser
      // This is a bit of a hack; ideally, authService.authenticateSession would return this
      const session = {
        id: authUser.id, // This isn't session_id, but it's what we have
        expiresAt: authUser.aud ? new Date(authUser.aud) : null,
        refreshToken: null // We don't have this here, middleware should pass it
      }
      
      // Use the new UserService to build the "fat" CurrentUser object
      const currentUser = await userService.getFullUserById(user.id, session)
      
      return c.json(currentUser)
    } catch (err: any) {
      console.error('Error building currentUser:', err.message)
      return c.json({ error: 'Failed to return user data', details: err.message }, 500)
    }
  })

  /**
   * GET /api/users/balance
   * This route now has to fetch the data itself.
   */
  .get('/balance', authMiddleware(), async (c) => {
    const user = c.get('user') // <-- Get LEAN user
    if (!user) {
      return c.json({ error: 'No current user found' }, 401)
    }
    
    try {
      // Use the new UserService to get the full user object
      // (This will be cached by the service itself)
      const authUser = c.get('authUser')
      const session = { id: authUser.id, expiresAt: null, refreshToken: null } // Dummy session
      const currentUser = await userService.getFullUserById(user.id, session)

      // Return balance information
      return c.json({
        realBalance: currentUser.balance.realBalance,
        bonusBalance: currentUser.activeBonuses.reduce((sum, b) => sum + b.currentBonusBalance, 0),
        totalBalance: currentUser.balance.realBalance + currentUser.activeBonuses.reduce((sum, b) => sum + b.currentBonusBalance, 0),
        freeSpinsRemaining: currentUser.balance.freeSpinsRemaining,
        wageringRequirements: {
          deposit: currentUser.balance.depositWageringRemaining,
          bonus: currentUser.activeBonuses.reduce((sum, b) => sum + b.currentWageringRemaining, 0),
        },
        lastUpdated: currentUser.balance.updatedAt
      })
    } catch (err: any) {
      console.error('Error returning balance data:', err.message)
      return c.json({ error: 'Failed to return balance data', details: err.message }, 500)
    }
  })

  /**
   * GET /api/users/active-game
   * Also must fetch on-demand.
   */
  .get('/active-game', authMiddleware(), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'No current user found' }, 401)
    }

    try {
      // This is faster, we can just call the session service directly
      const gameSession = await sessionService.getActiveGameSession(user.id)

      if (!gameSession) {
        return c.json({ hasActiveSession: false, message: 'No active game session' })
      }

      return c.json({
        hasActiveSession: true,
        session: gameSession
      })
    } catch (err: any) {
      console.error('Error returning active game data:', err.message)
      return c.json({ error: 'Failed to return active game data', details: err.message }, 500)
    }
  })

  /**
   * ADMIN-FACING ROUTES (Unchanged, but now use lean auth)
   */
  .get('/single/:id', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'User ID is required' }, 400)
    }
    
    // This query is great, keep it.
    const userDetail = await db.query.userTable.findFirst({
      where: eq(userTable.id, id),
      with: {
        userBalance: true,
        activeBonuses: {
          where: eq(activeBonusTable.status, 'ACTIVE'),
          orderBy: desc(activeBonusTable.createdAt)
        },
        gameSessions: {
          limit: 1,
          orderBy: desc(gameSessionTable.createdAt)
        }
      }
    })

    if (!userDetail) {
      return c.json({ error: 'User not found' }, 404)
    }
    return c.json(userDetail)
  })

  // ... (all other admin log routes remain the same, they already fetch on-demand) ...
  
  .get('/:id/bet-logs', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    const { params } = getPaginationParams(c)
    if (!params || !params.page || !params.perPage) {
      return c.json({ error: 'Pagination parameters are required' }, 400)
    }
    const logs = await db.query.betLogTable.findMany({
      where: eq(betLogTable.userId, id),
      limit: params.perPage,
      offset: (params.page - 1) * params.perPage,
      orderBy: desc(betLogTable.createdAt)
    })
    const total = await db.select({ count: sql`count(*)` }).from(betLogTable).where(eq(betLogTable.userId, id))
    return c.json({
      data: logs,
      pagination: { page: params.page, perPage: params.perPage, total: total[0]?.count ?? 0 }
    })
  })
  
  .get('/:id/deposit-logs', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    const { params } = getPaginationParams(c)
    if (!params || !params.page || !params.perPage) {
      return c.json({ error: 'Pagination parameters are required' }, 400)
    }
    const logs = await db.query.depositLogTable.findMany({
      where: eq(depositLogTable.userId, id),
      limit: params.perPage,
      offset: (params.page - 1) * params.perPage,
      orderBy: desc(depositLogTable.createdAt)
    })
    const total = await db.select({ count: sql`count(*)` }).from(depositLogTable).where(eq(depositLogTable.userId, id))
    return c.json({
      data: logs,
      pagination: { page: params.page, perPage: params.perPage, total: total[0]?.count ?? 0 }
    })
  })
  
  .get('/:id/withdrawal-logs', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    const { params } = getPaginationParams(c)
    if (!params || !params.page || !params.perPage) {
      return c.json({ error: 'Pagination parameters are required' }, 400)
    }
    const logs = await db.query.withdrawalLogTable.findMany({
      where: eq(withdrawalLogTable.userId, id),
      limit: params.perPage,
      offset: (params.page - 1) * params.perPage,
      orderBy: desc(withdrawalLogTable.requestedAt)
    })
    const total = await db.select({ count: sql`count(*)` }).from(withdrawalLogTable).where(eq(withdrawalLogTable.userId, id))
    return c.json({
      data: logs,
      pagination: { page: params.page, perPage: params.perPage, total: total[0]?.count ?? 0 }
    })
  })
  
  .get('/list', authMiddleware(), async (c) => {
    const { error, params: paginationParams } = getPaginationParams(c)
    if (error) return error
    if (!paginationParams || !paginationParams.page || !paginationParams.perPage)
      return c.json({ error: 'Must have paginated params' }, 401)

    const allUsers = await db.query.userTable.findMany({
      with: {
        operator: true,
        userBalance: true,
      },
      limit: paginationParams.perPage,
      offset: (paginationParams.page - 1) * paginationParams.perPage
    })
    
    const total = await db.select({ count: sql`count(*)` }).from(userTable)

    return c.json({
      data: allUsers,
      pagination: { page: paginationParams.page, perPage: paginationParams.perPage, total: total[0]?.count ?? 0 }
    })
  })
EOF

# --- 9. Update src/routes/game.routes.ts ---
echo "Updating: src/routes/game.routes.ts"
cat << 'EOF' > src/routes/game.routes.ts
import { db, gameTable, eq, and, operatorTable } from '@/db'
import { authMiddleware, AppEnv } from '@/middleware/auth' // <-- Import new AppEnv
import { PaginatedResponse } from '@/shared'
import { Hono } from 'hono'
import { createPaginatedQuery, getPaginationParams } from '@/utils/pagination'

const gameRoutes = new Hono<AppEnv>() // <-- Use new AppEnv
  
  .get('/', authMiddleware(), async (c) => {
    const user = c.get('user') // <-- Get LEAN user
    console.log('GET /api/games initiated by user:', user.id)

    try {
      if (!user) {
        return c.json({ error: 'User not authenticated' }, 401)
      }
      if (!user.operatorId) {
        return c.json({ error: 'User operatorId not found' }, 400)
      }

      // --- NEW LOGIC ---
      // 1. Fetch the operator's settings
      const operator = await db.query.operatorTable.findFirst({
        where: eq(operatorTable.id, user.operatorId),
        columns: { gameSettings: true }
      })
      
      const disabledGameIds = operator?.gameSettings?.disabledGames || []
      // --- END NEW LOGIC ---

      const { error, params: paginationParams } = getPaginationParams(c)
      if (error) return error
      if (!paginationParams) return new Error('no pagination params')
      
      const { category, page = 1, perPage = 10 } = paginationParams
      const offset = (page - 1) * perPage

      // Build where conditions
      const where = []
      if (category) {
        where.push(eq(gameTable.category, category as any))
      }
      // --- NEW LOGIC ---
      // Add the "disabled games" filter
      if (disabledGameIds.length > 0) {
        where.push(sql`${gameTable.id} NOT IN ${disabledGameIds}`)
      }
      // --- END NEW LOGIC ---
      
      const whereConditions = where.length > 0 ? and(...where) : undefined

      const dataFetcher = (limit: number, offset: number) => {
        return db.query.gameTable.findMany({
          columns: {
            id: true,
            name: true,
            isActive: true,
            title: true,
            developer: true,
            isFeatured: true,
            category: true,
            volatility: true,
            currentRtp: true,
            thumbnailUrl: true,
            totalBetAmount: true,
            totalWonAmount: true,
            targetRtp: true,
            createdAt: true,
            updatedAt: true
          },
          where: whereConditions,
          limit: limit,
          offset: offset
        })
      }

      const paginatedResult = await createPaginatedQuery(
        gameTable,
        dataFetcher,
        paginationParams,
        whereConditions
      )

      const response: PaginatedResponse<(typeof paginatedResult.data)[0]> = {
        data: paginatedResult.data,
        pagination: paginatedResult.pagination
      }

      return c.json(response)
    } catch (error) {
      console.error('Failed to fetch games:', error)
      return c.json({ error: 'Failed to fetch games' }, 500)
    }
  })

  .get('/:id', authMiddleware(), async (c) => {
    const user = c.get('user') // <-- Get LEAN user
    const gameId = c.req.param('id')

    try {
      if (!user) {
        return c.json({ error: 'Game not authenticated' }, 401)
      }

      const game = await db.query.gameTable.findFirst({
        where: eq(gameTable.id, gameId),
        columns: {
          id: true,
          name: true,
          title: true,
          developer: true,
          category: true,
          thumbnailUrl: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!game) {
        return c.json({ error: 'Game not found' }, 404)
      }

      return c.json({ data: game })
    } catch (error) {
      console.error('Failed to fetch game:', error)
      return c.json({ error: 'Failed to fetch game' }, 500)
    }
  })

export default gameRoutes
EOF

# --- 10. Clean up old files ---
echo "Cleaning up old middleware files..."
rm -f src/middleware/cross-kv-cache.ts
rm -f src/middleware/cross-kv-cache.ts.bak
rm -f src/middleware/auth.ts.bak

echo "---"
echo "✅ SERVICE LAYER REFACTOR COMPLETE!"
echo "---"
echo ""
echo "The 'auth.ts' middleware is now lean."
echo "All business logic has been moved to 'src/services/'."
echo "Routes 'user.routes.ts' and 'game.routes.ts' have been updated."
echo ""
echo "NEXT STEPS:"
echo "1. Run 'bun install' to make sure all dependencies are correct."
echo "2. Run 'bun run dev' to start the server."
echo "3. Test your application. The 'GET /api/users/me' endpoint is now the main"
echo "   source for the client's 'CurrentUser' object."
echo ""