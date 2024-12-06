import { MessageEncryption } from "./encryption";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandler: ((data: any) => void) | null = null;
  private keyPair: nacl.BoxKeyPair;

  constructor(private url: string) {
    this.keyPair = MessageEncryption.generateKeyPair();
  }

  connect(userId: string) {
    this.ws = new WebSocket(`${this.url}?userId=${userId}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (this.messageHandler) {
        this.messageHandler(data);
      }
    };
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandler = handler;
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async signMessage(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    const signature = await window.solana.signMessage(encodedMessage, "utf8");
    return signature;
  }
}
