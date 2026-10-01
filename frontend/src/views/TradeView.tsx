import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronDown, Trash2, Sliders, Zap, TrendingUp, TrendingDown, 
  ShieldCheck, CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownRight, Layers,
  Search, X, Flame, Star, Key, ExternalLink, Settings2, Sparkles, Coins, Radio
} from 'lucide-react';
import { Ticker, OrderBookDepth, Kline, Order, Trade, PortfolioSummary } from '../types';
import { api } from '../services/api';
import { binanceFeed, BinanceTradeData, BinanceTickerData } from '../services/binanceFeed';
import { TradingViewChart } from '../components/TradingViewChart';

interface TradeViewProps {
  currentSymbol: string;
  onSelectSymbol: (sym: string) => void;
  tickers: Ticker[];
  depth: OrderBookDepth | null;
  klines: Kline[];
  orders: Order[];
  trades: Trade[];
  portfolio: PortfolioSummary | null;
  onRefreshAll: () => void;
  isDark?: boolean;
  initialTradingMode?: 'SPOT' | 'MARGIN' | 'LEVERAGE';
}

export const TradeView: React.FC<TradeViewProps> = ({
  currentSymbol,
  onSelectSymbol,
  tickers,
  depth,
  klines,
  orders,
  trades,
  portfolio,
  onRefreshAll,
  isDark = false,
  initialTradingMode,
}) => {
  const [tradingMode, setTradingMode] = useState<'SPOT' | 'MARGIN' | 'LEVERAGE'>(initialTradingMode || 'SPOT');
  const [activeDeskTab, setActiveDeskTab] = useState<'POSITIONS' | 'OPEN_ORDERS' | 'HISTORY'>('POSITIONS');
  const [deskModeFilter, setDeskModeFilter] = useState<'ALL' | 'SPOT' | 'MARGIN' | 'LEVERAGE'>('ALL');
  const [bookTab, setBookTab] = useState<'ORDER_BOOK' | 'MARKET_TRADES'>('ORDER_BOOK');
  const [marketTrades, setMarketTrades] = useState<BinanceTradeData[]>([]);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LIMIT'>('LIMIT');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [amountUsdt, setAmountUsdt] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(10);
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Binance Testnet & Faucet States
  const [isBinanceModalOpen, setIsBinanceModalOpen] = useState(false);
  const [binanceConfig, setBinanceConfig] = useState<{
    is_enabled: boolean;
    api_key_masked: string;
    has_secret: boolean;
    base_url: string;
  } | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [isRoutingEnabled, setIsRoutingEnabled] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [orderSuccessToast, setOrderSuccessToast] = useState<{
    id: string;
    side: 'BUY' | 'SELL';
    symbol: string;
    qty: number;
    price: number;
    status: string;
    binanceId: string | null;
  } | null>(null);

  // Searchable Pair Selector Popover States
  const [isPairSearchOpen, setIsPairSearchOpen] = useState(false);
  const [pairSearchQuery, setPairSearchQuery] = useState('');
  const [pairCategoryFilter, setPairCategoryFilter] = useState<'ALL' | 'HOT' | 'GAINERS' | 'USDT'>('ALL');
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Direct 24h ticker subscription for instant real-time header bar rendering
  const [directTicker, setDirectTicker] = useState<BinanceTickerData | null>(() => binanceFeed.getLatestTicker(currentSymbol) || null);

  useEffect(() => {
    const initial = binanceFeed.getLatestTicker(currentSymbol);
    if (initial) {
      setDirectTicker(initial);
    }
    const unsubTicker = binanceFeed.onTicker((t) => {
      if (t.symbol === currentSymbol) {
        setDirectTicker(t);
      }
    });
    const unsubTrade = binanceFeed.onTrade((tr) => {
      if (tr.symbol === currentSymbol) {
        setDirectTicker((prev) => prev ? { ...prev, last_price: tr.price } : null);
      }
    });
    return () => {
      unsubTicker();
      unsubTrade();
    };
  }, [currentSymbol]);

  const currentTicker = useMemo<Ticker>(() => {
    const fromProps = tickers.find((t) => t.symbol === currentSymbol) || (tickers.length > 0 ? tickers[0] : null);
    const [base, quote] = currentSymbol.split('/');

    const lastPrice = directTicker?.last_price || fromProps?.last_price || 0;
    const chg24h = directTicker?.price_change_24h ?? fromProps?.price_change_24h ?? 0;
    const chgPct24h = directTicker?.price_change_pct_24h ?? fromProps?.price_change_pct_24h ?? 0;
    const high24h = directTicker?.high_24h || fromProps?.high_24h || 0;
    const low24h = directTicker?.low_24h || fromProps?.low_24h || 0;
    const vol24h = directTicker?.volume_24h || fromProps?.volume_24h || 0;
    const quoteVol24h = directTicker?.quote_volume_24h || fromProps?.quote_volume_24h || 0;

    return {
      symbol: currentSymbol,
      name: fromProps?.name || (base === 'BTC' ? 'Bitcoin' : base === 'ETH' ? 'Ethereum' : base === 'SOL' ? 'Solana' : base || 'Crypto'),
      base_asset: base || fromProps?.base_asset || 'BTC',
      quote_asset: quote || fromProps?.quote_asset || 'USDT',
      last_price: lastPrice,
      price_change_24h: chg24h,
      price_change_pct_24h: chgPct24h,
      price_change_pct_7d: fromProps?.price_change_pct_7d || 0,
      high_24h: high24h,
      low_24h: low24h,
      volume_24h: vol24h,
      quote_volume_24h: quoteVol24h,
      market_cap: fromProps?.market_cap || 0,
      sparkline_7d: fromProps?.sparkline_7d || [],
      icon_color: fromProps?.icon_color || (base === 'BTC' ? '#F3BA2F' : base === 'ETH' ? '#627EEA' : '#14B8A6'),
      is_gainer: chgPct24h >= 0,
      updated_at: new Date().toISOString(),
    };
  }, [tickers, currentSymbol, directTicker]);

  // Auto-focus search input when popover opens
  useEffect(() => {
    if (isPairSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setPairSearchQuery('');
    }
  }, [isPairSearchOpen]);

  // Handle click outside & Esc key to close search popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsPairSearchOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPairSearchOpen(false);
      }
    };
    if (isPairSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPairSearchOpen]);

  // Filtered available pairs for instant live search (Crypto Pairs Only)
  const filteredTickers = useMemo(() => {
    let list = tickers.filter((t) => !['GOLD/USD', 'EURO/USD', 'OIL/USD'].includes(t.symbol));
    if (pairCategoryFilter === 'HOT') {
      const hotSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT'];
      list = list.filter((t) => hotSymbols.includes(t.symbol));
    } else if (pairCategoryFilter === 'GAINERS') {
      list = list.filter((t) => t.price_change_pct_24h > 0).sort((a, b) => b.price_change_pct_24h - a.price_change_pct_24h);
    } else if (pairCategoryFilter === 'USDT') {
      list = list.filter((t) => t.quote_asset === 'USDT');
    }

    if (pairSearchQuery.trim()) {
      const q = pairSearchQuery.toLowerCase().trim();
      list = list.filter((t) => 
        t.symbol.toLowerCase().includes(q) || 
        t.name.toLowerCase().includes(q) || 
        t.base_asset.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickers, pairSearchQuery, pairCategoryFilter]);

  useEffect(() => {
    if (initialTradingMode) {
      setTradingMode(initialTradingMode);
      if (initialTradingMode === 'SPOT') {
        setLeverage(1);
      } else if (initialTradingMode === 'MARGIN') {
        setLeverage(3);
      } else if (leverage === 1) {
        setLeverage(10);
      }
    }
  }, [initialTradingMode]);

  // Synchronize desk mode filter when switching Spot / Margin / Leverage order forms
  useEffect(() => {
    if (tradingMode === 'SPOT') {
      setDeskModeFilter('SPOT');
    } else if (tradingMode === 'MARGIN') {
      setDeskModeFilter('MARGIN');
    } else {
      setDeskModeFilter('LEVERAGE');
    }
  }, [tradingMode]);

  // Load initial Market Trades and subscribe to real-time Binance execution stream
  useEffect(() => {
    let isMounted = true;
    binanceFeed.fetchRecentTrades(currentSymbol, 20).then((initialTrades) => {
      if (isMounted && initialTrades.length > 0) {
        setMarketTrades(initialTrades);
      }
    });

    const unsubTrade = binanceFeed.onTrade((trade) => {
      if (trade.symbol === currentSymbol) {
        setMarketTrades((prev) => [trade, ...prev.slice(0, 24)]);
      }
    });

    return () => {
      isMounted = false;
      unsubTrade();
    };
  }, [currentSymbol]);

  useEffect(() => {
    if (currentTicker && !price) {
      setPrice(currentTicker.last_price.toString());
    }
  }, [currentTicker]);

  const handlePriceChange = (val: string) => {
    setPrice(val);
    const p = parseFloat(val) || 0;
    const q = parseFloat(quantity) || 0;
    if (p > 0 && q > 0) {
      setAmountUsdt((q * p).toFixed(2));
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    setSelectedPercentage(null);
    const q = parseFloat(val);
    const targetPrice = orderType === 'MARKET' ? currentTicker?.last_price : parseFloat(price) || currentTicker?.last_price;
    if (!isNaN(q) && targetPrice && targetPrice > 0) {
      setAmountUsdt((q * targetPrice).toFixed(2));
    } else if (!val) {
      setAmountUsdt('');
    }
  };

  const handleAmountUsdtChange = (val: string) => {
    setAmountUsdt(val);
    setSelectedPercentage(null);
    const amt = parseFloat(val);
    const targetPrice = orderType === 'MARKET' ? currentTicker?.last_price : parseFloat(price) || currentTicker?.last_price;
    if (!isNaN(amt) && targetPrice && targetPrice > 0) {
      setQuantity((amt / targetPrice).toFixed(4));
    } else if (!val) {
      setQuantity('');
    }
  };

  const handlePercentageClick = (pct: number) => {
    setSelectedPercentage(pct);
    if (!portfolio || !currentTicker) return;

    let modeBal = portfolio.balances.find((b) => b.asset === 'USDT')?.free || 0;
    if (tradingMode === 'MARGIN') {
      const marginSub = portfolio.sub_accounts?.find((s) => s.account_id === 'margin');
      modeBal = marginSub ? marginSub.usd_value : (portfolio.available_balance_usd ? portfolio.available_balance_usd * 0.18 : 18457.20);
    } else if (tradingMode === 'LEVERAGE') {
      const futuresSub = portfolio.sub_accounts?.find((s) => s.account_id === 'futures');
      modeBal = futuresSub ? futuresSub.usd_value : (portfolio.available_balance_usd ? portfolio.available_balance_usd * 0.10 : 10254.00);
    }

    const mult = (tradingMode === 'LEVERAGE' || tradingMode === 'MARGIN') ? leverage : 1;
    const effectiveUsdt = (modeBal * (pct / 100)) * mult;
    const targetPrice = orderType === 'MARKET' ? currentTicker.last_price : parseFloat(price) || currentTicker.last_price;
    if (targetPrice > 0) {
      setAmountUsdt(effectiveUsdt.toFixed(2));
      setQuantity(((effectiveUsdt / targetPrice) * 0.99).toFixed(4));
    }
  };

  // Fetch Binance Testnet config on mount
  useEffect(() => {
    api.getBinanceConfig()
      .then((cfg) => {
        setBinanceConfig(cfg);
        setIsRoutingEnabled(cfg.is_enabled);
      })
      .catch(() => {});
  }, []);

  const handleSaveBinanceConfig = async () => {
    setIsSavingConfig(true);
    try {
      await api.updateBinanceConfig({
        api_key: apiKeyInput ? apiKeyInput : undefined,
        secret_key: secretKeyInput ? secretKeyInput : undefined,
        is_enabled: isRoutingEnabled,
      });
      const updated = await api.getBinanceConfig();
      setBinanceConfig(updated);
      setApiKeyInput('');
      setSecretKeyInput('');
      setIsBinanceModalOpen(false);
      setOrderSuccessToast({
        id: 'config_saved',
        side: 'BUY',
        symbol: 'Binance Testnet',
        qty: 0,
        price: 0,
        status: 'CONNECTED',
        binanceId: null,
      });
      setTimeout(() => setOrderSuccessToast(null), 4000);
    } catch (e: any) {
      alert(e.message || 'Failed to update Binance configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestDeposit = async (asset: string, amount: number) => {
    setIsDepositing(true);
    try {
      await api.testDeposit(asset, amount);
      onRefreshAll();
      setIsFaucetOpen(false);
      setOrderSuccessToast({
        id: 'faucet',
        side: 'BUY',
        symbol: asset,
        qty: amount,
        price: 1,
        status: 'DEPOSITED',
        binanceId: null,
      });
      setTimeout(() => setOrderSuccessToast(null), 4000);
    } catch (e: any) {
      alert(e.message || 'Test deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  const handlePlaceOrder = async (orderSide: 'BUY' | 'SELL') => {
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Please enter a valid quantity or amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.placeOrder({
        symbol: currentSymbol,
        side: orderSide,
        order_type: orderType,
        price: orderType === 'MARKET' ? undefined : parseFloat(price),
        quantity: parseFloat(quantity),
        leverage: tradingMode === 'LEVERAGE' ? leverage : 1,
      });
      onRefreshAll();
      setQuantity('');
      setAmountUsdt('');
      setSelectedPercentage(null);

      const isBinance = res.client_order_id?.startsWith('BINANCE-');
      const binanceId = isBinance ? res.client_order_id?.replace('BINANCE-', '') || null : null;
      setOrderSuccessToast({
        id: res.id,
        side: res.side,
        symbol: res.symbol,
        qty: res.quantity,
        price: res.price,
        status: res.status,
        binanceId,
      });
      setTimeout(() => setOrderSuccessToast(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Order failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      onRefreshAll();
    } catch (e: any) {
      alert(e.message || 'Cancel failed');
    }
  };

  // Open working limit orders (unfilled or partially filled)
  const openOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED');
  }, [orders]);

  // Derived Active Open Positions from filled executions
  const activePositions = useMemo(() => {
    return orders
      .filter((o) => (o.status === 'FILLED' || o.filled_quantity > 0))
      .map((ord) => {
        const symbolTicker = tickers.find((t) => t.symbol === ord.symbol) || currentTicker;
        const markPrice = symbolTicker ? symbolTicker.last_price : ord.price;
        const entryPrice = ord.price > 0 ? ord.price : markPrice;
        const qty = ord.filled_quantity > 0 ? ord.filled_quantity : ord.quantity;
        const isLong = ord.side === 'BUY';
        const priceDiff = (markPrice - entryPrice) * (isLong ? 1 : -1);
        const unrealizedPnl = priceDiff * qty;
        const posLeverage = tradingMode === 'LEVERAGE' ? leverage : 1;
        const pnlRoiPct = entryPrice > 0 ? ((priceDiff / entryPrice) * 100 * posLeverage) : 0;
        const notional = qty * markPrice;
        const liqPrice = isLong ? entryPrice * (1 - 0.85 / posLeverage) : entryPrice * (1 + 0.85 / posLeverage);
        const liqDistancePct = markPrice > 0 ? (Math.abs(markPrice - liqPrice) / markPrice) * 100 : 15;

        return {
          id: ord.id,
          symbol: ord.symbol,
          side: ord.side,
          isLong,
          quantity: qty,
          notional,
          entryPrice,
          markPrice,
          unrealizedPnl,
          pnlRoiPct,
          leverage: posLeverage,
          liqPrice,
          liqDistancePct,
          timestamp: ord.updated_at || ord.created_at,
        };
      });
  }, [orders, tickers, currentTicker, tradingMode, leverage]);

  // User's Real Spot Coin Holdings from portfolio balances
  const spotHoldings = useMemo(() => {
    if (!portfolio?.balances) return [];
    return portfolio.balances
      .filter((b) => b.asset !== 'USDT' && b.free > 0)
      .map((b) => {
        const sym = `${b.asset}/USDT`;
        const tick = tickers.find((t) => t.symbol === sym) || tickers.find((t) => t.base_asset === b.asset);
        const currentPrice = tick ? tick.last_price : 0;
        const totalValue = b.free * currentPrice;
        const buyOrd = orders.find((o) => o.symbol === sym && o.side === 'BUY');
        const avgBuyPrice = buyOrd && buyOrd.price > 0 ? buyOrd.price : (currentPrice > 0 ? currentPrice * 0.98 : 1);
        const pnl = totalValue - (b.free * avgBuyPrice);
        const pnlPct = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

        return {
          asset: b.asset,
          name: tick?.name || b.asset,
          symbol: sym,
          quantity: b.free,
          locked: b.locked,
          avgBuyPrice,
          currentPrice,
          totalValue,
          unrealizedPnl: pnl,
          pnlPct,
        };
      });
  }, [portfolio, tickers, orders]);

  // Total Portfolio Unrealized PnL
  const totalUnrealizedPnl = useMemo(() => {
    return activePositions.reduce((acc, pos) => acc + pos.unrealizedPnl, 0);
  }, [activePositions]);

  // Historical Executions
  const orderHistory = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders]);

  const [sellingAsset, setSellingAsset] = useState<string | null>(null);

  const handleMarketClosePosition = async (posSymbol: string, posSide: 'BUY' | 'SELL', qty: number) => {
    try {
      setIsSubmitting(true);
      await api.placeOrder({
        symbol: posSymbol,
        side: posSide === 'BUY' ? 'SELL' : 'BUY',
        order_type: 'MARKET',
        quantity: qty,
        leverage: 1,
      });
      onRefreshAll();
    } catch (e: any) {
      alert(e.message || 'Close position failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSellSpotToUsdt = async (holding: { symbol: string; asset: string; quantity: number }) => {
    try {
      setSellingAsset(holding.asset);
      await api.placeOrder({
        symbol: holding.symbol,
        side: 'SELL',
        order_type: 'MARKET',
        quantity: holding.quantity,
        leverage: 1,
      });
      onRefreshAll();
    } catch (e: any) {
      alert(e.message || `Failed to sell ${holding.asset} to USDT`);
    } finally {
      setSellingAsset(null);
    }
  };

  const handleCancelAllOrders = async () => {
    try {
      for (const ord of openOrders) {
        await api.cancelOrder(ord.id);
      }
      onRefreshAll();
    } catch (e: any) {
      alert(e.message || 'Cancel orders failed');
    }
  };

  const maxAskTotal = depth?.asks.reduce((acc, a) => Math.max(acc, a.total), 0) || 1;
  const maxBidTotal = depth?.bids.reduce((acc, b) => Math.max(acc, b.total), 0) || 1;

  return (
    <div className="space-y-4 max-w-[1680px] mx-auto pb-12">
      {/* Main Trading Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Ticker Bar + Chart Widget (Expanded length to the right by 25%) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {/* Top Header Bar: Symbol Selector & Live Stats (Decreased height by 25%) */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl py-2.5 px-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-wrap items-center justify-between gap-3 transition-colors">
            {/* Searchable Market Pair Selector */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={searchDropdownRef}>
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsPairSearchOpen(!isPairSearchOpen)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-sm transition-all border cursor-pointer shadow-2xs group ${
                    isPairSearchOpen
                      ? 'bg-teal-50 dark:bg-[#1E293B] border-[#0B3B3C] dark:border-[#14B8A6] text-[#0B3B3C] dark:text-[#14B8A6] ring-2 ring-[#0B3B3C]/10 dark:ring-[#14B8A6]/20'
                      : 'bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-slate-700/60 border-[#E2E8F0] dark:border-[#2E384D] text-[#0F172A] dark:text-white'
                  }`}
                >
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-2xs shrink-0"
                    style={{ backgroundColor: currentTicker?.icon_color || '#F3BA2F' }}
                  >
                    {currentTicker?.base_asset?.[0] || 'B'}
                  </div>
                  <span className="font-mono tracking-tight">{currentSymbol}</span>
                  <span className="text-xs font-semibold text-gray-400">({currentTicker?.name || 'Bitcoin'})</span>
                  <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0B3B3C] dark:group-hover:text-[#14B8A6] transition-colors ml-0.5" />
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isPairSearchOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Searchable Pair Modal / Popover */}
                {isPairSearchOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[380px] sm:w-[420px] bg-white dark:bg-[#161B26] border border-[#E5E9EB] dark:border-[#232B3B] rounded-2xl shadow-2xl z-50 p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Input Bar */}
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={pairSearchQuery}
                        onChange={(e) => setPairSearchQuery(e.target.value)}
                        placeholder="Search any crypto pair (e.g. BTC, ETH, SOL)..."
                        className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl text-xs font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                      />
                      {pairSearchQuery && (
                        <button
                          onClick={() => setPairSearchQuery('')}
                          className="absolute right-2.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quick Category Filter Tabs */}
                    <div className="flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-[11px] font-bold">
                      {[
                        { id: 'ALL', label: 'All Pairs' },
                        { id: 'HOT', label: '🔥 Hot' },
                        { id: 'GAINERS', label: '📈 Gainers' },
                        { id: 'USDT', label: '💵 USDT' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPairCategoryFilter(tab.id as any)}
                          className={`flex-1 py-1 rounded-lg transition-all text-center ${
                            pairCategoryFilter === tab.id
                              ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 text-[10px] font-semibold text-gray-400 px-2 pt-1 border-b border-gray-100 dark:border-[#232B3B] pb-1">
                      <span className="col-span-6">Pair / Name</span>
                      <span className="col-span-3 text-right">Price</span>
                      <span className="col-span-3 text-right">24h Change</span>
                    </div>

                    {/* Live Pair List Results */}
                    <div className="max-h-[280px] overflow-y-auto no-scrollbar divide-y divide-gray-50 dark:divide-gray-800/40">
                      {filteredTickers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No matching trading pairs found for "<span className="font-bold text-gray-600 dark:text-gray-300">{pairSearchQuery}</span>"
                        </div>
                      ) : (
                        filteredTickers.map((t) => {
                          const isSelected = t.symbol === currentSymbol;
                          const isPos = t.price_change_pct_24h >= 0;
                          return (
                            <div
                              key={t.symbol}
                              onClick={() => {
                                onSelectSymbol(t.symbol);
                                setPrice(t.last_price.toString());
                                setIsPairSearchOpen(false);
                              }}
                              className={`grid grid-cols-12 items-center py-2 px-2 rounded-xl transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-500/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className="col-span-6 flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-2xs shrink-0"
                                  style={{ backgroundColor: t.icon_color || '#3B82F6' }}
                                >
                                  {t.base_asset[0]}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-black text-[#0F172A] dark:text-white font-mono leading-tight">
                                      {t.base_asset}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">
                                      /{t.quote_asset}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight">
                                    {t.name}
                                  </span>
                                </div>
                              </div>

                              <div className="col-span-3 text-right font-mono font-bold text-xs text-[#0F172A] dark:text-white">
                                {t.last_price >= 1 ? `$${t.last_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${t.last_price.toFixed(4)}`}
                              </div>

                              <div className="col-span-3 text-right">
                                <span className={`inline-block px-1.5 py-0.5 rounded font-bold font-mono text-[10.5px] ${
                                  isPos 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]' 
                                    : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
                                }`}>
                                  {isPos ? '+' : ''}{t.price_change_pct_24h.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xl font-black font-mono tracking-tight ${
                  (currentTicker.price_change_pct_24h ?? 0) >= 0 
                    ? 'text-[#10B981]' 
                    : 'text-[#EF4444]'
                }`}>
                  {currentTicker.last_price > 0 
                    ? (currentTicker.last_price >= 1
                        ? `$${currentTicker.last_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `$${currentTicker.last_price.toFixed(4)}`)
                    : '$--.--'}
                </span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                  currentTicker.price_change_pct_24h >= 0 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]' 
                    : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
                }`}>
                  {currentTicker.price_change_pct_24h >= 0 ? '▲ +' : '▼ '}
                  {currentTicker.price_change_pct_24h.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 24h Rolling Stats Bar */}
            <div className="flex items-center gap-4 xl:gap-7 text-[11px] font-semibold overflow-x-auto no-scrollbar py-0.5">
              {/* 24h Change */}
              <div>
                <span className="text-[#94A3B8] dark:text-gray-400 block text-[9.5px]">24h Chg</span>
                <span className={`font-bold font-mono ${
                  currentTicker.price_change_pct_24h >= 0 
                    ? 'text-[#10B981]' 
                    : 'text-[#EF4444]'
                }`}>
                  {currentTicker.last_price > 0 ? (
                    <>
                      {currentTicker.price_change_24h >= 0 ? '+' : ''}
                      {currentTicker.price_change_24h >= 1 || currentTicker.price_change_24h <= -1
                        ? currentTicker.price_change_24h.toFixed(2)
                        : currentTicker.price_change_24h.toFixed(4)}
                      {' '}
                      ({currentTicker.price_change_pct_24h >= 0 ? '+' : ''}
                      {currentTicker.price_change_pct_24h.toFixed(2)}%)
                    </>
                  ) : (
                    '--'
                  )}
                </span>
              </div>

              {/* 24h High */}
              <div>
                <span className="text-[#94A3B8] dark:text-gray-400 block text-[9.5px]">24h High</span>
                <span className="text-[#0F172A] dark:text-white font-bold font-mono">
                  {currentTicker.high_24h > 0
                    ? (currentTicker.high_24h >= 1
                        ? currentTicker.high_24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : currentTicker.high_24h.toFixed(4))
                    : '--'}
                </span>
              </div>

              {/* 24h Low */}
              <div>
                <span className="text-[#94A3B8] dark:text-gray-400 block text-[9.5px]">24h Low</span>
                <span className="text-[#0F172A] dark:text-white font-bold font-mono">
                  {currentTicker.low_24h > 0
                    ? (currentTicker.low_24h >= 1
                        ? currentTicker.low_24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : currentTicker.low_24h.toFixed(4))
                    : '--'}
                </span>
              </div>

              {/* 24h Vol (Base Asset) */}
              <div>
                <span className="text-[#94A3B8] dark:text-gray-400 block text-[9.5px]">
                  24h Vol({currentTicker.base_asset || 'BTC'})
                </span>
                <span className="text-[#0F172A] dark:text-white font-bold font-mono">
                  {currentTicker.volume_24h > 0
                    ? currentTicker.volume_24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '--'}
                </span>
              </div>

              {/* 24h Vol (Quote Asset / USDT) */}
              <div className="hidden sm:block">
                <span className="text-[#94A3B8] dark:text-gray-400 block text-[9.5px]">
                  24h Vol({currentTicker.quote_asset || 'USDT'})
                </span>
                <span className="text-[#0F172A] dark:text-white font-bold font-mono">
                  {currentTicker.quote_volume_24h > 0
                    ? currentTicker.quote_volume_24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive TradingView & Local Matching Engine Chart */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl pt-2.5 px-4 pb-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col justify-between transition-colors">
            <TradingViewChart
              symbol={currentSymbol}
              klines={klines}
              lastPrice={currentTicker?.last_price || 0}
              isDark={isDark}
              tradingMode={tradingMode}
              leverage={leverage}
            />
          </div>
        </div>

        {/* Right Column: Spot / Leverage Trade Widget & Order Book (3 cols on LG) */}
        <div className="lg:col-span-3 flex flex-col gap-3.5">
          {/* Spot / Leverage Trade Widget (+5% height) */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl py-3.5 px-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col justify-between transition-colors">
            <div>
              {/* Routing Engine Indicator & Faucet Action Row */}
              <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-gray-100 dark:border-[#232B3B]">
                <button
                  type="button"
                  onClick={() => setIsBinanceModalOpen(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                    binanceConfig?.is_enabled && binanceConfig?.has_secret
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-[#10B981]'
                      : 'bg-[#F8FAFC] dark:bg-[#1E293B] border-gray-200 dark:border-[#2E384D] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Configure Binance Testnet API Keys"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    binanceConfig?.is_enabled && binanceConfig?.has_secret
                      ? 'bg-[#10B981] animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                      : 'bg-amber-400'
                  }`} />
                  <span className="font-mono text-[10.5px]">
                    {binanceConfig?.is_enabled && binanceConfig?.has_secret
                      ? 'Binance Testnet'
                      : '⚡ Local Engine'}
                  </span>
                  <Settings2 className="w-3 h-3 text-gray-400 ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsFaucetOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/40 transition-all cursor-pointer shadow-2xs"
                  title="Testnet Faucet Deposit"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>+ Test Faucet</span>
                </button>
              </div>

              {/* Top Trading Engine Mode Switcher: SPOT vs MARGIN vs LEVERAGE */}
              <div className="grid grid-cols-3 gap-1 bg-[#F1F5F9] dark:bg-[#1E293B] p-0.5 rounded-xl text-xs font-bold mb-2">
                {/* Button 1: SPOT TRADING */}
                <button
                  onClick={() => {
                    setTradingMode('SPOT');
                    setLeverage(1);
                  }}
                  className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
                    tradingMode === 'SPOT'
                      ? 'bg-white dark:bg-[#121722] text-[#0B3B3C] dark:text-[#14B8A6] shadow-2xs font-black'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {/* Live Animated Beacon Dot */}
                  <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                      tradingMode === 'SPOT' 
                        ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,1)] ring-2 ring-emerald-500/20' 
                        : 'bg-emerald-500/70'
                    }`} />
                  </span>
                  SPOT
                </button>

                {/* Button 2: MARGIN (MIDDLE) */}
                <button
                  onClick={() => {
                    setTradingMode('MARGIN');
                    if (leverage === 1 || leverage > 10) setLeverage(3);
                  }}
                  className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
                    tradingMode === 'MARGIN'
                      ? 'bg-[#10B981] text-white shadow-2xs font-black'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {/* Live Animated Layers / Margin Vault Icon */}
                  <span className="relative flex items-center justify-center shrink-0">
                    <Layers className={`w-3.5 h-3.5 transition-all duration-300 ${
                      tradingMode === 'MARGIN'
                        ? 'text-white animate-pulse drop-shadow-[0_0_6px_rgba(16,185,129,0.9)] scale-110'
                        : 'text-emerald-500/70'
                    }`} />
                  </span>
                  MARGIN
                </button>

                {/* Button 3: LEVERAGE */}
                <button
                  onClick={() => {
                    setTradingMode('LEVERAGE');
                    if (leverage === 1) setLeverage(10);
                  }}
                  className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
                    tradingMode === 'LEVERAGE'
                      ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 shadow-2xs font-black'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {/* Live Animated Electric Lightning Strike */}
                  <span className="relative flex items-center justify-center shrink-0">
                    <Zap className={`w-3.5 h-3.5 transition-all duration-300 ${
                      tradingMode === 'LEVERAGE'
                        ? 'text-amber-300 dark:text-amber-950 fill-amber-300 dark:fill-amber-950 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-110'
                        : 'text-amber-400 fill-amber-400/40'
                    }`} />
                  </span>
                  LEVERAGE
                </button>
              </div>

              {/* Order Type Tabs */}
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-100 dark:border-[#232B3B]">
                {(['LIMIT', 'MARKET', 'STOP_LIMIT'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`capitalize text-xs transition-colors ${
                      orderType === type 
                        ? 'text-[#0B3B3C] dark:text-[#14B8A6] font-black underline underline-offset-4' 
                        : 'hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {type.toLowerCase().replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Inputs Form */}
              <div className="space-y-2">
                {orderType !== 'MARKET' && (
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                      <span>Price</span>
                      <span>USDT</span>
                    </div>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="Price in USDT"
                      className="w-full px-3 py-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                    <span>Quantity</span>
                    <span>{currentTicker ? currentTicker.base_asset : 'BTC'}</span>
                  </div>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                    <span>Amount</span>
                    <span>USDT</span>
                  </div>
                  <input
                    type="number"
                    value={amountUsdt}
                    onChange={(e) => handleAmountUsdtChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                  />
                </div>

                {/* Percentage Buttons (25%, 50%, 75%, 100%) */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentageClick(pct)}
                      className={`py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedPercentage === pct
                          ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 shadow-2xs'
                          : 'bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* MARGIN MODE: Spot Margin Borrow Multiplier Controls */}
                {tradingMode === 'MARGIN' && (
                  <div className="pt-0.5 space-y-1.5 bg-[#10B981]/15 dark:bg-[#10B981]/10 p-2 rounded-xl border border-[#10B981]/40">
                    <div className="flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1 font-bold text-[#10B981] dark:text-[#10B981]">
                        <Layers className="w-3 h-3 text-[#10B981]" />
                        Spot Margin Borrow Power
                      </span>
                      <span className="font-black text-[#10B981] dark:text-[#10B981] font-mono">{leverage}x (Real Tokens)</span>
                    </div>
                    <div className="flex justify-between gap-1 pt-0.5">
                      {[2, 3, 5, 10].map((l) => (
                        <button
                          key={l}
                          onClick={() => setLeverage(l)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                            leverage === l
                              ? 'bg-[#10B981] text-white font-black shadow-2xs'
                              : 'bg-white dark:bg-[#121722] text-gray-500 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-[#2E384D]'
                          }`}
                        >
                          {l}x
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[9.5px] text-gray-500 dark:text-gray-400 pt-0.5">
                      <span>Borrow Rate: ~0.02%/day</span>
                      <span className="text-[#10B981] font-bold">100% Token Ownership</span>
                    </div>
                  </div>
                )}

                {/* LEVERAGE MODE: Perpetual Futures Multiplier Controls */}
                {tradingMode === 'LEVERAGE' && (
                  <div className="pt-0.5 space-y-1.5 bg-[#F8FAFC] dark:bg-[#1E293B]/70 p-2 rounded-xl border border-gray-200/70 dark:border-[#2E384D]">
                    <div className="flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-200">
                        <Sliders className="w-3 h-3 text-[#0B3B3C] dark:text-[#14B8A6]" />
                        Futures Multiplier
                      </span>
                      <span className="font-black text-[#0B3B3C] dark:text-[#14B8A6] font-mono">{leverage}x</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="100"
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 dark:bg-[#2E384D] rounded-lg appearance-none cursor-pointer accent-[#0B3B3C] dark:accent-[#14B8A6]"
                    />
                    <div className="flex justify-between gap-1 pt-0.5">
                      {[2, 5, 10, 25, 50, 100].map((l) => (
                        <button
                          key={l}
                          onClick={() => setLeverage(l)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                            leverage === l
                              ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-black shadow-2xs'
                              : 'bg-white dark:bg-[#121722] text-gray-500 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-[#2E384D]'
                          }`}
                        >
                          {l}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SPOT MODE: Available Balances Info */}
                {tradingMode === 'SPOT' && (
                  <div className="flex justify-between text-[10px] font-semibold text-gray-400 px-1 pt-0.5">
                    <span>Avail: ${(portfolio?.balances.find((b) => b.asset === 'USDT')?.free || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
                    <span>{(portfolio?.balances.find((b) => b.asset === (currentTicker?.base_asset || 'BTC'))?.free || 0).toFixed(4)} {currentTicker?.base_asset || 'BTC'}</span>
                  </div>
                )}

                {/* MARGIN MODE: Available Balances Info */}
                {tradingMode === 'MARGIN' && (
                  <div className="flex justify-between text-[10px] font-semibold text-gray-400 px-1 pt-0.5">
                    <span>Avail: ${(portfolio?.sub_accounts?.find((s) => s.account_id === 'margin')?.usd_value || (portfolio?.available_balance_usd ? portfolio.available_balance_usd * 0.18 : 18457.20)).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
                    <span className="text-[#10B981] font-bold">Max ({leverage}x): ${(
                      (portfolio?.sub_accounts?.find((s) => s.account_id === 'margin')?.usd_value || (portfolio?.available_balance_usd ? portfolio.available_balance_usd * 0.18 : 18457.20)) * leverage
                    ).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
                  </div>
                )}

                {/* LEVERAGE MODE: Available Balances Info */}
                {tradingMode === 'LEVERAGE' && (
                  <div className="flex justify-between text-[10px] font-semibold text-gray-400 px-1 pt-0.5">
                    <span>Avail: ${(portfolio?.sub_accounts?.find((s) => s.account_id === 'futures')?.usd_value || (portfolio?.available_balance_usd ? portfolio.available_balance_usd * 0.10 : 10254.00)).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
                    <span className="text-[#0B3B3C] dark:text-[#14B8A6] font-bold">Max ({leverage}x): ${(
                      (portfolio?.sub_accounts?.find((s) => s.account_id === 'futures')?.usd_value || (portfolio?.available_balance_usd ? portfolio.available_balance_usd * 0.10 : 10254.00)) * leverage
                    ).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Action Buttons & Metrics */}
            <div className="mt-3 space-y-1.5 pt-2 border-t border-gray-100 dark:border-[#232B3B]">
              <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span>
                  {tradingMode === 'LEVERAGE' 
                    ? 'Required Margin:' 
                    : tradingMode === 'MARGIN' 
                      ? 'Margin Collateral (Borrow):' 
                      : 'Est. Order Value:'}
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  ${(
                    ((parseFloat(quantity) || 0) * (parseFloat(price) || currentTicker?.last_price || 0)) / 
                    (tradingMode === 'LEVERAGE' || tradingMode === 'MARGIN' ? leverage : 1)
                  ).toFixed(2)}
                </span>
              </div>

              {tradingMode === 'LEVERAGE' && (
                <div className="flex justify-between text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <span>Est. Liq Price (Long / Short):</span>
                  <span className="font-mono font-bold">
                    ${((parseFloat(price) || currentTicker?.last_price || 0) * (1 - (1 / leverage) * 0.9)).toFixed(2)} / ${((parseFloat(price) || currentTicker?.last_price || 0) * (1 + (1 / leverage) * 0.9)).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Dual Side-by-Side Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => handlePlaceOrder('BUY')}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 bg-[#10B981] hover:bg-emerald-600 active:scale-[0.99] text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting 
                      ? 'Submitting...' 
                      : tradingMode === 'SPOT' 
                        ? `Buy ${currentTicker ? currentTicker.base_asset : 'BTC'}` 
                        : tradingMode === 'MARGIN'
                          ? `Margin Buy ${leverage}x`
                          : `Open ${leverage}x Long`}
                  </span>
                </button>

                <button
                  onClick={() => handlePlaceOrder('SELL')}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 bg-[#EF4444] hover:bg-rose-600 active:scale-[0.99] text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting 
                      ? 'Submitting...' 
                      : tradingMode === 'SPOT' 
                        ? `Sell ${currentTicker ? currentTicker.base_asset : 'BTC'}` 
                        : tradingMode === 'MARGIN'
                          ? `Margin Sell ${leverage}x`
                          : `Open ${leverage}x Short`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Order Book & Market Trades Live Desk */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl py-3.5 px-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setBookTab('ORDER_BOOK')}
                  className={`px-2.5 py-1 rounded-md transition-all text-xs font-black cursor-pointer ${
                    bookTab === 'ORDER_BOOK'
                      ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  Order Book
                </button>
                <button
                  onClick={() => setBookTab('MARKET_TRADES')}
                  className={`px-2.5 py-1 rounded-md transition-all text-xs font-black cursor-pointer flex items-center gap-1.5 ${
                    bookTab === 'MARKET_TRADES'
                      ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <span>Market Trades</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                </button>
              </div>
              <span className="text-[10.5px] font-semibold text-gray-400 dark:text-gray-500">
                {bookTab === 'ORDER_BOOK' ? 'Spread: $0.10' : 'Binance Live'}
              </span>
            </div>

            {bookTab === 'ORDER_BOOK' ? (
              <>
                <div className="grid grid-cols-3 text-[10.5px] font-semibold text-[#94A3B8] dark:text-gray-400 pb-1.5 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                  <span>Price (USDT)</span>
                  <span className="text-right">Size ({currentTicker?.base_asset})</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Asks (Sells - Red) */}
                <div className="space-y-0.5 my-1.5">
                  {depth?.asks.slice(0, 6).reverse().map((ask) => {
                    const depthPct = (ask.total / maxAskTotal) * 100;
                    return (
                      <div key={ask.price} className="relative grid grid-cols-3 text-xs py-[1.5px] font-mono">
                        <div 
                          className="absolute right-0 top-0 bottom-0 bg-rose-50/70 dark:bg-rose-950/40 rounded pointer-events-none"
                          style={{ width: `${depthPct}%` }}
                        />
                        <span className="text-[#EF4444] font-bold z-10">{ask.price.toFixed(2)}</span>
                        <span className="text-right text-gray-700 dark:text-gray-300 z-10">{ask.quantity.toFixed(4)}</span>
                        <span className="text-right text-gray-400 dark:text-gray-500 z-10">{ask.total.toFixed(4)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Mid Price Separator */}
                {currentTicker && (
                  <div className="py-1.5 my-1 px-2.5 bg-gray-50 dark:bg-[#1E293B] rounded-lg flex items-center justify-between text-xs font-black text-[#0F172A] dark:text-white">
                    <span>${currentTicker.last_price.toFixed(2)}</span>
                    <span className="text-xs text-[#10B981] font-bold">▲ Mark Price</span>
                  </div>
                )}

                {/* Bids (Buys - Green) */}
                <div className="space-y-0.5 my-1.5">
                  {depth?.bids.slice(0, 6).map((bid) => {
                    const depthPct = (bid.total / maxBidTotal) * 100;
                    return (
                      <div key={bid.price} className="relative grid grid-cols-3 text-xs py-[1.5px] font-mono">
                        <div 
                          className="absolute right-0 top-0 bottom-0 bg-emerald-50/70 dark:bg-emerald-950/40 rounded pointer-events-none"
                          style={{ width: `${depthPct}%` }}
                        />
                        <span className="text-[#10B981] font-bold z-10">{bid.price.toFixed(2)}</span>
                        <span className="text-right text-gray-700 dark:text-gray-300 z-10">{bid.quantity.toFixed(4)}</span>
                        <span className="text-right text-gray-400 dark:text-gray-500 z-10">{bid.total.toFixed(4)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 text-[10.5px] font-semibold text-[#94A3B8] dark:text-gray-400 pb-1.5 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                  <span>Price (USDT)</span>
                  <span className="text-right">Amount ({currentTicker?.base_asset})</span>
                  <span className="text-right">Time</span>
                </div>

                <div className="space-y-0.5 my-1.5 min-h-[290px]">
                  {marketTrades.length === 0 ? (
                    <div className="flex items-center justify-center h-[260px] text-xs text-gray-400 dark:text-gray-500">
                      Connecting live Binance stream...
                    </div>
                  ) : (
                    marketTrades.slice(0, 13).map((t, idx) => {
                      const d = new Date(t.timestamp);
                      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
                      const isBuy = !t.isBuyerMaker;
                      const decimals = currentSymbol.includes('EURO') || currentSymbol.includes('EUR') || t.price < 10 ? 4 : 2;
                      return (
                        <div key={`${t.timestamp}-${idx}`} className="grid grid-cols-3 text-xs py-[2px] font-mono hover:bg-gray-50 dark:hover:bg-[#1E293B]/50 rounded transition-colors">
                          <span className={`font-bold ${isBuy ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {t.price.toFixed(decimals)}
                          </span>
                          <span className="text-right text-gray-700 dark:text-gray-300">
                            {t.quantity.toFixed(4)}
                          </span>
                          <span className="text-right text-gray-400 dark:text-gray-500 text-[11px]">
                            {timeStr}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    {/* Lower Row: Next-Gen Position, Order & Trade History Desk */}
    <div className="bg-white dark:bg-[#161B26] rounded-2xl p-4 sm:p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors space-y-3">
          {/* Desk Header: Segmented Tabs & Mode Filter (Spot vs Leverage) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9] dark:border-[#232B3B]">
            <div className="flex flex-wrap items-center gap-2">
              {/* 3 Modern Segmented Tabs */}
              <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveDeskTab('POSITIONS')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeDeskTab === 'POSITIONS'
                      ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>{deskModeFilter === 'SPOT' ? 'Spot Holdings' : 'Positions'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    (deskModeFilter === 'SPOT' ? spotHoldings.length : activePositions.length) > 0 
                      ? 'bg-[#10B981] text-white animate-pulse' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {deskModeFilter === 'SPOT' ? spotHoldings.length : activePositions.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveDeskTab('OPEN_ORDERS')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeDeskTab === 'OPEN_ORDERS'
                      ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Open Orders</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {openOrders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveDeskTab('HISTORY')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeDeskTab === 'HISTORY'
                      ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Trade History</span>
                </button>
              </div>
            </div>

            {/* Right Action, Portfolio Unrealized PnL & Mode Filter Pills at Right Edge */}
            <div className="flex flex-wrap items-center gap-3">
              {activePositions.length > 0 && deskModeFilter !== 'SPOT' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 dark:text-gray-500 text-[11px] font-bold">Unrealized PnL:</span>
                  <span className={`px-2 py-0.5 rounded-md font-mono font-black border text-[11px] flex items-center gap-1 ${
                    totalUnrealizedPnl >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-[#10B981]'
                      : 'bg-rose-500/10 border-rose-500/30 text-[#EF4444]'
                  }`}>
                    {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)} USDT
                  </span>
                </div>
              )}

              {activeDeskTab === 'OPEN_ORDERS' && openOrders.length > 0 && (
                <button
                  onClick={handleCancelAllOrders}
                  className="px-2.5 py-1 text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel All
                </button>
              )}

              {/* Mode Filter Pills at the Right Edge: Spot vs Margin vs Leverage */}
              <div className="flex items-center bg-gray-100 dark:bg-[#1a2333] p-0.5 rounded-lg text-[10.5px] font-bold">
                <button
                  onClick={() => setDeskModeFilter('SPOT')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    deskModeFilter === 'SPOT'
                      ? 'bg-white dark:bg-[#121722] text-emerald-600 dark:text-[#10B981] shadow-2xs font-black'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  🪙 Spot Mode
                </button>
                <button
                  onClick={() => setDeskModeFilter('MARGIN')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    deskModeFilter === 'MARGIN'
                      ? 'bg-[#10B981] text-white shadow-2xs font-black'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  📦 Margin Mode
                </button>
                <button
                  onClick={() => setDeskModeFilter('LEVERAGE')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    deskModeFilter === 'LEVERAGE'
                      ? 'bg-white dark:bg-[#121722] text-blue-600 dark:text-blue-400 shadow-2xs font-black'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  ⚡ Leverage Mode
                </button>
                <button
                  onClick={() => setDeskModeFilter('ALL')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    deskModeFilter === 'ALL'
                      ? 'bg-white dark:bg-[#121722] text-gray-900 dark:text-white shadow-2xs font-black'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: POSITIONS & HOLDINGS */}
          {activeDeskTab === 'POSITIONS' && (
            <div>
              {/* SPOT HOLDINGS VIEW (Zero Liquidation Risk, Real Coin Balances) */}
              {deskModeFilter === 'SPOT' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                        <th className="py-2.5 px-3">Asset & Coin</th>
                        <th className="py-2.5 px-3">Spot Holdings (Amount)</th>
                        <th className="py-2.5 px-3">Avg Purchase Price</th>
                        <th className="py-2.5 px-3">Market Price (Live)</th>
                        <th className="py-2.5 px-3">Unrealized Gain / Loss</th>
                        <th className="py-2.5 px-3">Total Value (USDT)</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                      {spotHoldings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-gray-400 dark:text-gray-500 font-semibold">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <span className="text-2xl">🪙</span>
                              <span>No active spot crypto holdings.</span>
                              <span className="text-[11px] text-gray-400">Buy crypto with USDT in Spot Mode above to hold assets with 0% liquidation risk.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        spotHoldings.map((h) => (
                          <tr key={h.asset} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#0F172A] dark:text-white">{h.asset}</span>
                                <span className="text-[10px] text-gray-400">({h.name})</span>
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-500/10 text-[#10B981]">
                                  SPOT
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 font-mono font-bold text-[#0F172A] dark:text-white">
                              {h.quantity.toFixed(4)} {h.asset}
                            </td>

                            <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-300">
                              ${h.avgBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                                <span className="font-mono font-black text-[#0F172A] dark:text-white">
                                  ${h.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className={`inline-flex flex-col px-2 py-0.5 rounded-lg border font-mono ${
                                h.unrealizedPnl >= 0
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-[#10B981]'
                                  : 'bg-rose-500/10 border-rose-500/30 text-[#EF4444]'
                              }`}>
                                <span className="font-black text-xs">
                                  {h.unrealizedPnl >= 0 ? '+' : ''}${h.unrealizedPnl.toFixed(2)}
                                </span>
                                <span className="text-[9.5px] font-bold">
                                  ({h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%)
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 font-mono font-bold text-[#0F172A] dark:text-white">
                              ${h.totalValue.toFixed(2)} USDT
                            </td>

                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleSellSpotToUsdt(h)}
                                disabled={sellingAsset === h.asset}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-2xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>{sellingAsset === h.asset ? 'Placing Order...' : 'Sell to USDT'}</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* LEVERAGE POSITIONS VIEW (Multiplied Margin Contracts, Liquidation Safety Radar) */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                        <th className="py-2.5 px-3">Symbol & Direction</th>
                        <th className="py-2.5 px-3">Position Size</th>
                        <th className="py-2.5 px-3">Entry Price</th>
                        <th className="py-2.5 px-3">Mark Price (Live)</th>
                        <th className="py-2.5 px-3">Unrealized PnL (ROI)</th>
                        <th className="py-2.5 px-3">Liq. Price & Safety</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                      {activePositions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-gray-400 dark:text-gray-500 font-semibold">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <Zap className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                              <span>No active leverage positions.</span>
                              <span className="text-[11px] text-gray-400">Place a Leverage Long/Short order above to open a live margin position.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        activePositions.map((pos) => (
                          <tr key={pos.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors">
                            {/* Symbol & Side Badge */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#0F172A] dark:text-white">{pos.symbol}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase ${
                                  pos.isLong
                                    ? 'bg-emerald-500/15 text-[#10B981] border border-emerald-500/20'
                                    : 'bg-rose-500/15 text-[#EF4444] border border-rose-500/20'
                                }`}>
                                  {pos.isLong ? 'LONG' : 'SHORT'} {pos.leverage}x
                                </span>
                              </div>
                            </td>

                            {/* Size & Notional Value */}
                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-[#0F172A] dark:text-white">{pos.quantity.toFixed(4)}</div>
                              <div className="text-[10px] text-gray-400">${pos.notional.toFixed(2)} USDT</div>
                            </td>

                            {/* Entry Price */}
                            <td className="py-3 px-3 font-mono font-bold text-gray-700 dark:text-gray-300">
                              ${pos.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Mark Price (Live Fluctuating) */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                                <span className="font-mono font-black text-[#0F172A] dark:text-white">
                                  ${pos.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>

                            {/* Unrealized PnL (ROI %) */}
                            <td className="py-3 px-3">
                              <div className={`inline-flex flex-col px-2 py-0.5 rounded-lg border font-mono ${
                                pos.unrealizedPnl >= 0
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-[#10B981]'
                                  : 'bg-rose-500/10 border-rose-500/30 text-[#EF4444]'
                              }`}>
                                <span className="font-black text-xs">
                                  {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                                </span>
                                <span className="text-[9.5px] font-bold">
                                  ({pos.pnlRoiPct >= 0 ? '+' : ''}{pos.pnlRoiPct.toFixed(2)}%)
                                </span>
                              </div>
                            </td>

                            {/* Liquidation Price & Safety Buffer */}
                            <td className="py-3 px-3">
                              <div>
                                <div className="font-mono font-bold text-amber-500">
                                  ${pos.liqPrice.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                                  <span>{pos.liqDistancePct.toFixed(1)}% buffer</span>
                                </div>
                              </div>
                            </td>

                            {/* 1-Click Fast Market Close Action */}
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleMarketClosePosition(pos.symbol, pos.side, pos.quantity)}
                                disabled={isSubmitting}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[#EF4444] border border-rose-500/20 transition-all hover:scale-105 active:scale-95"
                                title="Close leverage position at market"
                              >
                                Market Close
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPEN WORKING ORDERS (Limit orders waiting in orderbook) */}
          {activeDeskTab === 'OPEN_ORDERS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Order Price</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Filled</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                  {openOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 dark:text-gray-500 font-semibold">
                        No active open limit orders
                      </td>
                    </tr>
                  ) : (
                    openOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#0F172A] dark:text-white">{ord.symbol}</td>
                        <td className="py-3 px-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            ord.side === 'BUY' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]' 
                              : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
                          }`}>
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">{ord.order_type}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0F172A] dark:text-white">${ord.price.toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono text-gray-800 dark:text-gray-200">{ord.quantity}</td>
                        <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">{ord.filled_quantity}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                            title="Cancel Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: TRADE & ORDER HISTORY */}
          {activeDeskTab === 'HISTORY' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Executed Price</th>
                    <th className="py-2.5 px-3">Filled Quantity</th>
                    <th className="py-2.5 px-3">Total Value</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                  {orderHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 dark:text-gray-500 font-semibold">
                        No trade history yet
                      </td>
                    </tr>
                  ) : (
                    orderHistory.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-3 text-gray-400 font-mono text-[10.5px]">
                          {new Date(ord.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#0F172A] dark:text-white">{ord.symbol}</td>
                        <td className="py-3 px-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            ord.side === 'BUY' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]' 
                              : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
                          }`}>
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">{ord.order_type}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0F172A] dark:text-white">${ord.price.toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono text-gray-800 dark:text-gray-200">{ord.filled_quantity || ord.quantity}</td>
                        <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">
                          ${((ord.filled_quantity || ord.quantity) * ord.price).toFixed(2)} USDT
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.status === 'FILLED'
                              ? 'bg-emerald-500/10 text-[#10B981] border border-emerald-500/20'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Binance Spot Testnet Settings Modal */}
      {isBinanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161B26] border border-[#E5E9EB] dark:border-[#232B3B] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    Binance Spot Testnet
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      $0 Cost Sandbox
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Route real buy/sell orders through Binance's official Testnet matching engine.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBinanceModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Base URL info */}
            <div className="p-3 bg-gray-50 dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#2E384D] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Matching Engine:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">https://testnet.binance.vision</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Status:</span>
                <span className={`inline-flex items-center gap-1 font-bold ${
                  binanceConfig?.is_enabled && binanceConfig?.has_secret
                    ? 'text-[#10B981]'
                    : 'text-amber-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    binanceConfig?.is_enabled && binanceConfig?.has_secret
                      ? 'bg-[#10B981]'
                      : 'bg-amber-400'
                  }`} />
                  {binanceConfig?.is_enabled && binanceConfig?.has_secret ? 'Testnet Ready (HMAC-SHA256)' : 'Awaiting API Keys (Falling back to Local Engine)'}
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3.5">
              {/* Routing Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] dark:bg-[#1E293B]/60 rounded-xl border border-gray-200/80 dark:border-[#2E384D]">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">Enable Binance Testnet Routing</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">When enabled, orders match against Binance Testnet orderbooks</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoutingEnabled(!isRoutingEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    isRoutingEnabled ? 'bg-[#10B981]' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isRoutingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Testnet API Key
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={binanceConfig?.api_key_masked ? `Current: ${binanceConfig.api_key_masked}` : 'Enter Binance Testnet API Key'}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-xs font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                />
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Testnet Secret Key
                </label>
                <input
                  type="password"
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder={binanceConfig?.has_secret ? '•••••••••••••••• (Secret key configured)' : 'Enter Binance Testnet Secret Key'}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-xs font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                />
              </div>

              {/* How to get testnet keys helper box */}
              <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-2xl border border-teal-200/50 dark:border-teal-800/40 text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#0B3B3C] dark:text-[#14B8A6]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>How to get free Binance Testnet keys:</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  1. Visit <a href="https://testnet.binance.vision/" target="_blank" rel="noreferrer" className="underline font-bold text-[#0B3B3C] dark:text-[#14B8A6] inline-flex items-center gap-0.5">testnet.binance.vision <ExternalLink className="w-2.5 h-2.5" /></a><br/>
                  2. Log in with your GitHub account.<br/>
                  3. Click <strong>"Generate HMAC_SHA256 Key"</strong> and copy your API Key & Secret Key here.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-[#232B3B]">
              <button
                type="button"
                onClick={() => setIsBinanceModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBinanceConfig}
                disabled={isSavingConfig}
                className="px-5 py-2 text-xs font-black bg-[#0B3B3C] dark:bg-[#14B8A6] hover:opacity-90 text-white dark:text-gray-950 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Testnet Faucet Modal */}
      {isFaucetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161B26] border border-[#E5E9EB] dark:border-[#232B3B] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    ⚡ Instant Testnet Faucet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Credit virtual funds instantly for risk-free order testing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFaucetOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Faucet Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                1-Click Quick Deposits
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { asset: 'USDT', amount: 1000, label: '+$1,000 USDT', desc: 'Working capital' },
                  { asset: 'USDT', amount: 10000, label: '+$10,000 USDT', desc: 'Whale testing' },
                  { asset: 'BTC', amount: 0.5, label: '+0.50 BTC', desc: 'Spot Bitcoin' },
                  { asset: 'ETH', amount: 5.0, label: '+5.00 ETH', desc: 'Spot Ethereum' },
                  { asset: 'SOL', amount: 25.0, label: '+25.00 SOL', desc: 'Spot Solana' },
                  { asset: 'BNB', amount: 10.0, label: '+10.00 BNB', desc: 'Spot BNB' },
                ].map((preset) => (
                  <button
                    key={`${preset.asset}-${preset.amount}`}
                    type="button"
                    disabled={isDepositing}
                    onClick={() => handleTestDeposit(preset.asset, preset.amount)}
                    className="p-3 text-left rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-teal-50 dark:hover:bg-slate-700/60 border border-gray-200/80 dark:border-[#2E384D] transition-all hover:border-[#0B3B3C] dark:hover:border-[#14B8A6] cursor-pointer group shadow-2xs disabled:opacity-50"
                  >
                    <div className="text-xs font-black text-gray-900 dark:text-white group-hover:text-[#0B3B3C] dark:group-hover:text-[#14B8A6]">
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {preset.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center pt-1">
              Funds are instantly credited to your simulated and test accounts with zero financial cost.
            </p>
          </div>
        </div>
      )}

      {/* Floating Order Execution Toast */}
      {orderSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-white dark:bg-[#161B26] border border-[#E5E9EB] dark:border-[#232B3B] rounded-2xl p-4 shadow-2xl max-w-sm w-full flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-gray-900 dark:text-white">
                  Order Executed Successfully
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase ${
                  orderSuccessToast.side === 'BUY'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
                }`}>
                  {orderSuccessToast.side}
                </span>
              </div>
              <div className="text-[11px] text-gray-600 dark:text-gray-300 font-mono mt-0.5">
                {orderSuccessToast.qty > 0 && `${orderSuccessToast.qty} `}{orderSuccessToast.symbol}
                {orderSuccessToast.price > 0 && ` @ $${orderSuccessToast.price.toFixed(2)}`}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                {orderSuccessToast.binanceId ? (
                  <span className="text-amber-500 font-bold">
                    Binance Order #{orderSuccessToast.binanceId}
                  </span>
                ) : (
                  <span>⚡ Instant Local Settlement</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setOrderSuccessToast(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
