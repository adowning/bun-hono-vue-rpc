import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRoutes } from './routes/user.routes'
import { AppEnv } from './middleware/auth.middleware' // Use the lean AppEnv
import { bettingRoutes } from './routes/betting.routes'
import { financialRoutes } from './routes/financial.routes'
import { hostedRoutes } from './routes/php.routes'
import { serveStatic } from 'hono/bun'
import { proxy } from 'hono/proxy'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const app = new Hono<AppEnv>()
// Define your R2 bucket URL
const R2_BUCKET_URL = 'https://r2-worker.andrews.workers.dev'
// Create the proxy route. 
// We use .all() to catch GET, POST, etc.
// We use '/*' to catch all nested paths
app.all('/game-proxy/*', async (c) => {

  // 1. Get the full path *after* /game-proxy
  // Example: /game-proxy/games/file.js?foo=bar
  // becomes: /games/file.js?foo=bar
  const path = c.req.path.substring('/game-proxy'.length)
  const queryString = c.req.url.split('?')[1]
  const pathWithQuery = path + (queryString ? `?${queryString}` : '')

  // 2. Construct the full target URL for R2
  const targetUrl = `${R2_BUCKET_URL}${pathWithQuery}`

  console.log(`[PROXY] ${c.req.path} -> ${targetUrl}`)

  // 3. Use the proxy helper
  return proxy(
    targetUrl,
    {
      // This forwards the original request's method (GET/POST), body, etc.
      ...c.req,
      headers: {
        // Forward all original headers from the client
        ...c.req.header(),
        // Set the 'Host' header to the R2 bucket's host
        'Host': R2_BUCKET_URL.replace('https://', ''),
        // Set X-Forwarded-Host so the R2 worker knows the original domain
        'X-Forwarded-Host': c.req.header('host'),

        // --- SECURITY ---
        // Unset the Authorization header. We don't want to leak your
        // dashboard's Supabase token to the R2 bucket.
        // Your *monkey-patch* will add the correct token for game API calls.
        'Authorization': undefined,
      },
    }
  )
})

app.use(
  '*',
  cors({
    origin: 'https://game.cashflowcasino.com',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-State-Refresh'],
    credentials: true
  })
)
const apiApp = new Hono<AppEnv>()
  .route('/users', userRoutes)
  // .route('/games', gameRoutes)
  .route('/betting', bettingRoutes)
  .route('/financial', financialRoutes)
app.route('/api', apiApp)

app.route('/game', hostedRoutes) // <-- NEW
console.log('Hono server configured with static files, /api, and /game routes.')

app.get('/public/sw.js', async (c) => {
  // Path is from your project root
  const swPath = './apps/server/public/sw.js'
  const file = Bun.file(swPath)

  if (!(await file.exists())) {
    console.error(`[Server] CRITICAL: /public/sw.js not found at ${swPath}`)
    return c.notFound()
  }

  // Set the magic header to allow the root scope
  c.header('Service-Worker-Allowed', '/')
  c.header('Content-Type', 'application/javascript')

  console.log('[Server] Serving /public/sw.js with Service-Worker-Allowed: / header')
  return c.body(file)
})
// Serve static files from /public directory
// app.use('/public/*', serveStatic({ root: './apps/server/public' }))

// // Redirect root /public to index.html
// app.get('/public', (c) => {
//   return c.redirect('/public/index.html')
// })
// Serve static files from /public directory
app.use('/public/*', serveStatic({
  root: './apps/public',
  rewriteRequestPath: (path) => {
    // Remove the /public prefix to get the correct file path
    return path.replace(/^\/public/, '')
  }
}))
app.use('/games/*', serveStatic({
  root: './apps/public',
  rewriteRequestPath: (path) => {
    // Remove the /public prefix to get the correct file path
    return path.replace(/^\/public/, '')
  }
}))
export type AppType = typeof app
export default app
// import 'dotenv/config'
// import { Hono } from 'hono'
// import { cors } from 'hono/cors'
// import { userRoutes } from './routes/user.routes'
// import { AppEnv } from './middleware/auth.middleware' // Use the lean AppEnv
// import gameRoutes from './routes/game.routes'
// import { bettingRoutes } from './routes/betting.routes'
// import { financialRoutes } from './routes/financial.routes'
// import { hostedRoutes } from './routes/hosted.routes' // <-- NEW
// import { upgradeWebSocket } from 'hono/bun'
// import { Server } from 'http'

// // --- Database Setup ---
// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not set in .env file')
// }

// // --- Main App (no base path) ---
// const app = new Hono<AppEnv>()

// // CORS for all routes
// app.use(
//   '*',
//   cors({
//     origin: 'http://localhost:5173', // Client UI
//     allowMethods: ['GET', 'POST', 'OPTIONS'],
//     allowHeaders: ['Content-Type', 'Authorization', 'X-State-Refresh']
//   })
// )

// // --- API Routes ---
// // Create a separate Hono app for all /api routes
// const apiApp = new Hono<AppEnv>()
//   .route('/users', userRoutes)
//   // .route('/games', gameRoutes)
//   .route('/betting', bettingRoutes)
//   .route('/financial', financialRoutes)
// // apiApp.get(
// //   '/ws/kickass',
// //   upgradeWebSocket(() => {
// //     console.log('[upgradeWebSocket]')
// //     return {
// //       onMessage: (event) => {
// //         console.log('[wsEvent]')
// //         console.log(event.data)
// //       },
// //       onOpen: (event) => {
// //         console.log('[wsOpen]')
// //       }
// //     }
// //   })
// // )
// // apiApp.get(
// //   '/ws/netgame',
// //   upgradeWebSocket((c) => {
// //     console.log('--upgradeWebSocket--')
// //     const [token] = c.req.queries('token')
// //     console.log(token)
// //     return {
// //       onMessage: (event) => {
// //         console.log('[wsEvent]')
// //         console.log(event.data)
// //         if (event.data.startsWith(':::')) {
// //           const _message = event.data.split(':::')[1]
// //           const message = JSON.parse(_message)
// //           console.log(message)
// //         }
// //       },
// //       onOpen: (event) => {
// //         console.log('[wsOpen]')
// //       }
// //     }
// //   })
// // )
// // Mount the API app under the /api base path
// app.route('/api', apiApp)

// // --- Game Provider Routes ---
// // Mount the hosted PHP game routes under /game
// app.route('/game', hostedRoutes) // <-- NEW

// console.log('Hono server configured with /api and /game routes.')

// // Export the *type* of the main app
// export type AppType = typeof app
// export default app
