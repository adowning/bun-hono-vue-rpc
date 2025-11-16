import { Hono } from 'hono'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware' // <-- Use new path
import { and, desc, eq, sql } from 'drizzle-orm'
import {
  db,
  betLogTable,
  depositLogTable,
  withdrawalLogTable,
  userTable,
  activeBonusTable,
  gameSessionTable,
  UserBalance
} from '@/db'
import { getPaginationParams } from '@/utils/pagination'
import { userService } from '@/services/user.service'
import { sessionService } from '@/services/session.service'
import { balanceService } from '@/services/balance.service'
import { supabase } from '@/core/supabase'
import { CurrentUser } from '@/shared' // <-- Correct import for CurrentUser

export const userRoutes = new Hono<AppEnv>()

  /**
   * GET /api/users/me
   * This is now the "on-demand aggregator"
   */
  .get('/me', authMiddleware(), async (c) => {
    const user = c.get('user') // <-- Get the LEAN user
    if (!user) {
      return c.json({ error: 'No user found' }, 401)
    }

    try {
      // This route is responsible for getting the Supabase session info
      const authHeader = c.req.header('Authorization')
      const accessToken = authHeader?.split(' ')[1]
      const refreshToken = c.req.header('X-State-Refresh')

      if (!accessToken || !refreshToken) {
        return c.json({ error: 'Invalid token' }, 401)
      }

      // Get the full authUser to find session details
      const {
        data: { user: authUser },
        error
      } = await supabase.auth.getUser(accessToken)
      if (error || !authUser) {
        return c.json({ error: 'Failed to authenticate user' }, 401)
      }

      const session = {
        id: authUser.id,
        // Parse 'aud' (audience) claim as the expiration time
        expiresAt: authUser.aud
          ? new Date(new Date(0).setUTCSeconds(parseInt(authUser.aud, 10)))
          : null,
        refreshToken: refreshToken
      }

      // Use the new UserService to build the "fat" CurrentUser object
      const currentUser: CurrentUser = await userService.getFullUserById(user.id, session)

      return c.json(currentUser)
    } catch (err: any) {
      console.error('Error building currentUser:', err.message)
      return c.json({ error: 'Failed to return user data', details: err.message }, 500)
    }
  })

  /**
   * GET /api/users/balance
   * Efficiently gets just balance, without Supabase call.
   */
  .get('/balance', authMiddleware(), async (c) => {
    const user = c.get('user') // <-- Get LEAN user
    if (!user) {
      return c.json({ error: 'No current user found' }, 401)
    }

    try {
      // 1. Get the user's balance sheet
      const balance: UserBalance = await balanceService.getOrCreateUserBalance(user.id)

      // 2. Get their active bonuses
      const activeBonuses = await db.query.activeBonusTable.findMany({
        where: and(eq(activeBonusTable.userId, user.id), eq(activeBonusTable.status, 'ACTIVE'))
      })

      // 3. Calculate totals
      const bonusBalance = activeBonuses.reduce((sum, b) => sum + b.currentBonusBalance, 0)
      const bonusWagering = activeBonuses.reduce((sum, b) => sum + b.currentWageringRemaining, 0)

      // 4. Return formatted response
      return c.json({
        realBalance: balance.realBalance,
        bonusBalance: bonusBalance,
        totalBalance: balance.realBalance + bonusBalance,
        freeSpinsRemaining: balance.freeSpinsRemaining,
        wageringRequirements: {
          deposit: balance.depositWageringRemaining,
          bonus: bonusWagering
        },
        lastUpdated: balance.updatedAt
      })
    } catch (err: any) {
      console.error('Error returning balance data:', err.message)
      return c.json({ error: 'Failed to return balance data', details: err.message }, 500)
    }
  })

  /**
   * GET /api/users/active-game
   * Efficiently gets just the active session.
   */
  .get('/active-game', authMiddleware(), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'No current user found' }, 401)
    }

    try {
      const gameSession = await sessionService.getActiveGameSession(user.id)
      if (!gameSession) {
        return c.json({ hasActiveSession: false, message: 'No active game session' })
      }
      return c.json({ hasActiveSession: true, session: gameSession })
    } catch (err: any) {
      console.error('Error returning active game data:', err.message)
      return c.json({ error: 'Failed to return active game data', details: err.message }, 500)
    }
  })

  /**
   * ADMIN-FACING ROUTES
   * These are fine, they just use the lean middleware for auth
   * and then fetch their own data.
   */
  .get('/single/:id', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    if (!id) return c.json({ error: 'User ID is required' }, 400)

    const userDetail = await db.query.userTable.findFirst({
      where: eq(userTable.id, id),
      with: {
        userBalance: true,
        activeBonuses: {
          where: eq(activeBonusTable.status, 'ACTIVE'),
          orderBy: desc(activeBonusTable.createdAt)
        },
        gameSessions: { limit: 1, orderBy: desc(gameSessionTable.createdAt) }
      }
    })

    if (!userDetail) return c.json({ error: 'User not found' }, 404)
    return c.json(userDetail)
  })

  .get('/:id/bet-logs', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    const { params } = getPaginationParams(c)
    if (!params || !params.page || !params.perPage)
      return c.json({ error: 'Pagination parameters are required' }, 400)

    const logs = await db.query.betLogTable.findMany({
      where: eq(betLogTable.userId, id),
      limit: params.perPage,
      offset: (params.page - 1) * params.perPage,
      orderBy: desc(betLogTable.createdAt)
    })
    const total = await db
      .select({ count: sql`count(*)` })
      .from(betLogTable)
      .where(eq(betLogTable.userId, id))
    const totalCount = Number(total[0]?.count ?? 0)

    return c.json({
      data: logs,
      pagination: {
        page: params.page,
        perPage: params.perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / params.perPage)
      }
    })
  })

  .get('/:id/deposit-logs', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    const { params } = getPaginationParams(c)
    if (!params || !params.page || !params.perPage)
      return c.json({ error: 'Pagination parameters are required' }, 400)

    const logs = await db.query.depositLogTable.findMany({
      where: eq(depositLogTable.userId, id),
      limit: params.perPage,
      offset: (params.page - 1) * params.perPage,
      orderBy: desc(depositLogTable.createdAt)
    })
    const total = await db
      .select({ count: sql`count(*)` })
      .from(depositLogTable)
      .where(eq(depositLogTable.userId, id))
    const totalCount = Number(total[0]?.count ?? 0)

    return c.json({
      data: logs,
      pagination: {
        page: params.page,
        perPage: params.perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / params.perPage)
      }
    })
  })

  .get('/:id/withdrawal-logs', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    const { params } = getPaginationParams(c)
    if (!params || !params.page || !params.perPage)
      return c.json({ error: 'Pagination parameters are required' }, 400)

    const logs = await db.query.withdrawalLogTable.findMany({
      where: eq(withdrawalLogTable.userId, id),
      limit: params.perPage,
      offset: (params.page - 1) * params.perPage,
      orderBy: desc(withdrawalLogTable.requestedAt)
    })
    const total = await db
      .select({ count: sql`count(*)` })
      .from(withdrawalLogTable)
      .where(eq(withdrawalLogTable.userId, id))
    const totalCount = Number(total[0]?.count ?? 0)

    return c.json({
      data: logs,
      pagination: {
        page: params.page,
        perPage: params.perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / params.perPage)
      }
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
        userBalance: true
      },
      limit: paginationParams.perPage,
      offset: (paginationParams.page - 1) * paginationParams.perPage
    })

    const total = await db.select({ count: sql`count(*)` }).from(userTable)
    const totalCount = Number(total[0]?.count ?? 0)

    return c.json({
      data: allUsers,
      pagination: {
        page: paginationParams.page,
        perPage: paginationParams.perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / paginationParams.perPage)
      }
    })
  })
