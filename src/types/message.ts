// types/message.ts
export interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  status: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  createdAt: number;
  expiresAt: number;
  status: "pending" | "active" | "rejected";
}
