import { Hono } from 'hono'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware'
import { handleNetGameRequest, } from '@/handlers/netgame.handler'
import { handleNetentRequest, handlePhpBet } from '@/handlers/netent.handler'
import { handleKaRequest } from '@/handlers/ka.handler'
import { NetGameMessage } from '@/utils/types'

export const hostedRoutes = new Hono<AppEnv>()

  /**
   * POST /game/:gameName/server
   *
   * This is now a "router" that detects the provider from the
   * gameName suffix and calls the correct handler.
   */
  .post('/:gameName/server', authMiddleware(), async (c) => {
    // .post('/:provider/:gameName/server', authMiddleware(), async (c) => {
    console.log('php router hit')
    const gameName = c.req.param('gameName')
    console.log(gameName, 'gaamnename')
    const user = c.get('user')
    const _params = await c.req.query();
    console.log(gameName, 'gaamnename')
    console.log(gameName, 'gaamnename')

    let postData
    console.log(gameName, 'gaamnename')
    if (gameName.endsWith('NG')) {
      const body = await c.req.json();

      postData = body as NetGameMessage
      return await handleNetGameRequest(c, user, gameName, postData)
    }
    if (gameName.endsWith('NET')) {
      // Handle NetEnt
      return await handlePhpBet(c, user, gameName, postData)
    }
    else if (gameName.endsWith('KA')) {
      // Handle Kickass
      return await handleKaRequest(c, user, gameName, postData)
    }
    const result = await handlePhpBet(c, user, gameName, postData, _params)
    // Default case if no provider matches
    console.warn(`Unknown provider for game: ${gameName}`)
    return c.json({ error: 'Unknown game provider' }, 400)


  })
