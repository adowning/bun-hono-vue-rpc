import type { WebSocketData } from "@/legacy_future_trash_and_gold/modules/websocket/websocket.handler";
import type { ServerWebSocket } from "bun";
// import destr from 'destr'
import chalk from "chalk";
// import type {
//   NolimitClientMessage,
// } from '#/modules/nolimit/nolimit.types'
// import {
//   handleNolimitSpinRequest,
// } from '#/modules/nolimit/nolimit.service'
// import rc4Api from '#/utils/crypto.js'

const TARGET_WS_URL = "wss://play.netgamenv.com/";

export const netgameProxyHandler = {
  open(ws: any)
  {
    console.log(chalk.yellow("✅ Client connected to proxy."));
    const { messageQueue, nolimitSessionKey } = ws.data;
    const backendSocket = new WebSocket(TARGET_WS_URL + nolimitSessionKey);
    ws.data.backendSocket = backendSocket;

    backendSocket.onopen = () =>
    {
      console.log(
        chalk.yellow(
          "✅ Proxy connected to backend. with key: ",
          ws.data.nolimitSessionKey
        )
      );

      // ✨ NEW: Process and send all queued messages.
      console.log(
        chalk.yellow(`▶️ Flushing ${messageQueue.length} queued message(s)...`)
      );
      for (const msg of messageQueue) {
        const original = msg;
        // const decrypted = rc4Api.decrypt(ws.data.nolimitSessionKey, msg)
        // const parsed = destr(decrypted) as NolimitClientMessage
        // let valid = false
        // if (parsed.type === 'init') {
        //  typedMessage = parsed as NolimitInitResponse
        //  handleNolimitSpinInitResponse(ws.data.user, typedMessage)
        console.log(chalk.yellow("sending init to backendSocket "), msg);
        backendSocket.send(original);
        // } else {
        //   valid = await handleNolimitSpinRequest(ws.data, parsed)
        //   if (valid) { backendSocket.send(original) }
        // }

        // console.log(chalk.yellow(`(from client) id: ${parsed.id}, type: ${parsed.type}}`))
      }
      // Clear the queue after flushing.
      ws.data.messageQueue = [];
    };

    backendSocket.onmessage = (event: MessageEvent) =>
    {
      // const decompressed = lzwDecode(event.data)
      // const parsed = destr(decompressed) as any
      // let typedMessage: NolimitInitResponse | NolimitServerMessage
      console.log(JSON.parse(event.data).action);

      if (event.data instanceof ArrayBuffer) {
        // const decompressed = lzwDecode(event.data)
        // const parsed = destr(event.data)

        // typedMessage = parsed as NolimitInitResponse
        // typedMessage.balance = ws.data.wallet?.balance
        // typedMessage.balances.TOTAL_BALANCE = ws.data.wallet?.balance
        // console.log(typedMessage.balance)
        // console.log(typedMessage.balances.TOTAL_BALANCE)

        // const mc = lzwEncode(JSON.stringify(typedMessage))
        ws.send(event.data);
      } else {
        // typedMessage = parsed as NolimitServerMessage

        // const alteredMessage = await handleNolimitSpinResponse(ws.data, typedMessage)
        // console.log(alteredMessage.messages)
        // const mc = lzwEncode(JSON.stringify(alteredMessage))
        ws.send(event.data);
        console.timeEnd("spin");
      }
    };

    backendSocket.onclose = (event: CloseEvent) =>
    {
      console.log(`❌ Backend connection closed: ${event.code}`);
      // ws.close(event.code, event.reason)
    };

    backendSocket.onerror = () =>
    {
      console.error("❌ Backend connection error.");
      // ws.close()
    };
  },
  message(ws: ServerWebSocket<WebSocketData>, message: string | Uint8Array)
  {
    const { backendSocket, messageQueue } = ws.data;
    if (backendSocket?.readyState === WebSocket.OPEN) {
      const original = message;
      // const parsed = message
      console.log(message);
      // const decrypted = rc4Api.decrypt(ws.data.nolimitSessionKey!, message as string)
      // const parsed = destr(decrypted) as NolimitClientMessage
      // let valid = false
      if (ws.data.gameSession === undefined || ws.data.user === undefined) {
        console.log(chalk.red("no user or no session ", ws.data.gameSession));
        ws.send(
          JSON.stringify({
            error: "no gamesession",
            message: "no game session",
          })
        );
        return;
      }
      // if (parsed.type === 'init') {
      //  typedMessage = parsed as NolimitInitResponse
      //  handleNolimitSpinInitResponse(ws.data.user, typedMessage)
      // console.log(chalk.yellow('sending init to backendSocket'))
      backendSocket.send(original);
      // } else {
      //   valid = await handleNolimitSpinRequest(ws.data, parsed)
      //   if (valid) { backendSocket.send(original) }
      //   console.timeEnd('spin')
      // }
    } else if (backendSocket?.readyState === WebSocket.CONNECTING) {
      const original = message;
      console.log(
        chalk.yellow(`[QUEUE ➡️] Message queued as backend is not ready.`)
      );
      messageQueue.push(original);
      // console.log(original.length)
      // console.log(messageQueue.length)
    }
  },
  close(ws: ServerWebSocket<WebSocketData>)
  {
    console.log("❌ Client disconnected from proxy.");
    const { backendSocket } = ws.data;

    if (
      backendSocket?.readyState === WebSocket.OPEN ||
      backendSocket?.readyState === WebSocket.CONNECTING
    ) {
      backendSocket.close();
    }
  },
};
