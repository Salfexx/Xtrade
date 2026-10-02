use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use tokio::sync::broadcast;
use uuid::Uuid;
use crate::engine::{DbManager, Ledger, OrderBook, RiskConfig, RiskEngine};
use crate::market_feed::{generate_initial_klines, initialize_tickers, seed_orderbook};
use crate::models::{BinaryContract, Kline, Order, OtcQuoteResponse, PortfolioSummary, Ticker, Trade, WsMessage};

pub struct AppState {
    pub tickers: RwLock<HashMap<String, Ticker>>,
    pub orderbooks: HashMap<String, Arc<RwLock<OrderBook>>>,
    pub klines: RwLock<HashMap<String, Vec<Kline>>>,
    pub ledger: RwLock<Ledger>,
    pub risk_engine: Arc<RiskEngine>,
    pub orders: RwLock<HashMap<Uuid, Order>>,
    pub trades: RwLock<Vec<Trade>>,
    pub ws_tx: broadcast::Sender<WsMessage>,
    pub ws_broadcast: broadcast::Sender<WsMessage>,
    pub otc_quotes: RwLock<HashMap<Uuid, OtcQuoteResponse>>,
    pub binary_contracts: RwLock<Vec<BinaryContract>>,
    pub binance_config: RwLock<crate::engine::BinanceTestnetConfig>,
    pub db: Arc<DbManager>,
}

impl AppState {
    pub fn new() -> Arc<Self> {
        let (ws_tx, _) = broadcast::channel(1024);
        let (db, hydrated_contracts) = DbManager::init("data/xtrade.db");
        let raw_tickers = initialize_tickers();
        let mut tickers_map = HashMap::new();
        let mut orderbooks = HashMap::new();
        let mut klines_map = HashMap::new();

        for ticker in raw_tickers {
            let symbol = ticker.symbol.clone();
            let price = ticker.last_price;
            
            let mut book = OrderBook::new(symbol.clone(), price);
            seed_orderbook(&mut book, price);
            orderbooks.insert(symbol.clone(), Arc::new(RwLock::new(book)));

            klines_map.insert(symbol.clone(), generate_initial_klines(price, 60));
            tickers_map.insert(symbol, ticker);
        }

        let ledger = Ledger::new();
        let risk_engine = Arc::new(RiskEngine::new(RiskConfig::default()));
        let binance_config = crate::engine::BinanceTestnetConfig::default();

        Arc::new(Self {
            tickers: RwLock::new(tickers_map),
            orderbooks,
            klines: RwLock::new(klines_map),
            ledger: RwLock::new(ledger),
            risk_engine,
            orders: RwLock::new(HashMap::new()),
            trades: RwLock::new(Vec::new()),
            ws_broadcast: ws_tx.clone(),
            ws_tx,
            otc_quotes: RwLock::new(HashMap::new()),
            binary_contracts: RwLock::new(hydrated_contracts),
            binance_config: RwLock::new(binance_config),
            db,
        })
    }

    pub fn get_asset_prices(&self) -> HashMap<String, f64> {
        let mut prices = HashMap::new();
        prices.insert("USDT".to_string(), 1.0);
        prices.insert("USD".to_string(), 1.0);
        
        let tickers = self.tickers.read();
        for (symbol, ticker) in tickers.iter() {
            let parts: Vec<&str> = symbol.split('/').collect();
            if parts.len() == 2 && (parts[1] == "USDT" || parts[1] == "USD") {
                prices.insert(parts[0].to_string(), ticker.last_price);
            }
        }
        prices
    }

    pub fn get_portfolio_summary(&self) -> PortfolioSummary {
        let prices = self.get_asset_prices();
        let ledger = self.ledger.read();
        ledger.get_portfolio_summary("demo_user", &prices)
    }
}

