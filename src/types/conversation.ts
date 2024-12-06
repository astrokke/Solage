export interface PendingMessage {
  id: string;
  sender: string;
  timestamp: number;
  isRead: boolean;
  expiresAt: number | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: {
    content: string;
    timestamp: number;
    sender: string;
  };
  unreadCount: number;
}
