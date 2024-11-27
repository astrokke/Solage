import { WebSocketServer } from "ws";

const clients = {}; // Stocke les connexions des utilisateurs avec leur clé publique

const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port });
console.log(`Serveur WebSocket en cours d'exécution sur le port ${port}`);
wss.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté.");

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Authentification de l'utilisateur
      if (data.type === "authenticate") {
        const walletAddress = data.walletAddress;
        clients[walletAddress] = socket;
        console.log(`Utilisateur authentifié : ${walletAddress}`);
        return;
      }

      // Transfert de message
      if (data.type === "message") {
        const { recipient, sender, content } = data;

        // Vérifie si le destinataire est en ligne
        if (clients[recipient]) {
          clients[recipient].send(
            JSON.stringify({
              type: "message",
              sender,
              content,
              timestamp: new Date().toISOString(),
            })
          );
          console.log(`Message envoyé de ${sender} à ${recipient}`);
        } else {
          console.log(`Destinataire ${recipient} non connecté.`);
        }
        return;
      }
    } catch (error) {
      console.error("Erreur de traitement du message:", error);
    }
  });

  socket.on("close", () => {
    // Nettoyage des utilisateurs déconnectés
    for (const [key, client] of Object.entries(clients)) {
      if (client === socket) {
        console.log(`Utilisateur déconnecté : ${key}`);
        delete clients[key];
        break;
      }
    }
  });
});
