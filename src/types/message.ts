export interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
  status: "pending" | "read" | "expired";
  readAt?: Date;
  expiresAt?: Date;
}

export interface Contact {
  address: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface MessageStore {
  messages: Message[];
  contacts: Contact[];
}
