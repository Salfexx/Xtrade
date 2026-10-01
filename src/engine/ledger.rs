use std::collections::HashMap;
use chrono::Utc;
use uuid::Uuid;
use crate::models::{AssetBalance, Order, OrderSide, PortfolioSummary, SubAccountBalance, Trade, TransactionActivity};

#[derive(Debug, Clone)]
pub struct AccountBalance {
    pub free: f64,
    pub locked: f64,
}

#[derive(Debug)]
pub struct Ledger {
    pub balances: HashMap<(String, String), AccountBalance>,
    pub sub_account_balances: HashMap<(String, String, String), f64>,
    pub activities: Vec<TransactionActivity>,
    pub selected_chain: String,
}

impl Ledger {
    pub fn new() -> Self {
        let mut ledger = Self {
            balances: HashMap::new(),
            sub_account_balances: HashMap::new(),
            activities: Vec::new(),
            selected_chain: "BNB Chain".to_string(),
        };

        // Initialize default user with demo balances matching the Raxon design ($102,540 total balance)
        let default_user = "demo_user";
        ledger.set_balance(default_user, "USDT", 62_450.0, 0.0);
        ledger.set_balance(default_user, "BTC", 0.45, 0.0);
        ledger.set_balance(default_user, "ETH", 1.85, 0.0);
        ledger.set_balance(default_user, "SOL", 14.2, 0.0);
        ledger.set_balance(default_user, "LTC", 18.5, 0.0);
        ledger.set_balance(default_user, "XRP", 4_200.0, 0.0);

        // Sub-account initial distribution
        // 1. Spot Trading Account
        ledger.set_sub_balance(default_user, "Spot Trading Account", "USDT", 36_000.0);
        ledger.set_sub_balance(default_user, "Spot Trading Account", "BTC", 0.25);
        ledger.set_sub_balance(default_user, "Spot Trading Account", "ETH", 1.10);
        ledger.set_sub_balance(default_user, "Spot Trading Account", "SOL", 8.0);
        ledger.set_sub_balance(default_user, "Spot Trading Account", "LTC", 10.0);
        ledger.set_sub_balance(default_user, "Spot Trading Account", "XRP", 2_500.0);

        // 2. Margin Trading (Cross Margin)
        ledger.set_sub_balance(default_user, "Margin Trading (Cross Margin)", "USDT", 14_450.0);
        ledger.set_sub_balance(default_user, "Margin Trading (Cross Margin)", "BTC", 0.12);
        ledger.set_sub_balance(default_user, "Margin Trading (Cross Margin)", "ETH", 0.40);
        ledger.set_sub_balance(default_user, "Margin Trading (Cross Margin)", "SOL", 3.2);

        // 3. Leverage Trading (Perpetual Future Trading)
        ledger.set_sub_balance(default_user, "Leverage Trading (Perpetual Future Trading)", "USDT", 8_000.0);
        ledger.set_sub_balance(default_user, "Leverage Trading (Perpetual Future Trading)", "BTC", 0.08);
        ledger.set_sub_balance(default_user, "Leverage Trading (Perpetual Future Trading)", "ETH", 0.35);
        ledger.set_sub_balance(default_user, "Leverage Trading (Perpetual Future Trading)", "LTC", 8.5);

        // 4. Funding / P2P Wallet
        ledger.set_sub_balance(default_user, "Funding / P2P Wallet", "USDT", 4_000.0);
        ledger.set_sub_balance(default_user, "Funding / P2P Wallet", "SOL", 3.0);
        ledger.set_sub_balance(default_user, "Funding / P2P Wallet", "XRP", 1_700.0);

        ledger.activities.push(TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Deposit".to_string(),
            asset: "USDT".to_string(),
            amount: 25_000.0,
            usd_value: 25_000.0,
            status: "Completed".to_string(),
            timestamp: Utc::now() - chrono::Duration::hours(4),
            tx_hash: Some("0x7f8a...9c2d".to_string()),
        });
        ledger.activities.push(TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Trade".to_string(),
            asset: "BTC".to_string(),
            amount: 0.15,
            usd_value: 9_642.0,
            status: "Completed".to_string(),
            timestamp: Utc::now() - chrono::Duration::hours(12),
            tx_hash: None,
        });

        ledger
    }

    pub fn set_sub_balance(&mut self, user_id: &str, account: &str, asset: &str, amount: f64) {
        self.sub_account_balances.insert(
            (user_id.to_string(), account.to_string(), asset.to_string()),
            amount,
        );
    }

    pub fn get_sub_available_balance(&self, user_id: &str, account: &str, asset: &str) -> f64 {
        self.sub_account_balances
            .get(&(user_id.to_string(), account.to_string(), asset.to_string()))
            .copied()
            .unwrap_or(0.0)
    }

    pub fn set_balance(&mut self, user_id: &str, asset: &str, free: f64, locked: f64) {
        self.balances.insert(
            (user_id.to_string(), asset.to_string()),
            AccountBalance { free, locked },
        );
    }

    pub fn get_available_balance(&self, user_id: &str, asset: &str) -> f64 {
        self.balances
            .get(&(user_id.to_string(), asset.to_string()))
            .map(|b| b.free)
            .unwrap_or(0.0)
    }

    pub fn update_free_balance(&mut self, user_id: &str, asset: &str, delta: f64) {
        let key = (user_id.to_string(), asset.to_string());
        let bal = self.balances.entry(key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
        bal.free = (bal.free + delta).max(0.0);
    }

    pub fn add_activity(&mut self, activity: TransactionActivity) {
        self.activities.insert(0, activity);
    }

    pub fn lock_funds_for_order(&mut self, order: &Order) -> Result<(), String> {
        let parts: Vec<&str> = order.symbol.split('/').collect();
        if parts.len() != 2 {
            return Err("Invalid symbol".to_string());
        }
        let (base, quote) = (parts[0], parts[1]);

        let remaining = order.quantity - order.filled_quantity;
        match order.side {
            OrderSide::Buy => {
                let required_quote = remaining * order.price;
                let key = (order.user_id.clone(), quote.to_string());
                let bal = self.balances.entry(key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                if bal.free < required_quote {
                    return Err(format!("Insufficient {} to lock for buy order", quote));
                }
                bal.free -= required_quote;
                bal.locked += required_quote;
            }
            OrderSide::Sell => {
                let required_base = remaining;
                let key = (order.user_id.clone(), base.to_string());
                let bal = self.balances.entry(key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                if bal.free < required_base {
                    return Err(format!("Insufficient {} to lock for sell order", base));
                }
                bal.free -= required_base;
                bal.locked += required_base;
            }
        }
        Ok(())
    }

    pub fn unlock_funds_on_cancel(&mut self, order: &Order) {
        let parts: Vec<&str> = order.symbol.split('/').collect();
        if parts.len() != 2 {
            return;
        }
        let (base, quote) = (parts[0], parts[1]);
        let remaining = order.quantity - order.filled_quantity;

        match order.side {
            OrderSide::Buy => {
                let locked_quote = remaining * order.price;
                let key = (order.user_id.clone(), quote.to_string());
                if let Some(bal) = self.balances.get_mut(&key) {
                    let unlock_amt = locked_quote.min(bal.locked);
                    bal.locked -= unlock_amt;
                    bal.free += unlock_amt;
                }
            }
            OrderSide::Sell => {
                let locked_base = remaining;
                let key = (order.user_id.clone(), base.to_string());
                if let Some(bal) = self.balances.get_mut(&key) {
                    let unlock_amt = locked_base.min(bal.locked);
                    bal.locked -= unlock_amt;
                    bal.free += unlock_amt;
                }
            }
        }
    }

    pub fn settle_trade(&mut self, trade: &Trade, maker: &Order, taker: &Order) {
        let parts: Vec<&str> = trade.symbol.split('/').collect();
        if parts.len() != 2 {
            return;
        }
        let (base, quote) = (parts[0], parts[1]);
        let quote_amount = trade.quantity * trade.price;

        let fee_rate = 0.001; // 0.1% fee
        let fee_quote = quote_amount * fee_rate;

        // Taker execution
        match taker.side {
            OrderSide::Buy => {
                let base_key = (taker.user_id.clone(), base.to_string());
                let taker_base = self.balances.entry(base_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                taker_base.free += trade.quantity;

                let quote_key = (taker.user_id.clone(), quote.to_string());
                let taker_quote = self.balances.entry(quote_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                let to_deduct = quote_amount + fee_quote;
                if taker_quote.locked >= quote_amount {
                    taker_quote.locked -= quote_amount;
                    taker_quote.free = (taker_quote.free - fee_quote).max(0.0);
                } else {
                    taker_quote.free = (taker_quote.free - to_deduct).max(0.0);
                }
            }
            OrderSide::Sell => {
                let quote_key = (taker.user_id.clone(), quote.to_string());
                let taker_quote = self.balances.entry(quote_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                taker_quote.free += (quote_amount - fee_quote).max(0.0);

                let base_key = (taker.user_id.clone(), base.to_string());
                let taker_base = self.balances.entry(base_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                if taker_base.locked >= trade.quantity {
                    taker_base.locked -= trade.quantity;
                } else {
                    taker_base.free = (taker_base.free - trade.quantity).max(0.0);
                }
            }
        }

        // Maker execution
        match maker.side {
            OrderSide::Buy => {
                let base_key = (maker.user_id.clone(), base.to_string());
                let maker_base = self.balances.entry(base_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                maker_base.free += trade.quantity;

                let quote_key = (maker.user_id.clone(), quote.to_string());
                let maker_quote = self.balances.entry(quote_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                let maker_locked_used = trade.quantity * maker.price;
                maker_quote.locked = (maker_quote.locked - maker_locked_used).max(0.0);
                let refund = maker_locked_used - quote_amount;
                if refund > 0.0 {
                    maker_quote.free += refund;
                }
            }
            OrderSide::Sell => {
                let quote_key = (maker.user_id.clone(), quote.to_string());
                let maker_quote = self.balances.entry(quote_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                maker_quote.free += quote_amount;

                let base_key = (maker.user_id.clone(), base.to_string());
                let maker_base = self.balances.entry(base_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
                maker_base.locked = (maker_base.locked - trade.quantity).max(0.0);
            }
        }
    }

    pub fn deposit(
        &mut self,
        user_id: &str,
        asset: &str,
        amount: f64,
        chain: Option<String>,
        to_wallet: Option<String>,
        asset_price: f64,
    ) {
        let key = (user_id.to_string(), asset.to_string());
        let bal = self.balances.entry(key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
        bal.free += amount;

        let target_account = to_wallet.unwrap_or_else(|| "Spot Trading Account".to_string());
        let sub_key = (user_id.to_string(), target_account.clone(), asset.to_string());
        let sub_bal = self.sub_account_balances.entry(sub_key).or_insert(0.0);
        *sub_bal += amount;

        let network_name = chain.unwrap_or_else(|| "BNB Smart Chain (BEP20)".to_string());
        self.selected_chain = network_name.clone();

        self.activities.insert(0, TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Deposit".to_string(),
            asset: format!("{} ({} · {})", asset, target_account, network_name),
            amount,
            usd_value: amount * asset_price,
            status: "Completed".to_string(),
            timestamp: Utc::now(),
            tx_hash: Some(format!("0x{:016x}{:016x}", rand::random::<u64>(), rand::random::<u64>())),
        });
    }

    pub fn web3_deposit(
        &mut self,
        user_id: &str,
        asset: &str,
        amount: f64,
        chain: Option<String>,
        to_wallet: Option<String>,
        tx_hash: Option<String>,
        asset_price: f64,
    ) {
        let key = (user_id.to_string(), asset.to_string());
        let bal = self.balances.entry(key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
        bal.free += amount;

        let target_account = to_wallet.unwrap_or_else(|| "Spot Trading Account".to_string());
        let sub_key = (user_id.to_string(), target_account.clone(), asset.to_string());
        let sub_bal = self.sub_account_balances.entry(sub_key).or_insert(0.0);
        *sub_bal += amount;

        let network_name = chain.unwrap_or_else(|| "BNB Smart Chain (BEP20)".to_string());
        self.selected_chain = network_name.clone();

        let hash = tx_hash.unwrap_or_else(|| format!("0x{:016x}{:016x}", rand::random::<u64>(), rand::random::<u64>()));

        self.activities.insert(0, TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Web3 On-Chain Deposit".to_string(),
            asset: format!("{} ({} · {})", asset, target_account, network_name),
            amount,
            usd_value: amount * asset_price,
            status: "Confirmed (On-Chain)".to_string(),
            timestamp: Utc::now(),
            tx_hash: Some(hash),
        });
    }

    pub fn fiat_deposit(
        &mut self,
        user_id: &str,
        fiat_currency: &str,
        fiat_amount: f64,
        crypto_asset: &str,
        crypto_amount: f64,
        payment_method: &str,
        to_wallet: Option<String>,
        payment_ref: Option<String>,
        asset_price: f64,
    ) -> Result<(), String> {
        if fiat_amount <= 0.0 || crypto_amount <= 0.0 {
            return Err("Deposit amount must be greater than zero".to_string());
        }

        // Credit global balance
        let key = (user_id.to_string(), crypto_asset.to_string());
        let bal = self.balances.entry(key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
        bal.free += crypto_amount;

        // Credit target sub-account
        let target_account = to_wallet.unwrap_or_else(|| "Spot Trading Account".to_string());
        let sub_key = (user_id.to_string(), target_account.clone(), crypto_asset.to_string());
        let sub_bal = self.sub_account_balances.entry(sub_key).or_insert(0.0);
        *sub_bal += crypto_amount;

        let sym = match fiat_currency {
            "EUR" => "€",
            "CNY" => "¥",
            _ => "$",
        };

        let hash = payment_ref.unwrap_or_else(|| format!("PAY-{:08x}", rand::random::<u32>()));

        // Record activity
        self.activities.insert(0, TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: format!("{} Deposit", payment_method),
            asset: format!("{}{:.0} ➔ {:.2} {} ({})", sym, fiat_amount, crypto_amount, crypto_asset, target_account),
            amount: crypto_amount,
            usd_value: crypto_amount * asset_price,
            status: "Completed".to_string(),
            timestamp: Utc::now(),
            tx_hash: Some(hash),
        });

        Ok(())
    }

    pub fn withdraw(&mut self, user_id: &str, asset: &str, amount: f64, _address: &str) -> Result<(), String> {
        let key = (user_id.to_string(), asset.to_string());
        let bal = self.balances.entry(key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
        if bal.free < amount {
            return Err(format!("Insufficient available {} for withdrawal", asset));
        }
        bal.free -= amount;

        self.activities.insert(0, TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Withdraw".to_string(),
            asset: asset.to_string(),
            amount,
            usd_value: amount,
            status: "Processing".to_string(),
            timestamp: Utc::now(),
            tx_hash: Some(format!("0x{:x}", rand::random::<u64>())),
        });

        Ok(())
    }

    pub fn swap(&mut self, user_id: &str, from_asset: &str, to_asset: &str, from_amount: f64, to_amount: f64) -> Result<(), String> {
        let from_key = (user_id.to_string(), from_asset.to_string());
        let from_bal = self.balances.entry(from_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
        if from_bal.free < from_amount {
            return Err(format!("Insufficient {} for swap", from_asset));
        }
        from_bal.free -= from_amount;

        let to_key = (user_id.to_string(), to_asset.to_string());
        let to_bal = self.balances.entry(to_key).or_insert(AccountBalance { free: 0.0, locked: 0.0 });
        to_bal.free += to_amount;

        self.activities.insert(0, TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Swap".to_string(),
            asset: format!("{}>{}", from_asset, to_asset),
            amount: to_amount,
            usd_value: from_amount,
            status: "Completed".to_string(),
            timestamp: Utc::now(),
            tx_hash: None,
        });

        Ok(())
    }

    pub fn transfer(
        &mut self,
        user_id: &str,
        from_wallet: &str,
        to_wallet: &str,
        asset: &str,
        amount: f64,
        asset_price: f64,
    ) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("Transfer amount must be greater than zero".to_string());
        }

        let from_key = (user_id.to_string(), from_wallet.to_string(), asset.to_string());
        let current_from_bal = *self.sub_account_balances.get(&from_key).unwrap_or(&0.0);
        
        // Also check global free balance fallback if sub-account balance is 0 but global exists
        let global_free = self.get_available_balance(user_id, asset);
        let effective_from_bal = if current_from_bal > 0.0 { current_from_bal } else { global_free };

        if effective_from_bal < amount {
            return Err(format!(
                "Insufficient available {} in {} (available: {:.4})",
                asset, from_wallet, effective_from_bal
            ));
        }

        // Deduct from origin sub-account
        self.sub_account_balances.insert(from_key, (effective_from_bal - amount).max(0.0));

        // Credit target sub-account
        let to_key = (user_id.to_string(), to_wallet.to_string(), asset.to_string());
        let current_to_bal = *self.sub_account_balances.get(&to_key).unwrap_or(&0.0);
        self.sub_account_balances.insert(to_key, current_to_bal + amount);

        // Record the internal transfer activity
        self.activities.insert(0, TransactionActivity {
            id: Uuid::new_v4(),
            tx_type: "Transfer".to_string(),
            asset: format!("{} ({} ➔ {})", asset, from_wallet, to_wallet),
            amount,
            usd_value: amount * asset_price,
            status: "Completed".to_string(),
            timestamp: Utc::now(),
            tx_hash: None,
        });

        Ok(())
    }

    pub fn get_portfolio_summary(&self, user_id: &str, asset_prices: &HashMap<String, f64>) -> PortfolioSummary {
        let mut asset_balances = Vec::new();
        let mut total_equity = 0.0;
        let mut available_balance = 0.0;
        let mut margin_used = 0.0;

        for ((uid, asset), bal) in &self.balances {
            if uid == user_id {
                let price = asset_prices.get(asset).copied().unwrap_or(1.0);
                let total_qty = bal.free + bal.locked;
                let usd_val = total_qty * price;
                let free_usd = bal.free * price;
                let locked_usd = bal.locked * price;

                total_equity += usd_val;
                available_balance += free_usd;
                margin_used += locked_usd;

                asset_balances.push(AssetBalance {
                    asset: asset.clone(),
                    free: bal.free,
                    locked: bal.locked,
                    total: total_qty,
                    usd_value: usd_val,
                });
            }
        }

        asset_balances.sort_by(|a, b| b.usd_value.partial_cmp(&a.usd_value).unwrap_or(std::cmp::Ordering::Equal));

        // Compute valuation per sub-account
        let account_defs = [
            ("spot", "Spot Trading Account", "#10B981"),
            ("margin", "Margin Trading (Cross Margin)", "#F59E0B"),
            ("futures", "Leverage Trading (Perpetual Future Trading)", "#8B5CF6"),
            ("funding", "Funding / P2P Wallet", "#0EA5E9"),
        ];

        let mut sub_accounts = Vec::new();
        for (acc_id, acc_name, acc_color) in account_defs {
            let mut acc_usd = 0.0;
            for ((uid, w_name, asset), amount) in &self.sub_account_balances {
                if uid == user_id && w_name == acc_name {
                    let price = asset_prices.get(asset).copied().unwrap_or(1.0);
                    acc_usd += *amount * price;
                }
            }
            let pct = if total_equity > 0.0 { (acc_usd / total_equity) * 100.0 } else { 0.0 };
            sub_accounts.push(SubAccountBalance {
                account_id: acc_id.to_string(),
                name: acc_name.to_string(),
                usd_value: acc_usd,
                percentage: pct,
                color: acc_color.to_string(),
            });
        }

        PortfolioSummary {
            total_equity_usd: total_equity,
            available_balance_usd: available_balance,
            margin_used_usd: margin_used,
            unrealized_pnl_usd: total_equity * 0.031,
            pnl_24h_pct: 3.1,
            balances: asset_balances,
            sub_accounts,
            recent_activities: self.activities.iter().take(10).cloned().collect(),
            chain: self.selected_chain.clone(),
            updated_at: Utc::now(),
        }
    }
}
