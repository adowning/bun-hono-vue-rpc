import { gameplayService } from "./gameplay.service"

/**
  * Processes a PHP game bet outcome by executing the PHP game calculator
  * and then processing the bet outcome through the existing bet processing logic.
  */
class PhpBetService {
    async handlePhpBet(
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

            // Spawn PHP process to execute DirectPHPHandler.php with the game name
            const phpPath = join(__dirname, '../providers/php', gameName, 'DirectPHPSpinHandler.php')
            const phpProcess = spawn('php', [phpPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: join(__dirname, '../providers/php', gameName)
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
}
export const phpBetService = new PhpBetService()

// /* eslint-disable @typescript-eslint/ban-ts-comment */

// import db, {
//   GameSession,
//   Games,
//   OperatorsWithRelations,
//   gameSessions,
//   games,
//   operators,
//   transactions,
//   wallets
// } from "@/types";
// import chalk from "chalk";
// import { eq, sql } from "drizzle-orm";
// import { creditTowallets } from "../wallet/wallet.service";
// // import { TypeOfTransaction } from '../../../shared/zero'
// import { PhpApiResponse, SpinResponseSchema } from "./php.types";

// /**
//  * Determines the desired outcome of a spin based on RTP.
//  */
// function determineWinType(
//   game: Pick<Games, "totalWagered" | "totalWon">,
//   operator: Pick<OperatorsWithRelations, "balance">
// ): "bonus" | "win" | "none"
// {
//   const totalWagered = game.totalWagered ?? 0;
//   const totalWon = game.totalWon ?? 0;
//   const currentRTP = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 100;

//   //@ts-ignore
//   const targetRTP = 95;

//   const randomValue = Math.random() * 100;

//   if (operator.balance > 100000 && currentRTP < targetRTP && randomValue < 5) {
//     return "bonus";
//   }

//   const winChance = currentRTP < targetRTP ? 40 : 20;
//   if (randomValue < winChance) {
//     return "win";
//   }

//   return "none";
// }
// /**
//  * Parses a URL-encoded response string from the PHP engine into a PhpApiResponse object.
//  * Handles goldsvet developer responses.
//  */
// function parseGoldsvetResponse(responseText: string): PhpApiResponse
// {
//   const params = new URLSearchParams(responseText);
//   const result: Record<string, any> = {};

//   // Parse all parameters
//   params.forEach((value, key) =>
//   {
//     result[key] = value;
//   });

//   // Map to PhpApiResponse structure
//   const phpResponse: PhpApiResponse = {
//     newBalance: parseInt(result.credit) || 0,
//     newBalanceCents: result["game.win.cents"]
//       ? parseInt(result["game.win.cents"])
//       : undefined,
//     totalWin: parseInt(result["totalwin.coins"]) || 0,
//     totalWinCents: result["totalwin.cents"]
//       ? parseInt(result["totalwin.cents"])
//       : undefined,
//     newGameData: result, // Store all data for persistence
//     reels: parseReels(result),
//     winLines: parseWinLines(result),
//     bonusWin: result["game.win.amount"]
//       ? parseInt(result["game.win.amount"])
//       : undefined,
//     totalFreeGames: result["totalfreegames"]
//       ? parseInt(result["totalfreegames"])
//       : undefined,
//     currentFreeGames: result["currentfreegames"]
//       ? parseInt(result["currentfreegames"])
//       : undefined,
//     isRespin: result.respin === "true",
//   };

//   return phpResponse;
// }

// /**
//  * Parses reel data from rs.* parameters into a structured reels object.
//  */
// function parseReels(params: Record<string, any>): Record<string, any>
// {
//   const reels: Record<string, any> = {};

//   // Find all rs.* keys and organize by reel set and reel index
//   Object.keys(params).forEach((key) =>
//   {
//     if (key.startsWith("rs.")) {
//       const parts = key.split(".");
//       if (parts.length >= 5 && parts[2] === "r") {
//         const reelSet = parts[1]!;
//         const reelIndex = parseInt(parts[3]!);
//         const property = parts[4]!;

//         if (!reelSet || isNaN(reelIndex)) return;

//         if (!reels[reelSet]) {
//           reels[reelSet] = {};
//         }
//         if (!reels[reelSet][reelIndex]) {
//           reels[reelSet][reelIndex] = {};
//         }

//         if (property === "syms") {
//           // Decode URL-encoded symbols (e.g., SYM9%2CSYM7%2CSYM5)
//           reels[reelSet][reelIndex].symbols = decodeURIComponent(
//             params[key]
//           ).split(",");
//         } else if (property === "pos") {
//           reels[reelSet][reelIndex].position = parseInt(params[key]);
//         } else if (property === "hold") {
//           reels[reelSet][reelIndex].hold = params[key] === "true";
//         } else if (property === "attention") {
//           reels[reelSet][reelIndex].attention = parseInt(params[key]);
//         }
//       }
//     }
//   });

//   return reels;
// }

// /**
//  * Parses win line data from ws.* parameters into a structured winLines array.
//  */
// function parseWinLines(params: Record<string, any>): any[]
// {
//   const winLines: any[] = [];

//   // Find all ws.* keys and organize by win set index
//   Object.keys(params).forEach((key) =>
//   {
//     if (key.startsWith("ws.")) {
//       const parts = key.split(".");
//       if (parts.length >= 3) {
//         const winSetIndex = parseInt(parts[1]!);
//         const property = parts[2];

//         if (isNaN(winSetIndex)) return;

//         if (!winLines[winSetIndex]) {
//           winLines[winSetIndex] = {};
//         }

//         if (property === "types" && parts[3]) {
//           if (!winLines[winSetIndex].types) {
//             winLines[winSetIndex].types = {};
//           }
//           winLines[winSetIndex].types[parts[3]] = params[key];
//         } else if (property === "pos" && parts[3]) {
//           if (!winLines[winSetIndex].positions) {
//             winLines[winSetIndex].positions = {};
//           }
//           winLines[winSetIndex].positions[parts[3]] = decodeURIComponent(
//             params[key]
//           );
//         } else if (property === "betline") {
//           winLines[winSetIndex].betLine = parseInt(params[key]);
//         } else if (property === "sym") {
//           winLines[winSetIndex].symbol = params[key];
//         } else if (property === "direction") {
//           winLines[winSetIndex].direction = params[key];
//         } else if (property === "reelset") {
//           winLines[winSetIndex].reelSet = params[key];
//         }
//       }
//     }
//   });

//   return winLines;
// }

// /**
//  * Sends the game state to the PHP engine.
//  */
// export async function callPhpEngine(
//   gameSession: GameSession,
//   payload: any
// ): Promise<string | Response>
// {
//   const phpEngineUrl = `${process.env.PHP_ENGINE_URL}/api/game/${gameSession.gameName}/server`;
//   const phpToken = gameSession.phpToken;
//   try {
//     if (!phpToken) {
//       console.error("[AUTH ERROR] No token provided");
//       throw new Error("no token");
//     }
//     const headers = {
//       Connection: "keep-alive",
//       "Content-Type": "application/json",
//       Cookie: `laravel_session=${phpToken}`,
//       Authorization: `Bearer ${phpToken}`,
//     };
//     const body = {
//       ...gameSession,
//       payload,
//       phpToken,
//     };
//     // console.log("[AUTH DEBUG] Headers - Authorization:", `Bearer ${token}`);
//     // console.log("[AUTH DEBUG] Headers - Cookie:", `laravel_session=${token}`);
//     console.log(chalk.blue("Calling PHP Engine URL:"), phpEngineUrl);
//     console.log(body);
//     const response = await fetch(phpEngineUrl, {
//       method: "POST",
//       body: JSON.stringify(body),
//       headers,
//     });
//     // console.log(response.data);
//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(
//         chalk.red(
//           `PHP engine error for ${gameSession.game.name}: ${response.status}`
//         ),
//         errorText
//       );
//       // throw new Error(
//       //   `Upstream PHP server responded with status: ${response.status}`
//       // );

//       return response;
//     }
//     if (payload.action !== "spin") {
//       return await response.text();
//     }
//     switch (gameSession.game.developer) {
//       case "netgame": {
//         const responseText = await response.text();

//         return responseText; //{ stringResponse: responseText } as unknown as PhpApiResponse;
//       }
//       case "netent": {
//         const responseText = await response.text();
//         console.log(chalk.blue("Parsing Goldsvet response:"), responseText);

//         try {
//           const parsedResponse = parseGoldsvetResponse(responseText);
//           if (parsedResponse.totalWin > 0) {
//             await creditTowallets(
//               user.id,
//               parsedResponse.totalWin,
//               `Win from ${game.name}`,
//               game
//             );
//           }
//           return response.text();
//         } catch (error) {
//           console.error(chalk.red("Failed to parse Goldsvet response:"), error);
//           throw new Error("Failed to parse PHP engine response");
//         }
//       }
//     }
//     return "";
//   } catch (error) {
//     console.error(chalk.red("Failed to communicate with PHP engine:"), error);
//     throw new Error("Could not process game request due to an internal error.");
//   }
// }

// /**
//  * Main handler for processing a game action.
//  */
// export async function handlePhpCall(gameSession: GameSession, body: any)
// {
//   let parsedBody = body;
//   if (typeof body === "string") parsedBody = JSON.parse(body);
//   const action = (body as any)?.action || "spin";

//   const betLevel = parsedBody["bet.betlevel"]! || 1;
//   parsedBody["bet.betlevel"] = betLevel;
//   // const lines = (game.goldsvetData as any)?.lines?.length || 20;
//   const lines = 20;
//   const allBetInCoins = betLevel * lines;
//   console.log("action ", action);
//   // console.log(gameSession);
//   if (
//     action === "spin" &&
//     gameSession.user.activeWallet.balance < allBetInCoins
//   ) {
//     // throw new Error("Insufficient funds.");
//     return publishUserUpdated(gameSession.user.id, "error:22120", {
//       balance: gameSession.user.activeWallet.balance,
//     });
//   }
//   // 4. Validate the entire payload
//   // const validatedPayload = TopLevelPayloadSchema.parse(topLevelPayload)
//   // console.log(parsedBody);
//   // 5. Call the PHP engine
//   const phpResult = await callPhpEngine(gameSession, parsedBody);
//   // console.log(phpResult);
//   // 6. Process the result
//   if (action === "spin") {
//     const phpResultConverted = parseGoldsvetResponse(phpResult);
//     const result = await db.transaction(async (tx) =>
//     {
//       await tx.insert(transactions).values({
//         userId: user.id,
//         type: "BET_PLACE",
//         amount: -allBetInCoins,
//         walletId: wallet.id,
//         relatedGameId: game.id,
//         description: `Bet on ${game.title}`,
//         balanceBefore: wallet.balance,
//         balanceAfter: wallet.balance - allBetInCoins,
//       });

//       if (phpResultConverted.totalWin > 0) {
//         await tx.insert(transactions).values({
//           userId: user.id,
//           type: "BET_WIN",
//           amount: phpResultConverted.totalWin,
//           walletId: wallet.id,
//           relatedGameId: game.id,
//           description: `Win on ${game.title}`,
//           balanceBefore: wallet.balance - allBetInCoins,
//           balanceAfter: phpResultConverted.newBalance,
//         });
//       }
//       console.log(phpResultConverted);
//       await Promise.all([
//         tx
//           .update(wallets)
//           .set({ balance: phpResultConverted.newBalance })
//           .where(eq(wallets.id, wallet.id)),
//         tx
//           .update(gameSessions)
//           .set({ phpGameData: phpResultConverted.newGameData })
//           .where(eq(gameSessions.id, gameSession.id)),
//         tx
//           .update(games)
//           .set({
//             totalWagered: sql`${games.totalWagered} + ${allBetInCoins}`,
//             totalWon: sql`${games.totalWon} + ${phpResultConverted.totalWin}`,
//           })
//           .where(eq(games.id, game.id)),
//         phpResultConverted.newBank !== undefined
//           ? //@ts-ignore
//           tx
//             .update(operators)
//             .set({ balance: phpResultConverted.newBank })
//             .where(eq(operators.id, operator.id))
//           : Promise.resolve(),
//       ]);

//       return { balance: phpResultConverted.newBalance };
//     });

//     const finalResponse = {
//       success: true,
//       message: "Spin processed successfully",
//       data: {
//         winAmount: phpResultConverted.totalWin,
//         balance: result.balance,
//         reels: phpResultConverted.reels,
//         winLines: phpResultConverted.winLines,
//         isBonus: (phpResultConverted.totalFreeGames ?? 0) > 0,
//         freeSpinState: phpResultConverted.freeSpinState,
//         isRespin: phpResultConverted.isRespin ?? false,
//       },
//     };

//     return SpinResponseSchema.parse(finalResponse);
//   }

//   return phpResult; //.stringResponse ?? phpResult;
// }

// // Test function for parsing the provided example response
// function testParseGoldsvetResponse()
// {
//   const exampleResponse =
//     "previous.rs.i0=basic&rs.i0.r.i1.pos=15&gameServerVersion=1.5.0&g4mode=false&game.win.coins=15&playercurrencyiso=USD&historybutton=false&rs.i0.r.i1.hold=false&current.rs.i0=basic&rs.i0.r.i4.hold=false&next.rs=basic&gamestate.history=basic&playforfun=false&jackpotcurrencyiso=USD&clientaction=spin&rs.i0.r.i1.syms=SYM9%2CSYM7%2CSYM5&rs.i0.r.i2.hold=false&rs.i0.r.i4.syms=SYM0%2CSYM3%2CSYM8&game.win.cents=15&rs.i0.r.i2.pos=80&rs.i0.id=basic&totalwin.coins=15&credit=100320&totalwin.cents=15&gamestate.current=basic&gameover=true&rs.i0.r.i0.hold=false&jackpotcurrency=%26%23x20AC%3B&multiplier=1&rs.i0.r.i3.pos=119&last.rs=basic&rs.i0.r.i4.pos=53&rs.i0.r.i0.syms=SYM10%2CSYM9%2CSYM5&rs.i0.r.i3.syms=SYM7%2CSYM10%2CSYM7&isJackpotWin=false&gamestate.stack=basic&nextaction=spin&rs.i0.r.i0.pos=114&wavecount=1&gamesoundurl=&rs.i0.r.i2.syms=SYM3%2CSYM8%2CSYM7&rs.i0.r.i3.hold=false&game.win.amount=1500&rs.i0.r.i0.syms=SYM3%2CSYM5%2CSYM8&rs.i0.r.i1.syms=SYM10%2CSYM6%2CSYM5&rs.i0.r.i2.syms=SYM6%2CSYM5%2CSYM9&rs.i0.r.i3.syms=SYM9%2CSYM3%2CSYM7&rs.i0.r.i4.syms=SYM7%2CSYM4%2CSYM10&ws.i0.reelset=basic&ws.i0.types.i0.coins=15&ws.i0.pos.i0=0%2C1&ws.i0.pos.i1=1%2C2&ws.i0.pos.i2=2%2C1&ws.i0.betline=10&ws.i0.sym=SYM5&ws.i0.direction=left_to_right&ws.i0.types.i0.cents=15&rs.i0.r.i3.attention.i0=1&rs.i0.r.i0.attention.i0=2&rs.i0.r.i2.attention.i0=1";

//   try {
//     const result = parseGoldsvetResponse(exampleResponse);
//     console.log(chalk.green("✅ Parsing test successful!"));
//     console.log(chalk.blue("Parsed result:"), JSON.stringify(result, null, 2));
//     return result;
//   } catch (error) {
//     console.error(chalk.red("❌ Parsing test failed:"), error);
//     throw error;
//   }
// }

// // Uncomment the line below to run the test
// // testParseGoldsvetResponse();
// import axios from "axios";
// import { publishUserUpdated } from "../websocket/websocket.service";

// const API_BASE_URL = "https://php.cashflowcasino.com/api/server";
// const API_KEY = process.env.API_SERVER_KEYS;
// console.log(API_KEY);
// const headers = {
//   "X-API-Key": API_KEY,
//   "Content-Type": "application/json",
// };

// // Update balance
// export const updateBalance = async (
//   userId: number,
//   amount: number,
//   type: "add" | "sub"
// ) =>
// {
//   try {
//     const response = await axios.post(
//       `${API_BASE_URL}/balance/update`,
//       {
//         user_id: userId,
//         amount: Math.abs(amount),
//         type,
//         reason: "External API update",
//         transaction_id: `tx_${Date.now()}_${userId}`,
//       },
//       { headers }
//     );

//     // return response.data;
//     return true;
//   } catch (error) {
//     console.error("Balance update failed:", error);
//     // throw error;
//     return false;
//   }
// };

// // Get balance
// export const getBalance = async (userId: number) =>
// {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/balance/${userId}`, {
//       headers,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error("Balance fetch failed:", error.response.data);
//     return false;
//   }
// };
