import 'dotenv/config' // Load .env file at the top
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRoutes } from './routes/user.routes'
import { AppEnv } from './middleware/auth'
import gameRoutes from './routes/game.routes'

// --- Database Setup (bun:sql for Postgres) ---
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const app = new Hono<AppEnv>().basePath('/api')

// CORS for client
app.use(
  '*',
  cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  })
)

console.log('Hono server with Drizzle (Postgres) running on http://localhost:3000')
const typedApp = app.route('/users', userRoutes).route('/games', gameRoutes) // .route('/betting', bettingRouter);

// Export the *type* of the RPC routes for the client
export type AppType = typeof typedApp
export default typedApp
