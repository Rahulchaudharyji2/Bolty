import type { VscodeMessagePayload } from "./types";

export class RelayWebsocket {
    private static instance: RelayWebsocket;
    private ws: WebSocket;
    private callbacks: Map<string, (data: VscodeMessagePayload) => void>;
    private queue: string[];

    private constructor(url: string) {
        this.ws = new WebSocket(url);
        this.callbacks = new Map();
        this.queue = [];

        this.ws.onmessage = (event) => {
            const { callbackId, ...data } = JSON.parse(event.data);
            const callback = this.callbacks.get(callbackId);
            if (callback) {
                callback(data);
            }
        };

        this.ws.onopen = () => {
            console.log("Worker WebSocket connection opened to relayer");
            this.ws.send(JSON.stringify({
                event: "api_subscribe",
            }));
            
            
            while (this.queue.length > 0) {
                const message = this.queue.shift();
                if (message) {
                    this.ws.send(message);
                }
            }
        }
    }

    static getInstance() {
        if (!RelayWebsocket.instance) {
            RelayWebsocket.instance = new RelayWebsocket(process.env.WS_RELAYER_URL || "ws://ws-relayer:9093");
        }
        return RelayWebsocket.instance;
    }

    send(message: string) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            this.queue.push(message);
        }
    }

    sendAndAwaitResponse(message: any, callbackId: string): Promise<VscodeMessagePayload> {
        const msgStr = JSON.stringify({...message, callbackId});
        
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(msgStr);
        } else {
            this.queue.push(msgStr);
        }

        return new Promise((resolve, reject) => {
            this.callbacks.set(callbackId, resolve);
        });
    }
    
}