#!/bin/bash
set -e

echo "--- Implementing Real Deposit & Withdrawal Features ---"

# --- 1. Create src/routes/financial.routes.ts (NEW FILE) ---
echo "Creating: src/routes/financial.routes.ts"
cat << 'EOF' > src/routes/financial.routes.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware'
import { db, eq, and, userBalanceTable, activeBonusTable, depositLogTable, operatorTable } from '@/db'
import { walletService } from '@/services/wallet.service'

// Schema for initiating a deposit with a product ID
const DepositInitiateSchema = z.object({
  productId: z.string().min(1, "Product ID is required")
})

// Schema for simulating the webhook completion
const DepositCompleteSchema = z.object({
  depositId: z.string().uuid("Invalid deposit ID")
})

// Schema for a withdrawal request
const WithdrawalRequestSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer")
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

      try {
        // 1. Get the operator's product list
        const operator = await db.query.operatorTable.findFirst({
          where: eq(operatorTable.id, user.operatorId),
          columns: { products: true }
        })
        if (!operator || !operator.products) {
          return c.json({ error: 'Operator products not found' }, 404)
        }

        // 2. Find the specific product
        const product = operator.products.find(p => p.title === productId) // Using title as ID for this test
        if (!product) {
          return c.json({ error: 'Product not found' }, 404)
        }

        // 3. Create a PENDING deposit log
        const [depositLog] = await db.insert(depositLogTable)
          .values({
            userId: user.id,
            operatorId: user.operatorId,
            amount: product.priceInCents,
            method: 'DEPOSIT_CASHAPP', // Hardcoded for test
            status: 'PENDING',
            metaData: { productId: product.title, productSnapshot: product }
          })
          .returning()

        return c.json(depositLog)

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
          return c.json({ error: `Wagering requirement not met. You still need to wager $${(balance.depositWageringRemaining / 100).toFixed(2)}.` }, 400)
        }
        
        const activeBonuses = await db.query.activeBonusTable.findMany({
          where: and(
            eq(activeBonusTable.userId, user.id),
            eq(activeBonusTable.status, 'ACTIVE')
          )
        })
        
        const totalBonusWR = activeBonuses.reduce((sum, b) => sum + b.currentWageringRemaining, 0)
        if (totalBonusWR > 0) {
          return c.json({ error: `Active bonus wagering requirement not met. You still need to wager $${(totalBonusWR / 100).toFixed(2)}.` }, 400)
        }
        
        // --- 3. All checks passed, process the withdrawal ---
        const withdrawalLog = await walletService.requestWithdrawal(user.id, user.operatorId, amount)
        
        return c.json({ success: true, withdrawalLog })
        
      } catch (err: any) {
        return c.json({ error: 'Failed to request withdrawal', details: err.message }, 500)
      }
    }
  )
EOF

# --- 2. Rewrite src/services/wallet.service.ts ---
echo "Rewriting: src/services/wallet.service.ts"
cat << 'EOF' > src/services/wallet.service.ts
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

      // 2. Get the associated operator's product data
      const operator = await tx.query.operatorTable.findFirst({
        where: eq(operatorTable.id, deposit.operatorId),
        columns: { products: true }
      })
      
      const product = operator?.products?.find(
        (p: Product) => p.title === (deposit.metaData as any)?.productId
      )
      
      if (!product) throw new Error('Product snapshot not found in deposit metaData')

      // 3. Define all amounts
      const depositAmount = deposit.amount
      const bonusAmount = product.bonusTotalInCredits || 0
      
      // 4. --- AML Wagering Requirement ---
      // All deposits have a 1x WR
      const amlWageringRequirement = depositAmount * 1 
      
      // 5. --- Bonus Wagering Requirement ---
      const bonusWageringRequirement = bonusAmount * BONUS_WAGERING_MULTIPLIER
      
      // 6. Update User Balance (AML WR + Real Money)
      const [updatedBalance] = await tx
        .update(userBalanceTable)
        .set({
          realBalance: sql`${userBalanceTable.realBalance} + ${depositAmount}`,
          totalDepositedReal: sql`${userBalanceTable.totalDepositedReal} + ${depositAmount}`,
          depositWageringRemaining: sql`${userBalanceTable.depositWageringRemaining} + ${amlWageringRequirement}`
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
EOF

# --- 3. Update src/app.ts ---
echo "Updating: src/app.ts (to register new financial route)"
cat << 'EOF' > src/app.ts
import 'dotenv/config' // Load .env file at the top
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRoutes } from './routes/user.routes'
import { AppEnv, authMiddleware } from './middleware/auth.middleware'
import gameRoutes from './routes/game.routes'
import { bettingRoutes } from './routes/betting.routes'
// --- NEW IMPORTS ---
import { financialRoutes } from './routes/financial.routes'
// ---

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
  .route('/betting', bettingRoutes)
  .route('/financial', financialRoutes) // <-- NEW

// Export the *type* of the RPC routes for the client
export type AppType = typeof typedApp
export default typedApp
EOF

# --- 4. Remove src/routes/testing.routes.ts ---
echo "Removing obsolete: src/routes/testing.routes.ts"
rm -f src/routes/testing.routes.ts

# --- 5. Update public/index.html ---
echo "Updating: public/index.html (with new deposit/withdrawal UI)"
cat << 'EOF' > public/index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Test Harness</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #1a1a1a; color: #eee; margin: 0; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 20px; }
    div { background: #2a2a2a; border-radius: 8px; padding: 1.5em; }
    h2, h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
    h3 { margin-bottom: 15px; }
    input { width: 100%; padding: 8px 10px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
    button { background: #007aff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px; margin-top: 5px; }
    button:hover { background: #0056b3; }
    button.danger { background: #ff3b30; }
    button.danger:hover { background: #c00; }
    .hidden { display: none; }
    
    #test-actions-container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 10px;
      align-items: center;
    }
    .form-grid label { text-align: right; font-weight: 500; font-size: 0.9em; }
    .button-group { display: flex; flex-wrap: wrap; align-items: center; }
    
    .product-card { background: #333; padding: 10px; border-radius: 5px; }
    .product-card p { margin: 5px 0; }

    #summary-table { padding: 0; }
    #summary-table table { width: 100%; border-collapse: collapse; }
    #summary-table th, #summary-table td { padding: 12px 15px; text-align: left; }
    #summary-table th { background: #333; }
    #summary-table td {
      background: #2f2f2f;
      font-weight: bold;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 1.1em;
      color: #34c759;
    }
    #summary-table tr td:first-child {
      color: #eee;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
      font-size: 1em;
    }
    #summary-table .wr-active { color: #ff9f0a; }

    #report-log { 
      background: #111; 
      border: 1px solid #333; 
      height: 400px; 
      overflow-y: scroll; 
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; 
      font-size: 0.85em; 
    }
    pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; padding: 10px; }
    pre.success { color: #34c759; border-bottom: 1px dashed #333; }
    pre.error { color: #ff3b30; border-bottom: 1px dashed #333; }
  </style>
</head>
<body>

  <div class="container">
    <div id="auth-section">
      <h2>1. Auth</h2>
      <input type="email" id="email" placeholder="test@example.com" value="testuser1@example.com" />
      <input type="password" id="password" placeholder="password" value="password123" />
      <button id="signup-btn">Sign Up</button>
      <button id="login-btn">Log In</button>
    </div>

    <div id="user-header" class="hidden">
      Logged in as: <strong id="user-email"></strong>
    </div>

    <div id="test-actions-container" class="hidden">
      <div>
        <h3>Products</h3>
        <div class="product-card">
          <p><strong>Package One</strong> (500 credits)</p>
          <p>Price: $2.00</p>
          <button class="buy-product-btn" data-product-id="Package One">Buy</button>
        </div>
        <br>
        <div class="product-card">
          <p><strong>Package Two</strong> (1000 credits + 100 Bonus)</p>
          <p>Price: $5.00</p>
          <button class="buy-product-btn" data-product-id="Package Two">Buy</button>
        </div>
      </div>
      
      <div>
        <h3>Withdrawal</h3>
        <div class="form-grid">
          <label for="withdraw-amount">Amount (cents):</label>
          <input type="number" id="withdraw-amount" value="1000" />
        </div>
        <div class="button-group">
          <button id="withdraw-btn">Request Withdrawal</button>
        </div>
      </div>

      <div>
        <h3>Betting</h3>
        <div class="form-grid">
          <label for="game-id">Game ID:</label>
          <input type="text" id="game-id" value="0a85d90f-8d97-42ce-94be-c99e7cad0d4b" />
          <label for="wager-amount">Wager Amount:</label>
          <input type="number" id="wager-amount" value="100" />
          <label for="win-amount">Win Amount:</label>
          <input type="number" id="win-amount" value="0" />
        </div>
        <div class="button-group">
          <button id="bet-btn">Place Single Bet</button>
          <button id="loop-btn">Start Bet Loop (1/sec)</button>
          <button id="stop-loop-btn" class="danger">Stop Loop</button>
        </div>
      </div>
    </div>

    <div id="summary-table" class="hidden">
      <table>
        <thead>
          <tr>
            <th colspan="4">Live Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Real Balance</td>
            <td id="summary-real">...</td>
            <td>Bonus Balance</td>
            <td id="summary-bonus">...</td>
          </tr>
          <tr>
            <td>Total Spendable</td>
            <td id="summary-total">...</td>
            <td>Deposit WR</td>
            <td id="summary-deposit-wr">...</td>
          </tr>
          <tr>
            <td>Bonus WR</td>
            <td id="summary-bonus-wr">...</td>
            <td>Free Spins</td>
            <td id="summary-spins">...</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="report-log">
      <pre>Test log... waiting for actions.</pre>
    </div>
  </div>

  <script>
    const SUPABASE_URL = "https://crqbazcsrncvbnapuxcp.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8";
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let session = null;
    let betLoopInterval = null;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const userEmailEl = document.getElementById('user-email');
    const authSection = document.getElementById('auth-section');
    const userHeader = document.getElementById('user-header');
    const testActions = document.getElementById('test-actions-container');
    const summaryTable = document.getElementById('summary-table');
    const logOutput = document.getElementById('report-log');

    function log(type, title, data) {
      const pre = document.createElement('pre');
      pre.className = type;
      pre.innerHTML = `<strong>[${type.toUpperCase()}] ${title}</strong> - ${new Date().toLocaleTimeString()}\n${JSON.stringify(data, null, 2)}`;
      logOutput.prepend(pre);
      
      if (type === 'success' && title === 'POST /api/betting/outcome') {
        updateSummary(data);
      }
    }
    
    function updateSummary(data) {
      const balanceData = data.balance ? data.balance : data;
      const wrData = data.wageringRequirements ? data.wageringRequirements : data;

      document.getElementById('summary-real').textContent = (balanceData.realBalance / 100).toFixed(2);
      document.getElementById('summary-bonus').textContent = (balanceData.bonusBalance / 100).toFixed(2);
      document.getElementById('summary-total').textContent = (balanceData.totalBalance / 100).toFixed(2);
      
      const depositWR = wrData?.deposit || 0;
      const bonusWR = wrData?.bonus || 0;
      
      const depositWREl = document.getElementById('summary-deposit-wr');
      depositWREl.textContent = (depositWR / 100).toFixed(2);
      depositWREl.className = depositWR > 0 ? 'wr-active' : '';

      const bonusWREl = document.getElementById('summary-bonus-wr');
      bonusWREl.textContent = (bonusWR / 100).toFixed(2);
      bonusWREl.className = bonusWR > 0 ? 'wr-active' : '';

      document.getElementById('summary-spins').textContent = balanceData.freeSpinsRemaining || 0;
    }
    
    async function getAuthHeaders() {
      if (!session) {
        log('error', 'Auth Error', 'Not logged in');
        return null;
      }
      if (session.expires_at * 1000 < Date.now() - 5000) {
        log('info', 'Auth', 'Refreshing session...');
        const { data, error } = await sb.auth.refreshSession(session);
        if (error) {
          log('error', 'Auth Refresh Error', error);
          return null;
        }
        session = data.session;
      }
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'X-State-Refresh': session.refresh_token,
        'Content-Type': 'application/json'
      };
    }

    async function updateUI(data) {
      session = data.session;
      userEmailEl.textContent = data.user.email;
      authSection.classList.add('hidden');
      userHeader.classList.remove('hidden');
      testActions.classList.remove('hidden');
      summaryTable.classList.remove('hidden');
      await fetchUserBalance();
    }
    
    async function fetchUserBalance() {
      const headers = await getAuthHeaders();
      if (!headers) return;
      
      try {
        const res = await fetch('/api/users/balance', { headers });
        const data = await res.json();
        if (!res.ok) throw data;
        log('success', 'GET /api/users/balance', data);
        updateSummary(data);
      } catch (e) {
        log('error', 'GET /api/users/balance', e);
      }
    }

    // --- AUTH ACTIONS ---
    document.getElementById('signup-btn').onclick = async () => {
      const email = emailInput.value;
      const password = passwordInput.value;
      // Get a random operator ID from our seeder
      const operatorIds = ["d0e9a7e6-7b8c-4a1e-8e3a-7a5d1b9c8d5e", "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", "f1e2d3c4-b5a6-7890-1234-56789abcdef0"];
      const randomOpId = operatorIds[Math.floor(Math.random() * operatorIds.length)];

      const { data, error }_from await sb.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            operatorId: randomOpId,
            full_name: email.split('@')[0]
          }
        }
      });
      if (error) return log('error', 'Sign Up Error', error);
      log('success', 'Sign Up Success (Check email for verification)', data);
      if (data.user && data.session) {
        await updateUI(data);
      }
    };

    document.getElementById('login-btn').onclick = async () => {
      const email = emailInput.value;
      const password = passwordInput.value;
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return log('error', 'Login Error', error);
      log('success', 'Login Success', data);
      await updateUI(data);
    };

    // --- DEPOSIT/WITHDRAWAL ACTIONS ---
    document.querySelectorAll('.buy-product-btn').forEach(button => {
      button.onclick = async (e) => {
        const productId = e.target.dataset.productId;
        log('info', 'Deposit', `Initiating deposit for: ${productId}`);
        
        const headers = await getAuthHeaders();
        if (!headers) return;

        try {
          // 1. Initiate Deposit
          const initRes = await fetch('/api/financial/deposit-initiate', {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId })
          });
          const initData = await initRes.json();
          if (!initRes.ok) throw initData;
          log('success', 'POST /deposit-initiate', initData);

          // 2. Simulate Webhook Completion
          log('info', 'Deposit', 'Simulating payment completion...');
          const completeRes = await fetch('/api/financial/deposit-complete', {
            method: 'POST',
            headers,
            body: JSON.stringify({ depositId: initData.id })
          });
          const completeData = await completeRes.json();
          if (!completeRes.ok) throw completeData;
          log('success', 'POST /deposit-complete', completeData);
          
          await fetchUserBalance(); // Refresh balance
          
        } catch (e) {
          log('error', 'Deposit Flow Error', e);
        }
      }
    });
    
    document.getElementById('withdraw-btn').onclick = async () => {
      const headers = await getAuthHeaders();
      if (!headers) return;
      
      const amount = parseInt(document.getElementById('withdraw-amount').value, 10);
      
      try {
        const res = await fetch('/api/financial/withdrawal-request', {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (!res.ok) throw data;
        log('success', 'POST /withdrawal-request', data);
        await fetchUserBalance(); // Refresh balance
      } catch (e) {
        log('error', 'Withdrawal Error', e);
      }
    };

    // --- BETTING ACTIONS ---
    async function placeBet() {
      const headers = await getAuthHeaders();
      if (!headers) return;
      
      const payload = {
        gameId: document.getElementById('game-id').value,
        gameSessionId: null,
        wagerAmount: parseInt(document.getElementById('wager-amount').value, 10),
        winAmount: parseInt(document.getElementById('win-amount').value, 10)
      };
      
      try {
        const res = await fetch('/api/betting/outcome', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw data;
        log('success', 'POST /api/betting/outcome', data);
      } catch (e) {
        log('error', 'POST /api/betting/outcome', e);
        stopLoop();
      }
    }
    
    document.getElementById('bet-btn').onclick = placeBet;
    
    document.getElementById('loop-btn').onclick = () => {
      if (betLoopInterval) return;
      log('info', 'Bet Loop', 'Starting loop...');
      betLoopInterval = setInterval(placeBet, 1000);
    };
    
    function stopLoop() {
      if (betLoopInterval) {
        log('info', 'Bet Loop', 'Stopping loop.');
        clearInterval(betLoopInterval);
        betLoopInterval = null;
      }
    }
    
    document.getElementById('stop-loop-btn').onclick = stopLoop;

  </script>
</body>
</html>
EOF

echo "✅ 'public/index.html' has been updated with new Deposit/Withdrawal test UI."
echo "Run 'bun run dev' and refresh your browser."