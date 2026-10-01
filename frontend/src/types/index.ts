export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'POST_ONLY';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED';

export interface Order {
  id: string;
  client_order_id?: string;
  symbol: string;
  side: OrderSide;
  order_type: OrderType;
  price: number;
  quantity: number;
  filled_quantity: number;
  status: OrderStatus;
  stop_price?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  fee: number;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  maker_order_id: string;
  taker_order_id: string;
  taker_side: OrderSide;
  executed_at: string;
  quote_volume: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  count: number;
}

export interface OrderBookDepth {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
  last_price: number;
}

export interface Ticker {
  symbol: string;
  name: string;
  base_asset: string;
  quote_asset: string;
  last_price: number;
  price_change_24h: number;
  price_change_pct_24h: number;
  price_change_pct_7d: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  quote_volume_24h: number;
  market_cap: number;
  sparkline_7d: number[];
  icon_color: string;
  is_gainer: boolean;
  updated_at: string;
}

export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usd_value: number;
}

export interface TransactionActivity {
  id: string;
  tx_type: string;
  asset: string;
  amount: number;
  usd_value: number;
  status: string;
  timestamp: string;
  tx_hash?: string;
}

export interface SubAccountBalance {
  account_id: string;
  name: string;
  usd_value: number;
  percentage: number;
  color: string;
}

export interface PortfolioSummary {
  total_equity_usd: number;
  available_balance_usd: number;
  margin_used_usd: number;
  unrealized_pnl_usd: number;
  pnl_24h_pct: number;
  balances: AssetBalance[];
  sub_accounts?: SubAccountBalance[];
  recent_activities: TransactionActivity[];
  chain: string;
  updated_at: string;
}

export interface OtcQuoteResponse {
  quote_id: string;
  from_asset: string;
  to_asset: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  inverse_rate: number;
  fee_usd: number;
  expires_at: string;
}

export type BinaryDirection = 'Call' | 'Put';
export type BinaryStatus = 'Active' | 'Profit' | 'Won' | 'Lost' | 'Tied';

export interface BinaryContract {
  id: string;
  symbol: string;
  direction: BinaryDirection;
  stake_usd: number;
  strike_price: number;
  duration_seconds: number;
  created_at: string;
  expires_at: string;
  settled_at?: string;
  settlement_price?: number;
  payout_pct: number;
  payout_usd: number;
  status: BinaryStatus;
}

export interface PlaceBinaryPayload {
  symbol: string;
  direction: BinaryDirection;
  stake_usd: number;
  duration_seconds: number;
  strike_price?: number;
}

export interface BinaryStats {
  total_trades: number;
  wins: number;
  losses: number;
  ties: number;
  win_rate_pct: number;
  total_profit_usd: number;
  active_contracts_count: number;
}

