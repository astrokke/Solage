import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onValue,
  update,
  query,
} from "firebase/database";
import { Message } from "../types/message";

const firebaseConfig = {
  apiKey: "AIzaSyA2yE4q6C49Fu6cDwsOB0_ijOVfVHNgnT8",
  authDomain: "solage-7829c.firebaseapp.com",
  databaseURL:
    "https://solage-7829c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "solage-7829c",
  storageBucket: "solage-7829c.firebasestorage.app",
  messagingSenderId: "228678821089",
  appId: "1:228678821089:web:e7effecb832be33a7143a0",
  measurementId: "G-3PTTNYLQ9C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const addMessage = async (
  sender: string,
  recipient: string,
  content: string
): Promise<void> => {
  try {
    const messagesRef = ref(db, "messages");
    const newMessage = {
      sender,
      recipient,
      content,
      timestamp: Date.now(),
      status: "pending",
      participants: [sender, recipient].sort().join(","),
    };

    await push(messagesRef, newMessage);
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

export const subscribeToMessages = (
  userAddress: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = ref(db, "messages");
  const messagesQuery = query(messagesRef);

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const participants = data.participants.split(",");

      if (participants.includes(userAddress)) {
        messages.push({
          id: childSnapshot.key!,
          sender: data.sender,
          recipient: data.recipient,
          content: data.content,
          timestamp: new Date(data.timestamp),
          status: data.status,
        });
      }
    });

    // Sort messages by timestamp in descending order
    messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    callback(messages);
  });

  return () => {
    unsubscribe();
  };
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const messageRef = ref(db, `messages/${messageId}`);
    await update(messageRef, {
      status: "read",
      readAt: Date.now(),
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

export const getConversations = async (userAddress: string) => {
  return new Promise((resolve) => {
    const messagesRef = ref(db, "messages");
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const conversations = new Map();

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const participants = data.participants.split(",");

        if (participants.includes(userAddress)) {
          const otherParticipant = participants.find(
            (p: string) => p !== userAddress
          )!;

          if (!conversations.has(otherParticipant)) {
            conversations.set(otherParticipant, {
              address: otherParticipant,
              lastMessage: {
                content: data.content,
                timestamp: new Date(data.timestamp),
              },
              unreadCount:
                data.status === "pending" && data.recipient === userAddress
                  ? 1
                  : 0,
            });
          }
        }
      });

      resolve(Array.from(conversations.values()));
      unsubscribe();
    });
  });
};
