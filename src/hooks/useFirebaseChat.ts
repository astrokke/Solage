import { useState, useEffect, useCallback } from "react";
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!publicKey) return;

    const address = publicKey.toBase58();
    let unsubscribeMessages: (() => void) | undefined;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;

    const setupSubscriptions = async () => {
      try {
        if (!isInitialized) {
          // Get conversations first
          const convos = await getConversations(address);
          setConversations(convos);
          setIsInitialized(true);
        }

        // Then subscribe to messages
        unsubscribeMessages = subscribeToMessages(address, (newMessages) => {
          setMessages(newMessages);
          retryCount = 0; // Reset retry count on successful connection
        });
      } catch (error) {
        console.error("Error setting up Firebase subscriptions:", error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupSubscriptions, retryDelay * retryCount);
        } else {
          setError("Failed to connect to chat service after multiple attempts");
        }
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [publicKey, isInitialized]);

  const sendMessage = useCallback(
    async (recipientAddress: string, content: string) => {
      if (!publicKey) {
        setError("Wallet not connected");
        return false;
      }

      try {
        setError(null);
        await addMessage(publicKey.toBase58(), recipientAddress, content);
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
        return false;
      }
    },
    [publicKey]
  );

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }, []);

  return {
    messages,
    conversations,
    sendMessage,
    markAsRead,
    error,
    isInitialized,
  };
};
