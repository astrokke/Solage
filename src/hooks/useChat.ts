import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ChatWebSocket } from "../utils/websocket";
import { sendMessageTransaction } from "../utils/websocket";

export function useChat() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<ChatWebSocket | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      const chatWs = new ChatWebSocket(
        "wss://solage-56rf.onrender.com",
        handleMessage,
        handleError,
        handleConnectionChange
      );

      chatWs.connect(wallet.publicKey.toString());
      setWs(chatWs);

      return () => chatWs.disconnect();
    }
  }, [wallet.publicKey]);

  const handleMessage = useCallback((data: any) => {
    if (data.type === "message") {
      setMessages((prev) => [...prev, data]);
    }
  }, []);

  const handleError = useCallback((error: string) => {
    setError(error);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  const sendMessage = useCallback(
    async (recipient: string, content: string) => {
      if (!ws || !wallet.publicKey) {
        handleError("Wallet not connected");
        return;
      }

      try {
        const signature = await sendMessageTransaction(
          connection,
          wallet,
          recipient,
          handleError
        );

        if (signature) {
          ws.send({
            type: "message",
            recipient,
            sender: wallet.publicKey.toString(),
            content,
          });
        }
      } catch (error: any) {
        handleError(error.message || "Failed to send message");
      }
    },
    [ws, wallet, connection]
  );

  return {
    messages,
    isConnected,
    error,
    sendMessage,
  };
}
