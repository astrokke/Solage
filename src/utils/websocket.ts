import { MessageEncryption } from "./encryption";
import {
  WEBSOCKET_URL,
  RECONNECT_INTERVAL,
  MAX_RETRY_ATTEMPTS,
} from "./constants";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((data: any) => void)[] = [];
  private reconnectAttempts = 0;
  private keyPair: { publicKey: Uint8Array; secretKey: Uint8Array } | null =
    null;

  constructor(private url: string = WEBSOCKET_URL) {
    this.keyPair = MessageEncryption.generateKeyPair();
  }

  connect(walletAddress: string) {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket connection opened");
      this.reconnectAttempts = 0;
      if (this.ws && this.keyPair) {
        const authMessage = {
          type: "authenticate",
          walletAddress: walletAddress,
          publicKey: Buffer.from(this.keyPair.publicKey).toString("base64"),
        };
        console.log("Sending authentication message:", authMessage);
        this.ws.send(JSON.stringify(authMessage));
      }
    };

    this.ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message received from server:", data);

        if (data.encrypted && this.keyPair) {
          data.content = await MessageEncryption.decrypt(
            data.content,
            data.sender,
            this.keyPair.secretKey
          );
        }

        this.messageHandlers.forEach((handler) => handler(data));
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket connection closed");
      if (this.reconnectAttempts < MAX_RETRY_ATTEMPTS) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(walletAddress), RECONNECT_INTERVAL);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  async sendMessage(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.keyPair) {
      console.error("WebSocket is not open or keyPair is missing");
      console.error(
        "WebSocket state:",
        this.ws ? this.ws.readyState : "No WebSocket"
      );
      console.error("KeyPair:", this.keyPair);
      return false;
    }

    try {
      if (message.content && message.recipient) {
        message.content = await MessageEncryption.encrypt(
          message.content,
          message.recipient,
          this.keyPair.secretKey
        );
        message.encrypted = true;
      }

      console.log("Sending message:", message);
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
