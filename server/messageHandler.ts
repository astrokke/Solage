import WebSocket from "ws";
import { clientManager } from "./clientManager";
import { Message } from "./types";

export class MessageHandler {
  static handleAuthentication(socket: WebSocket, walletAddress: string): void {
    clientManager.addClient(walletAddress, socket);
    socket.send(
      JSON.stringify({
        type: "authentication_success",
        message: "Successfully authenticated",
      })
    );
  }

  static handleChatMessage(data: Message): void {
    const { recipient, sender, content } = data;
    if (!recipient || !sender || !content) return;

    console.log(`Attempting to send message from ${sender} to ${recipient}`);
    const recipientClient = clientManager.getClient(recipient);

    if (recipientClient?.socket.readyState === WebSocket.OPEN) {
      const messageData = JSON.stringify({
        type: "message",
        sender,
        recipient,
        content,
        timestamp: new Date().toISOString(),
      });

      recipientClient.socket.send(messageData);
      console.log(`Message sent from ${sender} to ${recipient}`);
    } else {
      console.log(`Recipient ${recipient} not connected`);
    }
  }

  static handleError(socket: WebSocket, error: Error): void {
    console.error("WebSocket error:", error);
    socket.send(
      JSON.stringify({
        type: "error",
        message: "Failed to process message",
      })
    );
  }
}
