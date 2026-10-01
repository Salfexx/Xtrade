use chrono::Utc;
use uuid::Uuid;
use xtrade::engine::{Ledger, OrderBook, RiskConfig, RiskEngine};
use xtrade::models::{CreateOrderRequest, Order, OrderSide, OrderStatus, OrderType};

#[test]
fn test_orderbook_limit_match() {
    let mut book = OrderBook::new("BTC/USDT".to_string(), 60000.0);

    let maker_sell = Order {
        id: Uuid::new_v4(),
        client_order_id: None,
        symbol: "BTC/USDT".to_string(),
        side: OrderSide::Sell,
        order_type: OrderType::Limit,
        price: 60000.0,
        quantity: 1.0,
        filled_quantity: 0.0,
        status: OrderStatus::New,
        stop_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: "seller_1".to_string(),
        fee: 0.0,
    };
    let res1 = book.place_order(maker_sell);
    assert_eq!(res1.trades.len(), 0);
    assert_eq!(res1.order.status, OrderStatus::New);

    let taker_buy = Order {
        id: Uuid::new_v4(),
        client_order_id: None,
        symbol: "BTC/USDT".to_string(),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        price: 60000.0,
        quantity: 0.5,
        filled_quantity: 0.0,
        status: OrderStatus::New,
        stop_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: "buyer_1".to_string(),
        fee: 0.0,
    };
    let res2 = book.place_order(taker_buy);
    assert_eq!(res2.trades.len(), 1);
    assert_eq!(res2.trades[0].quantity, 0.5);
    assert_eq!(res2.trades[0].price, 60000.0);
    assert_eq!(res2.order.status, OrderStatus::Filled);
    assert_eq!(res2.updated_resting_orders[0].status, OrderStatus::PartiallyFilled);
    assert_eq!(res2.updated_resting_orders[0].filled_quantity, 0.5);
}

#[test]
fn test_orderbook_cancel() {
    let mut book = OrderBook::new("ETH/USDT".to_string(), 3000.0);
    let order_id = Uuid::new_v4();
    let buy_order = Order {
        id: order_id,
        client_order_id: None,
        symbol: "ETH/USDT".to_string(),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        price: 2900.0,
        quantity: 2.0,
        filled_quantity: 0.0,
        status: OrderStatus::New,
        stop_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: "buyer_1".to_string(),
        fee: 0.0,
    };
    book.place_order(buy_order);
    let depth_before = book.get_depth(10);
    assert_eq!(depth_before.bids.len(), 1);

    let canceled = book.cancel_order(order_id);
    assert!(canceled.is_some());
    assert_eq!(canceled.unwrap().status, OrderStatus::Canceled);

    let depth_after = book.get_depth(10);
    assert_eq!(depth_after.bids.len(), 0);
}

#[test]
fn test_risk_and_ledger() {
    let ledger = Ledger::new();
    let risk = RiskEngine::new(RiskConfig::default());

    let req = CreateOrderRequest {
        symbol: "BTC/USDT".to_string(),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        price: Some(60000.0),
        quantity: 0.5,
        stop_price: None,
        leverage: Some(1),
    };

    assert!(risk.validate_order(&req, 60000.0, &ledger, "demo_user").is_ok());

    let req_too_large = CreateOrderRequest {
        symbol: "BTC/USDT".to_string(),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        price: Some(60000.0),
        quantity: 2.0,
        stop_price: None,
        leverage: Some(1),
    };

    assert!(risk.validate_order(&req_too_large, 60000.0, &ledger, "demo_user").is_err());
}

#[test]
fn test_internal_transfer() {
    let mut ledger = Ledger::new();
    let user_id = "demo_user";

    // Valid transfer within balance
    let res = ledger.transfer(user_id, "Spot Account", "Futures Account", "USDT", 5000.0, 1.0);
    assert!(res.is_ok());

    // Verify activity logged
    assert_eq!(ledger.activities[0].tx_type, "Transfer");
    assert!(ledger.activities[0].asset.contains("USDT"));
    assert_eq!(ledger.activities[0].amount, 5000.0);

    // Transfer exceeding balance should fail
    let res_over = ledger.transfer(user_id, "Spot Account", "Futures Account", "USDT", 999_999.0, 1.0);
    assert!(res_over.is_err());

    // Transfer with zero or negative amount should fail
    let res_zero = ledger.transfer(user_id, "Spot Account", "Futures Account", "USDT", 0.0, 1.0);
    assert!(res_zero.is_err());
}

#[test]
fn test_sub_account_deposit() {
    let mut ledger = Ledger::new();
    let user_id = "demo_user";

    let initial_free = ledger.get_available_balance(user_id, "USDT");

    // Deposit 10,000 USDT directly to Leverage Trading account
    ledger.deposit(
        user_id,
        "USDT",
        10_000.0,
        Some("Solana (SPL)".to_string()),
        Some("Leverage Trading (Perpetual Future Trading)".to_string()),
        1.0,
    );

    let updated_free = ledger.get_available_balance(user_id, "USDT");
    assert_eq!(updated_free, initial_free + 10_000.0);

    // Verify activity recorded with network and destination
    assert_eq!(ledger.activities[0].tx_type, "Deposit");
    assert!(ledger.activities[0].asset.contains("Leverage Trading"));
    assert!(ledger.activities[0].asset.contains("Solana"));
    assert_eq!(ledger.activities[0].amount, 10_000.0);
}

#[test]
fn test_fiat_deposits_all_gateways() {
    let mut ledger = Ledger::new();
    let user_id = "demo_user";

    // 1. Visa Deposit in EUR (€1,000 -> 1,085 USDT)
    let res_visa = ledger.fiat_deposit(
        user_id,
        "EUR",
        1000.0,
        "USDT",
        1085.0,
        "Visa / Mastercard",
        Some("Spot Trading Account".to_string()),
        Some("PAY-VISA-123".to_string()),
        1.0,
    );
    assert!(res_visa.is_ok());
    assert_eq!(ledger.activities[0].tx_type, "Visa / Mastercard Deposit");
    assert!(ledger.activities[0].asset.contains("€1000"));

    // 2. PayPal Deposit in USD ($5,000 -> 5,000 USDT)
    let res_paypal = ledger.fiat_deposit(
        user_id,
        "USD",
        5000.0,
        "USDT",
        5000.0,
        "PayPal",
        Some("Margin Trading (Cross Margin)".to_string()),
        Some("PAY-PP-456".to_string()),
        1.0,
    );
    assert!(res_paypal.is_ok());
    assert!(ledger.activities[0].asset.contains("$5000"));

    // 3. U-Pay Deposit in CNY (¥7,200 -> 1,000 USDT)
    let res_upay = ledger.fiat_deposit(
        user_id,
        "CNY",
        7200.0,
        "USDT",
        1000.0,
        "U-Pay / UnionPay",
        Some("Funding / P2P Wallet".to_string()),
        Some("PAY-UPAY-789".to_string()),
        1.0,
    );
    assert!(res_upay.is_ok());
    assert!(ledger.activities[0].asset.contains("¥7200"));

    // 4. Skrill Deposit in EUR (€2,500 -> 2,712.5 USDT)
    let res_skrill = ledger.fiat_deposit(
        user_id,
        "EUR",
        2500.0,
        "USDT",
        2712.5,
        "Skrill",
        Some("Leverage Trading (Perpetual Future Trading)".to_string()),
        Some("PAY-SKRILL-101".to_string()),
        1.0,
    );
    assert!(res_skrill.is_ok());

    // 5. Live Web3 On-Chain Deposit
    ledger.web3_deposit(
        user_id,
        "USDT",
        2500.0,
        Some("BNB Smart Chain (BEP20)".to_string()),
        Some("Spot Trading Account".to_string()),
        Some("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef".to_string()),
        1.0,
    );
    assert_eq!(ledger.activities[0].tx_type, "Web3 On-Chain Deposit");
    assert_eq!(ledger.activities[0].status, "Confirmed (On-Chain)");
}



