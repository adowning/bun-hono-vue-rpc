import 'dotenv/config' // Load .env file at the top
import { createMiddleware } from 'hono/factory'
import { CurrentUser, db, User, UserBalance, GameSession, eq, and, sql } from '@/db'
import { userTable, userBalanceTable, gameSessionTable, activeBonusTable } from '@/db'
import { supabase } from '@/core/supabase'
import { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'
import { authKeyv } from './cross-kv-cache'

// ===== CONFIGURATION MANAGEMENT =====
interface SupabaseConfig {
  url: string
  serviceKey: string
  publishableKey: string
}

interface AuthConfig {
  supabase: SupabaseConfig
  cache: {
    ttl: number
    namespace: string
  }
}

class Configuration {
  private static instance: Configuration
  private config: AuthConfig

  private constructor() {
    this.config = this.loadConfig()
  }

  static getInstance(): Configuration {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration()
    }
    return Configuration.instance
  }

  private loadConfig(): AuthConfig {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
      throw new Error(
        'Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY'
      )
    }

    return {
      supabase: {
        url: supabaseUrl,
        serviceKey,
        publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || serviceKey
      },
      cache: {
        ttl: parseInt(process.env.AUTH_CACHE_TTL || '3600000', 10), // 1 hour default
        namespace: process.env.AUTH_CACHE_NAMESPACE || 'auth'
      }
    }
  }

  getConfig(): AuthConfig {
    return this.config
  }

  getSupabaseConfig(): SupabaseConfig {
    return this.config.supabase
  }
}

// ===== CUSTOM ERROR TYPES =====
abstract class AuthError extends Error {
  abstract statusCode: number
  abstract code: string

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

class AuthenticationError extends AuthError {
  statusCode = 401
  code = 'AUTHENTICATION_FAILED'

  constructor(message: string) {
    super(message)
  }
}

class UserNotFoundError extends AuthError {
  statusCode = 404
  code = 'USER_NOT_FOUND'

  constructor(userId: string) {
    super(`User not found: ${userId}`)
  }
}

class BalanceError extends AuthError {
  statusCode = 500
  code = 'BALANCE_ERROR'

  constructor(message: string) {
    super(`Balance operation failed: ${message}`)
  }
}

class SessionError extends AuthError {
  statusCode = 401
  code = 'SESSION_ERROR'

  constructor(message: string) {
    super(`Session validation failed: ${message}`)
  }
}

class CacheError extends AuthError {
  statusCode = 500
  code = 'CACHE_ERROR'

  constructor(message: string) {
    super(`Cache operation failed: ${message}`)
  }
}

// ===== SERVICE CLASSES =====

interface AuthResult {
  authenticatedClient: SupabaseClient
  authUser: SupabaseUser
  sessionId: string
  session: Session
}

interface UserRecord {
  user: User
  isNewUser: boolean
}

class AuthService {
  private supabaseClient: SupabaseClient
  private config: SupabaseConfig

  constructor() {
    this.config = Configuration.getInstance().getSupabaseConfig()
    this.supabaseClient = supabase
  }

  async authenticateSession(accessToken: string, refreshToken: string): Promise<AuthResult> {
    try {
      // Set session in Supabase
      const { error: setSessionError } = await this.supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (setSessionError) {
        throw new AuthenticationError(`Failed to set session: ${setSessionError.message}`)
      }

      // Get user claims
      const { data: claims, error: claimsError } = await this.supabaseClient.auth.getClaims()
      if (claimsError || !claims) {
        throw new AuthenticationError('Invalid or missing claims')
      }

      // Get authenticated user
      const { data: userData, error: userError } = await this.supabaseClient.auth.getUser()
      if (userError || !userData.user) {
        throw new AuthenticationError('Failed to retrieve authenticated user')
      }

      // Get session
      const { data: sessionData, error: getSessionError } =
        await this.supabaseClient.auth.getSession()
      if (getSessionError || !sessionData.session) {
        throw new AuthenticationError('No active session found')
      }

      // Validate session
      if (!this.isSessionValid(sessionData.session)) {
        throw new SessionError('Session has expired')
      }

      return {
        authenticatedClient: this.supabaseClient,
        authUser: userData.user,
        sessionId: claims.claims.session_id,
        session: sessionData.session
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
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

class UserService {
  private db = db

  async findOrCreateUser(authUser: SupabaseUser): Promise<UserRecord> {
    try {
      // Try to find existing user
      const [existingUser] = await this.db
        .select()
        .from(userTable)
        .where(eq(userTable.authId, authUser.id))
        .limit(1)

      if (existingUser) {
        return {
          user: existingUser,
          isNewUser: false
        }
      }

      // Create new user
      const [newUser] = await this.db
        .insert(userTable)
        .values({
          id: authUser.id,
          authId: authUser.id,
          operatorId: authUser.user_metadata.operatorId || '00000000-0000-0000-0000-000000000000',
          email: authUser.email!,
          displayName: authUser.user_metadata?.full_name || authUser.email || 'User',
          roles: authUser.user_metadata.roles || ['USER']
        })
        .returning()

      if (!newUser) {
        throw new Error('Failed to create user record')
      }

      return {
        user: newUser,
        isNewUser: true
      }
    } catch (error) {
      throw new Error(
        `User operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getActiveBonuses(userId: string) {
    try {
      const bonuses = await db
        .select()
        .from(activeBonusTable)
        .where(eq(activeBonusTable.userId, userId))
        .orderBy(sql`${activeBonusTable.priority}`)

      return bonuses
    } catch (error) {
      throw new Error(
        `Failed to get active bonuses: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

class BalanceService {
  private db = db

  async getOrCreateUserBalance(userId: string): Promise<UserBalance> {
    try {
      // Try to find existing balance
      const [existingBalance] = await this.db
        .select()
        .from(userBalanceTable)
        .where(eq(userBalanceTable.userId, userId))
        .limit(1)

      if (existingBalance) {
        return existingBalance
      }

      // Create default balance
      const [newBalance] = await this.db
        .insert(userBalanceTable)
        .values({
          id: crypto.randomUUID(),
          userId,
          realBalance: 0,
          freeSpinsRemaining: 0,
          depositWageringRemaining: 0,
          totalDepositedReal: 0,
          totalWithdrawn: 0,
          totalWagered: 0,
          totalWon: 0,
          totalBonusGranted: 0,
          totalFreeSpinWins: 0
        })
        .returning()

      if (!newBalance) {
        throw new BalanceError('Failed to create user balance')
      }

      return newBalance
    } catch (error) {
      if (error instanceof BalanceError) {
        throw error
      }
      throw new BalanceError(
        `Balance operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getUserBalance(userId: string): Promise<UserBalance> {
    try {
      const [balance] = await this.db
        .select()
        .from(userBalanceTable)
        .where(eq(userBalanceTable.userId, userId))
        .limit(1)

      if (!balance) {
        throw new BalanceError(`Balance not found for user: ${userId}`)
      }

      return balance
    } catch (error) {
      if (error instanceof BalanceError) {
        throw error
      }
      throw new BalanceError(
        `Failed to retrieve user balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

class GameSessionService {
  private db = db

  async getActiveGameSession(userId: string): Promise<GameSession | null> {
    try {
      const [activeSession] = await this.db
        .select()
        .from(gameSessionTable)
        .where(and(eq(gameSessionTable.userId, userId), eq(gameSessionTable.status, 'ACTIVE')))
        .limit(1)

      return activeSession || null
    } catch (error) {
      throw new Error(
        `Failed to get active game session: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

class CacheService {
  private cache: typeof authKeyv
  private config: AuthConfig

  constructor() {
    this.config = Configuration.getInstance().getConfig()
    this.cache = authKeyv
  }

  async getUserFromCache(key: string): Promise<CurrentUser | null> {
    try {
      const result: any = await this.cache.get([key])
      if (result) return result.data
      return null
    } catch (error) {
      throw new CacheError(
        `Failed to get from cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async setUserInCache(key: string, user: CurrentUser, ttl?: number): Promise<void> {
    try {
      await this.cache.set([key], user, ttl)
    } catch (error) {
      throw new CacheError(
        `Failed to set in cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// ===== SERVICE FACTORY =====
class ServiceFactory {
  private static instance: ServiceFactory
  private services: Map<string, any> = new Map()

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory()
    }
    return ServiceFactory.instance
  }

  getService<T>(serviceClass: new () => T): T {
    const serviceName = serviceClass.name
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new serviceClass())
    }
    return this.services.get(serviceName)
  }
}

// ===== ENHANCED ENVIRONMENT TYPES =====
export type AppEnv = {
  Variables: {
    currentUser: CurrentUser
    authUser: SupabaseUser
    authKeyv: typeof authKeyv
  }
}

// ===== ENHANCED CURRENTUSER BUILDER =====
class CurrentUserBuilder {
  private authService: AuthService
  private userService: UserService
  private balanceService: BalanceService
  private gameSessionService: GameSessionService
  private cacheService: CacheService

  constructor() {
    const factory = ServiceFactory.getInstance()
    this.authService = factory.getService(AuthService)
    this.userService = factory.getService(UserService)
    this.balanceService = factory.getService(BalanceService)
    this.gameSessionService = factory.getService(GameSessionService)
    this.cacheService = factory.getService(CacheService)
  }

  async buildCurrentUser(
    session: Session,
    sessionId: string,
    authUser: SupabaseUser
  ): Promise<CurrentUser> {
    try {
      // 1. Get or create user record
      const userRecord = await this.userService.findOrCreateUser(authUser)

      // 2. Get or create balance
      const balance = await this.balanceService.getOrCreateUserBalance(userRecord.user.authId)

      // 3. Get active bonuses
      const activeBonuses = await this.userService.getActiveBonuses(userRecord.user.authId)

      // 4. Get active game session
      const activeGameSession = await this.gameSessionService.getActiveGameSession(
        userRecord.user.authId
      )

      // 5. Build session info
      const sessionExpiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null
      const sessionRefreshToken = session?.refresh_token || null

      // 6. Build comprehensive currentUser object
      const currentUser: CurrentUser = {
        // user: {
        ...userRecord.user,
        status: 'ONLINE',
        roles: authUser.user_metadata.roles || ['USER'],
        avatar: authUser.user_metadata.avatar || 'avatar-6.webp',
        displayName: userRecord.user.displayName || authUser.email || 'User',
        // },
        activeBonuses,
        sessionId,
        sessionExpiresAt,
        sessionRefreshToken,
        operatorId: authUser.user_metadata.operatorId || userRecord.user.operatorId,
        balance,
        activeGameSession: activeGameSession
          ? {
              ...activeGameSession,
              totalWagered: activeGameSession.totalWagered || 0,
              totalWon: activeGameSession.totalWon || 0,
              totalBets: activeGameSession.totalBets || 0,
              gameSessionRtp: activeGameSession.gameSessionRtp || 0,
              duration: activeGameSession.duration || 0
            }
          : null,
        lastUpdated: new Date()
      }

      return currentUser
    } catch (error) {
      throw new Error(
        `Failed to build currentUser: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async refreshCurrentUser(currentUser: CurrentUser): Promise<CurrentUser> {
    try {
      // 1. Get fresh balance
      const balance = await this.balanceService.getUserBalance(currentUser.authId)

      // 2. Get active bonuses
      const activeBonuses = await this.userService.getActiveBonuses(currentUser.authId)

      // 3. Get active game session
      const activeGameSession = await this.gameSessionService.getActiveGameSession(
        currentUser.authId
      )

      // 4. Return updated currentUser
      return {
        ...currentUser,
        balance,
        activeBonuses,
        activeGameSession: activeGameSession
          ? {
              ...activeGameSession,
              totalWagered: activeGameSession.totalWagered || 0,
              totalWon: activeGameSession.totalWon || 0,
              totalBets: activeGameSession.totalBets || 0,
              gameSessionRtp: activeGameSession.gameSessionRtp || 0,
              duration: activeGameSession.duration || 0
            }
          : null,
        lastUpdated: new Date()
      }
    } catch (error) {
      throw new Error(
        `Failed to refresh currentUser: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// ===== ENHANCED MIDDLEWARE =====
export const authMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization')
      const refreshToken = c.req.header('X-State-Refresh')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          error: 'Unauthorized: No token headers',
          code: 'MISSING_AUTHORIZATION_HEADER'
        })
      }

      const accessToken = authHeader.split(' ')[1]
      if (!accessToken || !refreshToken) {
        return c.json({
          error: 'Invalid authorization header',
          code: 'INVALID_TOKEN'
        })
      }

      const cacheService = ServiceFactory.getInstance().getService(CacheService)

      // Try to get cached user
      const cachedUser = await cacheService.getUserFromCache(refreshToken)
      if (cachedUser) {
        c.set('currentUser', cachedUser)
        // Cast to SupabaseUser type as cached user contains auth metadata
        await next()
        return
      }

      if (!refreshToken) {
        return c.json({
          error: 'Unauthorized: No refresh token provided',
          code: 'MISSING_REFRESH_TOKEN'
        })
      }

      // Authenticate with Supabase
      const authService = ServiceFactory.getInstance().getService(AuthService)
      const authResult = await authService.authenticateSession(accessToken, refreshToken)

      // Build current user
      const userBuilder = new CurrentUserBuilder()
      const currentUser = await userBuilder.buildCurrentUser(
        authResult.session,
        authResult.sessionId,
        authResult.authUser
      )

      // Set in context
      c.set('currentUser', currentUser)
      c.set('authUser', authResult.authUser)

      // Cache the user
      const config = Configuration.getInstance().getConfig()
      await cacheService.setUserInCache(refreshToken, currentUser, config.cache.ttl)

      await next()
    } catch (error) {
      console.error('Authentication error:', error)

      if (error instanceof AuthError) {
        return c.json({
          error: error.message,
          code: error.code
        })
      }

      return c.json({
        error: 'Authentication failed',
        code: 'INTERNAL_ERROR',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  })

/**
 * Helper function to refresh the currentUser object with latest data
 * This can be used when balance changes or game session status updates
 */
export async function refreshCurrentUser(currentUser: CurrentUser): Promise<CurrentUser> {
  try {
    const userBuilder = new CurrentUserBuilder()
    return await userBuilder.refreshCurrentUser(currentUser)
  } catch (error) {
    console.error('Error refreshing currentUser:', error)
    throw new Error(
      `Failed to refresh currentUser: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
