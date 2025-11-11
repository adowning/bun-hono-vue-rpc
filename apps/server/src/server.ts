import typedApp from './app'

export const CORS_HEADERS = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

let server = Bun.serve({
  port: 3000,
  // routes:{

  // },
  async fetch(req, serverInstance) {
    const url = new URL(req.url)
    console.log(url.pathname)
    server = serverInstance
    if (url.pathname === '/ws') return new Response(200)
    return typedApp.fetch(req, serverInstance)
  }
})
console.log('app running on port: ', server.port)
