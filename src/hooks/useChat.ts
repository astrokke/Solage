import { useEffect, useRef, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";

interface WebSocketHookProps {
  publicKey: PublicKey | null;
  onMessage: (message: any) => void;
  onError: (error: string) => void;
}

export const useWebSocket = ({
  publicKey,
  onMessage,
  onError,
}: WebSocketHookProps) => {
  const websocket = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!publicKey) return;

    websocket.current = new WebSocket("wss://solage-zzum.onrender.com");

    websocket.current.onopen = () => {
      console.log("WebSocket connected");
      if (websocket.current && publicKey) {
        websocket.current.send(
          JSON.stringify({
            type: "authenticate",
            walletAddress: publicKey.toBase58(),
          })
        );
      }
    };

    websocket.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        onError("Failed to process message");
      }
    };

    websocket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      onError("WebSocket connection error");
    };

    websocket.current.onclose = () => {
      console.log("WebSocket disconnected");
    };
  }, [publicKey, onMessage, onError]);

  const sendMessage = useCallback(
    (recipient: string, content: string) => {
      if (!websocket.current || !publicKey) return;

      websocket.current.send(
        JSON.stringify({
          type: "message",
          sender: publicKey.toBase58(),
          recipient,
          content,
        })
      );
    },
    [publicKey]
  );

  useEffect(() => {
    connect();

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [connect]);

  return { sendMessage };
};
