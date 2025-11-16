import { db, eq, userTable, User, activeBonusTable, gameSessionTable } from '@/db'
import { CurrentUser } from '@/shared' // <-- Import CurrentUser from shared
import { User as SupabaseUser } from '@supabase/supabase-js'
import { balanceService } from './balance.service'
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
          operatorId: authUser.user_metadata.operatorId || '00000000-0000-0000-0000-000000000000',
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
    // --- START FIX ---
    // Read the wrapper object from the cache
    const cachedUserResponse: any = await userStateCache.get(userId)
    // Access the .data property
    const cachedUser = cachedUserResponse ? cachedUserResponse.data : null
    // --- END FIX ---

    if (cachedUser) {
      return cachedUser
    }

    // 2. Cache miss: Fetch from DB (ONE query)
    const userWithRelations = await this.db.query.userTable.findFirst({
      where: eq(userTable.id, userId),
      with: {
        userBalance: true,
        activeBonuses: {
          where: eq(activeBonusTable.status, 'ACTIVE')
        },
        gameSessions: {
          where: eq(gameSessionTable.status, 'ACTIVE'),
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
    // Note: We save the raw CurrentUser object. The cache service handles the wrapper.
    await userStateCache.set(userId, currentUser, 60) // Cache for 60 seconds
    return currentUser
  }
}

// Export singleton
export const userService = new UserService()
