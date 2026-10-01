use std::time::{SystemTime, UNIX_EPOCH};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use crate::models::{OrderSide, OrderType};

type HmacSha256 = Hmac<Sha256>;

const DEFAULT_TESTNET_BASE_URL: &str = "https://testnet.binance.vision";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinanceTestnetConfig {
    pub api_key: String,
    pub secret_key: String,
    pub is_enabled: bool,
    pub base_url: String,
}

impl Default for BinanceTestnetConfig {
    fn default() -> Self {
        let api_key = std::env::var("BINANCE_TESTNET_API_KEY").unwrap_or_default();
        let secret_key = std::env::var("BINANCE_TESTNET_SECRET_KEY").unwrap_or_default();
        let is_enabled = !api_key.is_empty() && !secret_key.is_empty();
        Self {
            api_key,
            secret_key,
            is_enabled,
            base_url: std::env::var("BINANCE_BASE_URL").unwrap_or_else(|_| DEFAULT_TESTNET_BASE_URL.to_string()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinanceFill {
    pub price: String,
    pub qty: String,
    pub commission: String,
    #[serde(rename = "commissionAsset")]
    pub commission_asset: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinanceOrderResponse {
    pub symbol: String,
    #[serde(rename = "orderId")]
    pub order_id: i64,
    #[serde(rename = "clientOrderId", default)]
    pub client_order_id: Option<String>,
    pub status: String,
    pub side: String,
    #[serde(rename = "type")]
    pub order_type: String,
    #[serde(rename = "executedQty", default)]
    pub executed_qty: String,
    #[serde(rename = "cummulativeQuoteQty", default)]
    pub cummulative_quote_qty: String,
    #[serde(default)]
    pub price: String,
    #[serde(default)]
    pub fills: Option<Vec<BinanceFill>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinanceAccountBalance {
    pub asset: String,
    pub free: String,
    pub locked: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinanceAccountInfo {
    pub balances: Vec<BinanceAccountBalance>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinanceApiError {
    pub code: i64,
    pub msg: String,
}

pub struct BinanceRouter;

impl BinanceRouter {
    fn get_timestamp() -> u128 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_millis()
    }

    pub fn sign_query(query: &str, secret_key: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(secret_key.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(query.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    pub fn to_binance_symbol(symbol: &str) -> String {
        symbol.replace('/', "").to_uppercase()
    }

    pub async fn place_order(
        config: &BinanceTestnetConfig,
        symbol: &str,
        side: OrderSide,
        order_type: OrderType,
        quantity: f64,
        price: Option<f64>,
    ) -> Result<BinanceOrderResponse, String> {
        if config.api_key.is_empty() || config.secret_key.is_empty() {
            return Err("Binance Testnet API Key or Secret Key is not configured.".to_string());
        }

        let binance_symbol = Self::to_binance_symbol(symbol);
        let side_str = match side {
            OrderSide::Buy => "BUY",
            OrderSide::Sell => "SELL",
        };
        let type_str = match order_type {
            OrderType::Market => "MARKET",
            _ => "LIMIT",
        };

        let timestamp = Self::get_timestamp();
        
        let formatted_qty = format!("{:.6}", quantity);
        let mut query = format!(
            "symbol={}&side={}&type={}&quantity={}&timestamp={}&recvWindow=10000",
            binance_symbol, side_str, type_str, formatted_qty, timestamp
        );

        if type_str == "LIMIT" {
            let p = price.unwrap_or(0.0);
            if p <= 0.0 {
                return Err("Limit orders require a valid price greater than 0.".to_string());
            }
            let formatted_price = format!("{:.2}", p);
            query.push_str(&format!("&price={}&timeInForce=GTC", formatted_price));
        }

        let signature = Self::sign_query(&query, &config.secret_key);
        let full_url = format!("{}/api/v3/order?{}&signature={}", config.base_url, query, signature);

        let client = Client::new();
        let res = client
            .post(&full_url)
            .header("X-MBX-APIKEY", &config.api_key)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Binance Testnet: {}", e))?;

        let status = res.status();
        let body_text = res
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        if !status.is_success() {
            if let Ok(api_err) = serde_json::from_str::<BinanceApiError>(&body_text) {
                return Err(format!("Binance Error ({}): {}", api_err.code, api_err.msg));
            }
            return Err(format!("Binance API returned error HTTP {}: {}", status, body_text));
        }

        let order_res: BinanceOrderResponse = serde_json::from_str(&body_text)
            .map_err(|e| format!("Failed to parse Binance order response: {}. Body: {}", e, body_text))?;

        Ok(order_res)
    }

    pub async fn cancel_order(
        config: &BinanceTestnetConfig,
        symbol: &str,
        binance_order_id: i64,
    ) -> Result<BinanceOrderResponse, String> {
        if config.api_key.is_empty() || config.secret_key.is_empty() {
            return Err("Binance Testnet API Key or Secret Key is not configured.".to_string());
        }

        let binance_symbol = Self::to_binance_symbol(symbol);
        let timestamp = Self::get_timestamp();
        let query = format!(
            "symbol={}&orderId={}&timestamp={}&recvWindow=10000",
            binance_symbol, binance_order_id, timestamp
        );
        let signature = Self::sign_query(&query, &config.secret_key);
        let full_url = format!("{}/api/v3/order?{}&signature={}", config.base_url, query, signature);

        let client = Client::new();
        let res = client
            .delete(&full_url)
            .header("X-MBX-APIKEY", &config.api_key)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Binance Testnet: {}", e))?;

        let status = res.status();
        let body_text = res
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        if !status.is_success() {
            if let Ok(api_err) = serde_json::from_str::<BinanceApiError>(&body_text) {
                return Err(format!("Binance Error ({}): {}", api_err.code, api_err.msg));
            }
            return Err(format!("Binance API returned error HTTP {}: {}", status, body_text));
        }

        let cancel_res: BinanceOrderResponse = serde_json::from_str(&body_text)
            .map_err(|e| format!("Failed to parse Binance cancel response: {}. Body: {}", e, body_text))?;

        Ok(cancel_res)
    }

    pub async fn get_account(config: &BinanceTestnetConfig) -> Result<BinanceAccountInfo, String> {
        if config.api_key.is_empty() || config.secret_key.is_empty() {
            return Err("Binance Testnet API Key or Secret Key is not configured.".to_string());
        }

        let timestamp = Self::get_timestamp();
        let query = format!("timestamp={}&recvWindow=10000", timestamp);
        let signature = Self::sign_query(&query, &config.secret_key);
        let full_url = format!("{}/api/v3/account?{}&signature={}", config.base_url, query, signature);

        let client = Client::new();
        let res = client
            .get(&full_url)
            .header("X-MBX-APIKEY", &config.api_key)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Binance Testnet: {}", e))?;

        let status = res.status();
        let body_text = res
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        if !status.is_success() {
            if let Ok(api_err) = serde_json::from_str::<BinanceApiError>(&body_text) {
                return Err(format!("Binance Error ({}): {}", api_err.code, api_err.msg));
            }
            return Err(format!("Binance API returned error HTTP {}: {}", status, body_text));
        }

        let acc_info: BinanceAccountInfo = serde_json::from_str(&body_text)
            .map_err(|e| format!("Failed to parse Binance account info: {}. Body: {}", e, body_text))?;

        Ok(acc_info)
    }
}
