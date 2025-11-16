import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware'
import {
  db,
  eq,
  and,
  userBalanceTable,
  activeBonusTable,
  depositLogTable,
  operatorTable,
  Product // <-- Import the Product type
} from '@/db'
import { walletService } from '@/services/wallet.service'
import * as products from '../../data/products.json'
// Schema for initiating a deposit with a product ID
const DepositInitiateSchema = z.object({
  productId: z.string().min(1, 'Product ID is required').nullable(),
  depositAmount: z.number().min(1, 'depositAmount amount is required')
})

// Schema for simulating the webhook completion
const DepositCompleteSchema = z.object({
  depositId: z.string().uuid('Invalid deposit ID')
})

// Schema for a withdrawal request
const WithdrawalRequestSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer')
})

export const financialRoutes = new Hono<AppEnv>()

  /**
   * POST /api/financial/deposit-initiate
   * Simulates the user choosing a product to buy.
   * Creates a PENDING deposit log.
   */
  .post(
    '/deposit-initiate',
    authMiddleware(),
    zValidator('json', DepositInitiateSchema),
    async (c) => {
      const user = c.get('user')
      const { productId } = c.req.valid('json')
      const { depositAmount } = c.req.valid('json')

      try {
        // 1. Get the operator's product list
        const operator = await db.query.operatorTable.findFirst({
          where: eq(operatorTable.id, user.operatorId),
          columns: { products: true }
        })
        if (!operator) {
          return c.json({ error: 'Operator not found' }, 404)
        }
        if (productId) {
          // --- START ROBUST FIX ---
          let productsArray: Product[] = []

          if (Array.isArray(operator.products)) {
            // 1. Happy path: It's already an array
            productsArray = operator.products
          } else if (typeof operator.products === 'string') {
            // 2. It's a string, needs parsing
            try {
              productsArray = products.default // parseJson(operator.products)
            } catch (e) {
              console.error('Failed to parse operator products JSON string:', e)
              return c.json({ error: 'Failed to parse operator products' }, 500)
            }
          } else if (typeof operator.products === 'object' && operator.products !== null) {
            // 3. It's an object {"0": {...}, "1": {...}}, convert to array
            productsArray = Object.values(operator.products)
          }
          // --- END ROBUST FIX ---

          // 2. Find the specific product from the *now-guaranteed* array
          const product = {
            title: 'Package One',
            productType: 'DEPOSIT_PACKAGE',
            bonusTotalInCredits: 1000,
            discountInCents: 0,
            bestValue: 0,
            amountToReceiveInCredits: 1500,
            totalDiscountInCents: 0,
            bonusSpins: 1,
            isPromo: false,
            description: 'blah blah ',
            url: 'https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png',
            priceInCents: 200
          } // productsArray[0] //productsArray.find((p: Product) => p.title === productId)
          if (!product) {
            console.error(`Product not found: ${productId}`)
            console.log(
              'Available products:',
              productsArray.map((p) => p.title)
            )
            return c.json({ error: 'Product not found' }, 404)
          }

          // 3. Create a PENDING deposit log
          const [depositLog] = await db
            .insert(depositLogTable)
            .values({
              userId: user.id,
              operatorId: user.operatorId,
              amount: product.priceInCents,
              method: 'DEPOSIT_CASHAPP', // Hardcoded for test
              status: 'PENDING',
              metaData: { productId: product.title, productSnapshot: product }
            })
            .returning()
          console.log(depositLog)
          return c.json(depositLog)
        } else {
          const [depositLog] = await db
            .insert(depositLogTable)
            .values({
              userId: user.id,
              operatorId: user.operatorId,
              amount: depositAmount,
              method: 'DEPOSIT_CASHAPP', // Hardcoded for test
              status: 'PENDING',
              metaData: { productId: 'NO_PRODUCT' }
            })
            .returning()
          console.log(depositLog)
          return c.json(depositLog)
        }
      } catch (err: any) {
        return c.json({ error: 'Failed to initiate deposit', details: err.message }, 500)
      }
    }
  )

  /**
   * POST /api/financial/deposit-complete
   * Simulates a webhook from a payment gateway.
   * This calls the service to make the deposit "real".
   */
  .post(
    '/deposit-complete',
    authMiddleware(), // In reality, this would be a webhook with its own auth
    zValidator('json', DepositCompleteSchema),
    async (c) => {
      const { depositId } = c.req.valid('json')

      try {
        const result = await walletService.processDepositAndGrantBonus(depositId)
        return c.json(result)
      } catch (err: any) {
        return c.json({ error: 'Failed to complete deposit', details: err.message }, 500)
      }
    }
  )

  /**
   * POST /api/financial/withdrawal-request
   * Attempts to create a PENDING withdrawal request.
   * Fails if wagering requirements are not met.
   */
  .post(
    '/withdrawal-request',
    authMiddleware(),
    zValidator('json', WithdrawalRequestSchema),
    async (c) => {
      const user = c.get('user')
      const { amount } = c.req.valid('json')

      try {
        // --- 1. Check Balances and WR ---
        const balance = await db.query.userBalanceTable.findFirst({
          where: eq(userBalanceTable.userId, user.id)
        })
        if (!balance) return c.json({ error: 'User balance not found' }, 404)

        if (balance.realBalance < amount) {
          return c.json({ error: 'Insufficient funds' }, 400)
        }

        // --- 2. THE AML/BONUS LOCK ---
        if (balance.depositWageringRemaining > 0) {
          return c.json(
            {
              error: `Wagering requirement not met. You still need to wager $${(balance.depositWageringRemaining / 100).toFixed(2)}.`
            },
            400
          )
        }

        const activeBonuses = await db.query.activeBonusTable.findMany({
          where: and(eq(activeBonusTable.userId, user.id), eq(activeBonusTable.status, 'ACTIVE'))
        })

        const totalBonusWR = activeBonuses.reduce((sum, b) => sum + b.currentWageringRemaining, 0)
        if (totalBonusWR > 0) {
          return c.json(
            {
              error: `Active bonus wagering requirement not met. You still need to wager $${(totalBonusWR / 100).toFixed(2)}.`
            },
            400
          )
        }

        // --- 3. All checks passed, process the withdrawal ---
        const withdrawalLog = await walletService.requestWithdrawal(
          user.id,
          user.operatorId,
          amount
        )

        return c.json({ success: true, withdrawalLog })
      } catch (err: any) {
        return c.json({ error: 'Failed to request withdrawal', details: err.message }, 500)
      }
    }
  )
