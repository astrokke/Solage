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
  updateDoc,
  doc,
  enableIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  DocumentData,
} from "firebase/firestore";
import { Message } from "../types/message";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA2yE4q6C49Fu6CDwsOB0_ijOVfVHNgnT8",
  authDomain: "solage-7829c.firebaseapp.com",
  projectId: "solage-7829c",
  storageBucket: "solage-7829c.firebasestorage.app",
  messagingSenderId: "228678821089",
  appId: "1:228678821089:web:e7effecb832be33a7143a0",
  measurementId: "G-3PTTNYLQ9C",
};

// Initialisation de Firebase et Firestore avec des paramètres optimisés
const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
  }),
});

// Fonction pour activer la persistance hors ligne
const enablePersistence = async (): Promise<void> => {
  try {
    await enableIndexedDbPersistence(db);
    console.info("Offline persistence enabled successfully.");
  } catch (err: any) {
    if (err.code === "failed-precondition") {
      console.warn(
        "Persistence failed: Multiple tabs open. Persistence enabled in the first tab only."
      );
    } else if (err.code === "unimplemented") {
      console.warn("Persistence is not supported in this browser.");
    } else {
      console.error("Error enabling persistence:", err);
    }
  }
};

// Appel de la fonction pour activer la persistance
enablePersistence();

// Fonction pour ajouter un message
export const addMessage = async (
  sender: string,
  recipient: string,
  content: string
): Promise<void> => {
  try {
    const messageData: Message = {
      sender,
      recipient,
      content,
      timestamp: Timestamp.now(),
      status: "pending",
      participants: [sender, recipient].sort(),
    };

    await addDoc(collection(db, "messages"), messageData);
    console.info("Message added successfully.");
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

// Fonction pour souscrire aux messages d'un utilisateur
export const subscribeToMessages = (
  userAddress: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("participants", "array-contains", userAddress),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Message[];

      callback(messages);
    },
    (error) => {
      console.error("Messages subscription error:", error);
    }
  );
};

// Fonction pour marquer un message comme lu
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, {
      status: "read",
      readAt: Timestamp.now(),
    });
    console.info(`Message ${messageId} marked as read.`);
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

// Fonction pour récupérer les conversations d'un utilisateur
export const getConversations = async (
  userAddress: string
): Promise<DocumentData[]> => {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("participants", "array-contains", userAddress),
    orderBy("timestamp", "desc")
  );

  return new Promise<DocumentData[]>((resolve) => {
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
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
                timestamp: data.timestamp.toDate(),
              },
              unreadCount:
                data.status === "pending" && data.recipient === userAddress
                  ? 1
                  : 0,
            });
          }
        });

        resolve(Array.from(conversations.values()));
        unsubscribe(); // Clean up subscription after first data retrieval
      },
      (error) => {
        console.error("Conversations subscription error:", error);
        resolve([]);
      }
    );
  });
};
