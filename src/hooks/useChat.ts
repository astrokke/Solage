import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { io, Socket } from "socket.io-client";
import type { Conversation, Message } from "../types/message";

export const useMessaging = () => {
  const { publicKey } = useWallet();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Établir la connexion Socket.IO
  useEffect(() => {
    if (!publicKey) return;

    const newSocket = io("https://solage-zzum.onrender.com", {
      auth: {
        walletAddress: publicKey.toBase58(),
      },
      transports: ["websocket"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setError("Connection failed - retrying...");
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setError(null);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [publicKey]);

  // Envoyer un message
  const sendMessage = useCallback(
    async (recipientAddress: string, content: string) => {
      if (!socket || !publicKey) {
        setError("Connexion non établie");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const message = {
          sender: publicKey.toBase58(),
          recipient: recipientAddress,
          content,
          timestamp: Date.now(),
        };

        // Émettre l'événement d'envoi de message
        socket.emit("send_message", message);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Échec de l'envoi du message"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [socket, publicKey]
  );

  // Accepter une conversation
  const acceptConversation = useCallback(
    (conversationId: string) => {
      if (!socket) return;

      socket.emit("accept_conversation", conversationId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, status: "active" } : conv
        )
      );
    },
    [socket]
  );

  // Rejeter une conversation
  const rejectConversation = useCallback(
    (conversationId: string) => {
      if (!socket) return;

      socket.emit("reject_conversation", conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
    },
    [socket]
  );

  // Nettoyer les conversations expirées
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setConversations((prev) => prev.filter((conv) => conv.expiresAt > now));
    }, 60000);

    return () => clearInterval(cleanup);
  }, []);

  return {
    conversations,
    loading,
    error,
    sendMessage,
    acceptConversation,
    rejectConversation,
  };
};
