import { MessageEncryption } from "./encryption";
import { encode as encodeBase64 } from "@stablelib/base64";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((data: any) => void)[] = [];
  private keyPair: nacl.BoxKeyPair;

  constructor(private url: string) {
    this.keyPair = MessageEncryption.generateKeyPair();
  }

  async connect(walletAddress: string) {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = async () => {
      const authMessage = {
        type: "authenticate",
        walletAddress: walletAddress,
        publicKey: encodeBase64(this.keyPair.publicKey),
        timestamp: Date.now(),
      };

      const signature = await this.signMessage(JSON.stringify(authMessage));

      this.ws?.send(
        JSON.stringify({
          ...authMessage,
          signature,
        })
      );
    };

    this.ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.encrypted) {
          data.content = MessageEncryption.decrypt(
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
  }

  async sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const encryptedContent = MessageEncryption.encrypt(
        message.content,
        message.recipient,
        this.keyPair.secretKey
      );

      const messageToSend = {
        ...message,
        content: encryptedContent,
        encrypted: true,
        timestamp: Date.now(),
      };

      const signature = await this.signMessage(JSON.stringify(messageToSend));

      this.ws.send(
        JSON.stringify({
          ...messageToSend,
          signature,
        })
      );
      return true;
    }
    return false;
  }

  private async signMessage(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    const signature = await window.solana.signMessage(encodedMessage, "utf8");
    return signature;
  }
}
