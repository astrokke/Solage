import { createServer } from "http";
import { WebSocketServer } from "ws";
import { CONFIG } from "./config";
import { clientManager } from "./clientManager";
import { MessageHandler } from "./messageHandler";
import { Message } from "./types";

const server = createServer();
const wss = new WebSocketServer({ server });

console.log(`WebSocket server running on port ${CONFIG.PORT}`);

wss.on("connection", (socket) => {
  console.log("Client connected");
  let userWalletAddress: string | null = null;

  socket.on("message", (message) => {
    try {
      const data: Message = JSON.parse(message.toString());
      console.log("Received message:", {
        type: data.type,
        sender: data.sender,
        recipient: data.recipient,
      });

      if (data.type === "authenticate" && data.walletAddress) {
        userWalletAddress = data.walletAddress;
        MessageHandler.handleAuthentication(socket, data.walletAddress);
      } else if (data.type === "message") {
        MessageHandler.handleChatMessage(data);
      }
    } catch (error) {
      MessageHandler.handleError(socket, error as Error);
    }
  });

  socket.on("close", () => {
    if (userWalletAddress) {
      clientManager.removeClient(userWalletAddress);
    }
  });

  socket.on("error", (error) => {
    MessageHandler.handleError(socket, error);
  });
});

// Keep connections alive with periodic pings
setInterval(() => {
  clientManager.pingAllClients();
}, CONFIG.PING_INTERVAL);

server.listen(CONFIG.PORT, () => {
  console.log(`Server is running on port ${CONFIG.PORT}`);
});
