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

    const socketUrl = "wss://solage-zzum.onrender.com";

    const socketOptions = {
      auth: {
        walletAddress: publicKey.toBase58(),
      },
      transports: ["websocket"],
      timeout: 30000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      forceNew: true,
    };

    const newSocket = io(socketUrl, socketOptions);

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Connected to chat server");
      setError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    // Message handling
    newSocket.on("message", (message: Message) => {
      console.log("Received message:", message);
      setConversations((prevConversations) => {
        const conversationExists = prevConversations.find(
          (conv) =>
            conv.participants.includes(message.sender) &&
            conv.participants.includes(message.recipient)
        );

        if (conversationExists) {
          return prevConversations.map((conv) =>
            conv.id === conversationExists.id
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  lastMessageAt: message.timestamp,
                }
              : conv
          );
        } else {
          // Create new conversation
          const newConversation: Conversation = {
            id: `${message.sender}-${message.recipient}-${Date.now()}`,
            participants: [message.sender, message.recipient],
            messages: [message],
            status: "active",
            lastMessageAt: message.timestamp,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          };
          return [...prevConversations, newConversation];
        }
      });
    });

    newSocket.on("message_sent", (confirmation) => {
      console.log("Message sent confirmation:", confirmation);
    });

    newSocket.on("message_error", (error) => {
      console.error("Message error:", error);
      setError("Failed to deliver message");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [publicKey]);

  // Send message function
  const sendMessage = useCallback(
    async (recipientAddress: string, content: string) => {
      if (!socket || !publicKey) {
        setError("Connection not established");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const message: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: publicKey.toBase58(),
          recipient: recipientAddress,
          content,
          timestamp: Date.now(),
          status: "sent",
        };

        // Add message to local state immediately for UI feedback
        setConversations((prevConversations) => {
          const conversationExists = prevConversations.find(
            (conv) =>
              conv.participants.includes(message.sender) &&
              conv.participants.includes(message.recipient)
          );

          if (conversationExists) {
            return prevConversations.map((conv) =>
              conv.id === conversationExists.id
                ? {
                    ...conv,
                    messages: [...conv.messages, message],
                    lastMessageAt: message.timestamp,
                  }
                : conv
            );
          } else {
            const newConversation: Conversation = {
              id: `${message.sender}-${message.recipient}-${Date.now()}`,
              participants: [message.sender, message.recipient],
              messages: [message],
              status: "active",
              lastMessageAt: message.timestamp,
              expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            };
            return [...prevConversations, newConversation];
          }
        });

        // Emit the message through socket
        socket.emit("send_message", message);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [socket, publicKey]
  );

  // Other functions remain the same...
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

  // Cleanup expired conversations
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
