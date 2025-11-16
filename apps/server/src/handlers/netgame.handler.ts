import { Context } from 'hono'
import { User } from '@/db'
import { AppEnv } from '@/middleware/auth.middleware'

// Get PHP server URL from environment variables
const PHP_SERVER_URL = Bun.env.PHP_SERVER_URL || 'http://localhost:8000'

/**
 * Handles requests for NetGame games by proxying them to the PHP server.
 */
export async function handleNetGameRequest(
  c: Context<AppEnv>,
  user: User,
  gameName: string,
  postData: any,
) {
  const forwardedAuthHeader = c.req.header('Authorization')

  // Get the original query string
  const originalUrl = new URL(c.req.url)
  const queryString = originalUrl.search;

  // Construct the full PHP endpoint URL
  const phpBaseUrl = `${PHP_SERVER_URL}/api/game/${gameName}/node`;
  const phpServerEndpoint = `${phpBaseUrl}${queryString}`;

  console.log(`[NetGame] Proxying request for user ${user.id} to: ${phpServerEndpoint}`)

  try {
    const response = await fetch(phpServerEndpoint, {
      method: 'POST', // Your api.php is listening for POST
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain, */*',
        'Authorization': forwardedAuthHeader || '',
      },
      body: JSON.stringify(postData),
    })

    const responseBody = await response.text()

    if (!response.ok) {
      console.error(
        `[NetGame] PHP server proxy error (${response.status}) for ${gameName}: ${responseBody}`,
      )
      return c.text(responseBody, response.status as any)
    }

    return c.text(responseBody)
  } catch (err: any) {
    console.error(`[FATAL] Proxy to PHP server failed for ${gameName}:`, err)
    return c.json(
      {
        responseEvent: 'error',
        serverResponse: 'InternalError',
        details: err.message,
      },
      500,
    )
  }
}
// import { Context } from 'hono'
// import { AppEnv } from '@/middleware/auth.middleware'
// import {
//   db,
//   eq,
//   and,
//   sql,
//   userTable,
//   gameTable,
//   betLogTable,
//   userBalanceTable,
//   operatorTable,
//   gameSessionTable,
//   activeBonusTable,
//   User,
//   Game,
//   UserBalance,
//   Operator,
//   GameSession
// } from '@/db'
// import { sessionService } from '@/services/session.service'
// import { userStateCache } from '@/services/cache.service'
// import { GameData, NetGameMessage, WebSocketData } from '@/utils/types'
// import { ServerWebSocket } from 'bun'

// /**
//  * Handles all game logic for the "NetGame" (NG) provider,
//  * which uses the "golden copy" Server.php/SlotSettings.php model.
//  */

// export async function handleNetgameRequest(
//   c: Context<AppEnv>,
//   user: User,
//   gameName: string,
//   postData: any
// ) {
//   // Define paths

//   try {
//     // --- 1. Build $initData ---

//     const initData = {
//       gameName: gameName,
//       userId: user.id,
//       postData: postData,
//       // reels: await reelsFile.text(),
//       ipAddress: c.req.header('CF-Connecting-IP') || '127.0.0.1'
//     }

//     const initUrl = `https://php.cashflowcasino.com/api/game/${gameName}/node?sessionId=${encodeURIComponent(
//       postData.sessionId
//     )}&action=init`

//     // const initQuery =
//     //     "action=init" +
//     //     "&sessid=rb4m5mypoqfcoclptj7duvtnkgt463qa9786f834" +
//     //     "&gameId=blacklagoon_not_mobile_sw" +
//     //     "&wantsfreerounds=true" +
//     //     "&freeroundmod=false" +
//     //     "&wantsreels=true" +
//     //     `&no-cache=${Date.now()}`;
//     const authHeader = c.req.header('Authorization')
//     if (!authHeader) return c.text('no auth')
//     const h1 = authHeader.split(',')[0] || ''
//     const accessToken = h1.split('Bearer ')[1]
//     const response = await fetch(initUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`
//       },
//       body: postData
//     })
//     const stdout = await response.json()
//     return c.body(stdout)
//     const responseParts = stdout.split(':::')
//     if (responseParts.length < 2) {
//       console.error(`[PHP-RESPONSE-INVALID] ${stdout}`)
//       throw new Error(`Invalid PHP response (missing ':::' separator)`)
//     }

//     const newContextJson = responseParts[0]
//     const rawResponse = responseParts[1] ?? ''

//     const newContext = JSON.parse(newContextJson)

//     // --- 4. Persist State Changes ---
//     if (newContext.internalErrors.length === 0) {
//       const balanceBefore = context.user.balance
//       const balanceAfter = newContext.user.balance
//       const balanceDelta = balanceAfter - balanceBefore

//       const gameBankDelta = newContext.gameBank - context.gameBank
//       const bonusBankDelta = newContext.bonusBank - context.bonusBank

//       await db.transaction(async (tx) => {
//         // a. Update User Balance
//         if (balanceDelta !== 0) {
//           await tx
//             .update(userBalanceTable)
//             .set({
//               realBalance: sql`${userBalanceTable.realBalance} + ${balanceDelta}`
//             })
//             .where(eq(userBalanceTable.userId, user.id))
//         }

//         // b. Update Operator Banks
//         if (gameBankDelta !== 0 || bonusBankDelta !== 0) {
//           await tx
//             .update(operatorTable)
//             .set({
//               slotsBalance: sql`${operatorTable.slotsBalance} + ${gameBankDelta}`,
//               arcadeBalance: sql`${operatorTable.arcadeBalance} + ${bonusBankDelta}`
//             })
//             .where(eq(operatorTable.id, user.operatorId))
//         }

//         // c. Update Game Session Data
//         await tx
//           .update(gameSessionTable)
//           .set({ sessionData: newContext.gameData })
//           .where(eq(gameSessionTable.id, session.id))

//         // d. Insert Bet Logs
//         if (newContext.newGameLogs.length > 0) {
//           const firstStatGame =
//             newContext.newStatGames.length > 0 ? newContext.newStatGames[0] : null

//           const logs = newContext.newGameLogs.map((log: any) => ({
//             userId: user.id,
//             operatorId: user.operatorId,
//             gameId: game.id,
//             gameSessionId: session.id,
//             status: 'COMPLETED',
//             wagerAmount: firstStatGame?.bet || 0,
//             winAmount: firstStatGame?.win || 0,
//             wagerPaidFromReal: firstStatGame?.bet || 0,
//             wagerPaidFromBonus: 0,
//             metadata: {
//               rawResponse: log?.str ?? '',
//               statGame: firstStatGame
//             }
//           }))

//           if (logs.length > 0) {
//             await tx.insert(betLogTable).values(logs)
//           }
//         }
//       })

//       // --- 5. Invalidate Cache ---
//       userStateCache.delete(user.id)
//     }

//     // --- 6. Return Raw Response to Game Client ---
//     console.log(`[PHP-RESPONSE] ${rawResponse}`)
//     c.header('Content-Type', 'application/json')
//     return c.body(rawResponse)
//   } catch (err: any) {
//     console.error(`[FATAL] Hosted game route failed:`, err)
//     return c.json(
//       { responseEvent: 'error', serverResponse: 'InternalError', details: err.message },
//       500
//     )
//   }
// }
export async function handleNetGameMessage(
  ws: ServerWebSocket<WebSocketData>,
  message: NetGameMessage
) {
  message.action = message.gameData.action
  console.log(message)
  const initUrl = `https://php.cashflowcasino.com/api/game/${message.gameName}/node?sessionId=${encodeURIComponent(
    ws.data.id
  )}&action=${message.action}`

  // const initQuery =
  //     "action=init" +
  //     "&sessid=rb4m5mypoqfcoclptj7duvtnkgt463qa9786f834" +
  //     "&gameId=blacklagoon_not_mobile_sw" +
  //     "&wantsfreerounds=true" +
  //     "&freeroundmod=false" +
  //     "&wantsreels=true" +
  //     `&no-cache=${Date.now()}`;
  console.log(JSON.stringify(message))
  const response = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ws.data.accessToken}`
    },
    body: JSON.stringify(message)
  })
  const body = await response.json()
  console.log(response)
  console.log(body)
}
export async function handleNetgameRequestV1(
  c: Context<AppEnv>,
  user: User,
  gameName: string,
  postData: any
) {
  // Define paths
  const phpScriptPath = `src/providers/php/${gameName}/Server.php`
  const reelsPath = `src/providers/php/${gameName}/reels.txt`
  const includePath = `src/providers/php/${gameName}`

  try {
    // --- 1. Build $initData ---
    const reelsFile = Bun.file(reelsPath)
    if (!(await reelsFile.exists())) {
      throw new Error(`Reels file not found: ${reelsPath}`)
    }

    const initData = {
      gameName: gameName,
      userId: user.id,
      postData: postData,
      reels: await reelsFile.text(),
      ipAddress: c.req.header('CF-Connecting-IP') || '127.0.0.1'
    }

    // --- 2. Build $context ---
    const [fullUser, game, gameLogs] = await Promise.all([
      db.query.userTable.findFirst({
        where: eq(userTable.id, user.id),
        with: {
          userBalance: true,
          operator: true,
          activeBonuses: {
            where: eq(activeBonusTable.status, 'ACTIVE')
          }
        }
      }),
      db.query.gameTable.findFirst({
        where: eq(gameTable.name, gameName),
        columns: {
          id: true,
          name: true,
          totalBetAmount: true,
          totalWonAmount: true,
          goldsvetData: true
        }
      }),
      db.query.betLogTable.findMany({
        where: eq(betLogTable.userId, user.id),
        orderBy: (betLogTable, { desc }) => [desc(betLogTable.createdAt)],
        limit: 10,
        columns: { metadata: true }
      })
    ])

    if (!fullUser || !fullUser.userBalance || !fullUser.operator) {
      throw new Error('Failed to fetch full user context')
    }
    if (!game) throw new Error(`Game not found: ${gameName}`)

    const session = await sessionService.getOrCreateGameSession(user.id, game.id)
    const jpgs: any[] = []
    const totalBonusBalance = fullUser.activeBonuses.reduce(
      (sum, b) => sum + b.currentBonusBalance,
      0
    )

    const context = {
      user: {
        id: fullUser.id,
        balance: fullUser.userBalance.realBalance,
        count_balance: totalBonusBalance,
        address: 0
      },
      game: {
        id: game.id,
        name: game.name,
        stat_in: game.totalBetAmount,
        stat_out: game.totalWonAmount,
        denomination: (game.goldsvetData as any)?.denomination || 1,
        bet: (game.goldsvetData as any)?.bet || 1,
        rezerv: (game.goldsvetData as any)?.rezerv || 0,
        slotViewState: (game.goldsvetData as any)?.slotviewstate || 'Normal',
        advanced: (game.goldsvetData as any)?.advanced || ''
      },
      shop: {
        id: fullUser.operator.id,
        name: fullUser.operator.name,
        currency: 'USD',
        max_win: (fullUser.operator.gameSettings as any)?.maxWin || 1000000,
        percent: 95
      },
      jpgs: jpgs,
      gameBank: fullUser.operator.slotsBalance,
      bonusBank: fullUser.operator.arcadeBalance,
      gameData: session.sessionData || {},
      gameDataStatic: {},
      gameLogs: gameLogs.map((log) => (log.metadata as any)?.rawResponse || ''),

      newGameLogs: [],
      newStatGames: [],
      internalErrors: []
    }

    // --- 3. Execute PHP Script ---
    console.log(`[PHP-RUN] Executing: ${phpScriptPath}`)
    const inputJson = JSON.stringify({ initData, context })

    const proc = Bun.spawnSync(['php', '-d', `include_path=${includePath}`, phpScriptPath], {
      stdin: Buffer.from(inputJson)
    })

    const stdout = proc.stdout.toString()
    const stderr = proc.stderr.toString()

    if (stderr) {
      console.error(`[PHP-ERROR] ${stderr}`)
      console.error(`[PHP-INPUT] ${inputJson}`)
      throw new Error(`PHP script failed: ${stderr}`)
    }

    const responseParts = stdout.split(':::')
    if (responseParts.length < 2) {
      console.error(`[PHP-RESPONSE-INVALID] ${stdout}`)
      throw new Error(`Invalid PHP response (missing ':::' separator)`)
    }

    const newContextJson = responseParts[0]
    const rawResponse = responseParts[1] ?? ''

    const newContext = JSON.parse(newContextJson!)

    // --- 4. Persist State Changes ---
    if (newContext.internalErrors.length === 0) {
      const balanceBefore = context.user.balance
      const balanceAfter = newContext.user.balance
      const balanceDelta = balanceAfter - balanceBefore

      const gameBankDelta = newContext.gameBank - context.gameBank
      const bonusBankDelta = newContext.bonusBank - context.bonusBank

      await db.transaction(async (tx) => {
        // a. Update User Balance
        if (balanceDelta !== 0) {
          await tx
            .update(userBalanceTable)
            .set({
              realBalance: sql`${userBalanceTable.realBalance} + ${balanceDelta}`
            })
            .where(eq(userBalanceTable.userId, user.id))
        }

        // b. Update Operator Banks
        if (gameBankDelta !== 0 || bonusBankDelta !== 0) {
          await tx
            .update(operatorTable)
            .set({
              slotsBalance: sql`${operatorTable.slotsBalance} + ${gameBankDelta}`,
              arcadeBalance: sql`${operatorTable.arcadeBalance} + ${bonusBankDelta}`
            })
            .where(eq(operatorTable.id, user.operatorId))
        }

        // c. Update Game Session Data
        await tx
          .update(gameSessionTable)
          .set({ sessionData: newContext.gameData })
          .where(eq(gameSessionTable.id, session.id))

        // d. Insert Bet Logs
        if (newContext.newGameLogs.length > 0) {
          const firstStatGame =
            newContext.newStatGames.length > 0 ? newContext.newStatGames[0] : null

          const logs = newContext.newGameLogs.map((log: any) => ({
            userId: user.id,
            operatorId: user.operatorId,
            gameId: game.id,
            gameSessionId: session.id,
            status: 'COMPLETED',
            wagerAmount: firstStatGame?.bet || 0,
            winAmount: firstStatGame?.win || 0,
            wagerPaidFromReal: firstStatGame?.bet || 0,
            wagerPaidFromBonus: 0,
            metadata: {
              rawResponse: log?.str ?? '',
              statGame: firstStatGame
            }
          }))

          if (logs.length > 0) {
            await tx.insert(betLogTable).values(logs)
          }
        }
      })

      // --- 5. Invalidate Cache ---
      userStateCache.delete(user.id)
    }

    // --- 6. Return Raw Response to Game Client ---
    console.log(`[PHP-RESPONSE] ${rawResponse}`)
    c.header('Content-Type', 'application/json')
    return c.body(rawResponse)
  } catch (err: any) {
    console.error(`[FATAL] Hosted game route failed:`, err)
    return c.json(
      { responseEvent: 'error', serverResponse: 'InternalError', details: err.message },
      500
    )
  }
}
