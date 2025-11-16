import { 
  db, 
  eq, 
  sql, 
  and,
  operatorTable, 
  userBalanceTable, 
  userTable, 
  depositLogTable,
  bonusLogTable,
  activeBonusTable,
  withdrawalLogTable,
  DepositLog,
  Product 
} from '@/db'
import type { PgTransaction } from 'drizzle-orm/pg-core'

// Define a default bonus wagering multiplier
const BONUS_WAGERING_MULTIPLIER = 10 // e.g., $10 bonus = $100 WR

/**
 * This service handles "financial" transactions:
 * 1. Completing Deposits & Granting Bonuses
 * 2. Requesting Withdrawals
 * 3. Switching Operators
 */
class WalletService {
  
  /**
   * Processes a *completed* deposit, updates balances, adds AML wagering,
   * and grants any associated bonuses.
   */
  async processDepositAndGrantBonus(depositId: string) {
    return await db.transaction(async (tx) => {
      // 1. Get the PENDING deposit and lock it
      const [deposit] = await tx
        .select()
        .from(depositLogTable)
        .where(and(
          eq(depositLogTable.id, depositId),
          eq(depositLogTable.status, 'PENDING')
        ))
        .for('update')
        
      if (!deposit) throw new Error('Deposit log not found or already processed')

      // 2. Get the product *directly from the snapshot*
      const product = (deposit.metaData as any)?.productSnapshot as Product
      
      if (!product) {
        console.error('Product snapshot not found in deposit metaData!', deposit.metaData)
        throw new Error('Product snapshot not found in deposit metaData')
      }
      
      // 3. Define all amounts
      const depositAmount = deposit.amount
      const bonusAmount = product.bonusTotalInCredits || 0
      
      // 4. --- AML Wagering Requirement ---
      const amlWageringRequirement = depositAmount * 1 
      
      // 5. --- Bonus Wagering Requirement ---
      const bonusWageringRequirement = bonusAmount * BONUS_WAGERING_MULTIPLIER
      
      // 6. Update User Balance (AML WR + Real Money + Bonus Granted)
      const [updatedBalance] = await tx
        .update(userBalanceTable)
        .set({
          realBalance: sql`${userBalanceTable.realBalance} + ${depositAmount}`,
          totalDepositedReal: sql`${userBalanceTable.totalDepositedReal} + ${depositAmount}`,
          depositWageringRemaining: sql`${userBalanceTable.depositWageringRemaining} + ${amlWageringRequirement}`,
          // --- THIS IS THE FIX ---
          totalBonusGranted: sql`${userBalanceTable.totalBonusGranted} + ${bonusAmount}`
          // --- END FIX ---
        })
        .where(eq(userBalanceTable.userId, deposit.userId))
        .returning()
        
      // 7. Grant Bonus (if any)
      if (bonusAmount > 0) {
        // 7a. Create the Bonus Log
        const [bonusLog] = await tx.insert(bonusLogTable)
          .values({
            userId: deposit.userId,
            operatorId: deposit.operatorId,
            triggeringDepositId: deposit.id,
            bonusType: 'DEPOSIT_MATCH', // Or read from product
            bonusAmount: bonusAmount,
            wageringRequirementTotal: bonusWageringRequirement,
            expiresInDays: 7 // Or read from product
          })
          .returning()
          
        // 7b. Create the Active Bonus
        await tx.insert(activeBonusTable)
          .values({
            userId: deposit.userId,
            bonusLogId: bonusLog.id,
            status: 'ACTIVE',
            priority: 100, // Or read from product
            currentBonusBalance: bonusAmount,
            currentWageringRemaining: bonusWageringRequirement,
            expiresAt: sql`now() + interval '7 days'` // Or read from product
          })
      }
      
      // 8. Update Operator Balance (Subtract the credits)
      await tx
        .update(operatorTable)
        .set({
          balance: sql`${operatorTable.balance} - ${depositAmount}`
        })
        .where(eq(operatorTable.id, deposit.operatorId))
        
      // 9. Mark Deposit as COMPLETED
      const [completedDeposit] = await tx
        .update(depositLogTable)
        .set({
          status: 'COMPLETED',
          completedAt: new Date(),
          realAmountBefore: updatedBalance.realBalance - depositAmount,
          realAmountAfter: updatedBalance.realBalance,
          depositWageringRequiredBefore: updatedBalance.depositWageringRemaining - amlWageringRequirement,
          depositWageringRequiredAfter: updatedBalance.depositWageringRemaining
        })
        .where(eq(depositLogTable.id, deposit.id))
        .returning()
        
      return { success: true, deposit: completedDeposit }
    })
  }

  /**
   * Processes a withdrawal request, moving credits from the
   * user to the operator and creating a PENDING withdrawal log.
   */
  async requestWithdrawal(
    userId: string,
    operatorId: string,
    amountInCents: number
  ) {
    return await db.transaction(async (tx) => {
      // 1. Get user balance and lock the row
      const [balance] = await tx
        .select()
        .from(userBalanceTable)
        .where(eq(userBalanceTable.userId, userId))
        .for('update')
        
      if (!balance || balance.realBalance < amountInCents) {
        throw new Error('Insufficient funds (checked again in transaction)')
      }

      // 2. Subtract credits from user's real balance
      await tx
        .update(userBalanceTable)
        .set({
          realBalance: sql`${userBalanceTable.realBalance} - ${amountInCents}`,
          totalWithdrawn: sql`${userBalanceTable.totalWithdrawn} + ${amountInCents}`
        })
        .where(eq(userBalanceTable.userId, userId))

      // 3. Add credits back to operator's balance
      await tx
        .update(operatorTable)
        .set({
          balance: sql`${operatorTable.balance} + ${amountInCents}`
        })
        .where(eq(operatorTable.id, operatorId))

      // 4. Create PENDING withdrawal log
      const [withdrawalLog] = await tx
        .insert(withdrawalLogTable)
        .values({
          userId,
          operatorId,
          status: 'PENDING',
          amount: amountInCents,
          realAmountBefore: balance.realBalance,
          realAmountAfter: balance.realBalance - amountInCents,
          requestedAt: new Date()
        })
        .returning()
        
      return withdrawalLog
    })
  }
  
  /**
   * (Existing function)
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
      .set({ 
        realBalance: 0,
        depositWageringRemaining: 0 // Also reset WR
      })
      .where(eq(userBalanceTable.userId, userId))

    // 2. Return forfeited balance to the old operator
    if (currentBalance > 0) {
      await tx
        .update(operatorTable)
        .set({ balance: sql`${operatorTable.balance} + ${currentBalance}` })
        .where(eq(operatorTable.id, oldOperatorId))
    }
    
    // 3. Reset any active bonuses
    await tx
      .update(activeBonusTable)
      .set({ status: 'CANCELLED' })
      .where(and(
        eq(activeBonusTable.userId, userId),
        eq(activeBonusTable.status, 'ACTIVE')
      ))

    // 4. Re-link user to new operator
    await tx
      .update(userTable)
      .set({ operatorId: newOperatorId })
      .where(eq(userTable.id, userId))
  }
}

export const walletService = new WalletService()
