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

    // Créer la connexion Socket.IO
    const newSocket = io("wss://solage-zzum.onrender.com", {
      auth: {
        walletAddress: publicKey.toBase58(),
      },
    });

    // Gérer la connexion
    newSocket.on("connect", () => {
      console.log("Connecté au serveur de messagerie");
      // Demander les messages en attente
      newSocket.emit("fetch_pending_messages");
    });

    // Gérer les erreurs de connexion
    newSocket.on("connect_error", (err) => {
      console.error("Erreur de connexion:", err);
      setError("Impossible de se connecter au serveur de messagerie");
    });

    // Recevoir les messages en attente
    newSocket.on("pending_messages", (messages: Message[]) => {
      const address = publicKey.toBase58();
      const conversationMap = new Map<string, Conversation>();

      messages.forEach((message) => {
        const otherParty =
          message.sender === address ? message.recipient : message.sender;
        const existing = conversationMap.get(otherParty);

        if (existing) {
          existing.messages.push(message);
        } else {
          conversationMap.set(otherParty, {
            id: message.id,
            participants: [address, otherParty],
            messages: [message],
            createdAt: message.timestamp,
            expiresAt: message.timestamp + 24 * 60 * 60 * 1000,
            status: "pending",
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    });

    // Recevoir de nouveaux messages
    newSocket.on("new_message", (message: Message) => {
      setConversations((prev) => {
        const address = publicKey.toBase58();
        const existing = prev.find((conv) =>
          conv.participants.includes(message.sender)
        );

        if (existing) {
          return prev.map((conv) =>
            conv.id === existing.id
              ? { ...conv, messages: [...conv.messages, message] }
              : conv
          );
        }

        const newConversation: Conversation = {
          id: message.id,
          participants: [address, message.sender],
          messages: [message],
          createdAt: message.timestamp,
          expiresAt: message.timestamp + 24 * 60 * 60 * 1000,
          status: "pending",
        };

        return [...prev, newConversation];
      });
    });

    // Définir le socket
    setSocket(newSocket);

    // Nettoyer la connexion
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
