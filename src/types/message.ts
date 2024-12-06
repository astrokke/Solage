export interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
  readAt?: Date;
  expiresAt?: Date;
  status: "pending" | "read" | "expired";
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
