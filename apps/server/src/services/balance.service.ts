import { db, eq, userBalanceTable, UserBalance } from '@/db'

class BalanceService {
  private db = db

  async getOrCreateUserBalance(userId: string): Promise<UserBalance> {
    try {
      const existingBalance = await this.db.query.userBalanceTable.findFirst({
         where: eq(userBalanceTable.userId, userId)
      })

      if (existingBalance) {
        return existingBalance
      }

      // Create default balance
      const [newBalance] = await this.db
        .insert(userBalanceTable)
        .values({
          id: crypto.randomUUID(),
          userId,
          // All other fields have defaults in the schema
        })
        .returning()

      if (!newBalance) {
        throw new Error('Failed to create user balance')
      }
      return newBalance
      
    } catch (error) {
      console.error('Balance operation failed:', error)
      throw new Error('Failed to get or create user balance')
    }
  }
}

// Export singleton
export const balanceService = new BalanceService()
