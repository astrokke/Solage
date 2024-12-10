import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  DocumentData,
  updateDoc,
  doc,
} from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const addMessage = async (
  sender: string,
  recipient: string,
  content: string
): Promise<void> => {
  try {
    const messageData = {
      sender,
      recipient,
      content,
      timestamp: Timestamp.now(),
      status: "pending",
      participants: [sender, recipient],
    };

    await addDoc(collection(db, "messages"), messageData);
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

export const subscribeToMessages = (
  userAddress: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("participants", "array-contains", userAddress),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        sender: data.sender,
        recipient: data.recipient,
        content: data.content,
        timestamp: data.timestamp.toDate(),
        status: data.status,
      });
    });
    callback(messages);
  });
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, {
      status: "read",
      readAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

export const getConversations = async (userAddress: string) => {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("participants", "array-contains", userAddress),
    orderBy("timestamp", "desc")
  );

  return new Promise((resolve) => {
    onSnapshot(q, (snapshot) => {
      const conversations = new Map<string, DocumentData>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const otherParticipant =
          data.sender === userAddress ? data.recipient : data.sender;

        if (!conversations.has(otherParticipant)) {
          conversations.set(otherParticipant, {
            address: otherParticipant,
            lastMessage: {
              content: data.content,
              timestamp: data.timestamp,
            },
            unreadCount:
              data.status === "pending" && data.recipient === userAddress
                ? 1
                : 0,
          });
        }
      });

      resolve(Array.from(conversations.values()));
    });
  });
};
