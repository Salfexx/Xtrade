use std::collections::{BTreeMap, HashMap};
use chrono::Utc;
use uuid::Uuid;
use crate::models::{Order, OrderBookDepth, OrderBookLevel, OrderSide, OrderStatus, OrderType, Trade};

#[derive(Debug, Clone)]
pub struct MatchResult {
    pub order: Order,
    pub trades: Vec<Trade>,
    pub updated_resting_orders: Vec<Order>,
}

#[derive(Debug)]
pub struct OrderBook {
    pub symbol: String,
    pub bids: BTreeMap<ordered_float::NotNan<f64>, Vec<Order>>, // Key is price. Sorted ascending; we reverse for bids
    pub asks: BTreeMap<ordered_float::NotNan<f64>, Vec<Order>>, // Key is price. Sorted ascending for asks
    pub order_index: HashMap<Uuid, (OrderSide, f64)>,
    pub last_price: f64,
}

impl OrderBook {
    pub fn new(symbol: String, initial_price: f64) -> Self {
        Self {
            symbol,
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
            order_index: HashMap::new(),
            last_price: initial_price,
        }
    }

    fn to_key(price: f64) -> ordered_float::NotNan<f64> {
        ordered_float::NotNan::new(price).unwrap_or_else(|_| ordered_float::NotNan::new(0.0).unwrap())
    }

    pub fn place_order(&mut self, mut order: Order) -> MatchResult {
        let mut trades = Vec::new();
        let mut updated_resting = Vec::new();

        match order.order_type {
            OrderType::Market => {
                self.match_market_order(&mut order, &mut trades, &mut updated_resting);
            }
            OrderType::Limit | OrderType::PostOnly | OrderType::StopLimit => {
                self.match_limit_order(&mut order, &mut trades, &mut updated_resting);
            }
        }

        MatchResult {
            order,
            trades,
            updated_resting_orders: updated_resting,
        }
    }

    fn match_market_order(&mut self, order: &mut Order, trades: &mut Vec<Trade>, updated_resting: &mut Vec<Order>) {
        let remaining = order.quantity - order.filled_quantity;
        if remaining <= 0.0 {
            order.status = OrderStatus::Filled;
            return;
        }

        match order.side {
            OrderSide::Buy => {
                while order.filled_quantity < order.quantity && !self.asks.is_empty() {
                    let best_ask_key = *self.asks.keys().next().unwrap();
                    let best_price = best_ask_key.into_inner();
                    
                    let orders_at_level = self.asks.get_mut(&best_ask_key).unwrap();
                    while !orders_at_level.is_empty() && order.filled_quantity < order.quantity {
                        let maker = &mut orders_at_level[0];
                        let needed = order.quantity - order.filled_quantity;
                        let maker_remaining = maker.quantity - maker.filled_quantity;
                        let fill_qty = needed.min(maker_remaining);

                        order.filled_quantity += fill_qty;
                        maker.filled_quantity += fill_qty;
                        self.last_price = best_price;

                        trades.push(Trade {
                            id: Uuid::new_v4(),
                            symbol: self.symbol.clone(),
                            price: best_price,
                            quantity: fill_qty,
                            maker_order_id: maker.id,
                            taker_order_id: order.id,
                            taker_side: OrderSide::Buy,
                            executed_at: Utc::now(),
                            quote_volume: fill_qty * best_price,
                        });

                        if maker.filled_quantity >= maker.quantity {
                            maker.status = OrderStatus::Filled;
                            let finished_maker = orders_at_level.remove(0);
                            self.order_index.remove(&finished_maker.id);
                            updated_resting.push(finished_maker);
                        } else {
                            maker.status = OrderStatus::PartiallyFilled;
                            updated_resting.push(maker.clone());
                            break;
                        }
                    }

                    if orders_at_level.is_empty() {
                        self.asks.remove(&best_ask_key);
                    }
                }
            }
            OrderSide::Sell => {
                while order.filled_quantity < order.quantity && !self.bids.is_empty() {
                    let best_bid_key = *self.bids.keys().next_back().unwrap();
                    let best_price = best_bid_key.into_inner();

                    let orders_at_level = self.bids.get_mut(&best_bid_key).unwrap();
                    while !orders_at_level.is_empty() && order.filled_quantity < order.quantity {
                        let maker = &mut orders_at_level[0];
                        let needed = order.quantity - order.filled_quantity;
                        let maker_remaining = maker.quantity - maker.filled_quantity;
                        let fill_qty = needed.min(maker_remaining);

                        order.filled_quantity += fill_qty;
                        maker.filled_quantity += fill_qty;
                        self.last_price = best_price;

                        trades.push(Trade {
                            id: Uuid::new_v4(),
                            symbol: self.symbol.clone(),
                            price: best_price,
                            quantity: fill_qty,
                            maker_order_id: maker.id,
                            taker_order_id: order.id,
                            taker_side: OrderSide::Sell,
                            executed_at: Utc::now(),
                            quote_volume: fill_qty * best_price,
                        });

                        if maker.filled_quantity >= maker.quantity {
                            maker.status = OrderStatus::Filled;
                            let finished_maker = orders_at_level.remove(0);
                            self.order_index.remove(&finished_maker.id);
                            updated_resting.push(finished_maker);
                        } else {
                            maker.status = OrderStatus::PartiallyFilled;
                            updated_resting.push(maker.clone());
                            break;
                        }
                    }

                    if orders_at_level.is_empty() {
                        self.bids.remove(&best_bid_key);
                    }
                }
            }
        }

        if order.filled_quantity >= order.quantity {
            order.status = OrderStatus::Filled;
        } else if order.filled_quantity > 0.0 {
            order.status = OrderStatus::PartiallyFilled;
        } else {
            order.status = OrderStatus::Canceled; // Unfilled market order
        }
    }

    fn match_limit_order(&mut self, order: &mut Order, trades: &mut Vec<Trade>, updated_resting: &mut Vec<Order>) {
        let order_price = order.price;

        match order.side {
            OrderSide::Buy => {
                while order.filled_quantity < order.quantity && !self.asks.is_empty() {
                    let best_ask_key = *self.asks.keys().next().unwrap();
                    let best_price = best_ask_key.into_inner();

                    if best_price > order_price {
                        break; // Best ask is higher than our buy limit
                    }

                    let orders_at_level = self.asks.get_mut(&best_ask_key).unwrap();
                    while !orders_at_level.is_empty() && order.filled_quantity < order.quantity {
                        let maker = &mut orders_at_level[0];
                        let needed = order.quantity - order.filled_quantity;
                        let maker_remaining = maker.quantity - maker.filled_quantity;
                        let fill_qty = needed.min(maker_remaining);

                        order.filled_quantity += fill_qty;
                        maker.filled_quantity += fill_qty;
                        self.last_price = best_price;

                        trades.push(Trade {
                            id: Uuid::new_v4(),
                            symbol: self.symbol.clone(),
                            price: best_price,
                            quantity: fill_qty,
                            maker_order_id: maker.id,
                            taker_order_id: order.id,
                            taker_side: OrderSide::Buy,
                            executed_at: Utc::now(),
                            quote_volume: fill_qty * best_price,
                        });

                        if maker.filled_quantity >= maker.quantity {
                            maker.status = OrderStatus::Filled;
                            let finished_maker = orders_at_level.remove(0);
                            self.order_index.remove(&finished_maker.id);
                            updated_resting.push(finished_maker);
                        } else {
                            maker.status = OrderStatus::PartiallyFilled;
                            updated_resting.push(maker.clone());
                            break;
                        }
                    }

                    if orders_at_level.is_empty() {
                        self.asks.remove(&best_ask_key);
                    }
                }

                // If not fully filled, rest on the order book
                if order.filled_quantity < order.quantity {
                    if order.order_type == OrderType::PostOnly && !trades.is_empty() {
                        // PostOnly crossed, reject remainder
                        order.status = OrderStatus::Canceled;
                    } else {
                        order.status = if order.filled_quantity > 0.0 {
                            OrderStatus::PartiallyFilled
                        } else {
                            OrderStatus::New
                        };
                        let key = Self::to_key(order_price);
                        self.bids.entry(key).or_default().push(order.clone());
                        self.order_index.insert(order.id, (OrderSide::Buy, order_price));
                    }
                } else {
                    order.status = OrderStatus::Filled;
                }
            }
            OrderSide::Sell => {
                while order.filled_quantity < order.quantity && !self.bids.is_empty() {
                    let best_bid_key = *self.bids.keys().next_back().unwrap();
                    let best_price = best_bid_key.into_inner();

                    if best_price < order_price {
                        break; // Best bid is lower than our sell limit
                    }

                    let orders_at_level = self.bids.get_mut(&best_bid_key).unwrap();
                    while !orders_at_level.is_empty() && order.filled_quantity < order.quantity {
                        let maker = &mut orders_at_level[0];
                        let needed = order.quantity - order.filled_quantity;
                        let maker_remaining = maker.quantity - maker.filled_quantity;
                        let fill_qty = needed.min(maker_remaining);

                        order.filled_quantity += fill_qty;
                        maker.filled_quantity += fill_qty;
                        self.last_price = best_price;

                        trades.push(Trade {
                            id: Uuid::new_v4(),
                            symbol: self.symbol.clone(),
                            price: best_price,
                            quantity: fill_qty,
                            maker_order_id: maker.id,
                            taker_order_id: order.id,
                            taker_side: OrderSide::Sell,
                            executed_at: Utc::now(),
                            quote_volume: fill_qty * best_price,
                        });

                        if maker.filled_quantity >= maker.quantity {
                            maker.status = OrderStatus::Filled;
                            let finished_maker = orders_at_level.remove(0);
                            self.order_index.remove(&finished_maker.id);
                            updated_resting.push(finished_maker);
                        } else {
                            maker.status = OrderStatus::PartiallyFilled;
                            updated_resting.push(maker.clone());
                            break;
                        }
                    }

                    if orders_at_level.is_empty() {
                        self.bids.remove(&best_bid_key);
                    }
                }

                // If not fully filled, rest on the order book
                if order.filled_quantity < order.quantity {
                    if order.order_type == OrderType::PostOnly && !trades.is_empty() {
                        order.status = OrderStatus::Canceled;
                    } else {
                        order.status = if order.filled_quantity > 0.0 {
                            OrderStatus::PartiallyFilled
                        } else {
                            OrderStatus::New
                        };
                        let key = Self::to_key(order_price);
                        self.asks.entry(key).or_default().push(order.clone());
                        self.order_index.insert(order.id, (OrderSide::Sell, order_price));
                    }
                } else {
                    order.status = OrderStatus::Filled;
                }
            }
        }
    }

    pub fn cancel_order(&mut self, order_id: Uuid) -> Option<Order> {
        if let Some((side, price)) = self.order_index.remove(&order_id) {
            let key = Self::to_key(price);
            let orders = match side {
                OrderSide::Buy => self.bids.get_mut(&key),
                OrderSide::Sell => self.asks.get_mut(&key),
            };

            if let Some(order_list) = orders {
                if let Some(pos) = order_list.iter().position(|o| o.id == order_id) {
                    let mut removed = order_list.remove(pos);
                    removed.status = OrderStatus::Canceled;
                    removed.updated_at = Utc::now();
                    if order_list.is_empty() {
                        match side {
                            OrderSide::Buy => self.bids.remove(&key),
                            OrderSide::Sell => self.asks.remove(&key),
                        };
                    }
                    return Some(removed);
                }
            }
        }
        None
    }

    pub fn get_depth(&self, limit: usize) -> OrderBookDepth {
        let mut bids = Vec::new();
        let mut running_bid_total = 0.0;
        for (key, orders) in self.bids.iter().rev().take(limit) {
            let price = key.into_inner();
            let qty: f64 = orders.iter().map(|o| o.quantity - o.filled_quantity).sum();
            running_bid_total += qty;
            bids.push(OrderBookLevel {
                price,
                quantity: qty,
                total: running_bid_total,
                count: orders.len() as u32,
            });
        }

        let mut asks = Vec::new();
        let mut running_ask_total = 0.0;
        for (key, orders) in self.asks.iter().take(limit) {
            let price = key.into_inner();
            let qty: f64 = orders.iter().map(|o| o.quantity - o.filled_quantity).sum();
            running_ask_total += qty;
            asks.push(OrderBookLevel {
                price,
                quantity: qty,
                total: running_ask_total,
                count: orders.len() as u32,
            });
        }

        OrderBookDepth {
            symbol: self.symbol.clone(),
            bids,
            asks,
            timestamp: Utc::now(),
            last_price: self.last_price,
        }
    }
}
