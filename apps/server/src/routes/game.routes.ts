import { db, gameTable, eq, and, operatorTable, sql } from '@/db'
import { authMiddleware, AppEnv } from '@/middleware/auth.middleware' // <-- Import new AppEnv
import { PaginatedResponse } from '@/shared'
import { Hono } from 'hono'
import { createPaginatedQuery, getPaginationParams } from '@/utils/pagination'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { phpBetService } from '@/services/php.service'

// Validation schema for PHP server route
const PHPServerSchema = z.object({
  gameName: z.string(),
  gameData: z.object({
    user: z.any(),
    game: z.any(),
    shop: z.any(),
    bank: z.any(),
    stat_in: z.any(),
    stat_out: z.any()
  }),
  wagerAmount: z.number().min(0),
  gameSessionId: z.string().uuid().nullable().optional()
})

const gameRoutes = new Hono<AppEnv>() // <-- Use new AppEnv

export default gameRoutes

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
  .post('/:gameName/server', authMiddleware(), zValidator('json', PHPServerSchema), async (c) => {
    console.log('hit')
    const user = c.get('user')
    const body = c.req.valid('json')
    const gameId = c.req.param('gameName')

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401)
    }

    const { gameName, gameData, wagerAmount, gameSessionId = null } = body

    try {
      const result = await phpBetService.handlePhpBet(
        user,
        gameName,
        gameData,
        wagerAmount,
        gameSessionId
      )

      if (!result.success) {
        return c.json({ error: result.error }, 400)
      }

      return c.json(result)
    } catch (err: any) {
      console.error('Unhandled error in PHP server route:', err)
      return c.json({ error: 'Internal server error', details: err.message }, 500)
    }
  })
