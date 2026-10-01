import { Ticker, OrderBookDepth, Kline, PortfolioSummary, Order, Trade, OtcQuoteResponse } from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'API request failed');
  }
  return json.data;
}

export const api = {
  getTickers: () => fetchJson<Ticker[]>('/market/tickers'),
  // Pushes the real live price (e.g. from Binance) so the backend's strike/settlement price matches what the user sees.
  syncTicker: (payload: {
    symbol: string;
    last_price: number;
    price_change_24h: number;
    price_change_pct_24h: number;
    high_24h: number;
    low_24h: number;
    volume_24h: number;
    quote_volume_24h: number;
  }) => fetchJson<string>('/market/ticker-sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getDepth: (symbol: string, limit = 15) => fetchJson<OrderBookDepth>(`/market/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`),
  getKlines: (symbol: string) => fetchJson<Kline[]>(`/market/klines?symbol=${encodeURIComponent(symbol)}`),
  getPortfolio: () => fetchJson<PortfolioSummary>('/portfolio'),
  getOrders: () => fetchJson<Order[]>('/orders'),
  getTrades: () => fetchJson<Trade[]>('/trades'),
  
  placeOrder: (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    order_type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'POST_ONLY';
    price?: number;
    quantity: number;
    stop_price?: number;
    leverage?: number;
  }) => fetchJson<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),

  cancelOrder: (orderId: string) => fetchJson<Order>(`/orders/${orderId}`, {
    method: 'DELETE',
  }),

  requestOtcQuote: (fromAsset: string, toAsset: string, fromAmount: number) =>
    fetchJson<OtcQuoteResponse>('/otc/quote', {
      method: 'POST',
      body: JSON.stringify({
        from_asset: fromAsset,
        to_asset: toAsset,
        from_amount: fromAmount,
      }),
    }),

  executeOtcSwap: (quoteId: string) =>
    fetchJson<string>('/otc/swap', {
      method: 'POST',
      body: JSON.stringify({ quote_id: quoteId }),
    }),

  walletAction: (payload: {
    action: 'deposit' | 'withdraw' | 'transfer' | 'fiat_deposit' | 'web3_deposit' | 'stripe_deposit' | 'moonpay_deposit';
    asset: string;
    amount: number;
    address?: string;
    chain?: string;
    from_wallet?: string;
    to_wallet?: string;
    fiat_currency?: string;
    fiat_amount?: number;
    payment_method?: string;
    payment_ref?: string;
    tx_hash?: string;
  }) =>
    fetchJson<string>('/wallet/action', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createStripePaymentIntent: (amountCents: number, currency: string, targetAccount?: string) =>
    fetchJson<{ client_secret: string; payment_intent_id: string; publishable_key: string }>('/stripe/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount_cents: amountCents,
        currency,
        target_account: targetAccount,
      }),
    }),

  placeBinaryOrder: (payload: {
    symbol: string;
    direction: 'Call' | 'Put';
    stake_usd: number;
    duration_seconds: number;
    strike_price?: number;
  }) =>
    fetchJson<import('../types').BinaryContract>('/binary/place', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getBinaryContracts: () =>
    fetchJson<import('../types').BinaryContract[]>('/binary/contracts'),

  getBinaryStats: () =>
    fetchJson<import('../types').BinaryStats>('/binary/stats'),

  getBinanceConfig: () =>
    fetchJson<{
      is_enabled: boolean;
      api_key_masked: string;
      has_secret: boolean;
      base_url: string;
    }>('/binance/config'),

  updateBinanceConfig: (payload: {
    api_key?: string;
    secret_key?: string;
    is_enabled?: boolean;
  }) =>
    fetchJson<string>('/binance/config', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  testDeposit: (asset: string, amount: number) =>
    fetchJson<PortfolioSummary>('/portfolio/test-deposit', {
      method: 'POST',
      body: JSON.stringify({ asset, amount }),
    }),
};

