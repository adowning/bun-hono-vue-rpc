import app from './app' // <-- Import the main app
import { serveStatic } from 'hono/bun' // No longer need this here
import { Hono } from 'hono'
import { websocket } from 'hono/bun'
import type { Server as BunServer, ServerWebSocket } from 'bun'

import type { ServerConfig, } from './wsServer'
import type { WebSocketData } from './utils/types'
import process from 'node:process'
import { BroadcastServer } from './wsServer'
import { channel } from 'node:diagnostics_channel'

async function main() {
  // Create server with all features enabled
  const config: ServerConfig = {
    verbose: true,
    driver: 'bun',
    default: 'bun',
    connections: {
      bun: {
        driver: 'bun',
        host: '0.0.0.0',
        port: 3000,
        scheme: 'ws',
        options: {
          idleTimeout: 120,
          maxPayloadLength: 16 * 1024 * 1024,
          perMessageDeflate: true,
        },
      },
    },

    // Optional: Redis for horizontal scaling
    redis: {
      host: 'localhost',
      port: 6379,
      keyPrefix: 'broadcast:',
    },

    // Optional: Authentication
    auth: {
      enabled: true,
      cookie: {
        name: 'auth_token',
        secure: true,
      },
    },

    // Optional: Rate limiting
    rateLimit: {
      max: 100, // 100 messages
      window: 60000, // per minute
      perChannel: true,
    },

    // Optional: Security
    security: {
      cors: {
        enabled: true,
        // origins: ['http://localhost:3000'],
        origins: ['*'],
        credentials: true,
      },
      maxPayloadSize: 1024 * 1024, // 1 MB
      sanitizeMessages: true,
    },
  }
  const connectionConfig = config.connections?.[config.default || 'bun']
  if (!connectionConfig) {
    throw new Error('No connection configuration found')
  }

  const host = connectionConfig.host || '0.0.0.0'
  const port = connectionConfig.port ?? 3000
  const wsServer = new BroadcastServer(config)

  wsServer.channels.channel('presence-chat.{roomId}', (ws) => {
    return {
      id: ws.data.user?.id || ws.data.socketId,
      info: {
        name: ws.data.user?.name || 'Anonymous',
        online: true,
      },
    }
  })
  if (wsServer.monitoring) {
    wsServer.monitoring.on('all', (event) => {
      // console.log(`[${event.type}] ${event.socketId}`)
    })

    wsServer.monitoring.on('connection', (event) => {
      // console.log(`✓ New connection: ${event.socketId}`)
    })

    wsServer.monitoring.on('broadcast', (event) => {
      // console.log(`📡 Broadcast to ${event.channel}`)
    })
  }

  // Custom validation
  if (wsServer.validator) {
    wsServer.validator.addValidator((message: any) => {
      // console.log('MessageValidationManager')
      if (message.channel && message.channel.length > 200) {
        return 'Channel name too long'
      }
      return true
    })
  }

  // --- REMOVED staticApp DEFINITION ---

  let server: BunServer<WebSocketData> = Bun.serve({
    hostname: host,
    port: port,
    async fetch(req, serverInstance) {
      const url = new URL(req.url)
      console.log(`[${req.method}] ${url.pathname}`)
      server = serverInstance
      if (url.pathname === '/health') {
        const health = {
          status: 'ok',
          redis: wsServer.redis ? await wsServer.redis.healthCheck() : null,
        }
        return Response.json(health)
      }

      // Stats endpoint
      if (url.pathname === '/stats') {
        return Response.json(await wsServer.getStats())
      }

      // Prometheus metrics endpoint
      if (url.pathname === '/metrics') {
        const { PrometheusExporter } = await import('./utils/prometheus')
        const exporter = new PrometheusExporter(wsServer)
        const metrics = await exporter.export()
        return new Response(metrics, {
          headers: {
            'Content-Type': 'text/plain; version=0.0.4',
          },
        })
      }

      // --- MODIFIED WebSocket / HTTP Routing ---

      if (url.pathname.startsWith('/ws')) {
        console.log('[DEBUG] Handling WebSocket upgrade:', url.pathname)
        let gameSocket = false
        let developer: 'futex' | 'kickass' | 'netgame' | 'nolimit' = 'futex'
        const channels = new Set<string>()
        if (url.pathname.includes('netgame')) {
          channels.add('netgame')
          gameSocket = true
          developer = 'netgame'
        }
        if (url.pathname.includes('kickass')) {
          channels.add('kickass')
          gameSocket = true
          developer = 'kickass'
        }
        if (url.pathname.includes('nolimit')) {
          channels.add('nolimit')
          gameSocket = true
          developer = 'nolimit'
        }
        // console.log(channels)
        // Authenticate if enabled
        // let user = null
        if (wsServer.auth) {
          const { user, accessToken } = await wsServer.auth.authenticateRequest(req)
          // }
          if (!user) return new Response('Authorization upgrade failed', { status: 400 })
          console.log('socket - user -', user)
          const success = server.upgrade(req, {
            data: {
              id: crypto.randomUUID(),
              socketId: user.id,
              gameSocket,
              developer,
              channels,
              accessToken,
              connectedAt: Date.now(),
              user: user,
            } satisfies WebSocketData,
          })
          if (success) {
            return undefined
          }
        }
        return new Response('WebSocket upgrade failed', { status: 400 })
      }

      // ALL other requests (static, /api, /game, etc.)
      // are passed to the main Hono app

      // console.log('sending to app from server ..')
      return app.fetch(req, serverInstance)

      // --- END MODIFICATION ---
    },
    websocket: {
      open: (ws: ServerWebSocket<WebSocketData>) => {
        wsServer.handleOpen(ws)
      },

      message: (ws: ServerWebSocket<WebSocketData>, message: string | Buffer) => {
        wsServer.handleMessage(ws, message)
      },

      close: (ws: ServerWebSocket<WebSocketData>, code: number, reason: string) => {
        wsServer.handleClose(ws, code, reason)
      },

      drain: (ws: ServerWebSocket<WebSocketData>) => {
        wsServer.handleDrain(ws)
      },

      // Apply connection options
      idleTimeout: connectionConfig.options?.idleTimeout,
      maxPayloadLength: connectionConfig.options?.maxPayloadLength,
      backpressureLimit: connectionConfig.options?.backpressureLimit,
      closeOnBackpressureLimit: connectionConfig.options?.closeOnBackpressureLimit,
      sendPings: connectionConfig.options?.sendPings,
      perMessageDeflate: connectionConfig.options?.perMessageDeflate,
    }
  })

  // Custom authentication
  if (wsServer.auth) {
    wsServer.auth.authenticate(async (req) => {
      const authHeader = req.headers.get('authorization')
      if (authHeader?.startsWith('Bearer')) {
        // Verify your JWT token here
        return {
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
        }
      }
      return null
    })
  }

  //   // Channel authorization
  //   server.channels.channel('private-user.{userId}', (ws) => {
  //     return ws.data.user?.id === Number.parseInt(ws.data.socketId)
  //   })

  //   server.channels.channel('presence-chat.{roomId}', (ws) => {
  //     return {
  //       id: ws.data.user?.id || ws.data.socketId,
  //       info: {
  //         name: ws.data.user?.name || 'Anonymous',
  //         online: true,
  //       },
  //     }
  //   })

  //   // Monitoring
  //   if (server.monitoring) {
  //     server.monitoring.on('all', (event) => {
  //       console.log(`[${event.type}] ${event.socketId}`)
  //     })

  //     server.monitoring.on('connection', (event) => {
  //       console.log(`✓ New connection: ${event.socketId}`)
  //     })

  //     server.monitoring.on('broadcast', (event) => {
  //       console.log(`📡 Broadcast to ${event.channel}`)
  //     })
  //   }

  //   // Custom validation
  //   if (server.validator) {
  //     server.validator.addValidator((message: any) => {
  //       if (message.channel && message.channel.length > 200) {
  // * return 'Channel name too long'
  //   * }
  // * return true
  // * })
  // * }

  await wsServer.start(server)

  console.log('==========================================')
  console.log('Broadcasting Server Started')
  console.log('==========================================')
  console.log(`WebSocket: ws://localhost:${port}/ws`)
  console.log(`Health: http://localhost:${port}/health`)
  console.log(`Stats: http://localhost:${port}/stats`)
  console.log(`Server: http://localhost:${port}`)
  console.log('')
  console.log('Features Enabled:')
  console.log(`  ${wsServer.redis ? '✓' : '✗'} Redis Horizontal Scaling`)
  console.log(`  ${wsServer.auth ? '✓' : '✗'} Authentication`)
  console.log(`  ${wsServer.rateLimit ? '✓' : '✗'} Rate Limiting`)
  console.log(`  ${wsServer.security ? '✓' : '✗'} Security & Sanitization`)
  console.log(`  ✓ Real-time Monitoring`)
  console.log('==========================================')

  // Example broadcasts using helpers
  setTimeout(() => {
    wsServer.helpers.toUser(123, 'notification', {
      title: 'Welcome!',
      body: 'Thanks for joining',
    })

    wsServer.helpers.systemMessage('Server is running smoothly', 'info')
  }, 2000)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    const stats = await wsServer.getStats()
    console.log('Final stats:', stats)
    await wsServer.stop()
    await server.stop()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

// --- REMOVED ALL COMMENTED-OUT SERVER LOGIC AT THE END ---
// import app from './app' // <-- Import the main app
// import { serveStatic } from 'hono/bun'
// import { Hono } from 'hono'
// import { websocket } from 'hono/bun'
// import type { Server as BunServer, ServerWebSocket } from 'bun'

// import type { ServerConfig, } from './wsServer'
// import type { WebSocketData } from './utils/types'
// import process from 'node:process'
// import { BroadcastServer } from './wsServer'
// import { channel } from 'node:diagnostics_channel'

// async function main() {
//   // Create server with all features enabled
//   const config: ServerConfig = {
//     verbose: true,
//     driver: 'bun',
//     default: 'bun',
//     connections: {
//       bun: {
//         driver: 'bun',
//         host: '0.0.0.0',
//         port: 3000,
//         scheme: 'ws',
//         options: {
//           idleTimeout: 120,
//           maxPayloadLength: 16 * 1024 * 1024,
//           perMessageDeflate: true,
//         },
//       },
//     },

//     // Optional: Redis for horizontal scaling
//     redis: {
//       host: 'localhost',
//       port: 6379,
//       keyPrefix: 'broadcast:',
//     },

//     // Optional: Authentication
//     auth: {
//       enabled: true,
//       cookie: {
//         name: 'auth_token',
//         secure: true,
//       },
//     },

//     // Optional: Rate limiting
//     rateLimit: {
//       max: 100, // 100 messages
//       window: 60000, // per minute
//       perChannel: true,
//     },

//     // Optional: Security
//     security: {
//       cors: {
//         enabled: true,
//         // origins: ['http://localhost:3000'],
//         origins: ['*'],
//         credentials: true,
//       },
//       maxPayloadSize: 1024 * 1024, // 1 MB
//       sanitizeMessages: true,
//     },
//   }
//   const connectionConfig = config.connections?.[config.default || 'bun']
//   if (!connectionConfig) {
//     throw new Error('No connection configuration found')
//   }

//   const host = connectionConfig.host || '0.0.0.0'
//   const port = connectionConfig.port ?? 3000
//   const wsServer = new BroadcastServer(config)

//   wsServer.channels.channel('presence-chat.{roomId}', (ws) => {
//     return {
//       id: ws.data.user?.id || ws.data.socketId,
//       info: {
//         name: ws.data.user?.name || 'Anonymous',
//         online: true,
//       },
//     }
//   })
//   if (wsServer.monitoring) {
//     wsServer.monitoring.on('all', (event) => {
//       // console.log(`[${event.type}] ${event.socketId}`)
//     })

//     wsServer.monitoring.on('connection', (event) => {
//       // console.log(`✓ New connection: ${event.socketId}`)
//     })

//     wsServer.monitoring.on('broadcast', (event) => {
//       // console.log(`📡 Broadcast to ${event.channel}`)
//     })
//   }

//   // Custom validation
//   if (wsServer.validator) {
//     wsServer.validator.addValidator((message: any) => {
//       // console.log('MessageValidationManager')
//       if (message.channel && message.channel.length > 200) {
//         return 'Channel name too long'
//       }
//       return true
//     })
//   }
//   const staticApp = new Hono()
//   // staticApp.use('/*', serveStatic({ root: '../public' }))
//   staticApp.get('/', serveStatic({ path: './public/index.html' }))
//   staticApp.use(
//     '/*',
//     serveStatic({
//       root: './public',
//       rewriteRequestPath: (path) => path
//     })
//   )

//   let server: BunServer<WebSocketData> = Bun.serve({
//     hostname: host,
//     port: port,
//     async fetch(req, serverInstance) {
//       const url = new URL(req.url)
//       // console.log(`[${req.method}] ${url.pathname}`)
//       server = serverInstance
//       if (url.pathname === '/health') {
//         const health = {
//           status: 'ok',
//           redis: wsServer.redis ? await wsServer.redis.healthCheck() : null,
//         }
//         return Response.json(health)
//       }

//       // Stats endpoint
//       if (url.pathname === '/stats') {
//         return Response.json(await wsServer.getStats())
//       }

//       // Prometheus metrics endpoint
//       if (url.pathname === '/metrics') {
//         const { PrometheusExporter } = await import('./utils/prometheus')
//         const exporter = new PrometheusExporter(wsServer)
//         const metrics = await exporter.export()
//         return new Response(metrics, {
//           headers: {
//             'Content-Type': 'text/plain; version=0.0.4',
//           },
//         })
//       }
//       if (url.pathname.startsWith('/api') || url.pathname.startsWith('/game/')) {
//         console.log('[DEBUG] Handling API/Game route:', url.pathname)
//         return app.fetch(req, serverInstance)
//       }

//       if (url.pathname.startsWith('/ws')) {
//         console.log('[DEBUG] Handling WebSocket upgrade:', url.pathname)
//         let gameSocket = false
//         let developer: 'futex' | 'kickass' | 'netgame' | 'nolimit' = 'futex'
//         const channels = new Set<string>()
//         if (url.pathname.includes('netgame')) {
//           channels.add('netgame')
//           gameSocket = true
//           developer = 'netgame'
//         }
//         if (url.pathname.includes('kickass')) {
//           channels.add('kickass')
//           gameSocket = true
//           developer = 'kickass'
//         }
//         if (url.pathname.includes('nolimit')) {
//           channels.add('nolimit')
//           gameSocket = true
//           developer = 'nolimit'
//         }
//         // console.log(channels)
//         // Authenticate if enabled
//         // let user = null
//         if (wsServer.auth) {
//           const { user, accessToken } = await wsServer.auth.authenticateRequest(req)
//           // }
//           if (!user) return new Response('Authorization upgrade failed', { status: 400 })
//           console.log('socket - user -', user)
//           const success = server.upgrade(req, {
//             data: {
//               id: crypto.randomUUID(),
//               socketId: user.id,
//               gameSocket,
//               developer,
//               channels,
//               accessToken,
//               connectedAt: Date.now(),
//               user: user,
//             } satisfies WebSocketData,
//           })
//           if (success) {
//             return undefined
//           }
//         }



//         return new Response('WebSocket upgrade failed', { status: 400 })
//       }
//       console.log('[DEBUG] Static file request:', url.pathname)
//       const result = await staticApp.fetch(req, serverInstance)
//       console.log('[DEBUG] Static response status:', result.status)
//       return result
//       // return new Response('Not found', { status: 404 })
//     },
//     websocket: {
//       open: (ws: ServerWebSocket<WebSocketData>) => {
//         wsServer.handleOpen(ws)
//       },

//       message: (ws: ServerWebSocket<WebSocketData>, message: string | Buffer) => {
//         wsServer.handleMessage(ws, message)
//       },

//       close: (ws: ServerWebSocket<WebSocketData>, code: number, reason: string) => {
//         wsServer.handleClose(ws, code, reason)
//       },

//       drain: (ws: ServerWebSocket<WebSocketData>) => {
//         wsServer.handleDrain(ws)
//       },

//       // Apply connection options
//       idleTimeout: connectionConfig.options?.idleTimeout,
//       maxPayloadLength: connectionConfig.options?.maxPayloadLength,
//       backpressureLimit: connectionConfig.options?.backpressureLimit,
//       closeOnBackpressureLimit: connectionConfig.options?.closeOnBackpressureLimit,
//       sendPings: connectionConfig.options?.sendPings,
//       perMessageDeflate: connectionConfig.options?.perMessageDeflate,
//     }
//   })

//   // Custom authentication
//   if (wsServer.auth) {
//     wsServer.auth.authenticate(async (req) => {
//       const authHeader = req.headers.get('authorization')
//       if (authHeader?.startsWith('Bearer')) {
//         // Verify your JWT token here
//         return {
//           id: 123,
//           name: 'John Doe',
//           email: 'john@example.com',
//         }
//       }
//       return null
//     })
//   }

//   //   // Channel authorization
//   //   server.channels.channel('private-user.{userId}', (ws) => {
//   //     return ws.data.user?.id === Number.parseInt(ws.data.socketId)
//   //   })

//   //   server.channels.channel('presence-chat.{roomId}', (ws) => {
//   //     return {
//   //       id: ws.data.user?.id || ws.data.socketId,
//   //       info: {
//   //         name: ws.data.user?.name || 'Anonymous',
//   //         online: true,
//   //       },
//   //     }
//   //   })

//   //   // Monitoring
//   //   if (server.monitoring) {
//   //     server.monitoring.on('all', (event) => {
//   //       console.log(`[${event.type}] ${event.socketId}`)
//   //     })

//   //     server.monitoring.on('connection', (event) => {
//   //       console.log(`✓ New connection: ${event.socketId}`)
//   //     })

//   //     server.monitoring.on('broadcast', (event) => {
//   //       console.log(`📡 Broadcast to ${event.channel}`)
//   //     })
//   //   }

//   //   // Custom validation
//   //   if (server.validator) {
//   //     server.validator.addValidator((message: any) => {
//   //       if (message.channel && message.channel.length > 200) {
//   //         return 'Channel name too long'
//   //       }
//   //       return true
//   //     })
//   //   }

//   await wsServer.start(server)

//   console.log('==========================================')
//   console.log('Broadcasting Server Started')
//   console.log('==========================================')
//   console.log('WebSocket: ws://localhost:3000/ws')
//   console.log('Health: http://localhost:3000/health')
//   console.log('Stats: http://localhost:3000/stats')
//   console.log('')
//   console.log('Features Enabled:')
//   console.log(`  ${wsServer.redis ? '✓' : '✗'} Redis Horizontal Scaling`)
//   console.log(`  ${wsServer.auth ? '✓' : '✗'} Authentication`)
//   console.log(`  ${wsServer.rateLimit ? '✓' : '✗'} Rate Limiting`)
//   console.log(`  ${wsServer.security ? '✓' : '✗'} Security & Sanitization`)
//   console.log(`  ✓ Real-time Monitoring`)
//   console.log('==========================================')

//   // Example broadcasts using helpers
//   setTimeout(() => {
//     wsServer.helpers.toUser(123, 'notification', {
//       title: 'Welcome!',
//       body: 'Thanks for joining',
//     })

//     wsServer.helpers.systemMessage('Server is running smoothly', 'info')
//   }, 2000)

//   // Graceful shutdown
//   process.on('SIGINT', async () => {
//     console.log('\nShutting down...')
//     const stats = await wsServer.getStats()
//     console.log('Final stats:', stats)
//     await wsServer.stop()
//     await server.stop()
//     process.exit(0)
//   })
// }

// main().catch((error) => {
//   console.error('Failed to start server:', error)
//   process.exit(1)
// })

// // --- Create a *separate* Hono app just for serving static files ---
// // const staticApp = new Hono()
// // staticApp.use('/*', serveStatic({ root: './public' }))
// // staticApp.get('/', serveStatic({ path: './public/index.html' }))
// // ---------------------------------
// // staticApp.use(
// //   '/*',
// //   serveStatic({
// //     root: './public',
// //     rewriteRequestPath: (path) => path
// //   })
// // )
// // staticApp.use(
// //   '/*',
// //   serveStatic({
// //     root: './public',
// //     rewriteRequestPath: (path) => path
// //   })
// // )

// // let server = Bun.serve({
// //   port: 3000,
// //   async fetch(req, serverInstance) {
// //     const url = new URL(req.url)
// //     server = serverInstance

// //     // --- START FIX ---
// //     // Check if the request is for an API route or game route
// //     if (url.pathname.startsWith('/api') || url.pathname.startsWith('/game/')) {
// //       console.log(`[${req.method}] ${url.pathname}`)
// //       // if (url.pathname.startsWith('/api')) {
// //       //|| url.pathname.startsWith('/game')) {
// //       // API and Game routes are handled by the main app
// //       console.log('handling from app')
// //       return app.fetch(req, serverInstance)
// //     }

// //     // All other requests (like / or /index.html) go to the static server
// //     return staticApp.fetch(req, serverInstance)
// //     // --- END FIX ---
// //   },
// //   websocket
// // })

// // console.log(`Hono server running on http://localhost:${server.port}`)
// // console.log(`API available at http://localhost:${server.port}/api`)
// // console.log(`Game routes available at http://localhost:${server.port}/game`)
// // console.log(`Test harness available at http://localhost:${server.port}/index.html`)
