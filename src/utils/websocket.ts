export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second

  constructor(
    private url: string,
    private onMessage: (data: any) => void,
    private onError: (error: string) => void,
    private onConnectionChange: (connected: boolean) => void
  ) {}

  connect(walletAddress: string) {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
        this.onConnectionChange(true);

        // Authenticate immediately after connection
        this.authenticate(walletAddress);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      this.ws.onclose = () => {
        this.onConnectionChange(false);
        this.handleReconnect(walletAddress);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.onError("WebSocket connection error");
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.onError("Failed to create WebSocket connection");
    }
  }

  private handleReconnect(walletAddress: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.reconnectTimeout *= 2; // Exponential backoff
        this.connect(walletAddress);
      }, this.reconnectTimeout);
    } else {
      this.onError("Failed to reconnect after multiple attempts");
    }
  }

  private authenticate(walletAddress: string) {
    this.send({
      type: "authenticate",
      walletAddress,
    });
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.onError("WebSocket is not connected");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
