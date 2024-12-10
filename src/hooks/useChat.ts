import { useEffect, useRef, useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";

interface Message {
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
}

interface WebSocketMessage {
  type: string;
  sender?: string;
  recipient?: string;
  content?: string;
  timestamp?: string;
  message?: string;
}

export const useChat = (
  publicKey: PublicKey | null,
  recipientAddress?: string
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!publicKey) return;

    ws.current = new WebSocket("wss://solage-zzum.onrender.com");

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      setError(null);

      if (ws.current && publicKey) {
        const authMessage = {
          type: "authenticate",
          walletAddress: publicKey.toBase58(),
        };
        console.log("Sending authentication message:", authMessage);
        ws.current.send(JSON.stringify(authMessage));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message received from WebSocket:", data);

        if (data.type === "message") {
          const newMessage = {
            sender: data.sender,
            recipient: data.recipient,
            content: data.content,
            timestamp: new Date(data.timestamp),
          };

          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      } catch (error) {
        console.error("Error processing message:", error);
        setError("Error processing message");
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
      setError("Connection lost. Reconnecting...");
      setTimeout(connect, 3000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setIsConnected(false);
      setError("Connection error");
    };
  }, [publicKey, recipientAddress]);

  const sendMessage = useCallback(
    (recipientAddress: string, content: string) => {
      if (!ws.current || !publicKey || !isConnected) {
        setError("Cannot send message: Not connected");
        return false;
      }

      const message = {
        type: "message",
        sender: publicKey.toBase58(),
        recipient: recipientAddress,
        content: content,
        timestamp: new Date().toISOString(),
      };

      try {
        console.log("Sending message:", message);
        ws.current.send(JSON.stringify(message));
        setMessages((prev) => [
          ...prev,
          {
            sender: message.sender,
            recipient: message.recipient,
            content: message.content,
            timestamp: new Date(message.timestamp),
          },
        ]);
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
        return false;
      }
    },
    [publicKey, isConnected]
  );

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    messages,
    sendMessage,
    isConnected,
    error,
  };
};
