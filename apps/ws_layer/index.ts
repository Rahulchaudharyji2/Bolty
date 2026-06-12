import type { ServerWebSocket } from "bun";
import type { MessagePayload } from "./types";

const SUBSCRIPTIONS: ServerWebSocket<unknown>[] = []

const API_SUBSCRIPTIONS: ServerWebSocket<unknown>[] = []

let bufferedMessages: any[] = []

Bun.serve({
    fetch(req, server) {
      
      if (server.upgrade(req)) {
        return; 
      }
      return new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        message(ws, message) {
            const { event, data }: MessagePayload = JSON.parse(message.toString());
            if (event === "subscribe") {
                SUBSCRIPTIONS.push(ws);
                if (bufferedMessages.length) {
                    SUBSCRIPTIONS.forEach(ws => ws.send(JSON.stringify(bufferedMessages.shift())));
                    bufferedMessages = [];
                }
            } else if (event === "admin") {
                if (!SUBSCRIPTIONS.length) {
                    bufferedMessages.push(data);
                } else {
                    SUBSCRIPTIONS.forEach(ws => ws.send(JSON.stringify(data)));
                }
            } else if (event === "api_subscribe") {
                API_SUBSCRIPTIONS.push(ws);
            } else if (event === "vscode") {
                API_SUBSCRIPTIONS.forEach(ws => ws.send(JSON.stringify(data)));
            }
        },
        open(ws) {
            console.log("open");
        },
        close(ws) {
            console.log("close");
            const index = SUBSCRIPTIONS.indexOf(ws);
            if (index !== -1) {
                SUBSCRIPTIONS.splice(index, 1);
            }
            const apiIndex = API_SUBSCRIPTIONS.indexOf(ws);
            if (apiIndex !== -1) {
                API_SUBSCRIPTIONS.splice(apiIndex, 1);
            }
        },
        
    },
    port: 9093
  });