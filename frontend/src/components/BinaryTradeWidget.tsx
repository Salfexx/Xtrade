import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, Zap, DollarSign, ChevronDown, Target, ArrowUpRight, Layers
} from 'lucide-react';
import { Ticker, BinaryContract, BinaryStats } from '../types';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';
import { binanceFeed } from '../services/binanceFeed';
import { BinaryLiveCanvas } from './BinaryLiveCanvas';

interface BinaryTradeWidgetProps {
  tickers: Ticker[];
  currentSymbol?: string;
  onRefreshPortfolio?: () => void;
  isDark?: boolean;
  isDashboard?: boolean;
  onNavigateToSpotTrade?: (symbol: string) => void;
  onNavigateToMarginTrade?: (symbol: string) => void;
  onNavigateToLeverageTrade?: (symbol: string) => void;
  onNavigateToBinaryTrade?: (symbol: string) => void;
}

const BINARY_PAIRS = [
  { symbol: 'BTC/USDT', name: 'Bitcoin (Crypto)' },
  { symbol: 'GOLD/USD', name: 'Gold XAU (Commodity)' },
  { symbol: 'EURO/USD', name: 'EUR/USD (Forex)' },
  { symbol: 'OIL/USD', name: 'Crude Oil WTI (Commodity)' },
];

export const BinaryTradeWidget: React.FC<BinaryTradeWidgetProps> = ({
  tickers,
  currentSymbol = 'BTC/USDT',
  onRefreshPortfolio,
  isDark = false,
  isDashboard = false,
  onNavigateToSpotTrade,
  onNavigateToMarginTrade,
  onNavigateToLeverageTrade,
  onNavigateToBinaryTrade,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(currentSymbol);
  const [viewExpirySeconds, setViewExpirySeconds] = useState<number>(60); // Default chart view: 1m
  const [betExpirySeconds, setBetExpirySeconds] = useState<number>(10);   // Default bet expiry: 10s
  const [stakeAmount, setStakeAmount] = useState<string>('50');
  const [activeContracts, setActiveContracts] = useState<BinaryContract[]>([]);
  const [stats, setStats] = useState<BinaryStats | null>(null);
  const [isPlacing, setIsPlacing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'win' | 'loss'; title: string; text: string } | null>(null);

  const activeTicker = tickers.find((t) => t.symbol === selectedSymbol) || {
    symbol: selectedSymbol,
    name: selectedSymbol === 'GOLD/USD' ? 'Gold (XAU)' : selectedSymbol === 'EURO/USD' ? 'Euro / USD' : selectedSymbol === 'OIL/USD' ? 'Crude Oil' : 'Bitcoin',
    base_asset: selectedSymbol.split('/')[0],
    quote_asset: selectedSymbol.split('/')[1] || 'USD',
    last_price: selectedSymbol === 'GOLD/USD' ? 2518.40 : selectedSymbol === 'EURO/USD' ? 1.0875 : selectedSymbol === 'OIL/USD' ? 73.65 : 79750.00,
    price_change_pct_24h: 1.5,
  };
  const basePrice = binanceFeed.getLatestPrice(selectedSymbol) || activeTicker?.last_price || (selectedSymbol === 'GOLD/USD' ? 2518.40 : selectedSymbol === 'EURO/USD' ? 1.0875 : selectedSymbol === 'OIL/USD' ? 73.65 : 79750.00);
  const payoutPct = 0.97;

  const formatPrice = (price: number, sym: string = selectedSymbol) => {
    const decimals = sym.includes('EURO') || sym.includes('EUR') || price < 10 ? 4 : 2;
    return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Throttled live price updated directly from Canvas engine (0% React lag)
  const [livePrice, setLivePrice] = useState<number>(basePrice);

  useEffect(() => {
    const initialPrice = binanceFeed.getLatestPrice(selectedSymbol) || basePrice;
    setLivePrice(initialPrice);
  }, [selectedSymbol, basePrice]);

  const handlePriceUpdate = useCallback((p: number) => {
    setLivePrice(p);
  }, []);

  const seenSettledIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Fetch active contracts & stats
  const fetchBinaryData = async () => {
    try {
      const [contracts, binaryStats] = await Promise.all([
        api.getBinaryContracts(),
        api.getBinaryStats(),
      ]);

      const currentActive = contracts.filter((c) => c.status === 'Active');

      if (isInitialLoadRef.current) {
        // On first load, record existing settled contracts so we don't trigger stale alerts
        contracts.forEach((c) => {
          if (c.status !== 'Active') {
            seenSettledIdsRef.current.add(c.id);
          }
        });
        isInitialLoadRef.current = false;
      } else {
        // Check for any newly settled contracts
        const newlySettled = contracts.filter(
          (c) => c.status !== 'Active' && !seenSettledIdsRef.current.has(c.id)
        );

        newlySettled.forEach((c) => {
          seenSettledIdsRef.current.add(c.id);
          if (c.status === 'Profit' || c.status === 'Won') {
            setToastMessage({
              type: 'win',
              title: `🎉 Binary Trade PROFIT (+${(payoutPct * 100).toFixed(0)}%)!`,
              text: `+$${c.payout_usd.toFixed(2)} USDT credited | Exit: $${c.settlement_price?.toFixed(2)} vs Strike: $${c.strike_price.toFixed(2)}`,
            });
          } else if (c.status === 'Tied') {
            setToastMessage({
              type: 'success',
              title: '⚖️ Binary Trade Tied (Refunded)',
              text: `$${c.stake_usd.toFixed(2)} USDT stake refunded at exact strike $${c.strike_price.toFixed(2)}`,
            });
          } else {
            setToastMessage({
              type: 'loss',
              title: 'Trade Expired (Loss)',
              text: `Exit: $${c.settlement_price?.toFixed(2)} vs Strike: $${c.strike_price.toFixed(2)}`,
            });
          }
          setTimeout(() => setToastMessage(null), 5000);
        });
      }

      setActiveContracts(currentActive);
      setStats(binaryStats);
    } catch (e) {
      console.error('Failed to fetch binary data', e);
    }
  };

  useEffect(() => {
    fetchBinaryData();
    const interval = setInterval(fetchBinaryData, 1000);

    // Subscribe to immediate real-time settlement WebSocket events
    const unsubResult = wsClient.on<BinaryContract>('BinaryResult', (settledContract) => {
      if (!seenSettledIdsRef.current.has(settledContract.id)) {
        seenSettledIdsRef.current.add(settledContract.id);
        if (settledContract.status === 'Profit' || settledContract.status === 'Won') {
          setToastMessage({
            type: 'win',
            title: `🎉 Binary Trade PROFIT (+${(payoutPct * 100).toFixed(0)}%)!`,
            text: `+$${settledContract.payout_usd.toFixed(2)} USDT credited | Exit: $${settledContract.settlement_price?.toFixed(2)} vs Strike: $${settledContract.strike_price.toFixed(2)}`,
          });
        } else if (settledContract.status === 'Tied') {
          setToastMessage({
            type: 'success',
            title: '⚖️ Binary Trade Tied (Refunded)',
            text: `$${settledContract.stake_usd.toFixed(2)} USDT stake refunded at exact strike $${settledContract.strike_price.toFixed(2)}`,
          });
        } else {
          setToastMessage({
            type: 'loss',
            title: 'Trade Expired (Loss)',
            text: `Exit: $${settledContract.settlement_price?.toFixed(2)} vs Strike: $${settledContract.strike_price.toFixed(2)}`,
          });
        }
        setTimeout(() => setToastMessage(null), 5000);
      }
      setActiveContracts((prev) => prev.filter((c) => c.id !== settledContract.id));
      fetchBinaryData();
      if (onRefreshPortfolio) onRefreshPortfolio();
    });

    const unsubContract = wsClient.on<BinaryContract>('BinaryContractUpdate', (contract) => {
      if (contract.status === 'Active') {
        setActiveContracts((prev) => {
          if (prev.some((c) => c.id === contract.id)) return prev;
          return [contract, ...prev];
        });
      }
    });

    return () => {
      clearInterval(interval);
      unsubResult();
      unsubContract();
    };
  }, [onRefreshPortfolio]);

  // Place Binary Trade
  const handlePlaceTrade = async (direction: 'Call' | 'Put') => {
    const stake = parseFloat(stakeAmount);
    if (!stake || stake < 1) {
      alert('Please enter a valid stake amount (min $1.00)');
      return;
    }

    setIsPlacing(true);
    try {
      const contract = await api.placeBinaryOrder({
        symbol: selectedSymbol,
        direction,
        stake_usd: stake,
        duration_seconds: betExpirySeconds,
        strike_price: livePrice > 0 ? livePrice : basePrice,
      });

      setActiveContracts((prev) => [contract, ...prev]);
      setToastMessage({
        type: 'success',
        title: `✓ ${direction.toUpperCase()} Order Placed`,
        text: `Strike: $${formatPrice(contract.strike_price)} | Expiry: ${betExpirySeconds}s | Payout: +$${(stake * payoutPct).toFixed(2)}`,
      });
      setTimeout(() => setToastMessage(null), 4000);

      if (onRefreshPortfolio) onRefreshPortfolio();
      fetchBinaryData();
    } catch (err: any) {
      alert(err.message || 'Trade placement failed');
    } finally {
      setIsPlacing(false);
    }
  };

  const formatDurationLabel = (sec: number) => {
    if (sec >= 3600) return `${sec / 3600}H`;
    if (sec >= 60) return `${sec / 60}m`;
    return `${sec}s`;
  };

  return (
    <div className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col justify-between transition-colors relative overflow-hidden space-y-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
          toastMessage.type === 'win'
            ? 'bg-emerald-500 text-white border-emerald-400'
            : toastMessage.type === 'loss'
            ? 'bg-rose-500 text-white border-rose-400'
            : 'bg-[#181E29] text-white border-gray-700'
        }`}>
          <div>
            <span className="font-bold block text-sm">{toastMessage.title}</span>
            <span className="opacity-90">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Header Bar: Asset Selector & Live Tick Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">Binary Options Live Stream</span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] animate-pulse">
              <Zap className="w-3 h-3" />
              LIVE TICK
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div className="relative">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="appearance-none bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] px-3 py-1 pr-8 rounded-xl font-black text-lg text-[#0F172A] dark:text-white focus:outline-none cursor-pointer"
              >
                {BINARY_PAIRS.map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.symbol}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight font-mono">
              ${formatPrice(livePrice, selectedSymbol)}
            </div>

            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              (activeTicker?.price_change_pct_24h || 0) >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]' 
                : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
            }`}>
              {(activeTicker?.price_change_pct_24h || 0) >= 0 ? '▲ +' : '▼ '}
              {(activeTicker?.price_change_pct_24h || 3.1).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* View Expiry Timeframe Pills */}
        <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-gray-400 mr-2 ml-1">View Expiry:</span>
          {[
            { label: '10s', sec: 10 },
            { label: '30s', sec: 30 },
            { label: '1m', sec: 60 },
            { label: '5m', sec: 300 },
            { label: '15m', sec: 900 },
            { label: '30m', sec: 1800 },
            { label: '1H', sec: 3600 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setViewExpirySeconds(item.sec)}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                viewExpirySeconds === item.sec
                  ? 'bg-white dark:bg-[#121722] text-gray-900 dark:text-white shadow-2xs font-black'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* HARDWARE ACCELERATED DIRECT GPU 120 FPS CANVAS LIVE STREAMING ENGINE */}
      <div className={`relative w-full select-none ${isDashboard ? 'h-[380px] md:h-[420px]' : 'h-[450px] md:h-[500px]'}`}>
        <BinaryLiveCanvas
          symbol={selectedSymbol}
          basePrice={basePrice}
          isDark={isDark}
          isDashboard={isDashboard}
          viewExpirySeconds={viewExpirySeconds}
          betExpirySeconds={betExpirySeconds}
          activeContracts={activeContracts}
          onPriceUpdate={handlePriceUpdate}
        />
      </div>

      {/* 3. DEDICATED ACTION BAR: 4 NAVIGATION BUTTONS FOR DASHBOARD (SPOT, MARGIN, LEVERAGE, BINARY) */}
      {isDashboard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-0.5">
          {/* Button 1: SPOT TRADE */}
          <button
            onClick={() => onNavigateToSpotTrade && onNavigateToSpotTrade(selectedSymbol)}
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center font-bold shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 block leading-tight">
                  SPOT TRADE
                </span>
                <span className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-400/80">
                  1:1 Direct Cash
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Button 2: MARGIN TRADE (IN THE MIDDLE) */}
          <button
            onClick={() => onNavigateToMarginTrade && onNavigateToMarginTrade(selectedSymbol)}
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center font-bold shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 block leading-tight">
                  MARGIN TRADE
                </span>
                <span className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-400/80">
                  2x-10x Borrow Power
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Button 3: LEVERAGE TRADE */}
          <button
            onClick={() => onNavigateToLeverageTrade && onNavigateToLeverageTrade(selectedSymbol)}
            className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/50 hover:border-teal-400 dark:hover:border-teal-600 transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 flex items-center justify-center font-bold shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-teal-950 dark:text-teal-300 block leading-tight">
                  LEVERAGE TRADE
                </span>
                <span className="text-[10px] font-semibold text-teal-700/80 dark:text-teal-400/80">
                  Up to 100x Multiplier
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Button 4: TRADE BINARY */}
          <button
            onClick={() => onNavigateToBinaryTrade && onNavigateToBinaryTrade(selectedSymbol)}
            className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-purple-950 dark:text-purple-300 block leading-tight">
                  TRADE BINARY
                </span>
                <span className="text-[10px] font-semibold text-purple-700/80 dark:text-purple-400/80">
                  Fixed 97% Payout
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      ) : (
        <>
          {/* Full Binary Execution Bar (For dedicated Binary View) */}
          <div className="bg-[#181E29] dark:bg-[#0B0E14] text-white rounded-xl px-4 py-2.5 shadow-md border border-gray-700 dark:border-gray-800 transition-all">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left info: Expiry & Strike Price */}
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    <span>Expiry: {formatDurationLabel(betExpirySeconds)}</span>
                    <span className="text-[#10B981] font-bold bg-[#10B981]/20 px-1.5 py-0.5 rounded text-[10px]">
                      {(payoutPct * 100).toFixed(0)}% Payout
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-base font-black font-mono tracking-tight text-white">${formatPrice(livePrice, selectedSymbol)}</span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase">{activeTicker?.base_asset}</span>
                  </div>
                </div>

                {/* Quick Stake Preset Selector */}
                <div className="flex items-center gap-1 bg-gray-800/80 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
                  {['1', '5', '10', '20', '30', '50', '100', '200', '500', '1000', '2000', '5000', '10000'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setStakeAmount(amt)}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                        stakeAmount === amt
                          ? 'bg-[#10B981] text-white shadow-2xs font-black'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Center: Expiry Selector & Profit Return Badge */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex items-center bg-gray-900/90 border border-gray-700 hover:border-gray-600 rounded-xl px-3 py-1.5 transition-all">
                  {/* Left: Expiry Duration Dropdown */}
                  <div className="relative flex items-center pr-2.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                    <select
                      value={betExpirySeconds}
                      onChange={(e) => setBetExpirySeconds(Number(e.target.value))}
                      className="bg-transparent text-white font-mono font-bold text-sm outline-none cursor-pointer appearance-none pr-4"
                    >
                      <option value={10} className="bg-[#161B26] text-white font-mono">10s</option>
                      <option value={30} className="bg-[#161B26] text-white font-mono">30s</option>
                      <option value={60} className="bg-[#161B26] text-white font-mono">1m</option>
                      <option value={300} className="bg-[#161B26] text-white font-mono">5m</option>
                      <option value={900} className="bg-[#161B26] text-white font-mono">15m</option>
                      <option value={1800} className="bg-[#161B26] text-white font-mono">30m</option>
                      <option value={3600} className="bg-[#161B26] text-white font-mono">1H</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 pointer-events-none" />
                  </div>

                  {/* Right: Est Profit (dynamically derived from selected stake) */}
                  <div className="text-right pl-3 border-l border-gray-700 leading-tight">
                    <span className="text-[10px] text-gray-400 block font-medium">Est. Profit</span>
                    <span className="text-[#10B981] font-mono text-xs font-black">
                      +${((parseFloat(stakeAmount) || 0) * payoutPct).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Call & Put Action Buttons (Length increased by 25%) */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handlePlaceTrade('Call')}
                  disabled={isPlacing}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3 min-w-[155px] bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer tracking-wide"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>+{(payoutPct * 100).toFixed(2)}% ▲ Call</span>
                </button>

                <button
                  onClick={() => handlePlaceTrade('Put')}
                  disabled={isPlacing}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3 min-w-[155px] bg-[#EF4444] hover:bg-rose-600 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer tracking-wide"
                >
                  <TrendingDown className="w-5 h-5" />
                  <span>{(payoutPct * 100).toFixed(2)}% ▼ Put</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Binary Positions Live Ticker */}
          {activeContracts.length > 0 && (
            <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#232B3B] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0B3B3C] dark:text-[#14B8A6] animate-spin" />
                  Active Binary Contracts ({activeContracts.length})
                </span>
                <span className="text-gray-400 text-[11px]">Real-time tick tracking</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeContracts.map((c) => {
                  const isCall = c.direction === 'Call';
                  const isITM = isCall ? livePrice > c.strike_price : livePrice < c.strike_price;
                  const remainingSec = Math.max(0, Math.floor((new Date(c.expires_at).getTime() - Date.now()) / 1000));

                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                        remainingSec === 0
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-xs'
                          : isITM
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700 shadow-xs'
                          : 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                          isCall ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                        }`}>
                          {c.direction.toUpperCase()}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">${formatPrice(c.strike_price, c.symbol)}</span>
                        <span className="text-gray-400 text-[10px]">(${c.stake_usd})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`font-black text-[11px] ${
                          remainingSec === 0 ? 'text-amber-500' : isITM ? 'text-[#10B981]' : 'text-[#EF4444]'
                        }`}>
                          {remainingSec === 0 ? 'SETTLING RESULT' : isITM ? 'IN THE MONEY (ITM)' : 'OUT OF MONEY (OTM)'}
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          remainingSec === 0 
                            ? 'bg-amber-500/20 text-amber-500 animate-pulse' 
                            : 'bg-white/70 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          {remainingSec === 0 ? '0s' : `${remainingSec}s`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
