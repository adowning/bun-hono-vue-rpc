import 'dotenv/config'
import { createMiddleware } from 'hono/factory'
import { User } from '@/db'
import { authCache } from '@/services/cache.service'
import { authService, AuthenticationError } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { supabase } from '@/core/supabase'
import { WebSocketMiddleware, IWebSocketRouteHandler } from '@thanhhoajs/websocket'
import { ServerWebSocket } from 'bun'
import { IThanhHoaWebSocketData } from '@/shared'
import { Context } from 'hono'
import { UserMetadata } from '@supabase/supabase-js'

/**
 * Define the new "lean" environment for Hono.
 * It only contains our local User.
 */
export type AppEnv = {
  Variables: {
    user: User
  }
}

export const authMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    console.log('authMiddleware: New request received.')
    try {
      // ---
      // --- THE FIX ---
      // We ONLY trust the Authorization header, which addon.js is now providing.
      // All logic for c.req.query('token') has been removed.
      // ---
      const authHeader = c.req.header('Authorization')
      let accessToken = authHeader?.split(' ')[1]
      if (!accessToken) {
        accessToken = c.req.query('access_token')
      }
      console.log('token  ', accessToken)
      if (!accessToken) {
        console.warn('authMiddleware: Unauthorized. Missing Authorization header.')
        return c.json({ error: 'Unauthorized: Missing token' }, 401)
      }

      // We still use the clean signature as the cache key.
      let cacheKey: string | null = null
      const tokenParts = accessToken.split('.')

      if (tokenParts.length === 3) {
        cacheKey = tokenParts[2] // Use the signature
      } else {
        // This should not happen now, but good to check.
        console.warn('authMiddleware: Token from header is not a valid JWT, caching will be skipped.')
      }

      // --- 1. Check Cache for LEAN User ---
      if (cacheKey) {
        let cachedUser: any = await authCache.get(cacheKey)
        if (cachedUser !== null && cachedUser.data !== null) {
          cachedUser = cachedUser.data
          c.set('user', cachedUser) // Set lean user
          console.log('authMiddleware: User auth from cache (fast path).')
          await next()
          return // <-- This is the fast path.
        }
      }

      // --- 2. Cache Miss: Authenticate with Supabase (Slow Path) ---
      console.log('authMiddleware: Cache miss or invalid key, authenticating with Supabase (slow path).')

      let authUser
      try {
        // We pass the full, clean accessToken from the header to Supabase.
        authUser = await authService.getAccount(accessToken)
      } catch (authError) {
        console.warn('authMiddleware: authService.getAccount failed.', authError)
        throw authError // Re-throw to be caught by the outer try/catch
      }

      if (!authUser) {
        console.warn('authMiddleware: Supabase auth failed, no user returned.')
        return c.json({ error: 'Authentication failed: Invalid token' }, 401)
      }

      // --- 3. Find or Create LEAN Local User ---
      console.log('authMiddleware: Finding or creating local user.')
      const { user: localUser } = await userService.findOrCreateUser(authUser)

      // --- 4. Set in Context and Cache ---
      c.set('user', localUser) // Set lean user ONLY

      if (cacheKey) {
        await authCache.set(cacheKey, localUser)
        console.log(`authMiddleware: Success. User ${localUser.id} authenticated and cached.`)
      } else {
        console.log(`authMiddleware: Success. User ${localUser.id} authenticated (not cached).`)
      }

      await next()
    } catch (error: unknown) {
      console.error('Authentication error:', error)

      if (error instanceof AuthenticationError) {
        console.log('AuthenticationError:', error.message)
        return c.json({ error: error.message, code: error.code }, 401)
      }

      if (error instanceof Error) {
        console.log('Generic Error:', error.message)
        return c.json({ error: 'Authentication failed', details: error.message }, 500)
      }

      return c.json({ error: 'An unknown authentication error occurred' }, 500)
    }
  })

export interface AuthConfig {
  enabled?: boolean
  cookie?: {
    name?: string
    secure?: boolean
  }
  jwt?: {
    secret?: string
    algorithm?: 'HS256' | 'HS384' | 'HS512'
  }
  session?: {
    key?: string
  }
}

export type AuthCallback = (req: Request) => Promise<User | null> | User | null

export class AuthenticationManager {
  private callback: AuthCallback | null = null
  private config: Required<AuthConfig>

  constructor(config: AuthConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      cookie: {
        name: config.cookie?.name || 'auth_token',
        secure: config.cookie?.secure ?? true,
      },
      jwt: {
        secret: config.jwt?.secret || process.env.JWT_SECRET || '',
        algorithm: config.jwt?.algorithm || 'HS256',
      },
      session: {
        key: config.session?.key || 'session_id',
      },
    }
  }

  /**
   * Register authentication callback
   */
  authenticate(callback: AuthCallback): void {
    this.callback = callback
  }

  /**
   * Authenticate a request
   */
  async authenticateRequest(req: Request): Promise<{ user: User, accessToken: string } | null> {
    // if (!this.config.enabled) {
    //   return null
    // }
    // console.log(await this.callback())

    // if (this.callback) {
    //   return await this.callback(req)
    // }
    const url = new URL(req.url)
    console.log(url)
    let token = url.search.split('=')[1]
    token = token.split('&wa')[0]
    console.log(token)
    if (!token) return null
    const accessToken = token.split(',')[0]
    const refreshToken = token.split(',')[1]
    if (accessToken) return this.verifyToken(accessToken, refreshToken)
    // Default authentication from cookies
    const cookie = req.headers.get('cookie')
    if (cookie) {
      const cookies = this.parseCookies(cookie)
      const token = cookies[this.config.cookie.name as string]

      if (token) {
        // Verify JWT or session token
        return this.verifyToken(token, refreshToken)
      }
    }

    // Try Authorization header
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      return this.verifyToken(token, refreshToken)


    }




    return null
  }

  /**
   * Parse cookies from header
   */
  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {}

    for (const cookie of cookieHeader.split(';')) {
      const [name, ...rest] = cookie.split('=')
      cookies[name.trim()] = rest.join('=').trim()
    }

    return cookies
  }

  /**
   * Verify token (JWT or session)
   */
  private async verifyToken(accessToken: string, refreshToken?: string,): Promise<{ user: User, accessToken: string } | null> {
    // This is a placeholder - implement actual JWT/session verification
    // You would integrate with your auth system here
    if (refreshToken) {
      console.log('has ref')
      const { authUser } = await authService.authenticateSession(accessToken, refreshToken)
      // --- 3. Find or Create LEAN Local User ---
      const { user } = await userService.findOrCreateUser(authUser)
      await authCache.set(refreshToken, user, 3600)
      return { user, accessToken }
    } else {
      console.log('no ref')
      const _accessToken = accessToken.split('&wa')[0]
      console.log('_accessToken -- ', _accessToken)
      if (accessToken == null) return null
      const authUser = await authService.getAccount(accessToken)
      console.log(authUser)
      const { user } = await userService.findOrCreateUser(authUser)

      return { user, accessToken }
    }
  }
}

export const wsAuthMiddleware: WebSocketMiddleware = async (
  ws: ServerWebSocket<IThanhHoaWebSocketData>
) => {
  const authHeader = ws.data.headers.get('Authorization')
  const refreshToken = ws.data.headers.get('X-State-Refresh')
  if (!authHeader || !authHeader.startsWith('Bearer ') || !refreshToken) {
    return false //c.json({ error: 'Unauthorized: Missing token headers' }, 401)
  }
  let cachedUser: any = await authCache.get(refreshToken)
  if (cachedUser !== null && cachedUser.data !== null) {
    cachedUser = cachedUser.data
    // c.set('user', cachedUser) // Set lean user
    ws.data.custom!.user = cachedUser
    return true
  }
  // --- 2. Cache Miss: Authenticate with Supabase ---
  const accessToken = authHeader.split(' ')[1]
  if (!accessToken) {
    return false // c.json({ error: 'Invalid authorization header' }, 401)
  }

  const { authUser } = await authService.authenticateSession(accessToken, refreshToken)

  // --- 3. Find or Create LEAN Local User ---
  const { user: _localUser } = await userService.findOrCreateUser(authUser)
  //@ts-ignore
  const localUser = _localUser
  // --- 4. Set in Context and Cache ---
  // c.set('user', localUser) // Set lean user ONLY
  ws.data.custom!.user = cachedUser

  await authCache.set(refreshToken, localUser, 3600) // Cache for 1 hour

  // Perform token validation here
  // ws.data.custom = { userId: 'user123' } // Attach custom data
  return true
}