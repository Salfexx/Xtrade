use crate::models::{
    BinaryContract, BinaryDirection, BinaryStats, BinaryStatus, PlaceBinaryRequest, TransactionActivity, WsMessage,
};
use crate::state::AppState;
use chrono::{Duration as ChronoDuration, Utc};
use tracing::info;
use uuid::Uuid;

fn normalize_symbol(s: &str) -> String {
    s.replace(['/', '-', '_', ' '], "").to_uppercase()
}

pub struct BinaryManager;

impl BinaryManager {
    /// Calculate fixed payout ratio of 97% across all binary markets
    pub fn get_payout_pct(_symbol: &str) -> f64 {
        0.97
    }

    /// Place a new binary contract
    pub fn place_contract(
        state: &AppState,
        req: PlaceBinaryRequest,
    ) -> Result<BinaryContract, String> {
        if req.stake_usd < 1.0 {
            return Err("Minimum binary trade stake is 1.00 USDT".into());
        }
        if req.stake_usd > 50_000.0 {
            return Err("Maximum single binary trade stake is 50,000.00 USDT".into());
        }
        if req.duration_seconds < 5 || req.duration_seconds > 86400 {
            return Err("Trade duration must be between 5 seconds and 24 hours".into());
        }

        let user_id = "demo_user";

        // Get latest price as strike price (or use client visual strike price if supplied)
        let (matched_symbol, current_price) = match req.strike_price {
            Some(p) if p > 0.0 => (req.symbol.clone(), p),
            _ => {
                let tickers = state.tickers.read();
                if let Some(t) = tickers.get(&req.symbol) {
                    (t.symbol.clone(), t.last_price)
                } else {
                    let norm = normalize_symbol(&req.symbol);
                    tickers
                        .iter()
                        .find(|(k, _)| normalize_symbol(k) == norm)
                        .map(|(k, t)| (k.clone(), t.last_price))
                        .ok_or_else(|| format!("Ticker symbol {} not found", req.symbol))?
                }
            }
        };

        // Deduct stake from ledger (USDT)
        {
            let mut ledger = state.ledger.write();
            let usdt_free = ledger.get_available_balance(user_id, "USDT");
            if usdt_free < req.stake_usd {
                return Err(format!(
                    "Insufficient USDT balance: free available ${:.2}, required ${:.2}",
                    usdt_free, req.stake_usd
                ));
            }
            // Deduct stake
            ledger.update_free_balance(user_id, "USDT", -req.stake_usd);
            ledger.add_activity(TransactionActivity {
                id: Uuid::new_v4(),
                tx_type: "Binary Trade Stake".into(),
                asset: "USDT".into(),
                amount: req.stake_usd,
                usd_value: req.stake_usd,
                status: "Completed".into(),
                timestamp: Utc::now(),
                tx_hash: None,
            });
        }

        let now = Utc::now();
        let expires_at = now + ChronoDuration::seconds(req.duration_seconds as i64);
        let payout_pct = Self::get_payout_pct(&matched_symbol);

        let contract = BinaryContract {
            id: Uuid::new_v4(),
            symbol: matched_symbol,
            direction: req.direction,
            stake_usd: req.stake_usd,
            strike_price: current_price,
            duration_seconds: req.duration_seconds,
            created_at: now,
            expires_at,
            settled_at: None,
            settlement_price: None,
            payout_pct,
            payout_usd: 0.0,
            status: BinaryStatus::Active,
        };

        // Store contract in RAM
        {
            let mut contracts = state.binary_contracts.write();
            contracts.push(contract.clone());
        }

        // Non-blocking async persistence (< 0.001ms latency overhead)
        state.db.send(crate::engine::DbEvent::SaveContract(contract.clone()));

        // Broadcast to WebSocket clients
        let _ = state.ws_broadcast.send(WsMessage::BinaryContractUpdate(contract.clone()));

        // Broadcast updated portfolio
        let summary = state.get_portfolio_summary();
        let _ = state.ws_broadcast.send(WsMessage::PortfolioUpdate(summary));

        info!(
            "Placed Binary Contract {} for {} | Direction: {:?} | Strike: ${:.2} | Stake: ${:.2} | Expiry: {}s",
            contract.id, contract.symbol, contract.direction, contract.strike_price, contract.stake_usd, contract.duration_seconds
        );

        Ok(contract)
    }

    /// Check and settle expired binary contracts against current price
    pub fn evaluate_and_settle(state: &AppState, symbol: &str, current_price: f64) {
        let now = Utc::now();
        let user_id = "demo_user";
        let mut settled_contracts = Vec::new();
        let norm_sym = normalize_symbol(symbol);

        {
            let mut contracts = state.binary_contracts.write();
            for contract in contracts.iter_mut() {
                if contract.status == BinaryStatus::Active
                    && (contract.symbol == symbol || normalize_symbol(&contract.symbol) == norm_sym)
                    && now >= contract.expires_at
                {
                    contract.settled_at = Some(now);
                    contract.settlement_price = Some(current_price);

                    let is_win = match contract.direction {
                        BinaryDirection::Call => current_price > contract.strike_price,
                        BinaryDirection::Put => current_price < contract.strike_price,
                    };

                    if current_price == contract.strike_price {
                        contract.status = BinaryStatus::Tied;
                        contract.payout_usd = contract.stake_usd; // Refund stake
                    } else if is_win {
                        contract.status = BinaryStatus::Profit;
                        contract.payout_usd = contract.stake_usd * (1.0 + contract.payout_pct);
                    } else {
                        contract.status = BinaryStatus::Lost;
                        contract.payout_usd = 0.0;
                    }

                    settled_contracts.push(contract.clone());
                }
            }
        }

        // Settle payouts in ledger
        if !settled_contracts.is_empty() {
            let mut ledger = state.ledger.write();
            for contract in &settled_contracts {
                if contract.payout_usd > 0.0 {
                    ledger.update_free_balance(user_id, "USDT", contract.payout_usd);
                }

                let (tx_type, status) = match contract.status {
                    BinaryStatus::Profit => ("Binary Profit Payout", "Profit"),
                    BinaryStatus::Lost => ("Binary Loss", "Lost"),
                    BinaryStatus::Tied => ("Binary Tie Refund", "Refunded"),
                    BinaryStatus::Active => ("Binary Active", "Active"),
                };

                ledger.add_activity(TransactionActivity {
                    id: Uuid::new_v4(),
                    tx_type: tx_type.into(),
                    asset: "USDT".into(),
                    amount: contract.payout_usd,
                    usd_value: contract.payout_usd,
                    status: status.into(),
                    timestamp: now,
                    tx_hash: None,
                });

                // Asynchronous persistent update
                state.db.send(crate::engine::DbEvent::UpdateContract(contract.clone()));

                info!(
                    "Settled Binary Contract {} -> {:?} | Strike: ${:.2} -> Exit: ${:.2} | Payout: ${:.2}",
                    contract.id, contract.status, contract.strike_price, current_price, contract.payout_usd
                );

                let _ = state
                    .ws_broadcast
                    .send(WsMessage::BinaryResult(contract.clone()));
            }

            drop(ledger);

            // Broadcast portfolio balance update
            let summary = state.get_portfolio_summary();
            let _ = state.ws_broadcast.send(WsMessage::PortfolioUpdate(summary));
        }
    }

    /// Calculate binary performance metrics
    pub fn get_stats(state: &AppState) -> BinaryStats {
        let contracts = state.binary_contracts.read();
        let mut wins = 0;
        let mut losses = 0;
        let mut ties = 0;
        let mut active = 0;
        let mut total_profit_usd = 0.0;

        for c in contracts.iter() {
            match c.status {
                BinaryStatus::Profit => {
                    wins += 1;
                    total_profit_usd += c.payout_usd - c.stake_usd;
                }
                BinaryStatus::Lost => {
                    losses += 1;
                    total_profit_usd -= c.stake_usd;
                }
                BinaryStatus::Tied => {
                    ties += 1;
                }
                BinaryStatus::Active => {
                    active += 1;
                }
            }
        }

        let total_settled = wins + losses + ties;
        let win_rate_pct = if total_settled > 0 {
            (wins as f64 / (wins + losses).max(1) as f64) * 100.0
        } else {
            0.0
        };

        BinaryStats {
            total_trades: contracts.len(),
            wins,
            losses,
            ties,
            win_rate_pct,
            total_profit_usd,
            active_contracts_count: active,
        }
    }
}
