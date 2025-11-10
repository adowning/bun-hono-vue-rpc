import { Hono } from 'hono'
// import { AppEnv } from "@/middleware/auth";
// import { authMiddleware } from "@/middleware/auth";
import type { CurrentUser } from '@/db'
import { AppEnv, authMiddleware } from '@/middleware/auth'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

// Import schema and schemas/types
// import { insertUserSchema, users } from './db/schema';
import { activeBonusTable, betLogTable, db, userTable } from '@/db'
import { getPaginationParams, parsePaginationParams } from '@/utils/pagination'
export const userRoutes = new Hono<AppEnv>()

  // GET /api/user/me
  // Returns the comprehensive currentUser object with all aggregated data
  // export function setUserRoutes(app: Hono<AppEnv>) {
  .get('/me', authMiddleware(), async (c) => {
    const currentUser: CurrentUser = c.get('currentUser')

    if (!currentUser) {
      return c.json({ error: 'No current user found' }, 401)
    }

    try {
      // Return the comprehensive currentUser object
      return c.json(currentUser)
    } catch (err: any) {
      console.error('Error returning currentUser:', err.message)
      return c.json({ error: 'Failed to return user data', details: err.message }, 500)
    }
  })

  // export const routes = new Hono<AppEnv>()
  //   .get('/users', async (c) => {
  //     console.log('GET /users');
  //     // bun:sql driver is async, no .all() needed
  //     // const allUsers = await db.select().from(userTable);
  //     // return c.json(allUsers);
  //     const currentUser: CurrentUser = c.get("currentUser");

  //     if (!currentUser) {
  //       return c.json({ error: "No current user found" }, 401);
  //     }

  //     try {
  //       // Return the comprehensive currentUser object
  //       return c.json(currentUser);
  //     } catch (err: any) {
  //       console.error("Error returning currentUser:", err.message);
  //       return c.json({ error: "Failed to return user data", details: err.message }, 500);
  //     }
  //   })
  // GET /api/user/balance
  // Returns just the balance information from currentUser
  .get('/balance', authMiddleware(), async (c) => {
    const currentUser: CurrentUser = c.get('currentUser')

    if (!currentUser) {
      return c.json({ error: 'No current user found' }, 401)
    }

    try {
      // Return balance information
      return c.json({
        realBalance: currentUser.balance.realBalance,
        bonusBalance: currentUser.balance.bonusBalance,
        totalBalance: currentUser.balance.realBalance + currentUser.balance.bonusBalance,
        freeSpinsRemaining: currentUser.balance.freeSpinsRemaining,
        wageringRequirements: {
          deposit: currentUser.balance.depositWageringRemaining,
          bonus: currentUser.balance.bonusWageringRemaining
        },
        totals: {
          depositedReal: currentUser.balance.totalDepositedReal,
          depositedBonus: currentUser.balance.totalDepositedBonus,
          withdrawn: currentUser.balance.totalWithdrawn,
          wagered: currentUser.balance.totalWagered,
          won: currentUser.balance.totalWon,
          bonusGranted: currentUser.balance.totalBonusGranted,
          freeSpinWins: currentUser.balance.totalFreeSpinWins
        },
        lastUpdated: currentUser.balance.updatedAt
      })
    } catch (err: any) {
      console.error('Error returning balance data:', err.message)
      return c.json({ error: 'Failed to return balance data', details: err.message }, 500)
    }
  })

  // GET /api/user/active-game
  // Returns active game session information from currentUser
  .get('/active-game', authMiddleware(), async (c) => {
    const currentUser: CurrentUser = c.get('currentUser')

    if (!currentUser) {
      return c.json({ error: 'No current user found' }, 401)
    }

    try {
      // Return active game session if exists
      if (!currentUser.activeGameSession) {
        return c.json({
          hasActiveSession: false,
          message: 'No active game session'
        })
      }

      const gameSession = currentUser.activeGameSession
      return c.json({
        hasActiveSession: true,
        session: {
          id: gameSession.id,
          gameId: gameSession.gameId,
          gameName: gameSession.gameName,
          status: gameSession.status,
          totalWagered: gameSession.totalWagered,
          totalWon: gameSession.totalWon,
          totalBets: gameSession.totalBets,
          rtp: gameSession.gameSessionRtp,
          playerStartingBalance: gameSession.playerStartingBalance,
          playerEndingBalance: gameSession.playerEndingBalance,
          duration: gameSession.duration,
          createdAt: gameSession.createdAt,
          updatedAt: gameSession.updatedAt
        }
      })
    } catch (err: any) {
      console.error('Error returning active game data:', err.message)
      return c.json({ error: 'Failed to return active game data', details: err.message }, 500)
    }
  })

  // GET /api/user/summary
  // Returns a formatted summary of currentUser for client consumption
  .get('/summary', authMiddleware(), async (c) => {
    const currentUser: CurrentUser = c.get('currentUser')

    if (!currentUser) {
      return c.json({ error: 'No current user found' }, 401)
    }

    try {
      // Return a formatted summary for client use
      return c.json({
        user: {
          id: currentUser.user.id,
          email: currentUser.user.email,
          displayName: currentUser.user.displayName,
          createdAt: currentUser.user.createdAt
        },
        balances: {
          real: currentUser.balance.realBalance,
          bonus: currentUser.balance.bonusBalance,
          total: currentUser.balance.realBalance + currentUser.balance.bonusBalance,
          freeSpins: currentUser.balance.freeSpinsRemaining
        },
        activeGame: currentUser.activeGameSession
          ? {
              id: currentUser.activeGameSession.id,
              gameName: currentUser.activeGameSession.gameName,
              status: currentUser.activeGameSession.status,
              duration: currentUser.activeGameSession.duration,
              totalWagered: currentUser.activeGameSession.totalWagered,
              totalWon: currentUser.activeGameSession.totalWon
            }
          : null,
        session: {
          id: currentUser.sessionId,
          expiresAt: currentUser.sessionExpiresAt
        },
        lastUpdated: currentUser.lastUpdated
      })
    } catch (err: any) {
      console.error('Error returning user summary:', err.message)
      return c.json({ error: 'Failed to return user summary', details: err.message }, 500)
    }
  })
  .get('/single/:id', authMiddleware(), async (c) => {
    const id = c.req.param('id')
    const user = await db
      .select()
      .from(userTable)
      .where(sql`${userTable.id} = ${id}`)
    return c.json(user[0])
  })
  .get('/list', authMiddleware(), async (c) => {
    // const allUsers = await db.select().from(userTable)
    const { error, params: paginationParams } = getPaginationParams(c)
    console.log(paginationParams)
    if (!paginationParams || !paginationParams.page || !paginationParams.perPage)
      return c.json({ error: 'Must have paginated params' }, 401)

    const allUsers = await db.query.userTable.findMany({
      with: {
        operator: true,
        betLogs: {
          limit: 20,
          orderBy: betLogTable.createdAt
        },
        activeBonuses: {
          limit: 20,
          orderBy: activeBonusTable.createdAt
        },
        userBalance: true
      },
      limit: paginationParams.perPage,
      offset: paginationParams.perPage * paginationParams.page
    })
    console.log(allUsers.length)
    return c.json(allUsers)
  })
// }
// export const userRoutes = app;
