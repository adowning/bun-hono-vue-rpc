import { Hono } from 'hono'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware'
import { handleNetGameRequest, } from '@/handlers/netgame.handler'
import { handleNetentBet, handleNetentRequest, } from '@/handlers/netent.handler'
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
    const user = c.get('user')
    const _params = c.req.query();
    let postData: any
    if (gameName.endsWith('NG')) {
      const body = await c.req.json();

      postData = body as NetGameMessage
      return await handleNetGameRequest(c, user, gameName, postData)
    }
    if (gameName.endsWith('NET')) {
      const url = new URL(c.req.url)
      const params = c.req.queries()
      const result: Record<string, any> = {};
      console.log(params)
      console.log(typeof params)
      postData = []
      // Parse all parameters
      if (!params) throw new Error('ouch')
      for (const [key, value] of Object.entries(params)) {
        console.log(`${key} ${value}`); // "a 5", "b 7", "c 9"
        result[key] = value[0]
      }
      console.log(result)
      // Handle NetEnt
      return await handleNetentBet(c, user, gameName, result)
    }
    else if (gameName.endsWith('KA')) {
      // Handle Kickass
      return await handleKaRequest(c, user, gameName, postData)
    }

    console.warn(`Unknown provider for game: ${gameName}`)
    return c.json({ error: 'Unknown game provider' }, 400)


  })
