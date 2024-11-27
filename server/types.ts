import WebSocket from "ws";

export interface Client {
  socket: WebSocket;
  walletAddress: string;
}

export interface Message {
  walletAddress: string | null;
  type: string;
  sender?: string;
  recipient?: string;
  content?: string;
  message?: string;
  timestamp?: string;
}
