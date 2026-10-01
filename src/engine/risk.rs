use crate::models::{CreateOrderRequest, OrderSide, OrderType};
use crate::engine::ledger::Ledger;

#[derive(Debug, Clone)]
pub struct RiskConfig {
    pub max_notional_value: f64,
    pub max_price_deviation_pct: f64,
    pub max_leverage: u32,
}

impl Default for RiskConfig {
    fn default() -> Self {
        Self {
            max_notional_value: 1_000_000.0,
            max_price_deviation_pct: 0.25, // 25% max deviation
            max_leverage: 100,
        }
    }
}

pub struct RiskEngine {
    pub config: RiskConfig,
}

impl RiskEngine {
    pub fn new(config: RiskConfig) -> Self {
        Self { config }
    }

    pub fn validate_order(
        &self,
        req: &CreateOrderRequest,
        current_market_price: f64,
        ledger: &Ledger,
        user_id: &str,
    ) -> Result<(), String> {
        if req.quantity <= 0.0 {
            return Err("Quantity must be strictly positive".to_string());
        }

        let effective_price = match req.order_type {
            OrderType::Market => current_market_price,
            OrderType::Limit | OrderType::PostOnly | OrderType::StopLimit => {
                let p = req.price.ok_or_else(|| "Limit price is required".to_string())?;
                if p <= 0.0 {
                    return Err("Price must be strictly positive".to_string());
                }
                // Check price deviation (fat-finger protection)
                if current_market_price > 0.0 {
                    let deviation = ((p - current_market_price) / current_market_price).abs();
                    if deviation > self.config.max_price_deviation_pct {
                        return Err(format!(
                            "Price deviates {:.1}% from market price ({:.2}), exceeding max allowed {:.1}%",
                            deviation * 100.0,
                            current_market_price,
                            self.config.max_price_deviation_pct * 100.0
                        ));
                    }
                }
                p
            }
        };

        let notional = effective_price * req.quantity;
        if notional > self.config.max_notional_value {
            return Err(format!(
                "Order notional value (${:.2}) exceeds maximum allowed (${:.2})",
                notional, self.config.max_notional_value
            ));
        }

        if let Some(lev) = req.leverage {
            if lev > self.config.max_leverage || lev == 0 {
                return Err(format!("Leverage must be between 1x and {}x", self.config.max_leverage));
            }
        }

        // Split symbol e.g. "BTC/USDT" into base "BTC" and quote "USDT"
        let parts: Vec<&str> = req.symbol.split('/').collect();
        if parts.len() != 2 {
            return Err("Invalid symbol format, expected BASE/QUOTE (e.g. BTC/USDT)".to_string());
        }
        let base = parts[0];
        let quote = parts[1];

        // Check user balance
        match req.side {
            OrderSide::Buy => {
                let required_quote = notional;
                let available_quote = ledger.get_available_balance(user_id, quote);
                if available_quote < required_quote {
                    return Err(format!(
                        "Insufficient {} balance. Required: {:.2}, Available: {:.2}",
                        quote, required_quote, available_quote
                    ));
                }
            }
            OrderSide::Sell => {
                let required_base = req.quantity;
                let available_base = ledger.get_available_balance(user_id, base);
                if available_base < required_base {
                    return Err(format!(
                        "Insufficient {} balance. Required: {:.6}, Available: {:.6}",
                        base, required_base, available_base
                    ));
                }
            }
        }

        Ok(())
    }
}
