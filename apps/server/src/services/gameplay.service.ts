import {
  db,
  eq,
  and,
  sql,
  User,
  UserBalance,
  ActiveBonus,
  userBalanceTable,
  activeBonusTable,
  operatorTable,
  betLogTable,
  gameSessionTable,
  gameTable,
  NewBetLog
} from '@/db'
import { userStateCache } from './cache.service'
import { spawn } from 'child_process'
import { join } from 'path'

class SlotSettings {
  public userId: string
  public game: Game
  public CurrentDenom: number;
  public CurrentDenomination: number;
  public slotId: string;
  private gameData: Map<string, any>;

  constructor(game: any, userId: string) {
    this.CurrentDenom = 0.01; // Default value
    this.CurrentDenomination = 0.01; // Default value
    this.slotId = "someSlotId";
    this.game = game
    this.gameData = new Map<string, any>();
    this.userId = userId
    // Pre-populate sample data for the logic paths
    this.gameData.set(this.slotId + 'GameDenom', 0.05);
    this.gameData.set(this.slotId + 'FreeGames', 10);
    this.gameData.set(this.slotId + 'CurrentFreeGame', 5);
  }

  /** Stub: Checks if the game is active. */
  is_active(): boolean {
    // Return true to allow the script to proceed
    return true;
  }

  /** Stub: Returns a sample balance. */
  GetBalance(): number {
    // Return a sample balance
    return 1000;
  }

  /** Stub: Stores game data. */
  SetGameData(key: string, value: any): void {
    console.log(`Setting GameData: ${key} = ${value}`);
    this.gameData.set(key, value);
  }

  /** Stub: Checks if game data exists. */
  HasGameData(key: string): boolean {
    return this.gameData.has(key);
  }

  /** Stub: Retrieves game data. */
  GetGameData(key: string): any {
    return this.gameData.get(key);
  }
}


/**
 * Service for handling all gameplay-related logic,
 * primarily the bet/win processing.
 */
class GameplayService {

  private slotSettings: Map<string, SlotSettings>
  /**
   * Wraps the entire bet/win/payout logic in a single
   * database transaction to ensure atomicity.
   */
  async processBetOutcome(
    user: User,
    gameId: string,
    gameSessionId: string | null,
    wagerAmount: number,
    winAmount: number
  ) {
    const { id: userId, operatorId } = user

    console.log(`[DEBUG] Starting bet processing for user ${userId}, game ${gameId}`)
    console.log(`[DEBUG] Wager: ${wagerAmount}, Win: ${winAmount}`)

    let result: any // To store the transaction result

    try {
      result = await db.transaction(async (tx) => {
        // --- 1. Lock Wallet Rows & Get "Before" State ---
        console.log(`[DEBUG] Locking wallet rows for user ${userId}`)

        const [balance] = await tx
          .select()
          .from(userBalanceTable)
          .where(eq(userBalanceTable.userId, userId))
          .for('update')

        const bonuses = await tx
          .select()
          .from(activeBonusTable)
          .where(and(eq(activeBonusTable.userId, userId), eq(activeBonusTable.status, 'ACTIVE')))
          .orderBy(activeBonusTable.priority)
          .for('update')

        const [operator] = await tx
          .select()
          .from(operatorTable)
          .where(eq(operatorTable.id, operatorId))
          .for('update')

        const [session] = gameSessionId ? await tx
          .select()
          .from(gameSessionTable)
          .where(eq(gameSessionTable.id, gameSessionId))
          .for('update') : [null]

        // --- Create deep clones for "before" state logging ---
        const originalBalance = JSON.parse(JSON.stringify(balance)) as UserBalance
        const originalBonuses = JSON.parse(JSON.stringify(bonuses)) as ActiveBonus[]
        const originalOperatorBalance = operator.balance
        const originalSession = session ? JSON.parse(JSON.stringify(session)) : null

        if (!balance) throw new Error('User balance not found')

        const totalBonusBalance = bonuses.reduce((sum, b) => sum + b.currentBonusBalance, 0)
        console.log(
          `[DEBUG] User balance check - Real: ${balance.realBalance}, Bonus: ${totalBonusBalance}, Required: ${wagerAmount}`
        )
        if (balance.realBalance + totalBonusBalance < wagerAmount) {
          console.log(`[ERROR] Insufficient funds for user ${userId}`)
          throw new Error('Not Sufficient Funds (NSF)')
        }

        // --- 2. Payment Logic ---
        let wagerPaidFromReal = 0
        let wagerPaidFromBonus = 0
        let wagerToPay = wagerAmount

        if (balance.realBalance > 0) {
          const paidReal = Math.min(balance.realBalance, wagerToPay)
          balance.realBalance -= paidReal
          wagerPaidFromReal += paidReal
          wagerToPay -= paidReal
        }

        if (wagerToPay > 0) {
          for (const bonus of bonuses) {
            if (wagerToPay === 0) break
            const paidBonus = Math.min(bonus.currentBonusBalance, wagerToPay)
            bonus.currentBonusBalance -= paidBonus
            wagerPaidFromBonus += paidBonus
            wagerToPay -= paidBonus
          }
        }

        // --- 3. Wagering Requirement (WR) Logic ---
        if (wagerPaidFromReal > 0 && balance.depositWageringRemaining > 0) {
          balance.depositWageringRemaining = Math.max(0, balance.depositWageringRemaining - wagerPaidFromReal)
        }

        let bonusCompleted = false
        for (const bonus of bonuses) {
          if (bonus.currentWageringRemaining > 0) {
            bonus.currentWageringRemaining = Math.max(0, bonus.currentWageringRemaining - wagerAmount)

            // 4. Bonus Completion Logic
            if (bonus.currentWageringRemaining === 0) {
              bonusCompleted = true
              bonus.status = 'COMPLETED'
              balance.realBalance += bonus.currentBonusBalance
              bonus.currentBonusBalance = 0
            }
          }
        }

        // --- 5. Payout Logic ---
        balance.realBalance += winAmount

        // --- 6. B2B2C Operator Ledger Logic ---
        const netFlowToOperator = wagerAmount - winAmount
        const newOperatorBalance = operator.balance + netFlowToOperator
        await tx
          .update(operatorTable)
          .set({ balance: newOperatorBalance }) // Use the calculated new balance
          .where(eq(operatorTable.id, operatorId))

        // --- 7. Auditing & Updates ---

        // 7a. Update user_balances table
        await tx
          .update(userBalanceTable)
          .set({
            realBalance: balance.realBalance,
            depositWageringRemaining: balance.depositWageringRemaining,
            totalWagered: sql`${userBalanceTable.totalWagered} + ${wagerAmount}`,
            totalWon: sql`${userBalanceTable.totalWon} + ${winAmount}`,
            updatedAt: new Date()
          })
          .where(eq(userBalanceTable.id, balance.id))

        // 7b. Update active_bonuses table (if changed)
        for (const bonus of bonuses) {
          const original = originalBonuses.find(b => b.id === bonus.id)
          // Only update if something actually changed
          if (bonus.status !== original?.status || bonus.currentBonusBalance !== original?.currentBonusBalance || bonus.currentWageringRemaining !== original?.currentWageringRemaining) {
            await tx
              .update(activeBonusTable)
              .set({
                status: bonus.status,
                currentBonusBalance: bonus.currentBonusBalance,
                currentWageringRemaining: bonus.currentWageringRemaining,
                updatedAt: new Date()
              })
              .where(eq(activeBonusTable.id, bonus.id))
          }
        }

        // 7c. Create Bet Log
        const newBetLog: NewBetLog = {
          userId,
          operatorId,
          gameId,
          gameSessionId,
          status: 'COMPLETED',
          wagerAmount,
          winAmount,
          wagerPaidFromReal,
          wagerPaidFromBonus,
          createdAt: new Date()
        }
        await tx.insert(betLogTable).values(newBetLog)

        // 7d. Update Game Session
        let updatedSession = null
        if (gameSessionId && session) {
          updatedSession = {
            ...session,
            totalWagered: (session.totalWagered || 0) + wagerAmount,
            totalWon: (session.totalWon || 0) + winAmount,
            totalBets: (session.totalBets || 0) + 1,
            updatedAt: new Date()
          }
          await tx
            .update(gameSessionTable)
            .set({
              totalWagered: updatedSession.totalWagered,
              totalWon: updatedSession.totalWon,
              totalBets: updatedSession.totalBets,
              updatedAt: updatedSession.updatedAt
            })
            .where(eq(gameSessionTable.id, gameSessionId))
        }

        // --- 8. Return New State & Debug Info ---
        const finalBonusBalance = bonuses.reduce((sum, b) => {
          return b.status === 'ACTIVE' ? sum + b.currentBonusBalance : sum
        }, 0)

        console.log(`[DEBUG] Bet processed successfully. New balance: ${balance.realBalance}`)

        const __debugInfo = {
          transaction: {
            userBalance: {
              before: originalBalance,
              after: balance // The mutated balance object
            },
            activeBonuses: {
              before: originalBonuses,
              after: bonuses // The mutated bonuses array
            },
            operatorBalance: {
              before: originalOperatorBalance,
              after: newOperatorBalance
            },
            betLog: {
              inserted: newBetLog
            },
            gameSession: {
              before: originalSession,
              after: updatedSession
            }
          },
          asyncTasks: {
            gameTable: {
              update: {
                gameId: gameId,
                totalBetAmount: `+${wagerAmount}`,
                totalWonAmount: `+${winAmount}`,
                totalBets: '+1',
                totalWins: winAmount > 0 ? '+1' : '+0'
              }
            },
            userStateCache: {
              delete: userId
            }
          }
        }

        return {
          __debugInfo, // Your enhanced report
          success: true,
          realBalance: balance.realBalance,
          bonusBalance: finalBonusBalance,
          totalBalance: balance.realBalance + finalBonusBalance,
          winAmount: winAmount,
          bonusCompleted
        }
      })

      // --- 9. Async Tasks (Fire-and-Forget) ---
      this.updateGlobalGameStats(gameId, wagerAmount, winAmount)
      userStateCache.delete(userId)

      return result // Return the full object from the transaction

    } catch (error: any) {
      console.error(`Bet processing failed for user ${userId}:`, error.message)
      // This is the clean catch block
      return { success: false, error: error.message }
    }
  }



  /**
   * (Async Task) Updates the global game stats.
   * This is "fire-and-forget" to not slow down the bet response.
   */
  async updateGlobalGameStats(gameId: string, wagerAmount: number, winAmount: number) {
    try {
      await db
        .update(gameTable)
        .set({
          totalBetAmount: sql`${gameTable.totalBetAmount} + ${wagerAmount}`,
          totalWonAmount: sql`${gameTable.totalWonAmount} + ${winAmount}`,
          totalBets: sql`${gameTable.totalBets} + 1`,
          totalWins: winAmount > 0 ? sql`${gameTable.totalWins} + 1` : undefined,
          updatedAt: new Date()
        })
        .where(eq(gameTable.id, gameId))
    } catch (error: any) {
      console.error(`Failed to update global stats for game ${gameId}:`, error)
    }
  }
}

export const gameplayService = new GameplayService()
