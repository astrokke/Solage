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
        ws.current.send(
          JSON.stringify({
            type: "authenticate",
            walletAddress: publicKey.toBase58(),
          })
        );
        console.log(
          "Sent authentication message for wallet:",
          publicKey.toBase58()
        );
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.type === "authentication_success") {
          console.log("Authentication successful");
        } else if (data.type === "message" && data.sender && data.content) {
          const newMessage: Message = {
            sender: data.sender,
            recipient: data.recipient || "",
            content: data.content,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          };

          // Only add messages that are part of this conversation
          if (
            recipientAddress &&
            (data.sender === recipientAddress ||
              data.recipient === recipientAddress)
          ) {
            setMessages((prev) => [...prev, newMessage]);
          }
        } else if (data.type === "error") {
          setError(data.message || "An error occurred");
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
