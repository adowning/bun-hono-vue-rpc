import type { UserWithRelations } from '@/types';
import type { ServerWebSocket } from 'bun';
import type { Buffer } from 'node:buffer';
import type { WebSocketData } from '../websocket/websocket.handler';

export const phpHandler = {
  open(ws: ServerWebSocket<WebSocketData>)
  {
    const { user, gameSession } = ws.data
    // console.log(`User ${user.username} joined the php`)
    ws.subscribe(user.id + '/' + gameSession.gameName)
    //console.log(`[WS] User ${userId} started game: ${gameName}`)
    // ws.send('1::')
    // ws.publish('php', `${user.username} has joined the php.`)
    // ws.send(JSON.stringify({ type: 'php', message: `Welcome to the php, ${user.username}!` }))
  },

  message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer)
  {
    const { user } = ws.data
    console.log(`Message from ${user.username} in php:`, message)
    // ws.publish('php', `${user.username}: ${message}`)
    // phpController.action(ws.data.context!)
    phpProxyMessageHandler(
      ws as ServerWebSocket<WebSocketData>,
      parseWebSocketMessage(message.toString()),
      ws.data.user,
    )
  },

  close(ws: ServerWebSocket<WebSocketData>)
  {
    const { user } = ws.data
    console.log(`User ${user.username} left the php`)
    ws.unsubscribe('php')
    ws.publish('php', `${user.username} has left the php.`)
  },
}

// Handler for SEND_MESSAGE
async function phpProxyMessageHandler(ws: ServerWebSocket<WebSocketData>, params: any, user: UserWithRelations)
{
  try {
    const { gameSession, user, authSession } = ws.data
    // console.log('params in phpProxyMessageHandler', params)
    //console.log('gamedata in user', user)
    // let params;
    // const messageStr = message.toString();
    // if (messageStr.includes(":::")) {
    //   // params = JSON.parse(messageStr.split(":::")[1]);
    //   params = convertNetGameMessageToJson(message)
    // } else {
    //   console.error("Received malformed message:", messageStr);
    //   return;
    // }

    // if (params?.irq !== undefined) {
    //   ws.send('~m~67~m~~j~{"err":0,"irs":1,"vals":[1,-2147483648,2,-503893983],"msg":null}')
    //   return
    // }
    // if (params?.vals !== undefined) {
    //   params = params.vals[0]
    // }

    // We assume the incoming message from the game client now includes the userId.
    // const { cookie: ck, gameName, } = params;
    // const userProfile =await prisma.userProfile.findUnique({
    //   where: {
    //     id: user.userId
    //   }
    // })

    const phpUserId = user?.phpId

    // Point to the new API endpoint
    const gameURL = `${process.env.PHP_ENGINE_URL}/game/${gameSession.gameName}/server`

    // It's better to load this from an environment variable or a config file
    const apiKey = 'a-very-secret-key'

    // Construct the payload for the new API
    const postData = {
      ...params,
      apiKey: apiKey,
      userId: phpUserId,
    }
    // console.log('authSession value:', authSession, 'type:', typeof authSession)
    const response = await fetch(gameURL, {
      method: 'POST',
      body: JSON.stringify(postData),
      headers: {
        'Content-Type': 'application/json',
        cookie: `laravel_session=${authSession.phpToken}`,
        authorization: `Bearer ${authSession.phpToken}`,
      },
    })
    if (!response.ok) {
      throw new Error(`Upstream server responded with status: ${response.status}`)
    }
    const body = await response.text()
    const allReq = body.split('------')
    for (const reqPart of allReq) {
      if (reqPart) {
        console.log(reqPart)
        ws.send(reqPart)
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Error processing /slots message:', errorMessage)
    ws.send(JSON.stringify({ error: 'Failed to process request', details: errorMessage }))
  }
}

export function parseWebSocketMessage(message: string): any
{
  // Handle the protocol format: "data:::json"
  const parts = message.toString().split(':::')
  let gameData
  if (parts.length < 2) {
    return null
  }

  if (parts[1] !== undefined) {
    let a = parts[1].replaceAll('"i_t"', '')
    a = a.replaceAll('"i_l"', '')
    const _gameData = JSON.parse(a)
    gameData = _gameData

    /*---------CQ---------*/

    if (gameData.vals !== undefined) {
      if (gameData.irq !== undefined) {
        return '~m~67~m~~j~{"err":0,"irs":1,"vals":[1,-2147483648,2,-503893983],"msg":null}'
      }
      gameData = gameData.vals[0]
    }
    /*-----------------------*/

    const originalCookie = gameData.cookie
    const sessionId = gameData.sessionId
    const gameName = gameData.gameName
    // const userId = 'cmbk4rnom0000zsmd5vf7mst1'
    // console.log('gameData', gameData)
    return {
      ...gameData,
      sessionId,
      gameName,
      // userId,
      action: gameData.gameData.action,
      cookie: originalCookie, // Preserve original cookie if needed
    }
  }

  // Fallback: Try to extract just the essential game data
  try {
    const parts = message.toString().split(':::')
    if (parts.length >= 2) {
      let jsonString = parts[1]

      if (!jsonString) {
        return null
      }

      // More aggressive approach: manually extract the gameData object
      const gameDataMatch = jsonString.match(/"gameData":\s*(\{[^}]*\})/s)
      const sessionIdMatch = jsonString.match(/"sessionId":\s*"([^"]*)"/)
      const gameNameMatch = jsonString.match(/"gameName":\s*"([^"]*)"/)

      if (gameDataMatch && gameDataMatch[1]) {
        try {
          const gameData = JSON.parse(gameDataMatch[1])
          return {
            ...gameData,
            sessionId: sessionIdMatch ? sessionIdMatch[1] : null,
            gameName: gameNameMatch ? gameNameMatch[1] : null,
            cookie: 'extracted_fallback',
          }
        } catch (gameDataError) {
          // Silently handle gameData parsing errors
        }
      }

      // Last resort: try to remove cookie entirely and parse
      jsonString = jsonString.replace(/"cookie":"[^"]*(?:\\.[^"]*)*"(?:,\s*)?/g, '')
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1') // Clean trailing commas

      const jsonData = JSON.parse(jsonString)

      if (jsonData.gameData) {
        const { gameData, sessionId, gameName } = jsonData
        return {
          ...gameData,
          sessionId,
          gameName,
          cookie: 'removed_fallback',
        }
      }
      return jsonData
    }
  } catch (secondError) {
    // Silently handle all parsing failures
  }

  return null
}
