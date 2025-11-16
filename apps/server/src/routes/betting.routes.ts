import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware'
import { gameplayService } from '@/services/gameplay.service'

// Validation schema for an incoming bet outcome
const BetOutcomeSchema = z.object({
  gameId: z.string().uuid(),
  gameSessionId: z.string().uuid().nullable().optional(),
  wagerAmount: z.number().int().min(0),
  winAmount: z.number().int().min(0)
})

export const bettingRoutes = new Hono<AppEnv>()

  /**
   * POST /api/betting/outcome
   * This is the core "bet" callback.
   */
  .post('/outcome', authMiddleware(), zValidator('json', BetOutcomeSchema), async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')

    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const { gameId, gameSessionId = null, wagerAmount, winAmount } = body

    try {
      const result = await gameplayService.processBetOutcome(
        user,
        gameId,
        gameSessionId,
        wagerAmount,
        winAmount
      )

      if (!result.success) {
        // Handle known errors (like NSF)
        return c.json({ error: result.error }, 400)
      }

      // Return the new, 100% accurate balances
      return c.json(result)
    } catch (err: any) {
      console.error('Unhandled error in bet outcome:', err)
      return c.json({ error: 'Internal server error', details: err.message }, 500)
    }
  })
