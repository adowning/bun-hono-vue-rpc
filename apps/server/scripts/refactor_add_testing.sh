#!/bin/bash
set -e

echo "--- Implementing the Full Test Harness ---"

# --- 1. Create the 'public' directory ---
echo "Creating: public/"
mkdir -p public

# --- 2. Create the 'public/index.html' file ---
echo "Creating: public/index.html"
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
    .container { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    div { background: #2a2a2a; border-radius: 8px; padding: 1.5em; }
    h2 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
    input { width: calc(100% - 20px); padding: 8px 10px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; margin-bottom: 10px; }
    button { background: #007aff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px; }
    button:hover { background: #0056b3; }
    button.danger { background: #ff3b30; }
    button.danger:hover { background: #c00; }
    .hidden { display: none; }
    #report-log { grid-column: span 2; background: #111; border: 1px solid #333; height: 400px; overflow-y: scroll; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.85em; }
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

    <div id="test-actions" class="hidden">
      <h2>2. Test Actions</h2>
      <p>Logged in as: <strong id="user-email"></strong></p>
      
      <h3>Deposit (Test Only)</h3>
      <input type="number" id="deposit-amount" value="5000" />
      <button id="deposit-btn">Deposit 5000 Cents</button>
      
      <hr style="border-color: #444; margin: 20px 0;">

      <h3>Betting</h3>
      <input type="text" id="game-id" value="0a85d90f-8d97-42ce-94be-c99e7cad0d4b" />
      <label for="wager-amount">Wager Amount (cents):</label>
      <input type="number" id="wager-amount" value="100" />
      <label for="win-amount">Win Amount (cents):</label>
      <input type="number" id="win-amount" value="0" />
      
      <button id="bet-btn">Place Single Bet</button>
      <button id="loop-btn">Start Bet Loop (1/sec)</button>
      <button id="stop-loop-btn" class="danger">Stop Loop</button>
    </div>

    <div id="report-log">
      <pre>Test log... waiting for actions.</pre>
    </div>
  </div>

  <script>
    // --- SUPABASE CONFIG ---
    const SUPABASE_URL = "https://crqbazcsrncvbnapuxcp.supabase.co";
    // This is the ANON KEY from your supabase.ts file
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8";
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- GLOBAL STATE ---
    let session = null;
    let betLoopInterval = null;

    // --- UI ELEMENTS ---
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const userEmailEl = document.getElementById('user-email');
    const authSection = document.getElementById('auth-section');
    const testActions = document.getElementById('test-actions');
    const logOutput = document.getElementById('report-log');

    // --- HELPER FUNCTIONS ---
    function log(type, title, data) {
      const pre = document.createElement('pre');
      pre.className = type;
      pre.innerHTML = `<strong>[${type.toUpperCase()}] ${title}</strong> - ${new Date().toLocaleTimeString()}\n${JSON.stringify(data, null, 2)}`;
      logOutput.prepend(pre);
    }
    
    async function getAuthHeaders() {
      if (!session) {
        log('error', 'Auth Error', 'Not logged in');
        return null;
      }
      // Check if token is expired
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
      testActions.classList.remove('hidden');
      await fetchUserMe();
    }
    
    async function fetchUserMe() {
      const headers = await getAuthHeaders();
      if (!headers) return;
      
      try {
        const res = await fetch('/api/users/me', { headers });
        const data = await res.json();
        if (!res.ok) throw data;
        log('success', 'GET /api/users/me', data);
      } catch (e) {
        log('error', 'GET /api/users/me', e);
      }
    }

    // --- AUTH ACTIONS ---
    document.getElementById('signup-btn').onclick = async () => {
      const email = emailInput.value;
      const password = passwordInput.value;
      const { data, error } = await sb.auth.signUp({ 
        email, 
        password,
        // We pass the (random) operatorId in the metadata
        options: {
          data: {
            operatorId: 'd0e9a7e6-7b8c-4a1e-8e3a-7a5d1b9c8d5e' // Hardcoded for test
          }
        }
      });
      if (error) return log('error', 'Sign Up Error', error);
      log('success', 'Sign Up Success', data);
      await updateUI(data);
    };

    document.getElementById('login-btn').onclick = async () => {
      const email = emailInput.value;
      const password = passwordInput.value;
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return log('error', 'Login Error', error);
      log('success', 'Login Success', data);
      await updateUI(data);
    };

    // --- TEST ACTIONS ---
    document.getElementById('deposit-btn').onclick = async () => {
      const headers = await getAuthHeaders();
      if (!headers) return;
      
      const amount = parseInt(document.getElementById('deposit-amount').value, 10);
      
      try {
        const res = await fetch('/api/testing/deposit', {
          method: 'POST',
          headers,
          body: JSON.stringify({ amountInCents: amount })
        });
        const data = await res.json();
        if (!res.ok) throw data;
        log('success', 'POST /api/testing/deposit', data);
        await fetchUserMe(); // Refresh balance
      } catch (e) {
        log('error', 'POST /api/testing/deposit', e);
      }
    };
    
    async function placeBet() {
      const headers = await getAuthHeaders();
      if (!headers) return;
      
      const payload = {
        gameId: document.getElementById('game-id').value,
        gameSessionId: null, // Test harness doesn't create sessions
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

# --- 3. Create 'src/routes/testing.routes.ts' (NEW FILE) ---
echo "Creating: src/routes/testing.routes.ts"
cat << 'EOF' > src/routes/testing.routes.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { AppEnv, authMiddleware } from '@/middleware/auth.middleware'
import { db, userBalanceTable, operatorTable, eq, sql } from '@/db'
import { walletService } from '@/services/wallet.service'

// Validation for our test deposit
const DepositSchema = z.object({
  amountInCents: z.number().int().positive()
})

export const testingRoutes = new Hono<AppEnv>()
  /**
   * POST /api/testing/deposit
   * A TEST-ONLY endpoint to add funds to a user's account.
   * This simulates a successful fiat deposit.
   */
  .post('/deposit', authMiddleware(), zValidator('json', DepositSchema), async (c) => {
    const user = c.get('user')
    const { amountInCents } = c.req.valid('json')

    try {
      // We wrap this in a transaction to use our walletService
      await db.transaction(async (tx) => {
        await walletService.processDeposit(
          tx,
          user.id,
          user.operatorId,
          amountInCents
        )
        // We could also create a depositLog here for completeness
      })

      const [newBalance] = await db
        .select({ balance: userBalanceTable.realBalance })
        .from(userBalanceTable)
        .where(eq(userBalanceTable.userId, user.id))

      return c.json({
        success: true,
        message: `Deposited ${amountInCents} cents.`,
        newRealBalance: newBalance.balance
      })
    } catch (err: any) {
      return c.json({ error: 'Failed to process test deposit', details: err.message }, 500)
    }
  })
EOF

# --- 4. Modify 'src/services/gameplay.service.ts' ---
echo "Modifying: src/services/gameplay.service.ts (to add debug report)"
# We'll use sed to insert the __debugInfo object into the return.
# This is tricky, so we'll target the 'return {' line.
sed -i.bak "s/return {/const __debugInfo = {\
          tablesEffected: [\
            'userBalanceTable (UPDATE)',\
            'activeBonusTable (UPDATE)',\
            'operatorTable (UPDATE)',\
            'betLogTable (INSERT)',\
            gameSessionId ? 'gameSessionTable (UPDATE)' : 'gameSessionTable (NONE)',\
            'gameTable (ASYNC UPDATE)',\
            'userStateCache (ASYNC DELETE)'\
          ],\
          flow: {\
            wagerPaidFromReal,\
            wagerPaidFromBonus,\
            netFlowToOperator,\
            bonusCompleted\
          }\
        };\
\
        return {\
          __debugInfo,\
/g" src/services/gameplay.service.ts
# Clean up the .bak file
rm -f src/services/gameplay.service.ts.bak
echo "Added __debugInfo to gameplayService response."

# --- 5. Modify 'src/app.ts' ---
echo "Modifying: src/app.ts (to add testing route)"
cat << 'EOF' > src/app.ts
import 'dotenv/config' // Load .env file at the top
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRoutes } from './routes/user.routes'
import { AppEnv, authMiddleware } from './middleware/auth.middleware'
import gameRoutes from './routes/game.routes'
import { bettingRoutes } from './routes/betting.routes'
import { testingRoutes } from './routes/testing.routes' // <-- NEW

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
  .route('/testing', testingRoutes) // <-- NEW

// Export the *type* of the RPC routes for the client
export type AppType = typeof typedApp
export default typedApp
EOF

# --- 6. Modify 'src/server.ts' ---
echo "Modifying: src/server.ts (to serve static files)"
cat << 'EOF' > src/server.ts
import typedApp from './app'
import { serveStatic } from 'hono/bun' // <-- NEW

export const CORS_HEADERS = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

// --- Serve Static Test Harness ---
typedApp.use('/*', serveStatic({ root: './public' })) // <-- NEW
typedApp.get('/', serveStatic({ path: './public/index.html' })) // <-- NEW
// ---------------------------------

let server = Bun.serve({
  port: 3000,
  async fetch(req, serverInstance) {
    const url = new URL(req.url)
    console.log(`[${req.method}] ${url.pathname}`) // <-- Improved logging
    server = serverInstance
    if (url.pathname === '/ws') return new Response(200)
    
    // API routes are handled by Hono
    return typedApp.fetch(req, serverInstance)
  }
})

console.log(`Hono server running on http://localhost:${server.port}`)
console.log(`Test harness available at http://localhost:${server.port}/index.html`)
EOF

echo "---"
echo "✅ Test Harness Setup Complete!"
echo "---"
echo ""
echo "NEXT STEPS:"
echo "1. Run 'bun run dev' to start the server."
echo "2. Open http://localhost:3000/index.html in your browser."
echo ""
echo "You can now:"
echo "  - Sign Up / Log In."
echo "  - Use the 'Deposit' button to add funds (this calls your new test endpoint)."
echo "  - Use the 'Place Single Bet' button."
echo "  - See the full report in the log, including the '__debugInfo' object!"
echo ""