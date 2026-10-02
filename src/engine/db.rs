use crate::models::{BinaryContract, BinaryDirection, BinaryStatus, TransactionActivity};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tracing::{error, info};
use uuid::Uuid;

pub enum DbEvent {
    SaveContract(BinaryContract),
    UpdateContract(BinaryContract),
    SaveTick {
        symbol: String,
        price: f64,
        timestamp_ms: i64,
    },
    SaveTransaction(TransactionActivity),
}

pub struct DbManager {
    sender: UnboundedSender<DbEvent>,
}

impl DbManager {
    /// Initialize SQLite with WAL mode for ultra-low latency write-behind persistence
    pub fn init<P: AsRef<Path>>(db_path: P) -> (Arc<Self>, Vec<BinaryContract>) {
        // Ensure parent directory exists
        if let Some(parent) = db_path.as_ref().parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(&db_path).expect("Failed to open SQLite database");

        // High-Performance PRAGMAs for sub-millisecond concurrent operations
        conn.execute_batch(
            r#"
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA busy_timeout = 5000;
            PRAGMA cache_size = -64000;
            PRAGMA temp_store = MEMORY;

            CREATE TABLE IF NOT EXISTS binary_contracts (
                id TEXT PRIMARY KEY,
                symbol TEXT NOT NULL,
                direction TEXT NOT NULL,
                stake_usd REAL NOT NULL,
                strike_price REAL NOT NULL,
                duration_seconds INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                settled_at TEXT,
                settlement_price REAL,
                payout_pct REAL NOT NULL,
                payout_usd REAL NOT NULL,
                status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS price_ticks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                price REAL NOT NULL,
                timestamp_ms INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_ticks_sym_time ON price_ticks (symbol, timestamp_ms DESC);

            CREATE TABLE IF NOT EXISTS ledger_transactions (
                id TEXT PRIMARY KEY,
                tx_type TEXT NOT NULL,
                asset TEXT NOT NULL,
                amount REAL NOT NULL,
                usd_value REAL NOT NULL,
                status TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                tx_hash TEXT
            );
            "#,
        )
        .expect("Failed to initialize database schema");

        // Load existing contracts for instant startup hydration
        let mut initial_contracts = Vec::new();
        if let Ok(mut stmt) = conn.prepare(
            "SELECT id, symbol, direction, stake_usd, strike_price, duration_seconds, \
             created_at, expires_at, settled_at, settlement_price, payout_pct, payout_usd, status \
             FROM binary_contracts ORDER BY created_at ASC",
        ) {
            let contract_iter = stmt.query_map([], |row| {
                let id_str: String = row.get(0)?;
                let symbol: String = row.get(1)?;
                let dir_str: String = row.get(2)?;
                let stake_usd: f64 = row.get(3)?;
                let strike_price: f64 = row.get(4)?;
                let duration_seconds: u64 = row.get(5)?;
                let created_str: String = row.get(6)?;
                let expires_str: String = row.get(7)?;
                let settled_str: Option<String> = row.get(8)?;
                let settlement_price: Option<f64> = row.get(9)?;
                let payout_pct: f64 = row.get(10)?;
                let payout_usd: f64 = row.get(11)?;
                let status_str: String = row.get(12)?;

                let direction = match dir_str.as_str() {
                    "Call" | "High" => BinaryDirection::Call,
                    _ => BinaryDirection::Put,
                };

                let status = match status_str.as_str() {
                    "Profit" => BinaryStatus::Profit,
                    "Lost" => BinaryStatus::Lost,
                    "Tied" => BinaryStatus::Tied,
                    _ => BinaryStatus::Active,
                };

                let created_at = DateTime::parse_from_rfc3339(&created_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());
                let expires_at = DateTime::parse_from_rfc3339(&expires_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());
                let settled_at = settled_str.and_then(|s| {
                    DateTime::parse_from_rfc3339(&s)
                        .map(|dt| dt.with_timezone(&Utc))
                        .ok()
                });

                Ok(BinaryContract {
                    id: Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::new_v4()),
                    symbol,
                    direction,
                    stake_usd,
                    strike_price,
                    duration_seconds,
                    created_at,
                    expires_at,
                    settled_at,
                    settlement_price,
                    payout_pct,
                    payout_usd,
                    status,
                })
            });

            if let Ok(iter) = contract_iter {
                for c in iter.flatten() {
                    initial_contracts.push(c);
                }
            }
        }

        info!(
            "📦 SQLite WAL Database initialized. Hydrated {} historical binary contracts into RAM.",
            initial_contracts.len()
        );

        let (tx, rx) = unbounded_channel::<DbEvent>();

        // Spawn detached async worker thread for write-behind batch logging
        let path_buf = db_path.as_ref().to_path_buf();
        std::thread::Builder::new()
            .name("xtrade-db-worker".into())
            .spawn(move || {
                Self::run_worker(path_buf, rx);
            })
            .expect("Failed to spawn db worker thread");

        (Arc::new(Self { sender: tx }), initial_contracts)
    }

    /// Non-blocking $< 0.001ms event dispatch to background persistence thread
    pub fn send(&self, event: DbEvent) {
        let _ = self.sender.send(event);
    }

    /// Background writer worker that commits events in batches
    fn run_worker(db_path: std::path::PathBuf, mut rx: UnboundedReceiver<DbEvent>) {
        let mut conn = match Connection::open(&db_path) {
            Ok(c) => c,
            Err(e) => {
                error!("Failed to open worker connection to db: {}", e);
                return;
            }
        };

        while let Some(event) = rx.blocking_recv() {
            let mut batch = vec![event];
            // Drain up to 256 pending events for atomic batch write
            while let Ok(next) = rx.try_recv() {
                batch.push(next);
                if batch.len() >= 256 {
                    break;
                }
            }

            if let Ok(tx) = conn.transaction() {
                for item in batch {
                    match item {
                        DbEvent::SaveContract(c) => {
                            let dir_str = match c.direction {
                                BinaryDirection::Call => "Call",
                                BinaryDirection::Put => "Put",
                            };
                            let status_str = match c.status {
                                BinaryStatus::Active => "Active",
                                BinaryStatus::Profit => "Profit",
                                BinaryStatus::Lost => "Lost",
                                BinaryStatus::Tied => "Tied",
                            };
                            let settled_str = c.settled_at.map(|dt| dt.to_rfc3339());

                            let _ = tx.execute(
                                "INSERT OR REPLACE INTO binary_contracts (
                                    id, symbol, direction, stake_usd, strike_price, duration_seconds,
                                    created_at, expires_at, settled_at, settlement_price, payout_pct, payout_usd, status
                                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                                params![
                                    c.id.to_string(),
                                    c.symbol,
                                    dir_str,
                                    c.stake_usd,
                                    c.strike_price,
                                    c.duration_seconds,
                                    c.created_at.to_rfc3339(),
                                    c.expires_at.to_rfc3339(),
                                    settled_str,
                                    c.settlement_price,
                                    c.payout_pct,
                                    c.payout_usd,
                                    status_str
                                ],
                            );
                        }
                        DbEvent::UpdateContract(c) => {
                            let status_str = match c.status {
                                BinaryStatus::Active => "Active",
                                BinaryStatus::Profit => "Profit",
                                BinaryStatus::Lost => "Lost",
                                BinaryStatus::Tied => "Tied",
                            };
                            let settled_str = c.settled_at.map(|dt| dt.to_rfc3339());

                            let _ = tx.execute(
                                "UPDATE binary_contracts SET 
                                    settled_at = ?1, settlement_price = ?2, payout_usd = ?3, status = ?4 
                                 WHERE id = ?5",
                                params![
                                    settled_str,
                                    c.settlement_price,
                                    c.payout_usd,
                                    status_str,
                                    c.id.to_string()
                                ],
                            );
                        }
                        DbEvent::SaveTick {
                            symbol,
                            price,
                            timestamp_ms,
                        } => {
                            let _ = tx.execute(
                                "INSERT INTO price_ticks (symbol, price, timestamp_ms) VALUES (?1, ?2, ?3)",
                                params![symbol, price, timestamp_ms],
                            );
                        }
                        DbEvent::SaveTransaction(t) => {
                            let _ = tx.execute(
                                "INSERT OR REPLACE INTO ledger_transactions (
                                    id, tx_type, asset, amount, usd_value, status, timestamp, tx_hash
                                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                                params![
                                    t.id.to_string(),
                                    t.tx_type,
                                    t.asset,
                                    t.amount,
                                    t.usd_value,
                                    t.status,
                                    t.timestamp.to_rfc3339(),
                                    t.tx_hash
                                ],
                            );
                        }
                    }
                }
                let _ = tx.commit();
            }
        }
    }
}
