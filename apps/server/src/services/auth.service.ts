import { supabase } from '@/core/supabase'
import { Session, SupabaseClient, User as SupabaseUser, User } from '@supabase/supabase-js'

// --- Custom Errors ---
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
  constructor(message: string) {
    super(message)
  }
}
export class SessionError extends AuthError {
  statusCode = 401
  code = 'SESSION_ERROR'
  constructor(message: string) {
    super(message)
  }
}
// --- End Custom Errors ---

export interface AuthResult {
  authUser: SupabaseUser
  sessionId: string
  session: Session
}

class AuthService {
  private supabaseClient: SupabaseClient = supabase

  async authenticateSession(accessToken: string, refreshToken: string): Promise<AuthResult> {
    try {
      console.log(accessToken)
      console.log(refreshToken)
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
  async getAccount(accessToken: string): Promise<User> {
    try {
      console.log(`accessToken, dd`, accessToken)
      const { data, error: userError } = await this.supabaseClient.auth.getUser(
        accessToken,
      )
      if (userError) {
        throw new AuthenticationError(`Failed to set session: ${userError.message}`)
      }

      return data.user
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
