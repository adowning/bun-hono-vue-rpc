#!/bin/bash
set -e

echo "--- Implementing Bet Outcome Feature ---"

# --- 1. Create src/services/wallet.service.ts ---
echo "Creating: src/services/wallet.service.ts"
cat << 'EOF' > src/services/wallet.service.ts
import { db, operatorTable, userBalanceTable, userTable, eq, sql } from '@/db'
import type { PgTransaction } from 'drizzle-orm/pg-core'

/**
 * This service handles "financial" transactions, like deposits,
 * withdrawals, and operator/platform credit transfers.
 */
class WalletService {
  /**
   * Processes a verified deposit, moving credits from the operator
   * to the user's balance.
   */
  async processDeposit(
    tx: PgTransaction<any, any, any>,
    userId: string,
    operatorId: string,
    amountInCents: number
  ) {
    // 1. Add credits to user's real balance
    await tx
      .update(userBalanceTable)
      .set({
        realBalance: sql`${userBalanceTable.realBalance} + ${amountInCents}`,
        totalDepositedReal: sql`${userBalanceTable.totalDepositedReal} + ${amountInCents}`
      })
      .where(eq(userBalanceTable.userId, userId))

    // 2. Subtract credits from operator's balance
    await tx
      .update(operatorTable)
      .set({
        balance: sql`${operatorTable.balance} - ${amountInCents}`
      })
      .where(eq(operatorTable.id, operatorId))

    // Note: The depositLog would be created by the calling route
    console.log(`Processed deposit for ${userId}: ${amountInCents}`)
  }

  /**
   * Processes the first step of a withdrawal, moving credits
   * from the user's balance back to the operator.
   */
  async processWithdrawal(
    tx: PgTransaction<any, any, any>,
    userId: string,
    operatorId: string,
    amountInCents: number
  ) {
    // 1. Subtract credits from user's real balance
    await tx
      .update(userBalanceTable)
      .set({
        realBalance: sql`${userBalanceTable.realBalance} - ${amountInCents}`,
        totalWithdrawn: sql`${userBalanceTable.totalWithdrawn} + ${amountInCents}`
      })
      .where(eq(userBalanceTable.userId, userId))

    // 2. Add credits back to operator's balance
    await tx
      .update(operatorTable)
      .set({
        balance: sql`${operatorTable.balance} + ${amountInCents}`
      })
      .where(eq(operatorTable.id, operatorId))

    // Note: The withdrawalLog would be created by the calling route
    console.log(`Processed withdrawal for ${userId}: ${amountInCents}`)
  }

  /**
   * Forfeits a user's balance and transfers it back to the
   * old operator, then re-links the user to the new operator.
   */
  async switchOperator(
    tx: PgTransaction<any, any, any>,
    userId: string,
    oldOperatorId: string,
    newOperatorId: string,
    currentBalance: number
  ) {
    // 1. Forfeit user's balance
    await tx
      .update(userBalanceTable)
      .set({ realBalance: 0 })
      .where(eq(userBalanceTable.userId, userId))

    // 2. Return forfeited balance to the old operator
    if (currentBalance > 0) {
      await tx
        .update(operatorTable)
        .set({ balance: sql`${operatorTable.balance} + ${currentBalance}` })
        .where(eq(operatorTable.id, oldOperatorId))
    }

    // 3. Re-link user to new operator
    await tx
      .update(userTable)
      .set({ operatorId: newOperatorId })
      .where(eq(userTable.id, userId))
  }
}

export const walletService = new WalletService()
EOF

# --- 2. Create src/services/gameplay.service.ts ---
echo "Creating: src/services/gameplay.service.ts"
cat << 'EOF' > src/services/gameplay.service.ts
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
  gameTable
} from '@/db'
import { userStateCache } from './cache.service'

/**
 * Service for handling all gameplay-related logic,
 * primarily the bet/win processing.
 */
class GameplayService {
  
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

    try {
      const result = await db.transaction(async (tx) => {
        // --- 1. Lock Wallet Rows ---
        const balance = await tx.query.userBalanceTable.findFirst({
          where: eq(userBalanceTable.userId, userId),
          for: 'update'
        })
        
        const bonuses = await tx.query.activeBonusTable.findMany({
          where: and(
            eq(activeBonusTable.userId, userId),
            eq(activeBonusTable.status, 'ACTIVE')
          ),
          orderBy: (activeBonusTable, { asc }) => [asc(activeBonusTable.priority)],
          for: 'update'
        })

        if (!balance) throw new Error('User balance not found')

        const totalBonusBalance = bonuses.reduce((sum, b) => sum + b.currentBonusBalance, 0)
        if (balance.realBalance + totalBonusBalance < wagerAmount) {
          throw new Error('Not Sufficient Funds (NSF)')
        }

        // --- 2. Payment Logic ---
        let wagerPaidFromReal = 0
        let wagerPaidFromBonus = 0
        let wagerToPay = wagerAmount

        // 2a. Pay from Real Balance first
        if (balance.realBalance > 0) {
          const paidReal = Math.min(balance.realBalance, wagerToPay)
          balance.realBalance -= paidReal
          wagerPaidFromReal += paidReal
          wagerToPay -= paidReal
        }

        // 2b. Pay remainder from Bonus Balance
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
        // 3a. Clear Deposit WR (only with real money wager)
        if (wagerPaidFromReal > 0 && balance.depositWageringRemaining > 0) {
          const cleared = Math.min(balance.depositWageringRemaining, wagerPaidFromReal)
          balance.depositWageringRemaining -= cleared
        }

        // 3b. Clear Bonus WR (with total wager)
        let bonusCompleted = false
        for (const bonus of bonuses) {
          if (bonus.currentWageringRemaining > 0) {
            const cleared = Math.min(bonus.currentWageringRemaining, wagerAmount)
            bonus.currentWageringRemaining -= cleared

            // 4. Bonus Completion Logic
            if (bonus.currentWageringRemaining === 0) {
              bonusCompleted = true
              bonus.status = 'COMPLETED'
              // Transfer remaining bonus balance to real balance
              balance.realBalance += bonus.currentBonusBalance
              bonus.currentBonusBalance = 0
            }
          }
        }
        
        // --- 5. Payout Logic ---
        balance.realBalance += winAmount

        // --- 6. B2B2C Operator Ledger Logic ---
        const netFlowToOperator = wagerAmount - winAmount
        await tx
          .update(operatorTable)
          .set({ balance: sql`${operatorTable.balance} + ${netFlowToOperator}` })
          .where(eq(operatorTable.id, operatorId))

        // --- 7. Auditing & Updates (Run in parallel) ---
        
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
          if (bonus.status === 'COMPLETED' || wagerPaidFromBonus > 0) {
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
        await tx.insert(betLogTable).values({
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
        })

        // 7d. Update Game Session
        if (gameSessionId) {
          await tx
            .update(gameSessionTable)
            .set({
              totalWagered: sql`${gameSessionTable.totalWagered} + ${wagerAmount}`,
              totalWon: sql`${gameSessionTable.totalWon} + ${winAmount}`,
              totalBets: sql`${gameSessionTable.totalBets} + 1`,
              updatedAt: new Date()
            })
            .where(eq(gameSessionTable.id, gameSessionId))
        }

        // --- 8. Return New State ---
        const finalBonusBalance = bonuses.reduce((sum, b) => {
          return b.status === 'ACTIVE' ? sum + b.currentBonusBalance : sum
        }, 0)
        
        return {
          realBalance: balance.realBalance,
          bonusBalance: finalBonusBalance,
          totalBalance: balance.realBalance + finalBonusBalance,
          winAmount: winAmount,
          bonusCompleted
        }
      })
      
      // --- 9. Async Tasks (Fire-and-Forget) ---
      // These run *after* the transaction is successful
      
      // 9a. Update global game stats
      this.updateGlobalGameStats(gameId, wagerAmount, winAmount)
      
      // 9b. Invalidate user state cache
      userStateCache.delete(userId)
      
      return { success: true, ...result }

    } catch (error: any) {
      console.error(`Bet processing failed for user ${userId}:`, error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * (Async Task) Updates the global game stats.
   * This is "fire-and-forget" to not slow down the bet response.
   */
  async updateGlobalGameStats(
    gameId: string,
    wagerAmount: number,
    winAmount: number
  ) {
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
    } catch (error) {
      console.error(`Failed to update global stats for game ${gameId}:`, error)
    }
  }
}

export const gameplayService = new GameplayService()
EOF

# --- 3. Create src/routes/betting.routes.ts ---
echo "Creating: src/routes/betting.routes.ts"
cat << 'EOF' > src/routes/betting.routes.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { AppEnv, authMiddleware }_from '@/middleware/auth.middleware'
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
EOF

# --- 4. Update src/app.ts ---
echo "Updating: src/app.ts (to register new route)"
cat << 'EOF' > src/app.ts
import 'dotenv/config' // Load .env file at the top
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRoutes } from './routes/user.routes'
import { AppEnv, authMiddleware } from './middleware/auth.middleware'
import gameRoutes from './routes/game.routes'
import { bettingRoutes } from './routes/betting.routes' // <-- NEW

// --- Database Setup (bun:sql for Postgres) ---
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const app = new Hono<AppEnv>().basePath('/api')

// CORS for client
app.use(
  '*',
  cors({
    origin: 'http://localhost:5173', // TODO: Make configurable
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-State-Refresh']
  })
)
console.log('Hono server with Drizzle (Postgres) running on http://localhost:3000')

const typedApp = app
  .route('/users', userRoutes)
  .route('/games', gameRoutes)
  .route('/betting', bettingRoutes) // <-- NEW

// Export the *type* of the RPC routes for the client
export type AppType = typeof typedApp
export default typedApp
EOF

echo "---"
echo "✅ Bet Outcome Feature Implementation Complete!"
echo "---"
echo ""
echo "New services 'wallet.service.ts' and 'gameplay.service.ts' created."
echo "New route 'betting.routes.ts' created."
echo "'app.ts' has been updated to use the new route."
echo ""
echo "You can now run 'bun run dev' and test the new endpoint at:"
echo "POST http://localhost:3000/api/betting/outcome"
echo ""