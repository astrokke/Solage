import { WebSocketServer } from "ws";
import { createServer } from "http";

const port = process.env.PORT || 10000;

// Create HTTP server
const server = createServer();

// Create WebSocket server instance attached to HTTP server
const wss = new WebSocketServer({ server });

const clients = {};

console.log(`WebSocket server running on port ${port}`);

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "authenticate") {
        const walletAddress = data.walletAddress;
        clients[walletAddress] = socket;
        console.log(`User authenticated: ${walletAddress}`);

        // Send confirmation back to client
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

        if (clients[recipient]) {
          clients[recipient].send(
            JSON.stringify({
              type: "message",
              sender,
              content,
              timestamp: new Date().toISOString(),
            })
          );
          console.log(`Message sent from ${sender} to ${recipient}`);

          // Send confirmation to sender
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
    for (const [key, client] of Object.entries(clients)) {
      if (client === socket) {
        console.log(`User disconnected: ${key}`);
        delete clients[key];
        break;
      }
    }
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
