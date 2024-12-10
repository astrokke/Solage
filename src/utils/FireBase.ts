import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  update,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

type Message = {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  status: string;
};

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
  id: string,
  sender: string,
  recipient: string,
  content: string
): Promise<void> => {
  if (!sender || !recipient || !content) {
    throw new Error("Tous les paramètres sont requis !");
  }
  try {
    const messagesRef = ref(db, "messages");
    const newMessageRef = push(messagesRef);
    const messageData = {
      id,
      sender,
      recipient,
      content,
      timestamp: Date.now(),
      status: "pending",
    };

    await set(newMessageRef, messageData);
    console.info("Message ajouté avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ajout du message :", error);
    throw error;
  }
};

export const subscribeToMessages = (
  userAddress: string,
  callback: (messages: Message[]) => void
): void => {
  const messagesRef = ref(db, "messages");
  const userMessagesQuery = query(
    messagesRef,
    orderByChild("recipient"),
    equalTo(userAddress)
  );

  onValue(
    userMessagesQuery,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data) {
          messages.push({ id: childSnapshot.key, ...data });
        } else {
          console.error(
            "Données introuvables pour le snapshot :",
            childSnapshot
          );
        }
      });

      callback(messages);
    },
    (error) => {
      console.error("Erreur lors de la récupération des messages :", error);
    }
  );
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const messageRef = ref(db, `messages/${messageId}`);
    await update(messageRef, { status: "read", readAt: Date.now() });
    console.info(`Message ${messageId} marqué comme lu.`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du message :", error);
    throw error;
  }
};

export const getConversations = (
  userAddress: string,
  callback: (conversations: any[]) => void
): void => {
  const messagesRef = ref(db, "messages");

  onValue(
    messagesRef,
    (snapshot) => {
      const conversationsMap = new Map<string, any>();

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (!data) {
          console.error("Données introuvables :", childSnapshot.key);
          return;
        }

        const otherParticipant =
          data.sender === userAddress ? data.recipient : data.sender;

        if (!otherParticipant) {
          console.error("Participant introuvable pour :", data);
          return;
        }

        if (!conversationsMap.has(otherParticipant)) {
          conversationsMap.set(otherParticipant, {
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
        } else {
          const conversation = conversationsMap.get(otherParticipant);
          if (conversation) {
            conversation.lastMessage = {
              content: data.content,
              timestamp: data.timestamp,
            };
            if (data.status === "pending" && data.recipient === userAddress) {
              conversation.unreadCount++;
            }
          }
        }
      });

      callback(Array.from(conversationsMap.values()));
    },
    (error) => {
      console.error(
        "Erreur lors de la récupération des conversations :",
        error
      );
    }
  );
};
