export type BinanceTickerData = {
  symbol: string;
  last_price: number;
  price_change_24h: number;
  price_change_pct_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  quote_volume_24h: number;
};

export type BinanceTradeData = {
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
  isBuyerMaker: boolean;
};

export type OneSecondTickData = {
  symbol: string;
  price: number;
  timestamp: number;
  high_24h?: number;
  low_24h?: number;
  price_change_pct_24h?: number;
};

export type BinanceTickerHandler = (data: BinanceTickerData) => void;
export type BinanceTradeHandler = (data: BinanceTradeData) => void;
export type OneSecondTickHandler = (data: OneSecondTickData) => void;

class BinanceFeedService {
  private ws: WebSocket | null = null;
  private tickerListeners: Set<BinanceTickerHandler> = new Set();
  private tradeListeners: Set<BinanceTradeHandler> = new Set();
  private oneSecondListeners: Set<OneSecondTickHandler> = new Set();
  private latestPrices: Map<string, number> = new Map();
  private latestTickers: Map<string, BinanceTickerData> = new Map();
  private lastTickTimes: Map<string, number> = new Map();
  private oneSecondInterval: number | null = null;
  private restPollInterval: number | null = null;
  private reconnectTimer: number | null = null;
  private isConnecting: boolean = false;
  private lastMessageTime: number = 0;

  private symbolMap: Record<string, string> = {
    BTCUSDT: 'BTC/USDT',
    ETHUSDT: 'ETH/USDT',
    SOLUSDT: 'SOL/USDT',
    LTCUSDT: 'LTC/USDT',
    XRPUSDT: 'XRP/USDT',
    QNTUSDT: 'QNT/USDT',
    BNBUSDT: 'BNB/USDT',
    DOGEUSDT: 'DOGE/USDT',
    ADAUSDT: 'ADA/USDT',
    AVAXUSDT: 'AVAX/USDT',
    LINKUSDT: 'LINK/USDT',
    NEARUSDT: 'NEAR/USDT',
    SUIUSDT: 'SUI/USDT',
    APTUSDT: 'APT/USDT',
    ROSEUSDT: 'ROSE/USDT',
    UTKUSDT: 'UTK/USDT',
  };

  isCryptoPair(symbol: string): boolean {
    return symbol.endsWith('/USDT') && !symbol.startsWith('GOLD') && !symbol.startsWith('EURO') && !symbol.startsWith('OIL');
  }

  getStandardSymbol(raw: string): string | null {
    if (!raw) return null;
    const upper = raw.toUpperCase();
    if (this.symbolMap[upper]) return this.symbolMap[upper];
    if (upper.endsWith('USDT')) {
      const base = upper.slice(0, -4);
      return `${base}/USDT`;
    }
    return null;
  }

  async fetchInitialTickers() {
    try {
      const symbols = Object.keys(this.symbolMap);
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((t: any) => {
            const standardSymbol = this.symbolMap[t.symbol];
            if (standardSymbol) {
              const parsed: BinanceTickerData = {
                symbol: standardSymbol,
                last_price: parseFloat(t.lastPrice) || 0,
                price_change_24h: parseFloat(t.priceChange) || 0,
                price_change_pct_24h: parseFloat(t.priceChangePercent) || 0,
                high_24h: parseFloat(t.highPrice) || 0,
                low_24h: parseFloat(t.lowPrice) || 0,
                volume_24h: parseFloat(t.volume) || 0,
                quote_volume_24h: parseFloat(t.quoteVolume) || 0,
              };
              this.latestTickers.set(standardSymbol, parsed);
              if (parsed.last_price > 0) {
                this.latestPrices.set(standardSymbol, parsed.last_price);
                this.lastTickTimes.set(standardSymbol, Date.now());
              }
              this.tickerListeners.forEach((handler) => handler(parsed));
            }
          });
        }
      }
    } catch {
      // Ignored network fallback
    }
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      // Lightweight Targeted Combined Stream: Only the 15 crypto pairs used in the app
      const rawSymbols = [
        'btcusdt',
        'ethusdt',
        'solusdt',
        'ltcusdt',
        'xrpusdt',
        'bnbusdt',
        'dogeusdt',
        'adausdt',
        'avaxusdt',
        'linkusdt',
        'nearusdt',
        'suiusdt',
        'aptusdt',
        'qntusdt',
        'roseusdt',
      ];
      const streams = rawSymbols.flatMap((s) => [`${s}@ticker`, `${s}@aggTrade`]);
      const streamUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
      this.ws = new WebSocket(streamUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('⚡ Connected to Binance Targeted Stream for', rawSymbols.length, 'pairs');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const data: any = payload.data !== undefined ? payload.data : payload;

          // 1. Process 24h Ticker Stream
          if (data && (data.e === '24hrTicker' || (data.c !== undefined && data.s !== undefined && data.p !== undefined))) {
            const standardSymbol = this.getStandardSymbol(data.s);
            if (standardSymbol) {
              const price = parseFloat(data.c) || 0;
              if (price > 0) {
                this.latestPrices.set(standardSymbol, price);
                this.lastTickTimes.set(standardSymbol, Date.now());
                this.lastMessageTime = Date.now();
              }
              const parsed: BinanceTickerData = {
                symbol: standardSymbol,
                last_price: price,
                price_change_24h: parseFloat(data.p) || 0,
                price_change_pct_24h: parseFloat(data.P) || 0,
                high_24h: parseFloat(data.h) || 0,
                low_24h: parseFloat(data.l) || 0,
                volume_24h: parseFloat(data.v) || 0,
                quote_volume_24h: parseFloat(data.q) || 0,
              };

              this.latestTickers.set(standardSymbol, parsed);
              this.tickerListeners.forEach((handler) => handler(parsed));
            }
            return;
          }

          // 2. Process High-Frequency AggTrade Stream
          if (data && (data.e === 'aggTrade' || (data.p !== undefined && data.s !== undefined))) {
            const standardSymbol = this.getStandardSymbol(data.s);
            if (standardSymbol) {
              const tradePrice = parseFloat(data.p) || 0;
              const tradeQty = parseFloat(data.q) || 0;
              if (tradePrice > 0) {
                this.latestPrices.set(standardSymbol, tradePrice);
                this.lastTickTimes.set(standardSymbol, Date.now());
                this.lastMessageTime = Date.now();
              }
              const parsedTrade: BinanceTradeData = {
                symbol: standardSymbol,
                price: tradePrice,
                quantity: tradeQty,
                timestamp: data.T || Date.now(),
                isBuyerMaker: !!data.m,
              };

              this.tradeListeners.forEach((handler) => handler(parsedTrade));
            }
            return;
          }

          // Fallback array processing if any
          if (Array.isArray(data)) {
            data.forEach((t) => {
              const standardSymbol = this.getStandardSymbol(t.s);
              if (standardSymbol) {
                const price = parseFloat(t.c) || 0;
                if (price > 0) {
                  this.latestPrices.set(standardSymbol, price);
                  this.lastTickTimes.set(standardSymbol, Date.now());
                  this.lastMessageTime = Date.now();
                }
                const parsed: BinanceTickerData = {
                  symbol: standardSymbol,
                  last_price: price,
                  price_change_24h: parseFloat(t.p) || 0,
                  price_change_pct_24h: parseFloat(t.P) || 0,
                  high_24h: parseFloat(t.h) || 0,
                  low_24h: parseFloat(t.l) || 0,
                  volume_24h: parseFloat(t.v) || 0,
                  quote_volume_24h: parseFloat(t.q) || 0,
                };
                this.tickerListeners.forEach((handler) => handler(parsed));
              }
            });
          }
        } catch {
          // Ignored malformed frame
        }
      };

      // Start synchronized 1-second pulse timer
      if (!this.oneSecondInterval) {
        this.oneSecondInterval = window.setInterval(() => {
          const now = Math.floor(Date.now() / 1000) * 1000;
          this.latestPrices.forEach((price, symbol) => {
            if (price > 0) {
              const tick: OneSecondTickData = {
                symbol,
                price,
                timestamp: now,
              };
              this.oneSecondListeners.forEach((handler) => handler(tick));
            }
          });
        }, 1000);
      }

      // REST Polling Health Watchdog: If WebSocket receives no messages for >4s, fetch via REST
      if (!this.restPollInterval) {
        this.restPollInterval = window.setInterval(() => {
          if (Date.now() - this.lastMessageTime > 4000) {
            this.fetchInitialTickers();
          }
        }, 4000);
      }

      this.ws.onclose = () => {
        this.isConnecting = false;
        if (!this.reconnectTimer) {
          this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 2500);
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.ws?.close();
      };
    } catch {
      this.isConnecting = false;
    }
  }

  hasRecentLiveTick(symbol: string, maxAgeMs = 2500): boolean {
    const lastTime = this.lastTickTimes.get(symbol);
    return !!lastTime && Date.now() - lastTime < maxAgeMs;
  }

  private klineCache: Map<string, { timestamp: number; price: number }[]> = new Map();

  async fetchKlines(
    symbol: string,
    interval: string = '1m',
    limit: number = 100
  ): Promise<{ timestamp: number; price: number }[]> {
    if (!this.isCryptoPair(symbol)) {
      return [];
    }
    const rawSymbol = symbol.replace('/', '').toUpperCase();
    const cacheKey = `${rawSymbol}_${interval}`;

    const cached = this.klineCache.get(cacheKey);
    if (cached && cached.length > 0) {
      const last = cached[cached.length - 1];
      if (Date.now() - last.timestamp < 15000) {
        return cached;
      }
    }

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${rawSymbol}&interval=${interval}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          const points = raw.map((item: any[]) => ({
            timestamp: Number(item[0]),
            price: parseFloat(item[4]) || 0,
          }));
          if (points.length > 0) {
            this.klineCache.set(cacheKey, points);
            return points;
          }
        }
      }
    } catch {
      // Ignored network fallback
    }

    return this.klineCache.get(cacheKey) || [];
  }

  async fetchRecentTrades(symbol: string, limit: number = 25): Promise<BinanceTradeData[]> {
    if (!this.isCryptoPair(symbol)) return [];
    const rawSymbol = symbol.replace('/', '').toUpperCase();
    try {
      const url = `https://api.binance.com/api/v3/trades?symbol=${rawSymbol}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          return raw.map((t: any) => ({
            symbol,
            price: parseFloat(t.price) || 0,
            quantity: parseFloat(t.qty) || 0,
            timestamp: t.time || Date.now(),
            isBuyerMaker: !!t.isBuyerMaker,
          }));
        }
      }
    } catch {
      // Network fallback silently handled
    }
    return [];
  }

  getLatestPrice(symbol: string): number | undefined {
    return this.latestPrices.get(symbol);
  }

  getLatestTicker(symbol: string): BinanceTickerData | undefined {
    return this.latestTickers.get(symbol);
  }

  getAllLatestTickers(): BinanceTickerData[] {
    return Array.from(this.latestTickers.values());
  }

  setLatestPrice(symbol: string, price: number) {
    if (price > 0) {
      this.latestPrices.set(symbol, price);
      this.lastTickTimes.set(symbol, Date.now());
    }
  }

  onTicker(handler: BinanceTickerHandler) {
    this.tickerListeners.add(handler);
    return () => {
      this.tickerListeners.delete(handler);
    };
  }

  onTrade(handler: BinanceTradeHandler) {
    this.tradeListeners.add(handler);
    return () => {
      this.tradeListeners.delete(handler);
    };
  }

  onOneSecondTick(handler: OneSecondTickHandler) {
    this.oneSecondListeners.add(handler);
    return () => {
      this.oneSecondListeners.delete(handler);
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.oneSecondInterval) {
      clearInterval(this.oneSecondInterval);
      this.oneSecondInterval = null;
    }
    if (this.restPollInterval) {
      clearInterval(this.restPollInterval);
      this.restPollInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.tickerListeners.clear();
    this.tradeListeners.clear();
    this.oneSecondListeners.clear();
  }
}

export const binanceFeed = new BinanceFeedService();
