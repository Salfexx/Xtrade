type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: number | null = null;

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to Xtrade Real-Time Stream');
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;
        const callbacks = this.listeners.get(type);
        if (callbacks) {
          callbacks.forEach((cb) => cb(data));
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    this.ws.onclose = () => {
      console.log('WS Connection closed, reconnecting in 2s...');
      this.reconnectTimer = window.setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = (err) => {
      console.error('WS error:', err);
      this.ws?.close();
    };
  }

  on<T>(eventType: string, handler: (data: T) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler as MessageHandler);

    return () => {
      this.listeners.get(eventType)?.delete(handler as MessageHandler);
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
