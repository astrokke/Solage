import { WebSocketServer } from "ws";
import { createServer } from "http";

const port = process.env.PORT || 10000;
const server = createServer();
const wss = new WebSocketServer({ server });

const clients = new Map();

console.log(`WebSocket server running on port ${port}`);

wss.on("connection", (socket) => {
  console.log("Client connected");
  let userWalletAddress = null;

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Detailed Message Received:", {
        type: data.type,
        sender: data.sender,
        recipient: data.recipient,
        content: data.content,
      });

      if (data.type === "authenticate") {
        userWalletAddress = data.walletAddress;
        clients.set(userWalletAddress, socket);
        console.log(`User authenticated: ${userWalletAddress}`);

        // Log tous les clients connectés

        socket.send(
          JSON.stringify({
            type: "authentication_success",
            message: "Successfully authenticated",
          })
        );
        return;
      }

      if (data.type === "message") {
        const { recipient, sender, content } = data;
        console.log(
          `Attempting to send message from ${sender} to ${recipient}`
        );
        console.log(`Searching for recipient socket: ${recipient}`);
        console.log("Connected Clients:", Array.from(clients.keys()));
        const recipientSocket = clients.get(recipient);
        console.log("Recipient Socket Status:", {
          exists: !!recipientSocket,
          readyState: recipientSocket ? recipientSocket.readyState : "N/A",
        });
        if (recipientSocket && recipientSocket.readyState === 1) {
          const messageData = JSON.stringify({
            type: "message",
            sender,
            recipient,
            content,
            timestamp: new Date().toISOString(),
          });

          recipientSocket.send(messageData);
          console.log(`Message sent from ${sender} to ${recipient}`);

          socket.send(
            JSON.stringify({
              type: "message_sent",
              recipient,
              timestamp: new Date().toISOString(),
            })
          );
        } else {
          console.log(`Recipient ${recipient} not connected`);
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Recipient is not online",
            })
          );
        }
        return;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        })
      );
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

// Ping pour maintenir les connexions actives
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.ping();
    }
  });
}, 30000);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
