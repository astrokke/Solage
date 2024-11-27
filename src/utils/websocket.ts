import {
  WEBSOCKET_URL,
  WEBSOCKET_RETRY_DELAY,
  MAX_RECONNECT_ATTEMPTS,
  ERROR_MESSAGES,
} from "./constants";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout = WEBSOCKET_RETRY_DELAY;
  private isIntentionalClose = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    private onMessage: (data: WebSocketMessage) => void,
    private onError: (error: string) => void,
    private onConnectionChange: (connected: boolean) => void
  ) {}

  connect(walletAddress: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WEBSOCKET_URL);
      this.setupEventListeners(walletAddress);
    } catch (error) {
      console.error("WebSocket creation error:", error);
      this.handleReconnect(walletAddress);
    }
  }

  private setupEventListeners(walletAddress: string) {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.resetConnectionState();
      this.onConnectionChange(true);
      this.authenticate(walletAddress);
      this.setupPing();
    };

    this.ws.onmessage = this.handleMessage;
    this.ws.onclose = () => this.handleClose(walletAddress);
    this.ws.onerror = this.handleError;
  }

  private setupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 20000);
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      console.log("Received WebSocket message:", data);
      this.onMessage(data);
    } catch (error) {
      console.error("Message parsing error:", error);
    }
  };

  private handleClose = (walletAddress: string) => {
    this.onConnectionChange(false);
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (!this.isIntentionalClose) {
      this.handleReconnect(walletAddress);
    }
  };

  private handleError = (event: Event) => {
    console.error("WebSocket error:", event);
    this.onError(ERROR_MESSAGES.WEBSOCKET_CONNECTION_ERROR);
  };

  private handleReconnect(walletAddress: string) {
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.reconnectTimeout *= 2;
        this.connect(walletAddress);
      }, this.reconnectTimeout);
    } else {
      this.onError("Connection failed after multiple attempts");
    }
  }

  private resetConnectionState() {
    this.reconnectAttempts = 0;
    this.reconnectTimeout = WEBSOCKET_RETRY_DELAY;
    this.isIntentionalClose = false;
  }

  private authenticate(walletAddress: string) {
    this.send({
      type: "authenticate",
      walletAddress,
    });
  }

  send(data: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("Sending WebSocket message:", data);
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.log("WebSocket not ready, message not sent:", data);
    return false;
  }

  disconnect() {
    if (this.ws) {
      this.isIntentionalClose = true;
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
      }
      this.ws.close();
      this.ws = null;
    }
  }
}
