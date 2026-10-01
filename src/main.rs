mod models;
mod engine;
mod market_feed;
mod state;
mod api;

use std::net::SocketAddr;
use axum::{
    routing::{delete, get},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::api::{rest, ws};
use crate::market_feed::start_market_feed_loop;
use crate::state::AppState;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Initializing Xtrade Trading Engine...");
    let state = AppState::new();

    // Spawn background market simulator
    let sim_state = state.clone();
    tokio::spawn(async move {
        start_market_feed_loop(sim_state).await;
    });

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // API Routes
    let api_routes = Router::new()
        .route("/market/tickers", get(rest::get_tickers))
        .route("/market/ticker-sync", axum::routing::post(rest::sync_ticker))
        .route("/market/depth", get(rest::get_depth))
        .route("/market/klines", get(rest::get_klines))
        .route("/portfolio", get(rest::get_portfolio))
        .route("/orders", get(rest::get_orders).post(rest::place_order))
        .route("/orders/{id}", delete(rest::cancel_order))
        .route("/trades", get(rest::get_trades))
        .route("/otc/quote", axum::routing::post(rest::request_otc_quote))
        .route("/otc/swap", axum::routing::post(rest::execute_otc_swap))
        .route("/wallet/action", axum::routing::post(rest::wallet_action))
        .route("/stripe/create-payment-intent", axum::routing::post(rest::create_stripe_payment_intent))
        .route("/webhooks/stripe", axum::routing::post(rest::stripe_webhook))
        .route("/webhooks/moonpay", axum::routing::post(rest::moonpay_webhook))
        .route("/binary/place", axum::routing::post(rest::place_binary_order))
        .route("/binary/contracts", get(rest::get_binary_contracts))
        .route("/binary/stats", get(rest::get_binary_stats))
        .route("/binance/config", get(rest::get_binance_config).post(rest::update_binance_config))
        .route("/portfolio/test-deposit", axum::routing::post(rest::test_deposit));

    // Fallback static files serving from frontend/dist
    let serve_dir = ServeDir::new("frontend/dist")
        .not_found_service(ServeFile::new("frontend/dist/index.html"));

    let app = Router::new()
        .nest("/api/v1", api_routes)
        .route("/ws", get(ws::ws_handler))
        .fallback_service(serve_dir)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    info!("🚀 Xtrade Trading Platform running at http://localhost:3000");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
