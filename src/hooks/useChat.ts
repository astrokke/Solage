import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  subscribeToMessages,
  addMessage,
  getConversations,
} from "../utils/FireBase";
import { Message } from "../types/message";
import { Contact } from "../types/message";

export const useChat = (publicKey: PublicKey | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const userAddress = publicKey.toBase58();

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(userAddress, (newMessages) => {
      setMessages(newMessages);
    });

    // Load conversations
    getConversations(userAddress).then(setContacts).catch(console.error);

    return () => {
      unsubscribe();
    };
  }, [publicKey]);

  const sendMessage = useCallback(
    async (recipientAddress: string, content: string) => {
      if (!publicKey) {
        setError("Wallet not connected");
        return false;
      }

      try {
        const messageId = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        await addMessage(messageId, {
          id: messageId,
          sender: publicKey.toBase58(),
          recipient: recipientAddress,
          content,
          timestamp: Date.now(),
        });

        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
        return false;
      }
    },
    [publicKey]
  );

  return {
    messages,
    contacts,
    sendMessage,
    error,
  };
};
