use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrderSide {
    Buy,
    Sell,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrderType {
    Limit,
    Market,
    StopLimit,
    PostOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrderStatus {
    New,
    PartiallyFilled,
    Filled,
    Canceled,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub client_order_id: Option<String>,
    pub symbol: String,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub price: f64,
    pub quantity: f64,
    pub filled_quantity: f64,
    pub status: OrderStatus,
    pub stop_price: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: String,
    pub fee: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    pub id: Uuid,
    pub symbol: String,
    pub price: f64,
    pub quantity: f64,
    pub maker_order_id: Uuid,
    pub taker_order_id: Uuid,
    pub taker_side: OrderSide,
    pub executed_at: DateTime<Utc>,
    pub quote_volume: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBookLevel {
    pub price: f64,
    pub quantity: f64,
    pub total: f64,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBookDepth {
    pub symbol: String,
    pub bids: Vec<OrderBookLevel>,
    pub asks: Vec<OrderBookLevel>,
    pub timestamp: DateTime<Utc>,
    pub last_price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticker {
    pub symbol: String,
    pub name: String,
    pub base_asset: String,
    pub quote_asset: String,
    pub last_price: f64,
    pub price_change_24h: f64,
    pub price_change_pct_24h: f64,
    pub price_change_pct_7d: f64,
    pub high_24h: f64,
    pub low_24h: f64,
    pub volume_24h: f64,
    pub quote_volume_24h: f64,
    pub market_cap: f64,
    pub sparkline_7d: Vec<f64>,
    pub icon_color: String,
    pub is_gainer: bool,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Kline {
    pub time: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
}

/// Authoritative real-world price update (e.g. from the Binance feed), used to replace the internal simulated walk for crypto pairs.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalTickerSync {
    pub symbol: String,
    pub last_price: f64,
    pub price_change_24h: f64,
    pub price_change_pct_24h: f64,
    pub high_24h: f64,
    pub low_24h: f64,
    pub volume_24h: f64,
    pub quote_volume_24h: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetBalance {
    pub asset: String,
    pub free: f64,
    pub locked: f64,
    pub total: f64,
    pub usd_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAccountBalance {
    pub account_id: String,
    pub name: String,
    pub usd_value: f64,
    pub percentage: f64,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioSummary {
    pub total_equity_usd: f64,
    pub available_balance_usd: f64,
    pub margin_used_usd: f64,
    pub unrealized_pnl_usd: f64,
    pub pnl_24h_pct: f64,
    pub balances: Vec<AssetBalance>,
    pub sub_accounts: Vec<SubAccountBalance>,
    pub recent_activities: Vec<TransactionActivity>,
    pub chain: String,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionActivity {
    pub id: Uuid,
    pub tx_type: String, // "Deposit", "Withdraw", "Trade", "Swap", "Transfer"
    pub asset: String,
    pub amount: f64,
    pub usd_value: f64,
    pub status: String,
    pub timestamp: DateTime<Utc>,
    pub tx_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    pub symbol: String,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub price: Option<f64>,
    pub quantity: f64,
    pub stop_price: Option<f64>,
    pub leverage: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OtcQuoteRequest {
    pub from_asset: String,
    pub to_asset: String,
    pub from_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OtcQuoteResponse {
    pub quote_id: Uuid,
    pub from_asset: String,
    pub to_asset: String,
    pub from_amount: f64,
    pub to_amount: f64,
    pub exchange_rate: f64,
    pub inverse_rate: f64,
    pub fee_usd: f64,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OtcSwapRequest {
    pub quote_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletActionRequest {
    pub action: String, // "deposit", "withdraw", "transfer", "fiat_deposit", "web3_deposit", "stripe_deposit", "moonpay_deposit"
    pub asset: String,
    pub amount: f64,
    pub address: Option<String>,
    pub chain: Option<String>,
    pub from_wallet: Option<String>,
    pub to_wallet: Option<String>,
    pub fiat_currency: Option<String>,
    pub fiat_amount: Option<f64>,
    pub payment_method: Option<String>,
    pub payment_ref: Option<String>,
    pub tx_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripePaymentIntentRequest {
    pub amount_cents: i64,
    pub currency: String,
    pub target_account: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripePaymentIntentResponse {
    pub client_secret: String,
    pub payment_intent_id: String,
    pub publishable_key: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BinaryDirection {
    Call, // Expect price to be higher at expiry
    Put,  // Expect price to be lower at expiry
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BinaryStatus {
    Active,
    #[serde(alias = "Won")]
    Profit,
    Lost,
    Tied,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryContract {
    pub id: Uuid,
    pub symbol: String,
    pub direction: BinaryDirection,
    pub stake_usd: f64,
    pub strike_price: f64,
    pub duration_seconds: u64,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub settled_at: Option<DateTime<Utc>>,
    pub settlement_price: Option<f64>,
    pub payout_pct: f64, // e.g. 0.85 (85%)
    pub payout_usd: f64, // e.g. stake * (1 + payout_pct) if won, 0 if lost
    pub status: BinaryStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaceBinaryRequest {
    pub symbol: String,
    pub direction: BinaryDirection,
    pub stake_usd: f64,
    pub duration_seconds: u64,
    pub strike_price: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryStats {
    pub total_trades: usize,
    pub wins: usize,
    pub losses: usize,
    pub ties: usize,
    pub win_rate_pct: f64,
    pub total_profit_usd: f64,
    pub active_contracts_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum WsMessage {
    TickerUpdate(Ticker),
    DepthUpdate(OrderBookDepth),
    TradeUpdate(Trade),
    OrderUpdate(Order),
    PortfolioUpdate(PortfolioSummary),
    KlineUpdate { symbol: String, kline: Kline },
    BinaryContractUpdate(BinaryContract),
    BinaryResult(BinaryContract),
}

