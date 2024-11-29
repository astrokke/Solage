import { WebSocketServer } from "ws";
import { createServer } from "http";

// Use consistent port variable name
const port = process.env.PORT || 10000;
const server = createServer();
const wss = new WebSocketServer({ server });

// Store connected clients with their wallet addresses
const clients = new Map();

// Helper function to safely send messages
const safeSend = (socket, message) => {
  try {
    if (socket && socket.readyState === 1) {
      socket.send(
        typeof message === "string" ? message : JSON.stringify(message)
      );
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

wss.on("connection", (socket) => {
  console.log("Client connected");
  let userWalletAddress = null;

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Message Received:", {
        type: data.type,
        sender: data.sender,
        recipient: data.recipient,
      });

      if (data.type === "authenticate") {
        userWalletAddress = data.walletAddress;
        clients.set(userWalletAddress, socket);
        console.log(`User authenticated: ${userWalletAddress}`);

        safeSend(socket, {
          type: "authentication_success",
          message: "Successfully authenticated",
        });
        return;
      }

      if (data.type === "message") {
        const { recipient, sender, content } = data;
        const recipientSocket = clients.get(recipient);

        if (recipientSocket && recipientSocket.readyState === 1) {
          safeSend(recipientSocket, {
            type: "message",
            sender,
            recipient,
            content,
            timestamp: new Date().toISOString(),
          });

          safeSend(socket, {
            type: "message_sent",
            recipient,
            timestamp: new Date().toISOString(),
          });
        } else {
          safeSend(socket, {
            type: "error",
            message: "Recipient is not online",
          });
        }
        return;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      safeSend(socket, {
        type: "error",
        message: "Failed to process message",
      });
    }
  });

  socket.on("close", () => {
    if (userWalletAddress) {
      console.log(`User disconnected: ${userWalletAddress}`);
      clients.delete(userWalletAddress);
    }
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Keep connections alive with periodic pings
const PING_INTERVAL = 30000;
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.ping();
    }
  });
}, PING_INTERVAL);

// Start the server
server.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});
