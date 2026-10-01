use xtrade::engine::BinaryManager;
use xtrade::models::{BinaryDirection, BinaryStatus, PlaceBinaryRequest};
use xtrade::state::AppState;

#[test]
fn test_binary_contract_placement_and_settlement() {
    let state = AppState::new();

    // 1. Place a Call contract on BTC/USDT
    let req = PlaceBinaryRequest {
        symbol: "BTC/USDT".to_string(),
        direction: BinaryDirection::Call,
        stake_usd: 100.0,
        duration_seconds: 10,
    };

    let contract = BinaryManager::place_contract(&state, req).expect("Failed to place binary contract");
    assert_eq!(contract.status, BinaryStatus::Active);
    assert_eq!(contract.stake_usd, 100.0);
    assert_eq!(contract.payout_pct, 0.97);

    let strike = contract.strike_price;

    // 2. Simulate price above strike -> should win
    let win_price = strike + 50.0;
    // Simulate expired time
    {
        let mut contracts = state.binary_contracts.write();
        contracts[0].expires_at = chrono::Utc::now() - chrono::Duration::seconds(1);
    }

    BinaryManager::evaluate_and_settle(&state, "BTC/USDT", win_price);

    {
        let contracts = state.binary_contracts.read();
        assert_eq!(contracts[0].status, BinaryStatus::Profit);
        assert_eq!(contracts[0].payout_usd, 197.0); // 100 + 97% = 197
    }

    // 3. Verify Binary Stats
    let stats = BinaryManager::get_stats(&state);
    assert_eq!(stats.wins, 1);
    assert_eq!(stats.losses, 0);
    assert_eq!(stats.total_profit_usd, 97.0);
    assert_eq!(stats.win_rate_pct, 100.0);
}
