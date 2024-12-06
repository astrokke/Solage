import { WebSocketServer } from "ws";
import { createServer } from "http";
import crypto from "crypto";

const port = process.env.PORT || 10000;
const server = createServer();
const wss = new WebSocketServer({ server });

// Store connected clients and their messages
const clients = new Map();
const pendingMessages = new Map();

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

// Clean up expired messages
setInterval(() => {
  const now = Date.now();
  for (const [address, messages] of pendingMessages.entries()) {
    const validMessages = messages.filter(
      (msg) => !msg.expiresAt || msg.expiresAt > now
    );
    if (validMessages.length !== messages.length) {
      pendingMessages.set(address, validMessages);
    }
  }
}, 60000);

wss.on("connection", (socket) => {
  console.log("Client connected");
  let userWalletAddress = null;

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Message received:", {
        type: data.type,
        sender: data.sender,
        recipient: data.recipient,
      });

      if (data.type === "authenticate") {
        userWalletAddress = data.walletAddress;
        clients.set(userWalletAddress, socket);

        // Send pending messages
        const pending = pendingMessages.get(userWalletAddress) || [];
        pending.forEach((msg) => safeSend(socket, msg));

        safeSend(socket, {
          type: "authentication_success",
          message: "Successfully authenticated",
        });
        return;
      }

      if (data.type === "message") {
        const { recipient, sender, content } = data;
        const messageId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const messageData = {
          type: "message",
          id: messageId,
          sender,
          recipient,
          content,
          timestamp,
          status: "pending",
        };

        // Store message for offline recipients
        if (!pendingMessages.has(recipient)) {
          pendingMessages.set(recipient, []);
        }
        pendingMessages.get(recipient).push(messageData);

        // Send to recipient if online
        const recipientSocket = clients.get(recipient);
        if (recipientSocket && recipientSocket.readyState === 1) {
          safeSend(recipientSocket, messageData);
        }

        // Confirm to sender
        safeSend(socket, {
          type: "message_sent",
          id: messageId,
          recipient,
          timestamp,
        });
      }

      if (data.type === "mark_read") {
        const { messageId, recipient } = data;
        const messages = pendingMessages.get(recipient) || [];
        const messageIndex = messages.findIndex((m) => m.id === messageId);

        if (messageIndex !== -1) {
          messages[messageIndex].status = "read";
          messages[messageIndex].readAt = new Date().toISOString();
          messages[messageIndex].expiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString();
        }
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
});

server.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});
