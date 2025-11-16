#!/bin/bash
set -e

echo "--- Refactoring 'hosted.routes.ts' into a Provider Router ---"

# --- 1. Create the new handlers directory ---
mkdir -p src/handlers
echo "Created: src/handlers/"

# --- 2. Create src/handlers/netgame.handler.ts (from hosted.routes.ts) ---
echo "Creating: src/handlers/netgame.handler.ts"
cat << 'EOF' > src/handlers/netgame.handler.ts
import { Context } from 'hono'
import { AppEnv } from '@/middleware/auth.middleware'
import { 
  db, 
  eq, 
  and, 
  sql,
  userTable, 
  gameTable, 
  betLogTable, 
  userBalanceTable, 
  operatorTable, 
  gameSessionTable,
  activeBonusTable,
  User,
  Game,
  UserBalance,
  Operator,
  GameSession
} from '@/db'
import { sessionService } from '@/services/session.service'
import { userStateCache } from '@/services/cache.service'

/**
 * Handles all game logic for the "NetGame" (NG) provider,
 * which uses the "golden copy" Server.php/SlotSettings.php model.
 */
export async function handleNetgameRequest(
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
    const totalBonusBalance = fullUser.activeBonuses.reduce((sum, b) => sum + b.currentBonusBalance, 0)

    const context = {
      user: {
        id: fullUser.id,
        balance: fullUser.userBalance.realBalance,
        count_balance: totalBonusBalance,
        address: 0,
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
      gameLogs: gameLogs.map(log => (log.metadata as any)?.rawResponse || ''),
      
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
    
    const newContext = JSON.parse(newContextJson)

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
          await tx.update(userBalanceTable)
            .set({
              realBalance: sql`${userBalanceTable.realBalance} + ${balanceDelta}`
            })
            .where(eq(userBalanceTable.userId, user.id))
        }
          
        // b. Update Operator Banks
        if(gameBankDelta !== 0 || bonusBankDelta !== 0) {
          await tx.update(operatorTable)
            .set({
              slotsBalance: sql`${operatorTable.slotsBalance} + ${gameBankDelta}`,
              arcadeBalance: sql`${operatorTable.arcadeBalance} + ${bonusBankDelta}`
            })
            .where(eq(operatorTable.id, user.operatorId))
        }
          
        // c. Update Game Session Data
        await tx.update(gameSessionTable)
          .set({ sessionData: newContext.gameData })
          .where(eq(gameSessionTable.id, session.id))
          
        // d. Insert Bet Logs
        if (newContext.newGameLogs.length > 0) {
          
          const firstStatGame = newContext.newStatGames.length > 0 ? newContext.newStatGames[0] : null;

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
          
          if(logs.length > 0) {
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
    return c.body(rawResponse, null)

  } catch (err: any) {
    console.error(`[FATAL] Hosted game route failed:`, err)
    return c.json({ responseEvent: "error", serverResponse: "InternalError", details: err.message }, 500)
  }
}
EOF

# --- 3. Create src/handlers/netent.handler.ts (NEW FILE) ---
echo "Creating: src/handlers/netent.handler.ts (Stub)"
cat << 'EOF' > src/handlers/netent.handler.ts
import { Context } from 'hono'
import { AppEnv } from '@/middleware/auth.middleware'
import { User } from '@/db'

/**
 * Handles all game logic for the "NetEnt" (NET) provider.
 * This will call the 'DirectPHPHandler.php' and '...Calculator.php'
 * for NetEnt games.
 */
export async function handleNetentRequest(
  c: Context<AppEnv>,
  user: User,
  gameName: string,
  postData: any
) {
  
  // TODO: Implement the logic for NetEnt games.
  // This will be different from the NetGame handler.
  // It will need to:
  // 1. Build the *simpler* context for 'DirectPHPHandler.php'.
  // 2. Call 'Bun.spawnSync' on 'src/providers/php/FlowersNET/DirectPHPHandler.php'
  // 3. Get the result, which is just spin/win data.
  // 4. Call *our* 'gameplayService.processBetOutcome' with that data.
  // 5. Format the response for the NetEnt game.
  
  console.log(`[STUB] NetEnt game '${gameName}' called by user '${user.id}'. Logic not implemented.`);
  
  return c.json({
    error: 'Provider (NetEnt) not yet implemented',
    gameName,
    postData
  }, 501) // 501 Not Implemented
}
EOF

# --- 4. Create src/handlers/ka.handler.ts (NEW FILE) ---
echo "Creating: src/handlers/ka.handler.ts (Stub)"
cat << 'EOF' > src/handlers/ka.handler.ts
import { Context } from 'hono'
import { AppEnv } from '@/middleware/auth.middleware'
import { User } from '@/db'

/**
 * Handles all game logic for the "Kickass" (KA) provider.
 */
export async function handleKaRequest(
  c: Context<AppEnv>,
  user: User,
  gameName: string,
  postData: any
) {
  
  // TODO: Implement the logic for Kickass games.
  // This will likely follow the same pattern as the NetEnt handler,
  // calling a 'DirectPHPHandler.php' or 'Server.php' specific to KA.
  
  console.log(`[STUB] KA game '${gameName}' called by user '${user.id}'. Logic not implemented.`);
  
  return c.json({
    error: 'Provider (KA) not yet implemented',
    gameName,
    postData
  }, 501) // 501 Not Implemented
}
EOF

# --- 5. Rewrite src/routes/hosted.routes.ts (The new "Router") ---
echo "Rewriting: src/routes/hosted.routes.ts"
cat << 'EOF' > src/routes/hosted.routes.ts
import { Hono } from 'hono'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware'
import { handleNetgameRequest } from '@/handlers/netgame.handler'
import { handleNetentRequest } from '@/handlers/netent.handler'
import { handleKaRequest } from '@/handlers/ka.handler'

export const hostedRoutes = new Hono<AppEnv>()

/**
 * POST /game/:gameName/server
 *
 * This is now a "router" that detects the provider from the
 * gameName suffix and calls the correct handler.
 */
.post('/:gameName/server', authMiddleware(), async (c) => {
  const user = c.get('user')
  const gameName = c.req.param('gameName')
  let postData: any
  try {
    postData = await c.req.json()
  } catch (e) {
    postData = {}
  }

  try {
    if (gameName.endsWith('NG')) {
      // Handle NetGame
      return await handleNetgameRequest(c, user, gameName, postData)
    } 
    else if (gameName.endsWith('NET')) {
      // Handle NetEnt
      return await handleNetentRequest(c, user, gameName, postData)
    }
    else if (gameName.endsWith('KA')) {
      // Handle Kickass
      return await handleKaRequest(c, user, gameName, postData)
    }
    
    // Default case if no provider matches
    console.warn(`Unknown provider for game: ${gameName}`)
    return c.json({ error: 'Unknown game provider' }, 400)

  } catch (err: any) {
    console.error(`[FATAL] Hosted game route failed:`, err)
    return c.json({ responseEvent: "error", serverResponse: "InternalError", details: err.message }, 500)
  }
})
EOF

echo "---"
echo "✅ Provider Routing Refactor Complete!"
echo "---"
echo ""
echo "Created 'src/handlers/' directory."
echo "Moved 'NetGame' logic to 'src/handlers/netgame.handler.ts'."
echo "Created stubs for 'netent.handler.ts' and 'ka.handler.ts'."
echo "'src/routes/hosted.routes.ts' is now a clean router."
echo ""
echo "Please restart 'bun run dev'. Your 'AfricanKingNG' game should still work."
echo ""