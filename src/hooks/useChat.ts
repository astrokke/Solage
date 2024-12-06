import { useEffect, useRef, useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { MessageEncryption } from "../utils/encryption";

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  expiresAt: number | null;
}

export const useChat = (publicKey: PublicKey | null) => {
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const keyPair = useRef(MessageEncryption.generateKeyPair());

  const connect = useCallback(() => {
    if (!publicKey) return;

    ws.current = new WebSocket("wss://solage-zzum.onrender.com");

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      ws.current?.send(
        JSON.stringify({
          type: "authenticate",
          walletAddress: publicKey.toBase58(),
        })
      );
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message received:", data);

        if (data.type === "message") {
          const newMessage = {
            id: crypto.randomUUID(),
            sender: data.sender,
            recipient: data.recipient,
            content: data.content,
            timestamp: Date.now(),
            isRead: false,
            expiresAt: null,
          };

          setPendingMessages((prev) => [...prev, newMessage]);
        }
      } catch (error) {
        console.error("Error processing message:", error);
        setError("Error processing message");
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      setError("Connection lost. Reconnecting...");
      setTimeout(connect, 3000);
    };
  }, [publicKey]);

  const sendMessage = useCallback(
    async (recipientAddress: string, content: string) => {
      if (!ws.current || !publicKey || !isConnected) {
        setError("Not connected");
        return false;
      }

      const message = {
        type: "message",
        sender: publicKey.toBase58(),
        recipient: recipientAddress,
        content: content,
        timestamp: Date.now(),
      };

      try {
        ws.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
        return false;
      }
    },
    [publicKey, isConnected]
  );

  const openMessage = useCallback(
    (messageId: string) => {
      const message = pendingMessages.find((m) => m.id === messageId);
      if (message && !message.isRead) {
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 heures

        setPendingMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isRead: true, expiresAt } : m
          )
        );
        setCurrentMessage({ ...message, isRead: true, expiresAt });
      }
    },
    [pendingMessages]
  );

  // Nettoyer les messages expirés
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPendingMessages((prev) =>
        prev.filter((msg) => !msg.expiresAt || msg.expiresAt > now)
      );
      if (currentMessage?.expiresAt && currentMessage.expiresAt < now) {
        setCurrentMessage(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentMessage]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  return {
    pendingMessages,
    currentMessage,
    openMessage,
    sendMessage,
    isConnected,
    error,
  };
};
