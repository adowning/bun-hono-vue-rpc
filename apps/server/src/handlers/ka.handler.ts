import { Context } from 'hono'
import { User } from '@/db'
import { AppEnv } from '@/middleware/auth.middleware'

// Get PHP server URL from environment variables
const PHP_SERVER_URL = Bun.env.PHP_SERVER_URL || 'http://localhost:8000'

/**
 * Handles requests for KA games by proxying them to the PHP server.
 */
export async function handleKaRequest(
  c: Context<AppEnv>,
  user: User,
  gameName: string,
  postData: any,
) {
  const forwardedAuthHeader = c.req.header('Authorization')

  // Get the original query string
  const originalUrl = new URL(c.req.url)
  const queryString = originalUrl.search;

  // Construct the full PHP endpoint URL
  const phpBaseUrl = `${PHP_SERVER_URL}/api/game/${gameName}/node`;
  const phpServerEndpoint = `${phpBaseUrl}${queryString}`;

  console.log(`[KA] Proxying request for user ${user.id} to: ${phpServerEndpoint}`)

  try {
    const response = await fetch(phpServerEndpoint, {
      method: 'POST', // Your api.php is listening for POST
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain, */*',
        'Authorization': forwardedAuthHeader || '',
      },
      body: JSON.stringify(postData),
    })

    const responseBody = await response.text()

    if (!response.ok) {
      console.error(
        `[KA] PHP server proxy error (${response.status}) for ${gameName}: ${responseBody}`,
      )
      return c.text(responseBody, response.status as any)
    }

    return c.text(responseBody)
  } catch (err: any) {
    console.error(`[FATAL] Proxy to PHP server failed for ${gameName}:`, err)
    return c.json(
      {
        responseEvent: 'error',
        serverResponse: 'InternalError',
        details: err.message,
      },
      500,
    )
  }
}