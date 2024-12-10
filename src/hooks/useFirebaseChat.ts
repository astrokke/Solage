import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  subscribeToMessages,
  addMessage,
  getConversations,
  markMessageAsRead,
} from "../utils/FireBase";
import { Message } from "../types/message";

export const useFirebaseChat = (publicKey: PublicKey | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const address = publicKey.toBase58();
    let unsubscribeMessages: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        // Subscribe to messages
        unsubscribeMessages = subscribeToMessages(address, (newMessages) => {
          setMessages(newMessages);
        });

        // Get conversations
        const convos = await getConversations(address);
        setConversations(convos);
      } catch (error) {
        console.error("Error setting up Firebase subscriptions:", error);
        setError("Failed to connect to chat service");
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [publicKey]);

  const sendMessage = async (recipientAddress: string, content: string) => {
    if (!publicKey) {
      setError("Wallet not connected");
      return false;
    }

    try {
      await addMessage(publicKey.toBase58(), recipientAddress, content);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
      return false;
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  return {
    messages,
    conversations,
    sendMessage,
    markAsRead,
    error,
  };
};
