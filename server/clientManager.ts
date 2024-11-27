import WebSocket from "ws";
import { Client } from "./types";

class ClientManager {
  private clients: Map<string, Client>;

  constructor() {
    this.clients = new Map();
  }

  addClient(walletAddress: string, socket: WebSocket): void {
    this.clients.set(walletAddress, { socket, walletAddress });
    console.log(`User authenticated: ${walletAddress}`);
  }

  removeClient(walletAddress: string): void {
    this.clients.delete(walletAddress);
    console.log(`User disconnected: ${walletAddress}`);
  }

  getClient(walletAddress: string): Client | undefined {
    return this.clients.get(walletAddress);
  }

  getAllClients(): string[] {
    return Array.from(this.clients.keys());
  }

  pingAllClients(): void {
    this.clients.forEach(({ socket }) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    });
  }
}

export const clientManager = new ClientManager();
