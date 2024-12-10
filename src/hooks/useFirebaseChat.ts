import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  subscribeToMessages,
  addMessage,
  getConversations,
} from "../utils/FireBase";
import { Message } from "../types/message";

export const useFirebaseChat = (publicKey: PublicKey | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const address = publicKey.toBase58();

    // Subscribe to messages
    const unsubscribeMessages = subscribeToMessages(address, (newMessages) => {
      setMessages(newMessages);
    });

    // Get conversations
    getConversations(address)
      .then(setConversations)
      .catch((error) => {
        console.error("Error fetching conversations:", error);
        setError("Failed to load conversations");
      });

    return () => {
      unsubscribeMessages();
    };
  }, [publicKey]);

  const sendMessage = async (recipientAddress: string, content: string) => {
    if (!publicKey) {
      setError("Wallet not connected");
      return false;
    }

    try {
      const messageId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await addMessage(
        messageId,
        publicKey.toBase58(),
        recipientAddress,
        content
      );
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
      return false;
    }
  };

  return {
    messages,
    conversations,
    sendMessage,
    error,
  };
};
