import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { TradeView } from './views/TradeView';
import { AnalyticsView } from './views/AnalyticsView';
import { PortfolioView } from './views/PortfolioView';
import { OtcView } from './views/OtcView';
import { BinaryView } from './views/BinaryView';
import { NewsView } from './views/NewsView';
import { AirdropView } from './views/AirdropView';
import { IgoView } from './views/IgoView';
import { FundraisingView } from './views/FundraisingView';
import { GlossaryView } from './views/GlossaryView';
import { StrategyView } from './views/StrategyView';

import { DepositModal } from './components/Modals/DepositModal';
import { WithdrawModal } from './components/Modals/WithdrawModal';
import { SwapModal } from './components/Modals/SwapModal';
import { TransferModal } from './components/Modals/TransferModal';

import { Ticker, OrderBookDepth, Kline, Order, Trade, PortfolioSummary } from './types';
import { api } from './services/api';
import { wsClient } from './services/websocket';
import { binanceFeed } from './services/binanceFeed';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('Dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('xtrade_theme');
    if (saved) return saved === 'dark';
    return true; // Dark mode as default
  });
  const [currentSymbol, setCurrentSymbol] = useState<string>('BTC/USDT');

  // Core Data States
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [depth, setDepth] = useState<OrderBookDepth | null>(null);
  const [klines, setKlines] = useState<Kline[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);

  // Modals
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Sync dark class with document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('xtrade_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('xtrade_theme', 'light');
    }
  }, [isDark]);

  // Initial Fetch & WebSocket setup + Binance Real-World Feed
  useEffect(() => {
    fetchAllData();
    wsClient.connect();
    binanceFeed.connect();
    binanceFeed.fetchInitialTickers();

    let lastBinanceMsgTime = 0;

    // Subscribe to Binance Real-Time Global Ticker Stream
    const unsubBinance = binanceFeed.onTicker((bTicker) => {
      lastBinanceMsgTime = Date.now();
      setTickers((prev) => {
        const idx = prev.findIndex((t) => t.symbol === bTicker.symbol);
        if (idx >= 0) {
          const next = [...prev];
          const existing = next[idx];
          next[idx] = {
            ...existing,
            last_price: bTicker.last_price,
            price_change_24h: bTicker.price_change_24h,
            price_change_pct_24h: bTicker.price_change_pct_24h,
            high_24h: bTicker.high_24h,
            low_24h: bTicker.low_24h,
            volume_24h: bTicker.volume_24h,
            quote_volume_24h: bTicker.quote_volume_24h,
            is_gainer: bTicker.price_change_pct_24h >= 0,
            updated_at: new Date().toISOString(),
          };
          return next;
        } else {
          const [base, quote] = bTicker.symbol.split('/');
          const newTicker: Ticker = {
            symbol: bTicker.symbol,
            name: base === 'BTC' ? 'Bitcoin' : base === 'ETH' ? 'Ethereum' : base === 'SOL' ? 'Solana' : base,
            base_asset: base || 'BTC',
            quote_asset: quote || 'USDT',
            last_price: bTicker.last_price,
            price_change_24h: bTicker.price_change_24h,
            price_change_pct_24h: bTicker.price_change_pct_24h,
            price_change_pct_7d: 0,
            high_24h: bTicker.high_24h,
            low_24h: bTicker.low_24h,
            volume_24h: bTicker.volume_24h,
            quote_volume_24h: bTicker.quote_volume_24h,
            market_cap: 0,
            sparkline_7d: [],
            icon_color: base === 'BTC' ? '#F3BA2F' : base === 'ETH' ? '#627EEA' : '#14B8A6',
            is_gainer: bTicker.price_change_pct_24h >= 0,
            updated_at: new Date().toISOString(),
          };
          return [...prev, newTicker];
        }
      });
      // Keep the backend's authoritative price (used for binary strike/settlement) in sync with what's on screen
      api.syncTicker(bTicker).catch(() => {});
    });

    // Subscribe to Binance Sub-Second Trade Stream for instant high-frequency updates
    const unsubBinanceTrade = binanceFeed.onTrade((bTrade) => {
      lastBinanceMsgTime = Date.now();
      setTickers((prev) => {
        const idx = prev.findIndex((t) => t.symbol === bTrade.symbol);
        if (idx >= 0 && prev[idx].last_price !== bTrade.price) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            last_price: bTrade.price,
            updated_at: new Date().toISOString(),
          };
          return next;
        }
        return prev;
      });
    });

    // Subscribe to 1-second authoritative tick synchronization
    const unsubOneSec = binanceFeed.onOneSecondTick((tick) => {
      lastBinanceMsgTime = Date.now();
      setTickers((prev) => {
        const idx = prev.findIndex((t) => t.symbol === tick.symbol);
        if (idx >= 0 && prev[idx].last_price !== tick.price) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            last_price: tick.price,
            updated_at: new Date().toISOString(),
          };
          return next;
        }
        return prev;
      });
    });

    // Subscribe to real-time events from local backend (with intelligent fallback)
    const unsubTicker = wsClient.on<Ticker>('TickerUpdate', (updatedTicker) => {
      // If live Binance stream is actively pushing updates, don't overwrite
      if (binanceFeed.isCryptoPair(updatedTicker.symbol) && binanceFeed.hasRecentLiveTick(updatedTicker.symbol, 2000)) {
        return;
      }
      setTickers((prev) => {
        const idx = prev.findIndex((t) => t.symbol === updatedTicker.symbol);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedTicker;
          return next;
        }
        return [...prev, updatedTicker];
      });
    });

    const unsubDepth = wsClient.on<OrderBookDepth>('DepthUpdate', (updatedDepth) => {
      if (updatedDepth.symbol === currentSymbol) {
        setDepth(updatedDepth);
      }
    });

    const unsubKline = wsClient.on<{ symbol: string; kline: Kline }>('KlineUpdate', ({ symbol, kline }) => {
      if (symbol === currentSymbol) {
        setKlines((prev) => {
          if (prev.length === 0) return [kline];
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (next[lastIdx].time === kline.time) {
            next[lastIdx] = kline;
          } else {
            next.push(kline);
          }
          return next;
        });
      }
    });

    const unsubOrder = wsClient.on<Order>('OrderUpdate', (updatedOrder) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === updatedOrder.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedOrder;
          return next;
        }
        return [updatedOrder, ...prev];
      });
    });

    const unsubPortfolio = wsClient.on<PortfolioSummary>('PortfolioUpdate', (p) => {
      setPortfolio(p);
    });

    return () => {
      unsubBinance();
      unsubBinanceTrade();
      unsubOneSec();
      binanceFeed.disconnect();
      unsubTicker();
      unsubDepth();
      unsubKline();
      unsubOrder();
      unsubPortfolio();
      wsClient.disconnect();
    };
  }, [currentSymbol]);

  const refreshPortfolioOnly = async () => {
    try {
      const pSum = await api.getPortfolio();
      setPortfolio(pSum);
    } catch (err) {
      console.error('Failed to refresh portfolio:', err);
    }
  };

  const fetchAllData = async () => {
    try {
      const [tList, pSum, oList, trList] = await Promise.all([
        api.getTickers(),
        api.getPortfolio(),
        api.getOrders(),
        api.getTrades(),
      ]);
      setTickers((prev) => {
        if (prev.length === 0) return tList;
        return tList.map((t) => {
          const existing = prev.find((p) => p.symbol === t.symbol);
          if (existing && binanceFeed.isCryptoPair(t.symbol) && existing.last_price > 0) {
            return {
              ...t,
              last_price: existing.last_price,
              price_change_24h: existing.price_change_24h,
              price_change_pct_24h: existing.price_change_pct_24h,
              high_24h: existing.high_24h,
              low_24h: existing.low_24h,
              volume_24h: existing.volume_24h,
              quote_volume_24h: existing.quote_volume_24h,
            };
          }
          return t;
        });
      });
      setPortfolio(pSum);
      setOrders(oList);
      setTrades(trList);

      fetchSymbolData(currentSymbol);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const fetchSymbolData = async (symbol: string) => {
    try {
      const [d, k] = await Promise.all([
        api.getDepth(symbol, 15),
        api.getKlines(symbol),
      ]);
      setDepth(d);
      setKlines(k);
    } catch (err) {
      console.error(`Failed to fetch depth/klines for ${symbol}:`, err);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol);
    fetchSymbolData(symbol);
  };

  const [initialTradeMode, setInitialTradeMode] = useState<'SPOT' | 'MARGIN' | 'LEVERAGE'>('SPOT');

  const handleNavigateToTrade = (symbol: string, mode: 'SPOT' | 'MARGIN' | 'LEVERAGE' = 'SPOT') => {
    handleSelectSymbol(symbol);
    setInitialTradeMode(mode);
    setCurrentTab('Trade');
  };

  const handleNavigateToBinary = (symbol: string) => {
    handleSelectSymbol(symbol);
    setCurrentTab('Binary');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'dark bg-[#0B0E14] text-white' : 'bg-[#F4F6F8] text-[#1E293B]'}`}>
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        portfolio={portfolio}
      />

      {/* Main Content View Switcher */}
      <main className="px-6 py-6 transition-colors duration-200">
        {currentTab === 'News' && (
          <NewsView
            tickers={tickers}
            onNavigateToTrade={handleNavigateToTrade}
            isDark={isDark}
          />
        )}

        {currentTab === 'Dashboard' && (
          <DashboardView
            tickers={tickers}
            portfolio={portfolio}
            onNavigateToTrade={handleNavigateToTrade}
            onNavigateToBinary={handleNavigateToBinary}
            onNavigateToNews={() => setCurrentTab('News')}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenSwap={() => setIsSwapOpen(true)}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onRefreshPortfolio={refreshPortfolioOnly}
            isDark={isDark}
          />
        )}

        {currentTab === 'Trade' && (
          <TradeView
            currentSymbol={currentSymbol}
            onSelectSymbol={handleSelectSymbol}
            tickers={tickers}
            depth={depth}
            klines={klines}
            orders={orders}
            trades={trades}
            portfolio={portfolio}
            onRefreshAll={fetchAllData}
            isDark={isDark}
            initialTradingMode={initialTradeMode}
          />
        )}

        {currentTab === 'Binary' && (
          <BinaryView
            tickers={tickers}
            onRefreshPortfolio={refreshPortfolioOnly}
            isDark={isDark}
          />
        )}

        {currentTab === 'Airdrop' && (
          <AirdropView isDark={isDark} />
        )}

        {currentTab === 'IGO' && (
          <IgoView
            tickers={tickers}
            onNavigateToTrade={handleNavigateToTrade}
            isDark={isDark}
          />
        )}

        {currentTab === 'Fundraising' && (
          <FundraisingView
            tickers={tickers}
            onNavigateToTrade={handleNavigateToTrade}
            isDark={isDark}
          />
        )}

        {currentTab === 'Analytics' && (
          <AnalyticsView portfolio={portfolio} isDark={isDark} />
        )}

        {currentTab === 'Glossary' && (
          <GlossaryView isDark={isDark} />
        )}

        {currentTab === 'Portfolio' && (
          <PortfolioView
            portfolio={portfolio}
            tickers={tickers}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onRefreshPortfolio={fetchAllData}
            isDark={isDark}
          />
        )}

        {currentTab === 'Strategy' && (
          <StrategyView
            onNavigateToTrade={handleNavigateToTrade}
            onNavigateToBinary={handleNavigateToBinary}
            isDark={isDark}
          />
        )}

        {currentTab === 'OTC' && (
          <OtcView onSuccessSwap={fetchAllData} isDark={isDark} />
        )}
      </main>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={fetchAllData}
        portfolio={portfolio}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={fetchAllData}
      />
      <SwapModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        onSuccess={fetchAllData}
      />
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={fetchAllData}
        portfolio={portfolio}
      />
    </div>
  );
};
