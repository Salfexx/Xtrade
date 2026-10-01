use std::sync::Arc;
use chrono::Utc;
use uuid::Uuid;
use crate::models::{Kline, Order, OrderSide, OrderStatus, OrderType, Ticker, WsMessage};
use crate::state::AppState;

pub fn initialize_tickers() -> Vec<Ticker> {
    vec![
        Ticker {
            symbol: "BTC/USDT".to_string(),
            name: "Bitcoin".to_string(),
            base_asset: "BTC".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 79750.00,
            price_change_24h: 1840.20,
            price_change_pct_24h: 2.36,
            price_change_pct_7d: 5.8,
            high_24h: 80200.00,
            low_24h: 78900.00,
            volume_24h: 24535.7,
            quote_volume_24h: 1_605_046_800.0,
            market_cap: 1289.0 * 1_000_000_000.0,
            sparkline_7d: vec![62000.0, 62800.0, 63500.0, 64200.0, 63900.0, 64800.0, 65420.5],
            icon_color: "#F7931A".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "GOLD/USD".to_string(),
            name: "Gold (XAU)".to_string(),
            base_asset: "GOLD".to_string(),
            quote_asset: "USD".to_string(),
            last_price: 2518.40,
            price_change_24h: 14.80,
            price_change_pct_24h: 0.59,
            price_change_pct_7d: 2.1,
            high_24h: 2530.00,
            low_24h: 2495.00,
            volume_24h: 184500.0,
            quote_volume_24h: 464_644_800.0,
            market_cap: 17_500.0 * 1_000_000_000.0,
            sparkline_7d: vec![2480.0, 2490.0, 2502.0, 2508.0, 2512.0, 2515.0, 2518.4],
            icon_color: "#FFD700".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "EURO/USD".to_string(),
            name: "Euro / US Dollar".to_string(),
            base_asset: "EURO".to_string(),
            quote_asset: "USD".to_string(),
            last_price: 1.0875,
            price_change_24h: 0.0032,
            price_change_pct_24h: 0.30,
            price_change_pct_7d: 0.8,
            high_24h: 1.0910,
            low_24h: 1.0830,
            volume_24h: 8945000.0,
            quote_volume_24h: 9_727_687.0,
            market_cap: 2_400.0 * 1_000_000_000.0,
            sparkline_7d: vec![1.081, 1.083, 1.084, 1.085, 1.086, 1.087, 1.0875],
            icon_color: "#003399".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "OIL/USD".to_string(),
            name: "Crude Oil (WTI)".to_string(),
            base_asset: "OIL".to_string(),
            quote_asset: "USD".to_string(),
            last_price: 73.65,
            price_change_24h: 1.25,
            price_change_pct_24h: 1.73,
            price_change_pct_7d: 3.4,
            high_24h: 74.80,
            low_24h: 71.90,
            volume_24h: 642000.0,
            quote_volume_24h: 47_283_300.0,
            market_cap: 1_850.0 * 1_000_000_000.0,
            sparkline_7d: vec![70.5, 71.2, 71.8, 72.4, 72.9, 73.2, 73.65],
            icon_color: "#1C1C1C".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "ETH/USDT".to_string(),
            name: "Ethereum".to_string(),
            base_asset: "ETH".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 3485.75,
            price_change_24h: 82.50,
            price_change_pct_24h: 2.42,
            price_change_pct_7d: 4.1,
            high_24h: 3550.00,
            low_24h: 3380.00,
            volume_24h: 18455.58,
            quote_volume_24h: 64_324_470.0,
            market_cap: 418.57 * 1_000_000_000.0,
            sparkline_7d: vec![3300.0, 3340.0, 3390.0, 3420.0, 3410.0, 3460.0, 3485.75],
            icon_color: "#627EEA".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "SOL/USDT".to_string(),
            name: "Solana".to_string(),
            base_asset: "SOL".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 148.40,
            price_change_24h: 6.85,
            price_change_pct_24h: 4.84,
            price_change_pct_7d: 8.2,
            high_24h: 152.00,
            low_24h: 139.00,
            volume_24h: 8453.38,
            quote_volume_24h: 1_254_539.0,
            market_cap: 68.8 * 1_000_000_000.0,
            sparkline_7d: vec![135.0, 138.0, 140.0, 142.0, 145.0, 147.0, 148.4],
            icon_color: "#14F195".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "BNB/USDT".to_string(),
            name: "BNB".to_string(),
            base_asset: "BNB".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 582.40,
            price_change_24h: 12.80,
            price_change_pct_24h: 2.25,
            price_change_pct_7d: 3.9,
            high_24h: 590.00,
            low_24h: 568.00,
            volume_24h: 12546.38,
            quote_volume_24h: 7_306_936.0,
            market_cap: 87.2 * 1_000_000_000.0,
            sparkline_7d: vec![560.0, 565.0, 570.0, 574.0, 578.0, 580.0, 582.4],
            icon_color: "#F3BA2F".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "XRP/USDT".to_string(),
            name: "Ripple".to_string(),
            base_asset: "XRP".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 0.584,
            price_change_24h: 0.018,
            price_change_pct_24h: 3.18,
            price_change_pct_7d: 4.5,
            high_24h: 0.605,
            low_24h: 0.562,
            volume_24h: 2184000.0,
            quote_volume_24h: 1_275_480.0,
            market_cap: 32.5 * 1_000_000_000.0,
            sparkline_7d: vec![0.55, 0.56, 0.565, 0.57, 0.575, 0.58, 0.584],
            icon_color: "#23292F".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "DOGE/USDT".to_string(),
            name: "Dogecoin".to_string(),
            base_asset: "DOGE".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 0.114,
            price_change_24h: 0.0058,
            price_change_pct_24h: 5.36,
            price_change_pct_7d: 9.4,
            high_24h: 0.120,
            low_24h: 0.106,
            volume_24h: 845635.38,
            quote_volume_24h: 96_748_651.0,
            market_cap: 16.5 * 1_000_000_000.0,
            sparkline_7d: vec![0.102, 0.105, 0.108, 0.110, 0.112, 0.113, 0.114],
            icon_color: "#C2A633".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "ADA/USDT".to_string(),
            name: "Cardano".to_string(),
            base_asset: "ADA".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 0.385,
            price_change_24h: 0.012,
            price_change_pct_24h: 3.22,
            price_change_pct_7d: 5.1,
            high_24h: 0.398,
            low_24h: 0.369,
            volume_24h: 452000.0,
            quote_volume_24h: 174_020.0,
            market_cap: 13.8 * 1_000_000_000.0,
            sparkline_7d: vec![0.36, 0.365, 0.37, 0.375, 0.38, 0.382, 0.385],
            icon_color: "#0033AD".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "LTC/USDT".to_string(),
            name: "Litecoin".to_string(),
            base_asset: "LTC".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 68.20,
            price_change_24h: 1.45,
            price_change_pct_24h: 2.17,
            price_change_pct_7d: 4.2,
            high_24h: 70.50,
            low_24h: 66.00,
            volume_24h: 5520.0,
            quote_volume_24h: 376_542.0,
            market_cap: 5.1 * 1_000_000_000.0,
            sparkline_7d: vec![64.0, 65.0, 66.0, 66.8, 67.2, 67.8, 68.2],
            icon_color: "#345D9D".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "AVAX/USDT".to_string(),
            name: "Avalanche".to_string(),
            base_asset: "AVAX".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 26.85,
            price_change_24h: 1.25,
            price_change_pct_24h: 4.88,
            price_change_pct_7d: 7.6,
            high_24h: 27.90,
            low_24h: 25.10,
            volume_24h: 8900.0,
            quote_volume_24h: 238_965.0,
            market_cap: 10.6 * 1_000_000_000.0,
            sparkline_7d: vec![24.5, 25.0, 25.4, 25.8, 26.2, 26.5, 26.85],
            icon_color: "#E84142".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "LINK/USDT".to_string(),
            name: "Chainlink".to_string(),
            base_asset: "LINK".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 11.92,
            price_change_24h: 0.48,
            price_change_pct_24h: 4.20,
            price_change_pct_7d: 6.8,
            high_24h: 12.30,
            low_24h: 11.20,
            volume_24h: 12450.0,
            quote_volume_24h: 148_404.0,
            market_cap: 7.2 * 1_000_000_000.0,
            sparkline_7d: vec![10.8, 11.1, 11.3, 11.5, 11.6, 11.8, 11.92],
            icon_color: "#375BD2".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "NEAR/USDT".to_string(),
            name: "NEAR Protocol".to_string(),
            base_asset: "NEAR".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 4.85,
            price_change_24h: 0.32,
            price_change_pct_24h: 7.06,
            price_change_pct_7d: 11.2,
            high_24h: 5.10,
            low_24h: 4.40,
            volume_24h: 27800.0,
            quote_volume_24h: 134_830.0,
            market_cap: 5.8 * 1_000_000_000.0,
            sparkline_7d: vec![4.2, 4.35, 4.48, 4.55, 4.68, 4.75, 4.85],
            icon_color: "#000000".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "SUI/USDT".to_string(),
            name: "Sui".to_string(),
            base_asset: "SUI".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 0.945,
            price_change_24h: 0.065,
            price_change_pct_24h: 7.39,
            price_change_pct_7d: 14.5,
            high_24h: 0.990,
            low_24h: 0.860,
            volume_24h: 173600.0,
            quote_volume_24h: 164_052.0,
            market_cap: 2.5 * 1_000_000_000.0,
            sparkline_7d: vec![0.80, 0.82, 0.85, 0.88, 0.90, 0.92, 0.945],
            icon_color: "#4FA2E7".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "QNT/USDT".to_string(),
            name: "Quant".to_string(),
            base_asset: "QNT".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 72.80,
            price_change_24h: 2.10,
            price_change_pct_24h: 2.97,
            price_change_pct_7d: 5.3,
            high_24h: 75.00,
            low_24h: 69.50,
            volume_24h: 3635.38,
            quote_volume_24h: 264_655.0,
            market_cap: 1.05 * 1_000_000_000.0,
            sparkline_7d: vec![68.0, 69.0, 70.0, 70.8, 71.5, 72.0, 72.8],
            icon_color: "#182830".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
        Ticker {
            symbol: "ROSE/USDT".to_string(),
            name: "Oasis Network".to_string(),
            base_asset: "ROSE".to_string(),
            quote_asset: "USDT".to_string(),
            last_price: 0.0645,
            price_change_24h: 0.0035,
            price_change_pct_24h: 5.74,
            price_change_pct_7d: 8.9,
            high_24h: 0.0680,
            low_24h: 0.0595,
            volume_24h: 745000.0,
            quote_volume_24h: 48_052.0,
            market_cap: 0.43 * 1_000_000_000.0,
            sparkline_7d: vec![0.058, 0.059, 0.061, 0.062, 0.063, 0.064, 0.0645],
            icon_color: "#E53E3E".to_string(),
            is_gainer: true,
            updated_at: Utc::now(),
        },
    ]
}

pub fn generate_initial_klines(base_price: f64, count: usize) -> Vec<Kline> {
    let mut klines = Vec::new();
    let now = Utc::now().timestamp();
    let mut current_price = base_price * 0.92;

    for i in 0..count {
        let time = now - ((count - i) as i64 * 300);
        let delta = (rand::random::<f64>() - 0.48) * (current_price * 0.008);
        let open = current_price;
        let close = (open + delta).max(1.0);
        let high = open.max(close) + (rand::random::<f64>() * current_price * 0.004);
        let low = (open.min(close) - (rand::random::<f64>() * current_price * 0.004)).max(0.5);
        let volume = (rand::random::<f64>() * 25.0 + 5.0).round();

        klines.push(Kline {
            time,
            open,
            high,
            low,
            close,
            volume,
        });

        current_price = close;
    }

    klines
}

pub fn seed_orderbook(book: &mut crate::engine::OrderBook, current_price: f64) {
    let spread = current_price * 0.0005;
    
    for i in 1..=15 {
        let price = current_price + spread + (i as f64 * current_price * 0.001);
        let qty = (rand::random::<f64>() * 1.5 + 0.2).round() * 1.0;
        let order = Order {
            id: Uuid::new_v4(),
            client_order_id: None,
            symbol: book.symbol.clone(),
            side: OrderSide::Sell,
            order_type: OrderType::Limit,
            price: (price * 100.0).round() / 100.0,
            quantity: qty,
            filled_quantity: 0.0,
            status: OrderStatus::New,
            stop_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            user_id: "market_maker".to_string(),
            fee: 0.0,
        };
        book.place_order(order);
    }

    for i in 1..=15 {
        let price = (current_price - spread - (i as f64 * current_price * 0.001)).max(0.01);
        let qty = (rand::random::<f64>() * 1.5 + 0.2).round() * 1.0;
        let order = Order {
            id: Uuid::new_v4(),
            client_order_id: None,
            symbol: book.symbol.clone(),
            side: OrderSide::Buy,
            order_type: OrderType::Limit,
            price: (price * 100.0).round() / 100.0,
            quantity: qty,
            filled_quantity: 0.0,
            status: OrderStatus::New,
            stop_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            user_id: "market_maker".to_string(),
            fee: 0.0,
        };
        book.place_order(order);
    }
}

/// Apply an authoritative real-world price (e.g. the live Binance feed) for a symbol,
/// replacing the internal simulated random walk so the strike/settlement price used by
/// the binary engine always matches the price the user actually sees on screen.
pub fn apply_external_ticker_update(state: &AppState, update: crate::models::ExternalTickerSync) {
    let symbol = update.symbol.clone();
    let new_price = update.last_price;
    if new_price <= 0.0 {
        return;
    }

    let updated_ticker = {
        let mut tickers = state.tickers.write();
        match tickers.get_mut(&symbol) {
            Some(ticker) => {
                ticker.last_price = new_price;
                ticker.price_change_24h = update.price_change_24h;
                ticker.price_change_pct_24h = update.price_change_pct_24h;
                ticker.high_24h = update.high_24h;
                ticker.low_24h = update.low_24h;
                ticker.volume_24h = update.volume_24h;
                ticker.quote_volume_24h = update.quote_volume_24h;
                ticker.is_gainer = update.price_change_pct_24h >= 0.0;
                ticker.updated_at = Utc::now();
                ticker.clone()
            }
            None => return,
        }
    };

    let _ = state.ws_tx.send(WsMessage::TickerUpdate(updated_ticker));

    if let Some(book_lock) = state.orderbooks.get(&symbol) {
        let mut book = book_lock.write();
        book.last_price = new_price;
        let depth = book.get_depth(15);
        drop(book);
        let _ = state.ws_tx.send(WsMessage::DepthUpdate(depth));
    }

    {
        let mut klines_map = state.klines.write();
        if let Some(kline_list) = klines_map.get_mut(&symbol) {
            if let Some(last_kline) = kline_list.last_mut() {
                last_kline.close = new_price;
                last_kline.high = last_kline.high.max(new_price);
                last_kline.low = last_kline.low.min(new_price);

                let _ = state.ws_tx.send(WsMessage::KlineUpdate {
                    symbol: symbol.clone(),
                    kline: last_kline.clone(),
                });
            }
        }
    }

    // Settle any binary contracts against this authoritative real price
    crate::engine::BinaryManager::evaluate_and_settle(state, &symbol, new_price);
}

pub async fn start_market_feed_loop(state: Arc<AppState>) {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(300));

    loop {
        interval.tick().await;

        let symbols: Vec<String> = {
            let t = state.tickers.read();
            t.keys().cloned().collect()
        };

        for symbol in &symbols {
            let mut tickers = state.tickers.write();
            if let Some(ticker) = tickers.get_mut(symbol) {
                let time_since_update = Utc::now().signed_duration_since(ticker.updated_at);
                // If real Binance ticks were received in the last 2.0 seconds, skip synthetic updates
                if ticker.quote_asset == "USDT" && time_since_update.num_milliseconds() < 2000 {
                    let last_p = ticker.last_price;
                    drop(tickers);
                    crate::engine::BinaryManager::evaluate_and_settle(&state, symbol, last_p);
                    continue;
                }

                let is_crypto = ticker.quote_asset == "USDT";
                let step_vol = if is_crypto { 0.00007 } else { 0.000035 };
                let change_pct = (rand::random::<f64>() - 0.499) * step_vol;
                let new_price = ((ticker.last_price * (1.0 + change_pct)) * 10000.0).round() / 10000.0;
                ticker.last_price = new_price;
                ticker.price_change_24h += new_price * change_pct;
                ticker.high_24h = ticker.high_24h.max(new_price);
                ticker.low_24h = ticker.low_24h.min(new_price);
                ticker.volume_24h += rand::random::<f64>() * 0.15;
                ticker.updated_at = Utc::now();

                let updated_ticker = ticker.clone();
                drop(tickers);

                let _ = state.ws_tx.send(WsMessage::TickerUpdate(updated_ticker));

                if let Some(book_lock) = state.orderbooks.get(symbol) {
                    let mut book = book_lock.write();
                    book.last_price = new_price;
                    let depth = book.get_depth(15);
                    drop(book);
                    let _ = state.ws_tx.send(WsMessage::DepthUpdate(depth));
                }

                let mut klines_map = state.klines.write();
                if let Some(kline_list) = klines_map.get_mut(symbol) {
                    if let Some(last_kline) = kline_list.last_mut() {
                        last_kline.close = new_price;
                        last_kline.high = last_kline.high.max(new_price);
                        last_kline.low = last_kline.low.min(new_price);
                        last_kline.volume += 0.02;

                        let _ = state.ws_tx.send(WsMessage::KlineUpdate {
                            symbol: symbol.to_string(),
                            kline: last_kline.clone(),
                        });
                    }
                }

                // Check and settle any expired binary contracts
                crate::engine::BinaryManager::evaluate_and_settle(&state, symbol, new_price);
            }
        }
    }
}
