import {
  ThanhHoaWebSocket,
  RouterHandler,
  type WebSocketMiddleware,
  IWebSocketRouteHandler,
  IThanhHoaWebSocketData
} from '@thanhhoajs/websocket'
import type { ServerWebSocket } from 'bun'
import { wsAuthMiddleware } from './middleware/auth.middleware'

// Create a new WebSocket server
const ws = new ThanhHoaWebSocket({ port: 3000 })
const router = new RouterHandler()

// Define a middleware

// Define route handlers
const chatHandler = {
  onOpen: (ws: ServerWebSocket<IThanhHoaWebSocketData>, query?: Record<string, string>) => {
    console.log(`New chat connection. User ID: ${ws.data.custom?.userId}`)
    ws.subscribe('general') // Subscribe to 'general' topic
    ws.send('Welcome to the chat!')
  },
  onMessage: (ws: ServerWebSocket<IThanhHoaWebSocketData>, message: string | Buffer) => {
    console.log(`Received: ${message}`)
    ws.publish('general', `User ${ws.data.custom?.userId} says: ${message}`)
  },
  onClose: (ws: ServerWebSocket<IThanhHoaWebSocketData>, code: number, reason: string) => {
    console.log(`Chat connection closed: ${code} - ${reason}`)
  }
}

// Add routes
router.route('chat', wsAuthMiddleware, chatHandler)

// Group routes
ws.group('api', wsAuthMiddleware, router)

// Global error handling
ws.on('error', (error, ws) => {
  console.error('WebSocket error:', error)
  ws.close(1011, 'Internal Server Error')
})

// Broadcast server status every 5 seconds
setInterval(() => {
  const stats = ws.getStats()
  ws.broadcast(JSON.stringify({ type: 'serverStatus', data: stats }))
}, 5000)

console.log(`Advanced WebSocket server is running on ws://localhost:${ws.port}`)
