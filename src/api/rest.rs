use std::sync::Arc;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::{
    CreateOrderRequest, Order, OrderStatus, OrderType, OtcQuoteRequest,
    OtcQuoteResponse, OtcSwapRequest, WalletActionRequest, WsMessage,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct SymbolQuery {
    pub symbol: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    pub fn err(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(message.into()),
        }
    }
}

// GET /api/v1/market/tickers
pub async fn get_tickers(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let tickers = state.tickers.read();
    let mut list: Vec<_> = tickers.values().cloned().collect();
    list.sort_by(|a, b| b.market_cap.partial_cmp(&a.market_cap).unwrap_or(std::cmp::Ordering::Equal));
    Json(ApiResponse::ok(list))
}

// POST /api/v1/market/ticker-sync — accepts an authoritative real-world price (e.g. live Binance feed)
// so the binary options strike/settlement price always matches what the user sees on screen.
pub async fn sync_ticker(
    State(state): State<Arc<AppState>>,
    Json(update): Json<crate::models::ExternalTickerSync>,
) -> impl IntoResponse {
    crate::market_feed::apply_external_ticker_update(&state, update);
    Json(ApiResponse::ok("synced"))
}

// GET /api/v1/market/depth?symbol=BTC/USDT
pub async fn get_depth(
    Query(query): Query<SymbolQuery>,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let symbol = query.symbol.unwrap_or_else(|| "BTC/USDT".to_string());
    let limit = query.limit.unwrap_or(20);

    if let Some(book_lock) = state.orderbooks.get(&symbol) {
        let book = book_lock.read();
        let depth = book.get_depth(limit);
        (StatusCode::OK, Json(ApiResponse::ok(depth)))
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::err(format!("Symbol {} not found", symbol))),
        )
    }
}

// GET /api/v1/market/klines?symbol=BTC/USDT
pub async fn get_klines(
    Query(query): Query<SymbolQuery>,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let symbol = query.symbol.unwrap_or_else(|| "BTC/USDT".to_string());
    let klines_map = state.klines.read();
    if let Some(klines) = klines_map.get(&symbol) {
        (StatusCode::OK, Json(ApiResponse::ok(klines.clone())))
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::err(format!("Symbol {} not found", symbol))),
        )
    }
}

// GET /api/v1/portfolio
pub async fn get_portfolio(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let prices = state.get_asset_prices();
    let ledger = state.ledger.read();
    let portfolio = ledger.get_portfolio_summary("demo_user", &prices);
    Json(ApiResponse::ok(portfolio))
}

// GET /api/v1/orders
pub async fn get_orders(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let orders = state.orders.read();
    let mut list: Vec<_> = orders.values().cloned().collect();
    list.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Json(ApiResponse::ok(list))
}

// GET /api/v1/trades
pub async fn get_trades(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let trades = state.trades.read();
    let mut list: Vec<_> = trades.iter().cloned().collect();
    list.sort_by(|a, b| b.executed_at.cmp(&a.executed_at));
    Json(ApiResponse::ok(list))
}

// POST /api/v1/orders
pub async fn place_order(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateOrderRequest>,
) -> impl IntoResponse {
    let user_id = "demo_user";
    let symbol = req.symbol.clone();

    // 1. Get current market price
    let current_price = {
        let tickers = state.tickers.read();
        match tickers.get(&symbol) {
            Some(t) => t.last_price,
            None => return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Order>::err(format!("Invalid symbol {}", symbol))),
            ),
        }
    };

    // 2. Pre-trade Risk Validation
    {
        let ledger = state.ledger.read();
        if let Err(e) = state.risk_engine.validate_order(&req, current_price, &ledger, user_id) {
            return (StatusCode::BAD_REQUEST, Json(ApiResponse::<Order>::err(e)));
        }
    }

    // 3. Create Order Model Price
    let order_price = match req.order_type {
        OrderType::Market => current_price,
        _ => req.price.unwrap_or(current_price),
    };

    // 4. Check if Binance Testnet Routing is enabled
    let binance_cfg = state.binance_config.read().clone();
    let is_binance_routing = binance_cfg.is_enabled && !binance_cfg.api_key.is_empty();

    if is_binance_routing {
        match crate::engine::BinanceRouter::place_order(
            &binance_cfg,
            &symbol,
            req.side,
            req.order_type,
            req.quantity,
            req.price,
        ).await {
            Ok(b_res) => {
                let parts: Vec<&str> = symbol.split('/').collect();
                let (base, quote) = (parts[0], parts[1]);

                let exec_qty: f64 = b_res.executed_qty.parse().unwrap_or(req.quantity);
                let cum_quote: f64 = b_res.cummulative_quote_qty.parse().unwrap_or(exec_qty * order_price);
                let exec_price = if exec_qty > 0.0 { cum_quote / exec_qty } else { order_price };

                let is_filled = b_res.status == "FILLED";
                let status = match b_res.status.as_str() {
                    "FILLED" => OrderStatus::Filled,
                    "PARTIALLY_FILLED" => OrderStatus::PartiallyFilled,
                    "NEW" => OrderStatus::New,
                    "CANCELED" => OrderStatus::Canceled,
                    _ => OrderStatus::New,
                };

                let completed_order = Order {
                    id: Uuid::new_v4(),
                    client_order_id: Some(format!("BINANCE-{}", b_res.order_id)),
                    symbol: symbol.clone(),
                    side: req.side,
                    order_type: req.order_type,
                    price: exec_price,
                    quantity: req.quantity,
                    filled_quantity: exec_qty,
                    status,
                    stop_price: req.stop_price,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                    user_id: user_id.to_string(),
                    fee: cum_quote * 0.001,
                };

                // Settle in local ledger
                {
                    let mut ledger = state.ledger.write();
                    if is_filled || exec_qty > 0.0 {
                        match req.side {
                            crate::models::OrderSide::Buy => {
                                ledger.update_free_balance(user_id, quote, -(cum_quote + completed_order.fee));
                                ledger.update_free_balance(user_id, base, exec_qty);
                            }
                            crate::models::OrderSide::Sell => {
                                ledger.update_free_balance(user_id, base, -exec_qty);
                                ledger.update_free_balance(user_id, quote, (cum_quote - completed_order.fee).max(0.0));
                            }
                        }
                    } else if req.order_type != OrderType::Market {
                        let _ = ledger.lock_funds_for_order(&completed_order);
                    }
                }

                // Record order & trade
                {
                    let mut orders_map = state.orders.write();
                    orders_map.insert(completed_order.id, completed_order.clone());

                    if is_filled || exec_qty > 0.0 {
                        let trade = crate::models::Trade {
                            id: Uuid::new_v4(),
                            symbol: symbol.clone(),
                            price: exec_price,
                            quantity: exec_qty,
                            maker_order_id: Uuid::nil(),
                            taker_order_id: completed_order.id,
                            taker_side: req.side,
                            executed_at: Utc::now(),
                            quote_volume: cum_quote,
                        };
                        let mut trades_vec = state.trades.write();
                        trades_vec.push(trade.clone());
                        let _ = state.ws_tx.send(WsMessage::TradeUpdate(trade));
                    }
                }

                let _ = state.ws_tx.send(WsMessage::OrderUpdate(completed_order.clone()));
                let prices = state.get_asset_prices();
                let portfolio = state.ledger.read().get_portfolio_summary(user_id, &prices);
                let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));

                return (StatusCode::OK, Json(ApiResponse::ok(completed_order)));
            }
            Err(e) => {
                return (StatusCode::BAD_REQUEST, Json(ApiResponse::<Order>::err(e)));
            }
        }
    }

    let order = Order {
        id: Uuid::new_v4(),
        client_order_id: None,
        symbol: symbol.clone(),
        side: req.side,
        order_type: req.order_type,
        price: order_price,
        quantity: req.quantity,
        filled_quantity: 0.0,
        status: OrderStatus::New,
        stop_price: req.stop_price,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: user_id.to_string(),
        fee: 0.0,
    };

    // 5. Lock collateral in Ledger if limit order
    {
        let mut ledger = state.ledger.write();
        if req.order_type != OrderType::Market {
            if let Err(e) = ledger.lock_funds_for_order(&order) {
                return (StatusCode::BAD_REQUEST, Json(ApiResponse::<Order>::err(e)));
            }
        }
    }

    // 6. Submit to Local Matching Engine (CLOB)
    let book_lock = match state.orderbooks.get(&symbol) {
        Some(b) => b.clone(),
        None => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Order>::err("Order book unavailable")),
        ),
    };

    let match_result = {
        let mut book = book_lock.write();
        book.place_order(order.clone())
    };

    // 7. Settle any matched trades
    {
        let mut ledger = state.ledger.write();
        let orders_map = state.orders.read();
        for trade in &match_result.trades {
            if let Some(maker_order) = orders_map.get(&trade.maker_order_id) {
                ledger.settle_trade(trade, maker_order, &match_result.order);
            }
        }
    }

    // 8. Store / Update Orders & Trades
    {
        let mut orders_map = state.orders.write();
        orders_map.insert(match_result.order.id, match_result.order.clone());
        for resting in &match_result.updated_resting_orders {
            orders_map.insert(resting.id, resting.clone());
        }

        let mut trades_vec = state.trades.write();
        for trade in &match_result.trades {
            trades_vec.push(trade.clone());
            let _ = state.ws_tx.send(WsMessage::TradeUpdate(trade.clone()));
        }
    }

    // 9. Broadcast order update & fresh portfolio
    let _ = state.ws_tx.send(WsMessage::OrderUpdate(match_result.order.clone()));
    let prices = state.get_asset_prices();
    let portfolio = state.ledger.read().get_portfolio_summary(user_id, &prices);
    let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));

    (StatusCode::OK, Json(ApiResponse::ok(match_result.order)))
}

// DELETE /api/v1/orders/:id
pub async fn cancel_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<Uuid>,
) -> impl IntoResponse {
    let (symbol, client_order_id) = {
        let orders_map = state.orders.read();
        if let Some(order) = orders_map.get(&order_id) {
            if order.status == OrderStatus::Filled || order.status == OrderStatus::Canceled {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse::<Order>::err("Order is already closed")),
                );
            }
            (order.symbol.clone(), order.client_order_id.clone())
        } else {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<Order>::err(format!("Order {} not found", order_id))),
            );
        }
    };

    // If this order was routed to Binance Testnet, cancel on Binance
    if let Some(ref client_id) = client_order_id {
        if client_id.starts_with("BINANCE-") {
            if let Ok(b_id) = client_id.trim_start_matches("BINANCE-").parse::<i64>() {
                let binance_cfg = state.binance_config.read().clone();
                let _ = crate::engine::BinanceRouter::cancel_order(&binance_cfg, &symbol, b_id).await;
            }
        }
    }

    let mut orders_map = state.orders.write();
    if let Some(order) = orders_map.get_mut(&order_id) {
        order.status = OrderStatus::Canceled;
        order.updated_at = Utc::now();

        // Unlock funds in Ledger
        {
            let mut ledger = state.ledger.write();
            ledger.unlock_funds_on_cancel(order);
        }

        // Remove from local orderbook
        if let Some(book_lock) = state.orderbooks.get(&order.symbol) {
            let mut book = book_lock.write();
            book.cancel_order(order.id);
        }

        let _ = state.ws_tx.send(WsMessage::OrderUpdate(order.clone()));
        let prices = state.get_asset_prices();
        let portfolio = state.ledger.read().get_portfolio_summary(&order.user_id, &prices);
        let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));

        (StatusCode::OK, Json(ApiResponse::ok(order.clone())))
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Order>::err(format!("Order {} not found", order_id))),
        )
    }
}

// POST /api/v1/otc/quote
pub async fn request_otc_quote(
    State(state): State<Arc<AppState>>,
    Json(req): Json<OtcQuoteRequest>,
) -> impl IntoResponse {
    let prices = state.get_asset_prices();
    let from_price = prices.get(&req.from_asset).copied().unwrap_or(1.0);
    let to_price = prices.get(&req.to_asset).copied().unwrap_or(1.0);

    let exchange_rate = from_price / to_price;
    let inverse_rate = to_price / from_price;
    let to_amount = req.from_amount * exchange_rate;
    let fee_usd = (req.from_amount * from_price) * 0.0005; // 0.05% OTC fee

    let quote = OtcQuoteResponse {
        quote_id: Uuid::new_v4(),
        from_asset: req.from_asset,
        to_asset: req.to_asset,
        from_amount: req.from_amount,
        to_amount: (to_amount * 10000.0).round() / 10000.0,
        exchange_rate,
        inverse_rate,
        fee_usd,
        expires_at: Utc::now() + chrono::Duration::seconds(30),
    };

    let mut quotes = state.otc_quotes.write();
    quotes.insert(quote.quote_id, quote.clone());

    Json(ApiResponse::ok(quote))
}

// POST /api/v1/otc/swap
pub async fn execute_otc_swap(
    State(state): State<Arc<AppState>>,
    Json(req): Json<OtcSwapRequest>,
) -> impl IntoResponse {
    let mut quotes = state.otc_quotes.write();
    if let Some(quote) = quotes.remove(&req.quote_id) {
        if Utc::now() > quote.expires_at {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::err("Quote expired")),
            );
        }

        let mut ledger = state.ledger.write();
        match ledger.swap(
            "demo_user",
            &quote.from_asset,
            &quote.to_asset,
            quote.from_amount,
            quote.to_amount,
        ) {
            Ok(_) => {
                let prices = state.get_asset_prices();
                let portfolio = ledger.get_portfolio_summary("demo_user", &prices);
                let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));
                (StatusCode::OK, Json(ApiResponse::ok("Swap successful")))
            }
            Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e))),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::err("Quote not found")),
        )
    }
}

// POST /api/v1/wallet/action
pub async fn wallet_action(
    State(state): State<Arc<AppState>>,
    Json(req): Json<WalletActionRequest>,
) -> impl IntoResponse {
    let user_id = "demo_user";
    let mut ledger = state.ledger.write();

    match req.action.as_str() {
        "deposit" => {
            let prices = state.get_asset_prices();
            let asset_price = prices.get(&req.asset).copied().unwrap_or(1.0);
            ledger.deposit(
                user_id,
                &req.asset,
                req.amount,
                req.chain,
                req.to_wallet,
                asset_price,
            );
            let portfolio = ledger.get_portfolio_summary(user_id, &prices);
            let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));
            (StatusCode::OK, Json(ApiResponse::ok("Deposit processed successfully")))
        }
        "withdraw" => {
            let addr = req.address.unwrap_or_else(|| "0xDefaultAddress".to_string());
            match ledger.withdraw(user_id, &req.asset, req.amount, &addr) {
                Ok(_) => {
                    let prices = state.get_asset_prices();
                    let portfolio = ledger.get_portfolio_summary(user_id, &prices);
                    let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));
                    (StatusCode::OK, Json(ApiResponse::ok("Withdrawal submitted for processing")))
                }
                Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e))),
            }
        }
        "transfer" => {
            let from_w = req.from_wallet.unwrap_or_else(|| "Spot Account".to_string());
            let to_w = req.to_wallet.unwrap_or_else(|| "Futures Account".to_string());
            let prices = state.get_asset_prices();
            let asset_price = prices.get(&req.asset).copied().unwrap_or(1.0);

            match ledger.transfer(user_id, &from_w, &to_w, &req.asset, req.amount, asset_price) {
                Ok(_) => {
                    let portfolio = ledger.get_portfolio_summary(user_id, &prices);
                    let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));
                    (
                        StatusCode::OK,
                        Json(ApiResponse::ok("Internal transfer completed successfully")),
                    )
                }
                Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e))),
            }
        }
        "web3_deposit" => {
            let prices = state.get_asset_prices();
            let asset_price = prices.get(&req.asset).copied().unwrap_or(1.0);
            ledger.web3_deposit(
                user_id,
                &req.asset,
                req.amount,
                req.chain,
                req.to_wallet,
                req.tx_hash,
                asset_price,
            );
            let portfolio = ledger.get_portfolio_summary(user_id, &prices);
            let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));
            (
                StatusCode::OK,
                Json(ApiResponse::ok("Web3 on-chain deposit confirmed successfully")),
            )
        }
        "fiat_deposit" | "stripe_deposit" | "moonpay_deposit" => {
            let fiat_curr = req.fiat_currency.unwrap_or_else(|| "USD".to_string());
            let fiat_amt = req.fiat_amount.unwrap_or(req.amount);
            let pay_method = req.payment_method.unwrap_or_else(|| match req.action.as_str() {
                "stripe_deposit" => "Stripe 3DS".to_string(),
                "moonpay_deposit" => "MoonPay".to_string(),
                _ => "Visa / Mastercard".to_string(),
            });
            let prices = state.get_asset_prices();
            let asset_price = prices.get(&req.asset).copied().unwrap_or(1.0);

            match ledger.fiat_deposit(
                user_id,
                &fiat_curr,
                fiat_amt,
                &req.asset,
                req.amount,
                &pay_method,
                req.to_wallet,
                req.payment_ref,
                asset_price,
            ) {
                Ok(_) => {
                    let portfolio = ledger.get_portfolio_summary(user_id, &prices);
                    let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio));
                    (
                        StatusCode::OK,
                        Json(ApiResponse::ok("Payment processed and credited successfully")),
                    )
                }
                Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e))),
            }
        }
        _ => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::err("Invalid wallet action")),
        ),
    }
}

// POST /api/v1/stripe/create-payment-intent
pub async fn create_stripe_payment_intent(
    Json(_req): Json<crate::models::StripePaymentIntentRequest>,
) -> impl IntoResponse {
    let mock_pi_id = format!("pi_{:024x}", rand::random::<u128>());
    let mock_secret = format!("{}_secret_{:024x}", mock_pi_id, rand::random::<u128>());
    let pub_key = "pk_test_51MockXtradeKey0000000000000000000000000000000000000000000000000000000000000000000000000000000".to_string();

    let res = crate::models::StripePaymentIntentResponse {
        client_secret: mock_secret,
        payment_intent_id: mock_pi_id,
        publishable_key: pub_key,
    };
    (StatusCode::OK, Json(ApiResponse::ok(res)))
}

// POST /api/v1/webhooks/stripe
pub async fn stripe_webhook(
    State(_state): State<Arc<AppState>>,
    _body: String,
) -> impl IntoResponse {
    (StatusCode::OK, Json(ApiResponse::ok("Stripe webhook received")))
}

// POST /api/v1/webhooks/moonpay
pub async fn moonpay_webhook(
    State(_state): State<Arc<AppState>>,
    _body: String,
) -> impl IntoResponse {
    (StatusCode::OK, Json(ApiResponse::ok("MoonPay webhook received")))
}

// POST /api/v1/binary/place
pub async fn place_binary_order(
    State(state): State<Arc<AppState>>,
    Json(req): Json<crate::models::PlaceBinaryRequest>,
) -> impl IntoResponse {
    match crate::engine::BinaryManager::place_contract(&state, req) {
        Ok(contract) => (StatusCode::OK, Json(ApiResponse::ok(contract))),
        Err(err) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(err))),
    }
}

// GET /api/v1/binary/contracts
pub async fn get_binary_contracts(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let contracts = state.binary_contracts.read();
    let mut list = contracts.clone();
    list.reverse(); // Most recent first
    (StatusCode::OK, Json(ApiResponse::ok(list)))
}

// GET /api/v1/binary/stats
pub async fn get_binary_stats(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let stats = crate::engine::BinaryManager::get_stats(&state);
    (StatusCode::OK, Json(ApiResponse::ok(stats)))
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BinanceConfigResponse {
    pub is_enabled: bool,
    pub api_key_masked: String,
    pub has_secret: bool,
    pub base_url: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBinanceConfigRequest {
    pub api_key: Option<String>,
    pub secret_key: Option<String>,
    pub is_enabled: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct TestDepositRequest {
    pub asset: String,
    pub amount: f64,
}

// GET /api/v1/binance/config
pub async fn get_binance_config(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let cfg = state.binance_config.read();
    let api_key_masked = if cfg.api_key.len() > 8 {
        format!("{}...{}", &cfg.api_key[..4], &cfg.api_key[cfg.api_key.len() - 4..])
    } else if !cfg.api_key.is_empty() {
        "configured".to_string()
    } else {
        "".to_string()
    };
    Json(ApiResponse::ok(BinanceConfigResponse {
        is_enabled: cfg.is_enabled,
        api_key_masked,
        has_secret: !cfg.secret_key.is_empty(),
        base_url: cfg.base_url.clone(),
    }))
}

// POST /api/v1/binance/config
pub async fn update_binance_config(
    State(state): State<Arc<AppState>>,
    Json(req): Json<UpdateBinanceConfigRequest>,
) -> impl IntoResponse {
    let mut cfg = state.binance_config.write();
    if let Some(k) = req.api_key {
        cfg.api_key = k.trim().to_string();
    }
    if let Some(s) = req.secret_key {
        cfg.secret_key = s.trim().to_string();
    }
    if let Some(en) = req.is_enabled {
        cfg.is_enabled = en;
    }
    Json(ApiResponse::ok("Binance config updated successfully"))
}

// POST /api/v1/portfolio/test-deposit
pub async fn test_deposit(
    State(state): State<Arc<AppState>>,
    Json(req): Json<TestDepositRequest>,
) -> impl IntoResponse {
    let user_id = "demo_user";
    let asset = req.asset.to_uppercase();
    let amount = req.amount.max(0.0);

    if amount <= 0.0 {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::err("Amount must be greater than 0")));
    }

    {
        let mut ledger = state.ledger.write();
        ledger.update_free_balance(user_id, &asset, amount);
        ledger.add_activity(crate::models::TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Testnet Faucet Deposit".to_string(),
            asset: asset.clone(),
            amount,
            usd_value: if asset == "USDT" || asset == "USD" { amount } else { amount * 75000.0 },
            status: "Completed".to_string(),
            timestamp: Utc::now(),
            tx_hash: Some(format!("0xTESTNET_{}", Uuid::new_v4().to_string().replace("-", "")[..10].to_uppercase())),
        });
    }

    let prices = state.get_asset_prices();
    let portfolio = state.ledger.read().get_portfolio_summary(user_id, &prices);
    let _ = state.ws_tx.send(WsMessage::PortfolioUpdate(portfolio.clone()));

    (StatusCode::OK, Json(ApiResponse::ok(portfolio)))
}

