import { Context } from 'hono'
import { activeBonusTable, betLogTable, db, eq, gameTable, User, userTable } from '@/db'
import { AppEnv } from '@/middleware/auth.middleware'
import { PhpApiResponse } from '@/utils/php.types';
import chalk from 'chalk';
import { gameplayService } from '@/services/gameplay.service';
import { sessionService } from '@/services/session.service';

// Types
interface GameContext {
  user: {
    id: number;
    balance: number;
    count_balance: number;
    address: number;
  };
  game: {
    id: number;
    name: string;
    stat_in: number;
    stat_out: number;
    denomination: number;
    bet: number;
    rezerv: number;
    slotViewState: string;
    advanced: string;
  };
  shop: {
    id: number;
    name: string;
    currency: string;
    max_win: number;
    percent: number;
  };
  jpgs: any[];
  gameBank: number;
  bonusBank: number;
  gameData: any;
  gameDataStatic: any;
  gameLogs: string[];
  newGameLogs: any[];
  newStatGames: any[];
  internalErrors: string[];
}

interface PhpInputData {
  gameData: {
    user: any;
    game: any;
    shop: any;
    bank: any;
    stat_in: any;
    stat_out: any;
  };
  slotEvent: string;
}

// Environment configuration
const CONFIG = {
  PHP_SERVER_URL: Bun.env.PHP_SERVER_URL || 'http://localhost:8000',
  DEFAULT_DENOMINATION: 1,
  DEFAULT_BET: 1,
  DEFAULT_REZERV: 0,
  DEFAULT_SLOT_VIEW_STATE: 'Normal',
  DEFAULT_ADVANCED: '',
  DEFAULT_MAX_WIN: 1000000,
  DEFAULT_PERCENT: 95,
  DEFAULT_LINES: 20
} as const;

// Logging utilities
const logger = {
  info: (message: string, ...args: any[]) => console.log(chalk.blue(`[NetEnt-INFO] ${message}`), ...args),
  warn: (message: string, ...args: any[]) => console.warn(chalk.yellow(`[NetEnt-WARN] ${message}`), ...args),
  error: (message: string, ...args: any[]) => console.error(chalk.red(`[NetEnt-ERROR] ${message}`), ...args),
  debug: (message: string, ...args: any[]) => console.debug(chalk.gray(`[NetEnt-DEBUG] ${message}`), ...args),
  fatal: (message: string, ...args: any[]) => console.error(chalk.red.bold(`[NetEnt-FATAL] ${message}`), ...args)
};

/**
 * Parses reel data from rs.* parameters into a structured reels object.
 */
function parseReels(params: Record<string, any>): Record<string, any> {
  logger.debug('Parsing reels from params:', Object.keys(params).filter(k => k.startsWith('rs.')));

  const reels: Record<string, any> = {};

  Object.keys(params).forEach((key) => {
    if (!key.startsWith("rs.")) return;

    const parts = key.split(".");
    if (parts.length < 5 || parts[2] !== "r") return;

    const reelSet = parts[1];
    const reelIndex = parts[3] ? parseInt(parts[3]) : NaN;
    const property = parts[4];

    if (!reelSet || Number.isNaN(reelIndex)) return;

    if (!reels[reelSet]) {
      reels[reelSet] = {};
    }
    if (!reels[reelSet][reelIndex]) {
      reels[reelSet][reelIndex] = {};
    }

    try {
      switch (property) {
        case "syms":
          reels[reelSet][reelIndex].symbols = decodeURIComponent(params[key]).split(",");
          break;
        case "pos":
          reels[reelSet][reelIndex].position = parseInt(params[key]) || 0;
          break;
        case "hold":
          reels[reelSet][reelIndex].hold = params[key] === "true";
          break;
        case "attention":
          reels[reelSet][reelIndex].attention = parseInt(params[key]) || 0;
          break;
      }
    } catch (error) {
      logger.error(`Error parsing reel property ${property} for key ${key}:`, error);
    }
  });

  logger.debug('Parsed reels:', JSON.stringify(reels, null, 2));
  return reels;
}

/**
 * Parses win line data from ws.* parameters into a structured winLines array.
 */
function parseWinLines(params: Record<string, any>): any[] {
  logger.debug('Parsing win lines from params:', Object.keys(params).filter(k => k.startsWith('ws.')));

  const winLines: any[] = [];

  Object.keys(params).forEach((key) => {
    if (!key.startsWith("ws.")) return;

    const parts = key.split(".");
    if (parts.length < 3) return;

    const winSetIndex = parts[1] ? parseInt(parts[1]) : NaN;
    const property = parts[2];

    if (Number.isNaN(winSetIndex)) return;

    if (!winLines[winSetIndex]) {
      winLines[winSetIndex] = {};
    }

    try {
      if (property === "types" && parts[3]) {
        if (!winLines[winSetIndex].types) {
          winLines[winSetIndex].types = {};
        }
        winLines[winSetIndex].types[parts[3]] = params[key];
      } else if (property === "pos" && parts[3]) {
        if (!winLines[winSetIndex].positions) {
          winLines[winSetIndex].positions = {};
        }
        winLines[winSetIndex].positions[parts[3]] = decodeURIComponent(params[key]);
      } else if (property === "betline") {
        winLines[winSetIndex].betLine = parseInt(params[key]) || 0;
      } else if (property === "sym") {
        winLines[winSetIndex].symbol = params[key];
      } else if (property === "direction") {
        winLines[winSetIndex].direction = params[key];
      } else if (property === "reelset") {
        winLines[winSetIndex].reelSet = params[key];
      }
    } catch (error) {
      logger.error(`Error parsing win line property ${property} for key ${key}:`, error);
    }
  });

  logger.debug('Parsed win lines:', JSON.stringify(winLines, null, 2));
  return winLines;
}

/**
 * Parses a URL-encoded response string from the PHP engine into a PhpApiResponse object.
 */
function parseGoldsvetResponse(responseText: string): PhpApiResponse {
  try {
    logger.debug('Parsing Goldsvet response:', responseText);

    const params = new URLSearchParams(responseText);
    const result: Record<string, any> = {};

    // Parse all parameters
    params.forEach((value, key) => {
      result[key] = value;
    });

    const parsedResponse: PhpApiResponse = {
      newBalance: parseInt(result.credit) || 0,
      newBalanceCents: result["game.win.cents"] ? parseInt(result["game.win.cents"]) : undefined,
      totalWin: parseInt(result["totalwin.coins"]) || 0,
      totalWinCents: result["totalwin.cents"] ? parseInt(result["totalwin.cents"]) : undefined,
      newGameData: result,
      reels: parseReels(result),
      winLines: parseWinLines(result),
      bonusWin: result["game.win.amount"] ? parseInt(result["game.win.amount"]) : undefined,
      totalFreeGames: result["totalfreegames"] ? parseInt(result["totalfreegames"]) : undefined,
      currentFreeGames: result["currentfreegames"] ? parseInt(result["currentfreegames"]) : undefined,
      isRespin: result.respin === "true",
    };

    logger.info('Successfully parsed Goldsvet response', {
      totalWin: parsedResponse.totalWin,
      newBalance: parsedResponse.newBalance,
      isRespin: parsedResponse.isRespin
    });

    return parsedResponse;
  } catch (error) {
    logger.error('Failed to parse Goldsvet response:', error);
    throw new Error(`Failed to parse PHP engine response: ${error}`);
  }
}

/**
 * Builds the game context for PHP processing
 */
async function buildGameContext(
  fullUser: any,
  game: any,
  session: any,
  gameLogs: any[]
): Promise<GameContext> {
  const totalBonusBalance = fullUser.activeBonuses.reduce(
    (sum: number, b: any) => sum + (b.currentBonusBalance || 0), 0
  );

  return {
    user: {
      id: fullUser.id,
      balance: fullUser.userBalance?.realBalance || 0,
      count_balance: totalBonusBalance,
      address: 0,
    },
    game: {
      id: game.id,
      name: game.name,
      stat_in: game.totalBetAmount || 0,
      stat_out: game.totalWonAmount || 0,
      denomination: (game.goldsvetData as any)?.denomination || CONFIG.DEFAULT_DENOMINATION,
      bet: (game.goldsvetData as any)?.bet || CONFIG.DEFAULT_BET,
      rezerv: (game.goldsvetData as any)?.rezerv || CONFIG.DEFAULT_REZERV,
      slotViewState: (game.goldsvetData as any)?.slotviewstate || CONFIG.DEFAULT_SLOT_VIEW_STATE,
      advanced: (game.goldsvetData as any)?.advanced || CONFIG.DEFAULT_ADVANCED
    },
    shop: {
      id: fullUser.operator.id,
      name: fullUser.operator.name,
      currency: 'USD',
      max_win: (fullUser.operator.gameSettings as any)?.maxWin || CONFIG.DEFAULT_MAX_WIN,
      percent: CONFIG.DEFAULT_PERCENT
    },
    jpgs: [],
    gameBank: fullUser.operator.slotsBalance || 0,
    bonusBank: fullUser.operator.arcadeBalance || 0,
    gameData: session.sessionData || {},
    gameDataStatic: {},
    gameLogs: gameLogs.map(log => (log.metadata as any)?.rawResponse || ''),
    newGameLogs: [],
    newStatGames: [],
    internalErrors: []
  };
}

/**
 * Calls the PHP engine to process game requests
 */
async function callPhpEngine(
  gameName: string,
  accessToken: string,
  payload: any = {}
): Promise<string> {
  const phpEngineUrl = `${CONFIG.PHP_SERVER_URL}/api/game/${gameName}/server`;

  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    const headers = {
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Cookie': `laravel_session=${accessToken}`,
      'Authorization': `Bearer ${accessToken}`,
    };

    logger.info('Calling PHP engine:', phpEngineUrl);

    const response = await fetch(phpEngineUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`PHP engine error for ${gameName}: ${response.status}`, errorText);
      throw new Error(`PHP engine returned ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    logger.debug('Raw PHP engine response:', responseText);

    return responseText;
  } catch (error) {
    logger.error('Failed to communicate with PHP engine:', error);
    throw new Error(`Could not process game request: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Proxies request to PHP server node endpoint
 */
async function proxyToPhpNode(
  gameName: string,
  queryString: string,
  forwardedAuthHeader: string | undefined,
  postData: any
): Promise<string> {
  const phpBaseUrl = `${CONFIG.PHP_SERVER_URL}/api/game/${gameName}/node`;
  const phpServerEndpoint = `${phpBaseUrl}${queryString}`;

  logger.info(`Proxying request to: ${phpServerEndpoint}`);

  try {
    const response = await fetch(phpServerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain, */*',
        'Authorization': forwardedAuthHeader || '',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Proxy error (${response.status}) for ${gameName}:`, errorText);
      throw new Error(`Proxy failed with status ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    logger.debug('Proxy response:', responseText);
    return responseText;
  } catch (error) {
    logger.fatal(`Proxy to PHP server failed for ${gameName}:`, error);
    throw error;
  }
}

/**
 * Main export: Processes NetEnt game requests via PHP engine
 */
export async function handleNetentRequest(
  c: Context,
  user: User,
  gameName: string,
  gameData: any,
  wagerAmount: number,
  gameSessionId: string | null = null
) {
  const correlationId = Math.random().toString(36).substring(7);
  logger.info(`[${correlationId}] Starting NetEnt request processing`, { gameName, wagerAmount });

  try {
    // Validate inputs
    if (!user?.id) throw new Error('Invalid user data');
    if (!gameName) throw new Error('Game name is required');
    if (wagerAmount < 0) throw new Error('Wager amount must be non-negative');

    // Fetch user and game data in parallel
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
    ]);

    // Validate fetched data
    if (!fullUser?.userBalance) {
      throw new Error('Failed to fetch complete user context');
    }
    if (!game) {
      throw new Error(`Game not found: ${gameName}`);
    }

    // Create or get game session
    const session = await sessionService.getOrCreateGameSession(user.id, game.id);
    await buildGameContext(fullUser, game, session, gameLogs); // context built for potential future use

    // Prepare PHP input data
    const phpInput: PhpInputData = {
      gameData: {
        user: gameData.user,
        game: gameData.game,
        shop: gameData.shop,
        bank: gameData.bank,
        stat_in: gameData.stat_in,
        stat_out: gameData.stat_out
      },
      slotEvent: 'bet'
    };

    // Process the bet through PHP engine
    const phpResponse = await callPhpEngine(gameName, '', phpInput);

    // Parse the response
    let phpResult: PhpApiResponse;
    try {
      // Try to parse as JSON first
      phpResult = JSON.parse(phpResponse);
    } catch {
      // If not JSON, treat as URL-encoded response
      phpResult = parseGoldsvetResponse(phpResponse);
    }

    const winAmount = phpResult.totalWin || 0;

    // Process bet outcome
    const betOutcomeResult = await gameplayService.processBetOutcome(
      user,
      gameName,
      gameSessionId,
      wagerAmount,
      winAmount
    );

    logger.info(`[${correlationId}] Successfully processed NetEnt request`, {
      winAmount,
      wagerAmount,
      success: betOutcomeResult.success
    });

    return {
      phpGameResult: phpResult,
      betOutcome: betOutcomeResult,
      success: betOutcomeResult.success,
      winAmount,
      wagerAmount,
      correlationId
    };

  } catch (error: any) {
    logger.error(`[${correlationId}] Error processing NetEnt request:`, error);
    return {
      success: false,
      error: `NetEnt processing failed: ${error.message}`,
      phpGameResult: null,
      betOutcome: null,
      winAmount: 0,
      wagerAmount,
      correlationId
    };
  }
}
function correctQueryString(malformedQueryString: string): string {
  let correctedString = malformedQueryString;

  // 1. Correct the improper comma escape (\2C -> %2C)
  // This specifically targets the sequence of backslash-2-C
  correctedString = correctedString.replace(/\\2C/g, '%2C');

  // 2. Correct unencoded literal percent signs (e.g., in "1%").
  // Matches a '%' that is NOT followed by a valid hex code (like %2C or %26, etc.)
  // and replaces it with the correct URL-encoded percent sign (%25).
  // Note: The original string seems to have literal % signs *before* the \2C in some cases.
  // This regex looks for '%' followed by a digit.
  correctedString = correctedString.replace(/%(\d)/g, '%25$1');

  // 3. Correct HTML Entity for Euro (&#x20AC; -> %E2%82%AC) in currency fields
  // This targets the specific entity found in your string.
  correctedString = correctedString.replace(/%26%23x20AC%3B/g, '%E2%82%AC');

  // Note: The input already seems to have ampersands encoded as %26.
  // If the input was '&#x20AC;', the proper replacement would be needed here.

  return correctedString;
}

// --- Example Usage ---

// const malformedString = "gameServerVersion=1.21.0&g4mode=false&historybutton=false&gameEventSetters.enabled=false&clientaction=init&gameover=true&nextaction=spin&playercurrency=%26%23x20AC%3B&denomination.standard=1&betlevel.standard=1&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&gamesoundurl=&denomination.all=1%\\2C2%\\2C5%\\2C10%\\C20%\\C25%\\C50%\\C100%\\C200%\\C250%\\C500%\\C1000%\\C2000%\\C2500%\\C5000%\\C10000&betlevel.all=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&credit=0&playercurrencyiso=USD&jackpotcurrency=%26%23x20AC%3B&jackpotcurrencyiso=USD&restore=false&rs.i0.r.i0.syms=SYM5%2CSYM6%2CSYM3%2CSYM3&rs.i0.r.i1.syms=SYM3%2CSYM5%2CSYM4%2CSYM3&rs.i0.r.i2.syms=SYM2%2CSYM1%2CSYM4%2CSYM4&rs.i0.r.i3.syms=SYM4%2CSYM1%2CSYM6%2CSYM1&rs.i0.r.i4.syms=SYM6%2CSYM2%2CSYM4%2CSYM5&rs.i0.r.i0.pos=3&rs.i0.r.i1.pos=3&rs.i0.r.i2.pos=4&rs.i0.r.i3.pos=2&rs.i0.r.i4.pos=10&rs.i1.r.i0.pos=3&rs.i1.r.i1.pos=3&rs.i1.r.i2.pos=6&rs.i1.r.i3.pos=7&rs.i1.r.i4.pos=9";


/**
 * Handles HTTP requests for NetEnt games by proxying to PHP server
 */
export async function handleNetentBet(
  c: Context<AppEnv>,
  user: User,
  gameName: string,
  postData: any
) {
  const correlationId = Math.random().toString(36).substring(7);
  logger.info(`[${correlationId}] Handling NetEnt bet request`, { gameName });

  try {
    // Extract request data
    const forwardedAuthHeader = c.req.header('Authorization');
    const accessToken = c.get('accessToken');
    const originalUrl = new URL(c.req.url);
    const queryString = originalUrl.search;

    // Parse request parameters
    const action = c.req.query('action') || 'spin';
    const betLevel = (action === 'spin' || action === 'bet') ?
      parseInt(c.req.query('betLevel') || '1') || 1 : 1;

    const lines = CONFIG.DEFAULT_LINES;
    const allBetInCoins = betLevel * lines;

    logger.info(`[${correlationId}] Request details`, {
      action,
      betLevel,
      lines,
      allBetInCoins
    });

    // Get or create game session
    const gameSession = await sessionService.getOrCreateGameSession(user.id, gameName);

    // Check sufficient funds for spin actions
    const userBalance = (gameSession as any).user?.activeWallet?.balance || 0;
    if (action === "spin" && userBalance < allBetInCoins) {
      logger.warn(`[${correlationId}] Insufficient funds`, {
        required: allBetInCoins,
        available: userBalance
      });

      return c.json({
        responseEvent: 'error',
        serverResponse: 'error:22120',
        balance: userBalance,
      }, 400);
    }

    // Process different action types
    if (action === "spin") {
      try {
        // Proxy to PHP node endpoint
        const responseText = await proxyToPhpNode(
          gameName,
          queryString,
          forwardedAuthHeader,
          postData
        );

        // Parse and return the response
        const parsedResponse = parseGoldsvetResponse(responseText);

        if (parsedResponse.totalWin > 0) {
          logger.info(`[${correlationId}] Player won ${parsedResponse.totalWin} coins`);
        }

        return c.text(responseText);
      } catch (error) {
        logger.error(`[${correlationId}] Failed to process spin:`, error);
        throw error;
      }
    } else {
      // Handle non-spin actions (init, etc.)
      const phpResult = await callPhpEngine(gameName, accessToken || '', postData);
      const correctedString = correctQueryString(phpResult);

      console.log("Original:\n", phpResult);
      console.log("---");
      console.log("Corrected:\n", correctedString);
      return c.text(correctedString);
    }

  } catch (error: any) {
    logger.error(`[${correlationId}] Error in handleNetentBet:`, error);

    return c.json({
      responseEvent: 'error',
      serverResponse: 'InternalError',
      details: error.message,
      correlationId
    }, 500);
  }
}