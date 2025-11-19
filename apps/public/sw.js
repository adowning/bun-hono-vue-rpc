// This variable will hold our auth token in the worker's global state
let authToken = null

// 1. Listen for messages from the main page (e.g., the dashboard)
self.addEventListener('message', (event) => {
  // We expect a message with a 'token'
  if (event.data && event.data.type === 'SET_TOKEN') {
    authToken = event.data.token
    console.log('[ServiceWorker] Auth token received and stored.')
  }
})

// 2. Intercept all network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 3. Check if it's a request to our game server API
  const isGameApiRequest = url.pathname.startsWith('/game/') && url.pathname.includes('/server')

  if (isGameApiRequest) {
    // 4. This is our API request, handle it
    console.log(`[ServiceWorker] Intercepting API: ${url.pathname}`)
    if (authToken) {
      const newHeaders = new Headers(event.request.headers)
      newHeaders.set('Authorization', `Bearer ${authToken}`)

      const newRequest = new Request(event.request, {
        headers: newHeaders
      })

      // Respond with our modified request
      event.respondWith(fetch(newRequest))
    } else {
      // If we have no token, just let the request proceed (it will fail auth)
      console.warn('[ServiceWorker] Game API request, but no token is set.')
      event.respondWith(fetch(event.request))
    }
  }

  // 5. All other requests (for /dashboard, /public, /games, etc.)
  //    are ignored by the worker and will pass through to the network normally.
})

// 6. Add lifecycle listeners to take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
  console.log('[ServiceWorker] Installed.')
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
  console.log('[ServiceWorker] Activated and claimed clients.')
})
