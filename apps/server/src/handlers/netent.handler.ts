import { Context } from 'hono'
import { activeBonusTable, betLogTable, db, eq, gameTable, User, userTable } from '@/db'
import { AppEnv } from '@/middleware/auth.middleware'
import { PhpApiResponse } from '@/utils/php.types';
import chalk from 'chalk';
import { join } from 'path';
import { gameplayService } from '@/services/gameplay.service';
import { sessionService } from '@/services/session.service';

// Get PHP server URL from environment variables
const PHP_SERVER_URL = Bun.env.PHP_SERVER_URL || 'http://localhost:8000'



/**
 * Parses reel data from rs.* parameters into a structured reels object.
 */
function parseReels(params: Record<string, any>): Record<string, any> {
  const reels: Record<string, any> = {};

  // Find all rs.* keys and organize by reel set and reel index
  Object.keys(params).forEach((key) => {
    if (key.startsWith("rs.")) {
      const parts = key.split(".");
      if (parts.length >= 5 && parts[2] === "r") {
        const reelSet = parts[1]!;
        const reelIndex = parseInt(parts[3]!);
        const property = parts[4]!;

        if (!reelSet || isNaN(reelIndex)) return;

        if (!reels[reelSet]) {
          reels[reelSet] = {};
        }
        if (!reels[reelSet][reelIndex]) {
          reels[reelSet][reelIndex] = {};
        }

        if (property === "syms") {
          // Decode URL-encoded symbols (e.g., SYM9%2CSYM7%2CSYM5)
          reels[reelSet][reelIndex].symbols = decodeURIComponent(
            params[key]
          ).split(",");
        } else if (property === "pos") {
          reels[reelSet][reelIndex].position = parseInt(params[key]);
        } else if (property === "hold") {
          reels[reelSet][reelIndex].hold = params[key] === "true";
        } else if (property === "attention") {
          reels[reelSet][reelIndex].attention = parseInt(params[key]);
        }
      }
    }
  });

  return reels;
}

/**
 * Parses win line data from ws.* parameters into a structured winLines array.
 */
function parseWinLines(params: Record<string, any>): any[] {
  const winLines: any[] = [];

  // Find all ws.* keys and organize by win set index
  Object.keys(params).forEach((key) => {
    if (key.startsWith("ws.")) {
      const parts = key.split(".");
      if (parts.length >= 3) {
        const winSetIndex = parseInt(parts[1]!);
        const property = parts[2];

        if (isNaN(winSetIndex)) return;

        if (!winLines[winSetIndex]) {
          winLines[winSetIndex] = {};
        }

        if (property === "types" && parts[3]) {
          if (!winLines[winSetIndex].types) {
            winLines[winSetIndex].types = {};
          }
          winLines[winSetIndex].types[parts[3]] = params[key];
        } else if (property === "pos" && parts[3]) {
          if (!winLines[winSetIndex].positions) {
            winLines[winSetIndex].positions = {};
          }
          winLines[winSetIndex].positions[parts[3]] = decodeURIComponent(
            params[key]
          );
        } else if (property === "betline") {
          winLines[winSetIndex].betLine = parseInt(params[key]);
        } else if (property === "sym") {
          winLines[winSetIndex].symbol = params[key];
        } else if (property === "direction") {
          winLines[winSetIndex].direction = params[key];
        } else if (property === "reelset") {
          winLines[winSetIndex].reelSet = params[key];
        }
      }
    }
  });

  return winLines;
}
/**
 * Parses a URL-encoded response string from the PHP engine into a PhpApiResponse object.
 * Handles goldsvet developer responses.
 */
function parseGoldsvetResponse(responseText: string): PhpApiResponse {
  const params = new URLSearchParams(responseText);
  const result: Record<string, any> = {};

  // Parse all parameters
  params.forEach((value, key) => {
    result[key] = value;
  });

  // Map to PhpApiResponse structure
  const phpResponse: PhpApiResponse = {
    newBalance: parseInt(result.credit) || 0,
    newBalanceCents: result["game.win.cents"]
      ? parseInt(result["game.win.cents"])
      : undefined,
    totalWin: parseInt(result["totalwin.coins"]) || 0,
    totalWinCents: result["totalwin.cents"]
      ? parseInt(result["totalwin.cents"])
      : undefined,
    newGameData: result, // Store all data for persistence
    reels: parseReels(result),
    winLines: parseWinLines(result),
    bonusWin: result["game.win.amount"]
      ? parseInt(result["game.win.amount"])
      : undefined,
    totalFreeGames: result["totalfreegames"]
      ? parseInt(result["totalfreegames"])
      : undefined,
    currentFreeGames: result["currentfreegames"]
      ? parseInt(result["currentfreegames"])
      : undefined,
    isRespin: result.respin === "true",
  };

  return phpResponse;
}
export async function handleNetentRequest(
  user: User,
  gameName: string,
  gameData: any,
  wagerAmount: number,
  gameSessionId: string | null = null
) {
  try {
    // Construct JSON input for PHP DirectCall based on protocol analysis
    const phpInput = {
      gameData: {
        user: gameData.user,
        game: gameData.game,
        shop: gameData.shop,
        bank: gameData.bank,
        stat_in: gameData.stat_in,
        stat_out: gameData.stat_out
      },
      slotEvent: 'bet'
    }
    const phpScriptPath = `src/providers/php/${gameName}/Server.php`
    const reelsPath = `src/providers/php/${gameName}/reels.txt`
    const includePath = `src/providers/php/${gameName}`

    // Spawn PHP process to execute DirectPHPHandler.php with the game name
    const phpPath = join(__dirname, '../providers/php', gameName, 'DirectPHPSpinHandler.php')
    // const phpProcess =  Bun.spawnSync('php', [phpPath], {
    //     stdio: ['pipe', 'pipe', 'pipe'],
    //     cwd: join(__dirname, '../providers/php', gameName)
    // })
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
    const phpProcess = Bun.spawnSync(['php', '-d', `include_path=${includePath}`, phpPath], {
      stdin: Buffer.from(inputJson)
    })
    let phpOutput = ''
    let phpError = ''

    // Collect stdout
    phpProcess.stdout.on('data', (data) => {
      phpOutput += data.toString()
    })

    // Collect stderr
    phpProcess.stderr.on('data', (data) => {
      phpError += data.toString()
    })

    // Send JSON input to PHP via stdin
    phpProcess.stdin.write(JSON.stringify(phpInput))
    phpProcess.stdin.end()

    // Wait for PHP process to complete
    await new Promise((resolve, reject) => {
      phpProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`PHP process exited with code ${code}. Error: ${phpError}`))
        } else {
          resolve(null)
        }
      })
      phpProcess.on('error', reject)
    })

    // Parse PHP response and extract winAmount from totalWin
    const phpResult = JSON.parse(phpOutput.trim())
    const winAmount = phpResult.totalWin || 0

    // Call existing processBetOutcome method with extracted winAmount
    const betOutcomeResult = await gameplayService.processBetOutcome(
      user,
      gameName, // Using gameName as gameId for now
      gameSessionId,
      wagerAmount,
      winAmount
    )

    // Return combined result including both PHP game result and bet outcome
    return {
      phpGameResult: phpResult,
      betOutcome: betOutcomeResult,
      success: betOutcomeResult.success,
      winAmount,
      wagerAmount
    }

  } catch (error: any) {
    console.error('Error in processPHPBetOutcome:', error.message)
    return {
      success: false,
      error: `PHP execution failed: ${error.message}`,
      phpGameResult: null,
      betOutcome: null,
      winAmount: 0,
      wagerAmount
    }
  }
}
/**
 * Handles requests for NetEnt games by proxying them to the PHP server.
 */
export async function handlePhpBet(
  c: Context<AppEnv>,
  user: User,
  gameName: string,
  postData: any, // This is the (likely empty) JSON body from hosted.routes.ts
) {
  console.log('handlephp', gameName, postData)
  // Get the Authorization header (which the Service Worker added)
  const forwardedAuthHeader = c.req.header('Authorization')

  // ---
  // --- THIS IS THE FIX ---
  // ---
  // 1. Get the original URL from the incoming request
  const originalUrl = new URL(c.req.url)

  // 2. Get the full query string (e.g., "?sessionId=...&action=init&...")
  //    This includes all the game parameters.
  const queryString = originalUrl.search;

  // 3. The PHP server's base /api/game/{game}/node route
  const phpBaseUrl = `${PHP_SERVER_URL}/api/game/${gameName}/node`;

  // 4. Combine the base URL and the original query string
  const phpServerEndpoint = `${phpBaseUrl}${queryString}`;
  // --- END FIX ---
  let parsedBody = postData;
  if (typeof postData === "string") parsedBody = JSON.parse(postData);
  const action = (postData as any)?.action || "spin";

  const betLevel = parsedBody["bet.betlevel"]! || 1;
  parsedBody["bet.betlevel"] = betLevel;
  // const lines = (game.goldsvetData as any)?.lines?.length || 20;
  const lines = 20;
  const allBetInCoins = betLevel * lines;
  console.log("action ", action);
  // console.log(gameSession);
  if (
    action === "spin" &&
    gameSession.user.activeWallet.balance < allBetInCoins
  ) {
    // throw new Error("Insufficient funds.");
    return publishUserUpdated(gameSession.user.id, "error:22120", {
      balance: gameSession.user.activeWallet.balance,
    });
  }
  // 4. Validate the entire payload
  // const validatedPayload = TopLevelPayloadSchema.parse(topLevelPayload)
  // console.log(parsedBody);
  // 5. Call the PHP engine
  const phpResult = await callPhpEngine(gameSession, parsedBody);
  // console.log(phpResult);
  // 6. Process the result
  if (action === "spin") {
    const phpResultConverted = parseGoldsvetResponse(phpResult);
    console.log(`[NetEnt] Proxying request for user ${user.id} to: ${phpServerEndpoint}`)

    try {
      const response = await fetch(phpServerEndpoint, {
        method: 'POST', // Your api.php is listening for POST
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain, */*', // PHP server might return non-JSON
          'Authorization': forwardedAuthHeader || '', // Forward the auth header
        },
        // 5. Forward the original body. It's likely empty, but we send it
        //    to be safe, as Server.php checks both query and body.
        body: JSON.stringify(postData),
      })

      // Read the response from the PHP server as text
      const responseText = await response.text();
      console.log(chalk.blue("Parsing Goldsvet response:"), responseText);

      try {
        const parsedResponse = parseGoldsvetResponse(responseText);
        if (parsedResponse.totalWin > 0) {
          // await creditTowallets(
          //   user.id,
          //   parsedResponse.totalWin,
          //   `Win from ${game.name}`,
          //   game
          // );
        }
        return response.text();
      } catch (error) {
        console.error(chalk.red("Failed to parse Goldsvet response:"), error);
        throw new Error("Failed to parse PHP engine response");
      }
      //   if (!response.ok) {
      //     console.error(
      //       `[NetEnt] PHP server proxy error (${response.status}) for ${gameName}: ${responseBody}`,
      //     )
      //     // Forward the exact error and status from PHP
      //     return c.text(responseBody, response.status as any)
      //   }

      //   // Success: Stream the raw text/string response back to the game client
      //   return c.text(responseBody)
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


  async function callPhpEngine(
    // gameSession: GameSession,
    payload: any,
    gameName: string
  ): Promise<string | Response> {
    const phpEngineUrl = `${process.env.PHP_ENGINE_URL}/api/game/${gameName}/server`;
    const phpToken = gameSession.phpToken;
    try {
      if (!phpToken) {
        console.error("[AUTH ERROR] No token provided");
        throw new Error("no token");
      }
      const headers = {
        Connection: "keep-alive",
        "Content-Type": "application/json",
        Cookie: `laravel_session=${phpToken}`,
        Authorization: `Bearer ${phpToken}`,
      };

      console.log(chalk.blue("Calling PHP Engine URL:"), phpEngineUrl);
      const response = await fetch(phpEngineUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          chalk.red(
            `PHP engine error for ${gameName}: ${response.status}`
          ),
          errorText
        );

        return response;
      }
      if (payload.action !== "spin") {
        return await response.text();
      }
      const responseText = await response.text();
      console.log(chalk.blue("Parsing Goldsvet response:"), responseText);

      try {
        const parsedResponse = parseGoldsvetResponse(responseText);
        if (parsedResponse.totalWin > 0) {
          // credit a wallet
        }
        return response.text();
      } catch (error) {
        console.error(chalk.red("Failed to parse Goldsvet response:"), error);
        throw new Error("Failed to parse PHP engine response");
      }
      return "";
    } catch (error) {
      console.error(chalk.red("Failed to communicate with PHP engine:"), error);
      throw new Error("Could not process game request due to an internal error.");
    }
  }
}