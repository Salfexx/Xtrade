import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, ChevronDown, 
  ArrowDownToLine, ArrowUpRight as ArrowUpIcon, ArrowDownUp, ArrowRightLeft,
  Search, Star, Zap, BarChart2, MoreHorizontal, Flame, ArrowUpRight, Newspaper,
  ChevronLeft, ChevronRight, Pause, Play
} from 'lucide-react';
import { Ticker, PortfolioSummary } from '../types';
import { Sparkline } from '../components/Sparkline';
import { BinaryTradeWidget } from '../components/BinaryTradeWidget';

interface DashboardViewProps {
  tickers: Ticker[];
  portfolio: PortfolioSummary | null;
  onNavigateToTrade: (symbol: string, mode?: 'SPOT' | 'MARGIN' | 'LEVERAGE') => void;
  onNavigateToBinary: (symbol: string) => void;
  onNavigateToNews?: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenSwap: () => void;
  onOpenTransfer: () => void;
  onRefreshPortfolio: () => void;
  isDark?: boolean;
}

const TODAY_SHORT_NEWS = [
  {
    id: 'n1',
    category: '🔥 HIGH IMPACT',
    categoryClass: 'text-[#10B981] bg-emerald-50 dark:bg-emerald-950/60',
    time: '12m ago',
    title: 'Bitcoin Spot ETF Inflows Break Records With $1.2B Added in 48 Hours',
    summary: 'Institutional treasury accumulation accelerates across major regulated funds.',
    source: 'Bloomberg Crypto',
    sentiment: '▲ Bullish',
    sentimentClass: 'text-[#10B981]',
  },
  {
    id: 'n2',
    category: '⚡ L2 SCALING',
    categoryClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60',
    time: '34m ago',
    title: 'Ethereum Layer-2 TVL Crosses $42B as Rollup Gas Costs Plunge 90%',
    summary: 'Active on-chain addresses reach multi-month highs across Arbitrum and Base.',
    source: 'The Block',
    sentiment: '▲ Bullish',
    sentimentClass: 'text-[#10B981]',
  },
  {
    id: 'n3',
    category: '🌐 MACRO FED',
    categoryClass: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60',
    time: '1h ago',
    title: 'Federal Reserve Hints at Rate Easing as Benchmark Inflation Cools',
    summary: 'Derivatives markets price in 82% likelihood of policy easing in upcoming assembly.',
    source: 'Reuters Financial',
    sentiment: '● Neutral',
    sentimentClass: 'text-amber-500',
  },
  {
    id: 'n4',
    category: '⚖️ REGULATION',
    categoryClass: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60',
    time: '1.5h ago',
    title: 'SEC Finalizes Comprehensive Staking Rules for Regulated Custodians',
    summary: 'New clarity allows registered financial institutions to offer compliant liquid staking.',
    source: 'CoinDesk',
    sentiment: '● Neutral',
    sentimentClass: 'text-teal-500',
  },
  {
    id: 'n5',
    category: '🤖 AI & WEB3',
    categoryClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60',
    time: '2h ago',
    title: 'Decentralized AI Compute Clusters Experience 300% Quarterly Expansion',
    summary: 'Protocols aggregating sovereign GPU data centers report massive throughput surge.',
    source: 'Decrypt',
    sentiment: '▲ Bullish',
    sentimentClass: 'text-[#10B981]',
  },
  {
    id: 'n6',
    category: '🔒 ZK PROOFS',
    categoryClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
    time: '2.5h ago',
    title: 'Cross-Chain Liquidity Protocols Enable Sub-Second Atomic Swaps',
    summary: 'Zero-knowledge verification eliminates reliance on centralized bridge multisigs.',
    source: 'CoinTelegraph',
    sentiment: '▲ Bullish',
    sentimentClass: 'text-[#10B981]',
  },
];

export type MarketCategory = 
  | 'All' 
  | 'Favorites'
  | 'Spot' 
  | 'Gainers' 
  | 'High Volume'
  | 'Layer-1 Protocols'
  | 'Layer-2 Solutions'
  | 'Application Layer'
  | 'AI and Big Data'
  | 'Payment Cryptocurrencies'
  | 'Smart Contracts'
  | 'Memecoins'
  | 'Utility & Governance Tokens'
  | 'Decentralized Finance (DeFi)'
  | 'Privacy Coins'
  | 'Real-World Asset (RWA) Tokens'
  | 'Stablecoins';

const MARKET_CATEGORY_TABS: { id: MarketCategory; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Favorites', label: '⭐ Favorites' },
  { id: 'Spot', label: 'Spot' },
  { id: 'Gainers', label: 'Gainers' },
  { id: 'High Volume', label: 'High Volume' },
  { id: 'Layer-1 Protocols', label: 'Layer-1 Protocols' },
  { id: 'Layer-2 Solutions', label: 'Layer-2 Solutions' },
  { id: 'Application Layer', label: 'Application Layer' },
  { id: 'AI and Big Data', label: 'AI and Big Data' },
  { id: 'Payment Cryptocurrencies', label: 'Payment Cryptocurrencies' },
  { id: 'Smart Contracts', label: 'Smart Contracts' },
  { id: 'Memecoins', label: 'Memecoins' },
  { id: 'Utility & Governance Tokens', label: 'Utility & Governance Tokens' },
  { id: 'Decentralized Finance (DeFi)', label: 'Decentralized Finance (DeFi)' },
  { id: 'Privacy Coins', label: 'Privacy Coins' },
  { id: 'Real-World Asset (RWA) Tokens', label: 'Real-World Asset (RWA) Tokens' },
  { id: 'Stablecoins', label: 'Stablecoins' },
];

const ASSET_SECTOR_TAGS: Record<string, MarketCategory[]> = {
  // Layer-1 Protocols
  BTC: ['Layer-1 Protocols', 'Payment Cryptocurrencies'],
  ETH: ['Layer-1 Protocols', 'Smart Contracts', 'Decentralized Finance (DeFi)'],
  SOL: ['Layer-1 Protocols', 'Smart Contracts', 'Decentralized Finance (DeFi)'],
  BNB: ['Layer-1 Protocols', 'Smart Contracts', 'Utility & Governance Tokens'],
  ADA: ['Layer-1 Protocols', 'Smart Contracts'],
  AVAX: ['Layer-1 Protocols', 'Smart Contracts', 'Decentralized Finance (DeFi)'],
  SUI: ['Layer-1 Protocols', 'Smart Contracts'],
  APT: ['Layer-1 Protocols', 'Smart Contracts'],
  DOT: ['Layer-1 Protocols', 'Smart Contracts', 'Utility & Governance Tokens'],
  ATOM: ['Layer-1 Protocols', 'Smart Contracts'],
  NEAR: ['Layer-1 Protocols', 'AI and Big Data', 'Smart Contracts'],

  // Layer-2 Solutions
  ARB: ['Layer-2 Solutions', 'Utility & Governance Tokens', 'Decentralized Finance (DeFi)'],
  OP: ['Layer-2 Solutions', 'Utility & Governance Tokens'],
  MATIC: ['Layer-2 Solutions', 'Smart Contracts', 'Decentralized Finance (DeFi)'],
  POL: ['Layer-2 Solutions', 'Smart Contracts', 'Decentralized Finance (DeFi)'],
  STRK: ['Layer-2 Solutions', 'Privacy Coins', 'Smart Contracts'],
  IMX: ['Layer-2 Solutions', 'Application Layer'],
  MANTA: ['Layer-2 Solutions', 'Privacy Coins', 'Decentralized Finance (DeFi)'],

  // Application Layer / Gaming / Metaverse / Social
  GALA: ['Application Layer'],
  AXS: ['Application Layer', 'Decentralized Finance (DeFi)'],
  SAND: ['Application Layer'],
  MANA: ['Application Layer'],
  CHZ: ['Application Layer', 'Utility & Governance Tokens'],
  YGG: ['Application Layer'],

  // AI and Big Data
  FET: ['AI and Big Data', 'Smart Contracts'],
  RENDER: ['AI and Big Data', 'Application Layer'],
  TAO: ['AI and Big Data', 'Layer-1 Protocols'],
  GRT: ['AI and Big Data', 'Utility & Governance Tokens'],
  WLD: ['AI and Big Data', 'Application Layer'],

  // Payment Cryptocurrencies
  XRP: ['Payment Cryptocurrencies'],
  LTC: ['Payment Cryptocurrencies', 'Layer-1 Protocols'],
  BCH: ['Payment Cryptocurrencies', 'Layer-1 Protocols'],
  XLM: ['Payment Cryptocurrencies'],
  KAS: ['Payment Cryptocurrencies', 'Layer-1 Protocols'],

  // Memecoins
  DOGE: ['Memecoins', 'Payment Cryptocurrencies', 'Layer-1 Protocols'],
  SHIB: ['Memecoins', 'Decentralized Finance (DeFi)'],
  PEPE: ['Memecoins'],
  WIF: ['Memecoins'],
  BONK: ['Memecoins'],
  FLOKI: ['Memecoins'],

  // Utility & Governance Tokens
  UNI: ['Utility & Governance Tokens', 'Decentralized Finance (DeFi)', 'Application Layer'],
  AAVE: ['Utility & Governance Tokens', 'Decentralized Finance (DeFi)'],
  MKR: ['Utility & Governance Tokens', 'Decentralized Finance (DeFi)', 'Real-World Asset (RWA) Tokens'],
  CRV: ['Utility & Governance Tokens', 'Decentralized Finance (DeFi)'],
  LDO: ['Utility & Governance Tokens', 'Decentralized Finance (DeFi)'],

  // Decentralized Finance (DeFi)
  LINK: ['Decentralized Finance (DeFi)', 'Utility & Governance Tokens', 'Smart Contracts'],
  SNX: ['Decentralized Finance (DeFi)'],
  PENDLE: ['Decentralized Finance (DeFi)', 'Real-World Asset (RWA) Tokens'],
  INJ: ['Decentralized Finance (DeFi)', 'Layer-1 Protocols'],
  DYDX: ['Decentralized Finance (DeFi)', 'Layer-1 Protocols'],

  // Privacy Coins
  XMR: ['Privacy Coins', 'Payment Cryptocurrencies', 'Layer-1 Protocols'],
  ZEC: ['Privacy Coins', 'Payment Cryptocurrencies'],
  DASH: ['Privacy Coins', 'Payment Cryptocurrencies'],
  ROSE: ['Privacy Coins', 'Smart Contracts', 'Layer-1 Protocols'],
  SCRT: ['Privacy Coins', 'Smart Contracts'],

  // Real-World Asset (RWA) Tokens
  ONDO: ['Real-World Asset (RWA) Tokens', 'Decentralized Finance (DeFi)'],
  CFG: ['Real-World Asset (RWA) Tokens', 'Decentralized Finance (DeFi)'],
  RIO: ['Real-World Asset (RWA) Tokens'],

  // Stablecoins
  USDT: ['Stablecoins', 'Payment Cryptocurrencies'],
  USDC: ['Stablecoins', 'Payment Cryptocurrencies'],
  DAI: ['Stablecoins', 'Decentralized Finance (DeFi)'],
  FDUSD: ['Stablecoins'],
  USDE: ['Stablecoins', 'Decentralized Finance (DeFi)'],
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickers,
  portfolio,
  onNavigateToTrade,
  onNavigateToBinary,
  onNavigateToNews,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSwap,
  onOpenTransfer,
  onRefreshPortfolio,
  isDark = false,
}) => {
  const [marketCategory, setMarketCategory] = useState<MarketCategory>('All');
  const [marketSearch, setMarketSearch] = useState('');
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('xtrade_favorite_symbols');
      return saved ? JSON.parse(saved) : ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'NEAR/USDT', 'DOGE/USDT'];
    } catch {
      return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'NEAR/USDT', 'DOGE/USDT'];
    }
  });

  const toggleFavorite = (sym: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteSymbols((prev) => {
      const next = prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym];
      try {
        localStorage.setItem('xtrade_favorite_symbols', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [newsIndex, setNewsIndex] = useState(0);
  const [isNewsPaused, setIsNewsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-slide news every 1.5 seconds (sliding previous news to the left)
  useEffect(() => {
    if (isNewsPaused) return;
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % TODAY_SHORT_NEWS.length);
    }, 1500);

    return () => clearInterval(timer);
  }, [isNewsPaused]);

  const handlePrevNews = () => {
    setNewsIndex((prev) => (prev - 1 + TODAY_SHORT_NEWS.length) % TODAY_SHORT_NEWS.length);
  };

  const handleNextNews = () => {
    setNewsIndex((prev) => (prev + 1) % TODAY_SHORT_NEWS.length);
  };

  const visibleNews = [
    TODAY_SHORT_NEWS[newsIndex % TODAY_SHORT_NEWS.length],
    TODAY_SHORT_NEWS[(newsIndex + 1) % TODAY_SHORT_NEWS.length],
    TODAY_SHORT_NEWS[(newsIndex + 2) % TODAY_SHORT_NEWS.length],
  ];

  const btcTicker = tickers.find((t) => t.symbol === 'BTC/USDT') || tickers[0];
  const ltcTicker = tickers.find((t) => t.symbol === 'LTC/USDT');
  const xrpTicker = tickers.find((t) => t.symbol === 'XRP/USDT');
  const ethTicker = tickers.find((t) => t.symbol === 'ETH/USDT');

  // Live Dynamic Portfolio Balance calculated in real-time from Binance price ticks
  const liveTotalEquity = useMemo(() => {
    if (!portfolio?.balances) return portfolio?.total_equity_usd || 102540;
    return portfolio.balances.reduce((acc, b) => {
      if (b.asset === 'USDT') return acc + b.total;
      const sym = `${b.asset}/USDT`;
      const t = tickers.find((tick) => tick.symbol === sym) || tickers.find((tick) => tick.base_asset === b.asset);
      const price = t ? t.last_price : (b.usd_value > 0 ? b.usd_value / b.total : 0);
      return acc + (b.total * price);
    }, 0);
  }, [portfolio, tickers]);

  // Top Assets List (100% Live from Binance Stream)
  const topAssets = useMemo(() => {
    const majorSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT'];
    return majorSymbols
      .map((sym) => {
        const t = tickers.find((tick) => tick.symbol === sym);
        if (!t) return null;
        const isPos = t.price_change_pct_24h >= 0;
        return {
          name: t.name,
          symbol: t.base_asset,
          pair: t.symbol,
          price: t.last_price >= 1 ? `$${t.last_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${t.last_price.toFixed(4)}`,
          dynamic: `${isPos ? '+' : ''}${t.price_change_pct_24h.toFixed(2)}%`,
          isPos,
          iconBg: t.icon_color || '#3B82F6',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [tickers]);

  // Top Gainers List (Sorted in real-time by 24h % gain, Crypto Only)
  const topGainers = useMemo(() => {
    return [...tickers]
      .filter((t) => !['GOLD/USD', 'EURO/USD', 'OIL/USD'].includes(t.symbol))
      .sort((a, b) => b.price_change_pct_24h - a.price_change_pct_24h)
      .slice(0, 7)
      .map((t, idx) => {
        const capFormatted = t.market_cap >= 1_000_000_000 
          ? `$${(t.market_cap / 1_000_000_000).toFixed(1)}B`
          : `$${(t.market_cap / 1_000_000).toFixed(1)}M`;
        return {
          coin: t.base_asset,
          pair: t.symbol,
          cap: capFormatted,
          price: t.last_price >= 1 ? `$${t.last_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${t.last_price.toFixed(4)}`,
          dynamic: `${t.price_change_pct_24h >= 0 ? '+' : ''}${t.price_change_pct_24h.toFixed(2)}%`,
          isStar: idx % 2 === 0,
          iconColor: t.icon_color || '#10B981',
        };
      });
  }, [tickers]);

  // Sector Supplementary Coins
  const supplementaryTickers: Ticker[] = useMemo(() => [
    {
      symbol: 'ARB/USDT',
      name: 'Arbitrum',
      base_asset: 'ARB',
      quote_asset: 'USDT',
      last_price: 0.584,
      price_change_24h: 0.024,
      price_change_pct_24h: 4.28,
      price_change_pct_7d: 8.50,
      high_24h: 0.612,
      low_24h: 0.554,
      volume_24h: 18500000,
      quote_volume_24h: 10800000,
      market_cap: 1950000000,
      icon_color: '#28A0F0',
      sparkline_7d: [0.52, 0.54, 0.55, 0.56, 0.58, 0.584],
    },
    {
      symbol: 'OP/USDT',
      name: 'Optimism',
      base_asset: 'OP',
      quote_asset: 'USDT',
      last_price: 1.482,
      price_change_24h: 0.062,
      price_change_pct_24h: 4.37,
      price_change_pct_7d: 6.90,
      high_24h: 1.540,
      low_24h: 1.410,
      volume_24h: 9200000,
      quote_volume_24h: 13600000,
      market_cap: 1780000000,
      icon_color: '#FF0420',
      sparkline_7d: [1.38, 1.41, 1.43, 1.45, 1.482],
    },
    {
      symbol: 'RENDER/USDT',
      name: 'Render Network',
      base_asset: 'RENDER',
      quote_asset: 'USDT',
      last_price: 6.24,
      price_change_24h: 0.48,
      price_change_pct_24h: 8.33,
      price_change_pct_7d: 14.20,
      high_24h: 6.45,
      low_24h: 5.72,
      volume_24h: 5400000,
      quote_volume_24h: 33700000,
      market_cap: 3240000000,
      icon_color: '#E53E3E',
      sparkline_7d: [5.4, 5.7, 5.9, 6.1, 6.24],
    },
    {
      symbol: 'TAO/USDT',
      name: 'Bittensor',
      base_asset: 'TAO',
      quote_asset: 'USDT',
      last_price: 342.50,
      price_change_24h: 24.10,
      price_change_pct_24h: 7.57,
      price_change_pct_7d: 18.40,
      high_24h: 355.00,
      low_24h: 315.00,
      volume_24h: 340000,
      quote_volume_24h: 116450000,
      market_cap: 2530000000,
      icon_color: '#1E293B',
      sparkline_7d: [290, 310, 325, 335, 342.5],
    },
    {
      symbol: 'NEAR/USDT',
      name: 'NEAR Protocol',
      base_asset: 'NEAR',
      quote_asset: 'USDT',
      last_price: 4.85,
      price_change_24h: 0.22,
      price_change_pct_24h: 4.75,
      price_change_pct_7d: 11.20,
      high_24h: 4.98,
      low_24h: 4.58,
      volume_24h: 14200000,
      quote_volume_24h: 68870000,
      market_cap: 5850000000,
      icon_color: '#000000',
      sparkline_7d: [4.3, 4.5, 4.6, 4.75, 4.85],
    },
    {
      symbol: 'SHIB/USDT',
      name: 'Shiba Inu',
      base_asset: 'SHIB',
      quote_asset: 'USDT',
      last_price: 0.00001425,
      price_change_24h: 0.00000085,
      price_change_pct_24h: 6.34,
      price_change_pct_7d: 12.80,
      high_24h: 0.00001490,
      low_24h: 0.00001330,
      volume_24h: 14200000000000,
      quote_volume_24h: 202350000,
      market_cap: 8390000000,
      icon_color: '#FFA409',
      sparkline_7d: [0.000012, 0.000013, 0.0000135, 0.00001425],
    },
    {
      symbol: 'PEPE/USDT',
      name: 'Pepe',
      base_asset: 'PEPE',
      quote_asset: 'USDT',
      last_price: 0.00000892,
      price_change_24h: 0.00000094,
      price_change_pct_24h: 11.78,
      price_change_pct_7d: 22.40,
      high_24h: 0.00000940,
      low_24h: 0.00000785,
      volume_24h: 38000000000000,
      quote_volume_24h: 338960000,
      market_cap: 3750000000,
      icon_color: '#479F53',
      sparkline_7d: [0.000007, 0.0000078, 0.0000084, 0.00000892],
    },
    {
      symbol: 'AAVE/USDT',
      name: 'Aave',
      base_asset: 'AAVE',
      quote_asset: 'USDT',
      last_price: 138.40,
      price_change_24h: 6.80,
      price_change_pct_24h: 5.17,
      price_change_pct_7d: 19.80,
      high_24h: 142.50,
      low_24h: 129.80,
      volume_24h: 1420000,
      quote_volume_24h: 196528000,
      market_cap: 2060000000,
      icon_color: '#B6509E',
      sparkline_7d: [115, 122, 128, 134, 138.4],
    },
    {
      symbol: 'UNI/USDT',
      name: 'Uniswap',
      base_asset: 'UNI',
      quote_asset: 'USDT',
      last_price: 7.45,
      price_change_24h: 0.38,
      price_change_pct_24h: 5.37,
      price_change_pct_7d: 9.10,
      high_24h: 7.70,
      low_24h: 6.98,
      volume_24h: 18500000,
      quote_volume_24h: 137825000,
      market_cap: 4470000000,
      icon_color: '#FF007A',
      sparkline_7d: [6.8, 7.0, 7.2, 7.35, 7.45],
    },
    {
      symbol: 'LINK/USDT',
      name: 'Chainlink',
      base_asset: 'LINK',
      quote_asset: 'USDT',
      last_price: 11.95,
      price_change_24h: 0.55,
      price_change_pct_24h: 4.82,
      price_change_pct_7d: 8.60,
      high_24h: 12.30,
      low_24h: 11.25,
      volume_24h: 16400000,
      quote_volume_24h: 195980000,
      market_cap: 7260000000,
      icon_color: '#375BD2',
      sparkline_7d: [10.9, 11.2, 11.5, 11.8, 11.95],
    },
    {
      symbol: 'ONDO/USDT',
      name: 'Ondo Finance',
      base_asset: 'ONDO',
      quote_asset: 'USDT',
      last_price: 0.742,
      price_change_24h: 0.045,
      price_change_pct_24h: 6.46,
      price_change_pct_7d: 14.50,
      high_24h: 0.775,
      low_24h: 0.692,
      volume_24h: 84000000,
      quote_volume_24h: 62328000,
      market_cap: 1030000000,
      icon_color: '#002B49',
      sparkline_7d: [0.64, 0.68, 0.71, 0.73, 0.742],
    },
    {
      symbol: 'XMR/USDT',
      name: 'Monero',
      base_asset: 'XMR',
      quote_asset: 'USDT',
      last_price: 154.20,
      price_change_24h: 3.40,
      price_change_pct_24h: 2.25,
      price_change_pct_7d: 4.80,
      high_24h: 157.00,
      low_24h: 150.20,
      volume_24h: 420000,
      quote_volume_24h: 64764000,
      market_cap: 2840000000,
      icon_color: '#FF6600',
      sparkline_7d: [147, 149, 151, 153, 154.2],
    },
    {
      symbol: 'USDC/USDT',
      name: 'USD Coin',
      base_asset: 'USDC',
      quote_asset: 'USDT',
      last_price: 1.0001,
      price_change_24h: 0.0001,
      price_change_pct_24h: 0.01,
      price_change_pct_7d: 0.02,
      high_24h: 1.0005,
      low_24h: 0.9998,
      volume_24h: 840000000,
      quote_volume_24h: 840084000,
      market_cap: 34500000000,
      icon_color: '#2775CA',
      sparkline_7d: [1.0, 1.0001, 1.0, 1.0001],
    },
    {
      symbol: 'GALA/USDT',
      name: 'GALA Games',
      base_asset: 'GALA',
      quote_asset: 'USDT',
      last_price: 0.0224,
      price_change_24h: 0.0016,
      price_change_pct_24h: 7.69,
      price_change_pct_7d: 13.50,
      high_24h: 0.0238,
      low_24h: 0.0205,
      volume_24h: 1250000000,
      quote_volume_24h: 28000000,
      market_cap: 810000000,
      icon_color: '#10172A',
      sparkline_7d: [0.019, 0.0205, 0.0215, 0.0224],
    },
  ].map((item) => ({
    ...item,
    is_gainer: item.price_change_24h >= 0,
    updated_at: new Date().toISOString(),
  })), []);

  // Filtered Market Tickers Screener (Crypto Only Across All 16 Sectors)
  const filteredMarketTickers = useMemo(() => {
    // Combine base live tickers with supplementary tickers (without duplicates)
    const existingSymbols = new Set(tickers.map(t => t.symbol));
    const allAvailableTickers = [
      ...tickers.filter((t) => !['GOLD/USD', 'EURO/USD', 'OIL/USD'].includes(t.symbol)),
      ...supplementaryTickers.filter(st => !existingSymbols.has(st.symbol)),
    ];

    return allAvailableTickers.filter((t) => {
      const matchesSearch = t.symbol.toLowerCase().includes(marketSearch.toLowerCase()) || t.name.toLowerCase().includes(marketSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (marketCategory === 'All') return true;
      if (marketCategory === 'Favorites') return favoriteSymbols.includes(t.symbol);
      if (marketCategory === 'Spot') return !t.symbol.includes('PERP');
      if (marketCategory === 'Gainers') return t.price_change_pct_24h > 2.0;
      if (marketCategory === 'High Volume') return t.quote_volume_24h > 10_000_000 || t.volume_24h > 5000;

      // Sector Multi-Tag Matching
      const tags = ASSET_SECTOR_TAGS[t.base_asset] || [];
      return tags.includes(marketCategory);
    });
  }, [tickers, supplementaryTickers, marketCategory, marketSearch, favoriteSymbols]);

  return (
    <div className="space-y-4 max-w-[1680px] mx-auto pb-12">
      {/* Top Row: 4 Metric Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Bitcoin */}
          <div 
            onClick={() => onNavigateToTrade('BTC/USDT')}
            className="bg-white dark:bg-[#161B26] rounded-xl py-2.5 px-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow card-hover cursor-pointer transition-colors flex items-center justify-between gap-2"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#0F172A] dark:text-white">Bitcoin</span>
                <span className="text-[10px] font-bold text-gray-400">BTC</span>
              </div>
              <div className="text-base font-black text-[#0F172A] dark:text-white tracking-tight font-mono mt-0.5">
                ${btcTicker ? btcTicker.last_price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '65,420.00'}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md font-black text-[11px] ${
                (btcTicker?.price_change_pct_24h ?? 0) >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
              }`}>
                {(btcTicker?.price_change_pct_24h ?? 0) >= 0 ? '▲ +' : '▼ '}{btcTicker ? btcTicker.price_change_pct_24h.toFixed(2) : '2.89'}%
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">24h Change</span>
            </div>
          </div>

          {/* Card 2: Litecoin */}
          <div 
            onClick={() => onNavigateToTrade('LTC/USDT')}
            className="bg-white dark:bg-[#161B26] rounded-xl py-2.5 px-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow card-hover cursor-pointer transition-colors flex items-center justify-between gap-2"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#0F172A] dark:text-white">Litecoin</span>
                <span className="text-[10px] font-bold text-gray-400">LTC</span>
              </div>
              <div className="text-base font-black text-[#0F172A] dark:text-white tracking-tight font-mono mt-0.5">
                ${ltcTicker ? ltcTicker.last_price.toFixed(2) : '68.20'}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md font-black text-[11px] ${
                (ltcTicker?.price_change_pct_24h ?? 0) >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
              }`}>
                {(ltcTicker?.price_change_pct_24h ?? 0) >= 0 ? '▲ +' : '▼ '}{ltcTicker ? ltcTicker.price_change_pct_24h.toFixed(2) : '2.17'}%
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">24h Change</span>
            </div>
          </div>

          {/* Card 3: Ripple */}
          <div 
            onClick={() => onNavigateToTrade('XRP/USDT')}
            className="bg-white dark:bg-[#161B26] rounded-xl py-2.5 px-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow card-hover cursor-pointer transition-colors flex items-center justify-between gap-2"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#0F172A] dark:text-white">Ripple</span>
                <span className="text-[10px] font-bold text-gray-400">XRP</span>
              </div>
              <div className="text-base font-black text-[#0F172A] dark:text-white tracking-tight font-mono mt-0.5">
                ${xrpTicker ? (xrpTicker.last_price < 1 ? xrpTicker.last_price.toFixed(4) : xrpTicker.last_price.toFixed(2)) : '0.5840'}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md font-black text-[11px] ${
                (xrpTicker?.price_change_pct_24h ?? 0) >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
              }`}>
                {(xrpTicker?.price_change_pct_24h ?? 0) >= 0 ? '▲ +' : '▼ '}{xrpTicker ? xrpTicker.price_change_pct_24h.toFixed(2) : '3.18'}%
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">24h Change</span>
            </div>
          </div>

          {/* Card 4: Ethereum */}
          <div 
            onClick={() => onNavigateToTrade('ETH/USDT')}
            className="bg-white dark:bg-[#161B26] rounded-xl py-2.5 px-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow card-hover cursor-pointer transition-colors flex items-center justify-between gap-2"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#0F172A] dark:text-white">Ethereum</span>
                <span className="text-[10px] font-bold text-gray-400">ETH</span>
              </div>
              <div className="text-base font-black text-[#0F172A] dark:text-white tracking-tight font-mono mt-0.5">
                ${ethTicker ? ethTicker.last_price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '3,485.75'}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md font-black text-[11px] ${
                (ethTicker?.price_change_pct_24h ?? 0) >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
              }`}>
                {(ethTicker?.price_change_pct_24h ?? 0) >= 0 ? '▲ +' : '▼ '}{ethTicker ? ethTicker.price_change_pct_24h.toFixed(2) : '2.42'}%
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">24h Change</span>
            </div>
          </div>
        </div>

          {/* Today's 24H Key Market News (1.5s Auto-Sliding Rotating Ticker) */}
          <div 
            onMouseEnter={() => setIsNewsPaused(true)}
            onMouseLeave={() => setIsNewsPaused(false)}
            className="bg-white dark:bg-[#161B26] rounded-xl py-2 px-3.5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors relative"
          >
            {/* Header with Title & View All Link */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#F1F5F9] dark:border-[#232B3B]">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-rose-50 dark:bg-rose-950/50 text-rose-500 rounded-md">
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#0F172A] dark:text-white">Today's Key Market News (24h)</span>
                  <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    1.5s Auto-Rotate
                  </span>
                  {isNewsPaused && (
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.2 rounded">
                      Paused
                    </span>
                  )}
                </div>
              </div>

              {/* View All Link */}
              {onNavigateToNews && (
                <button
                  onClick={onNavigateToNews}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0B3B3C] dark:text-[#14B8A6] hover:underline cursor-pointer"
                >
                  <span>View All News</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* News Cards Sliding Track with < on Left Edge and > on Right Edge */}
            <div className="relative overflow-hidden">
              {/* < Button on Middle Left Edge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevNews();
                }}
                title="Previous News"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/90 dark:bg-[#1E293B]/90 border border-[#E2E8F0] dark:border-[#2E384D] shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#0B3B3C] dark:hover:text-[#14B8A6] hover:scale-110 active:scale-95 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 backdrop-blur-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 -ml-0.5" />
              </button>

              {/* Continuous Sliding Horizontal Track (Smoothly slides previous news out to the left) */}
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${(newsIndex % TODAY_SHORT_NEWS.length) * (isMobile ? 100 : 33.333333)}%)`,
                }}
              >
                {[...TODAY_SHORT_NEWS, ...TODAY_SHORT_NEWS, ...TODAY_SHORT_NEWS].map((item, idx) => (
                  <div 
                    key={`${item.id}-${idx}`}
                    className="w-full md:w-1/3 shrink-0 px-1.5"
                  >
                    <div 
                      onClick={onNavigateToNews}
                      className="py-1.5 px-3 bg-[#F8FAFC] dark:bg-[#1E293B]/70 hover:bg-teal-50/50 dark:hover:bg-[#1E293B] rounded-lg border border-[#E2E8F0] dark:border-[#2E384D] transition-all cursor-pointer group flex flex-col justify-between shadow-2xs h-[84px]"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 mb-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-black ${item.categoryClass}`}>
                            {item.category}
                          </span>
                          <span>{item.time}</span>
                        </div>
                        <h4 className="text-[11px] font-black text-[#0F172A] dark:text-white group-hover:text-[#0B3B3C] dark:group-hover:text-[#14B8A6] leading-tight line-clamp-1 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 leading-snug">
                          {item.summary}
                        </p>
                      </div>
                      <div className="mt-1 pt-1 border-t border-gray-200/50 dark:border-gray-700/40 flex items-center justify-between text-[9px] font-bold text-gray-400">
                        <span className="text-[#0F172A] dark:text-gray-300 truncate max-w-[130px]">{item.source}</span>
                        <span className={item.sentimentClass}>{item.sentiment}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* > Button on Middle Right Edge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextNews();
                }}
                title="Next News"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/90 dark:bg-[#1E293B]/90 border border-[#E2E8F0] dark:border-[#2E384D] shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#0B3B3C] dark:hover:text-[#14B8A6] hover:scale-110 active:scale-95 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 backdrop-blur-xs"
              >
                <ChevronRight className="w-3.5 h-3.5 -mr-0.5" />
              </button>
            </div>

            {/* Bottom 1.5-Second Visual Progress Indicator Bar */}
            <div className="mt-1.5 pt-1 border-t border-[#F1F5F9] dark:border-[#232B3B] flex items-center justify-between">
              {/* Slide Dots Indicator */}
              <div className="flex items-center gap-1.5">
                {TODAY_SHORT_NEWS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setNewsIndex(i)}
                    className={`h-1 rounded-full transition-all ${
                      newsIndex % TODAY_SHORT_NEWS.length === i
                        ? 'w-5 bg-[#0B3B3C] dark:bg-[#14B8A6]'
                        : 'w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              {/* Countdown Ticker Text */}
              <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 font-semibold">
                Rotating every 1.5s ({((newsIndex % TODAY_SHORT_NEWS.length) + 1)}/{TODAY_SHORT_NEWS.length})
              </span>
            </div>
          </div>
        </div>

      {/* Middle Section: Interactive Binary Options Forecast & Top Assets / Gainers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. Interactive Live Tick Chart & 3-Way Mode Launcher (8 cols on LG) */}
        <div className="lg:col-span-8">
          <BinaryTradeWidget
            tickers={tickers}
            onRefreshPortfolio={onRefreshPortfolio}
            isDark={isDark}
            isDashboard={true}
            onNavigateToSpotTrade={(sym) => onNavigateToTrade(sym, 'SPOT')}
            onNavigateToMarginTrade={(sym) => onNavigateToTrade(sym, 'MARGIN')}
            onNavigateToLeverageTrade={(sym) => onNavigateToTrade(sym, 'LEVERAGE')}
            onNavigateToBinaryTrade={(sym) => onNavigateToBinary(sym)}
          />
        </div>

        {/* 2. Top Gainers Live Desk (4 cols on LG) */}
        <div className="lg:col-span-4">
          {/* Top Gainers */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Top Gainers</h3>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-12 text-[11px] font-semibold text-[#94A3B8] dark:text-gray-500 pb-2 border-b border-[#F1F5F9] dark:border-[#232B3B]">
              <span className="col-span-4">Coin ⬍</span>
              <span className="col-span-3 text-right">Cap ⬍</span>
              <span className="col-span-2 text-right">Price ⬍</span>
              <span className="col-span-3 text-right">Dynamic ⬍</span>
            </div>

            <div className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
              {topGainers.map((gainer) => (
                <div key={gainer.coin} className="grid grid-cols-12 items-center py-2 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 rounded-lg px-1 transition-colors">
                  <div className="col-span-4 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(gainer.pair, e)}
                      className="hover:scale-110 transition-transform cursor-pointer"
                      title={favoriteSymbols.includes(gainer.pair) ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 transition-colors ${
                          favoriteSymbols.includes(gainer.pair)
                            ? 'fill-[#FBBF24] text-[#FBBF24]'
                            : 'text-gray-300 dark:text-gray-600 hover:text-[#FBBF24]'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-[#0F172A] dark:text-white">{gainer.coin}</span>
                  </div>
                  <div className="col-span-3 text-right text-xs font-bold text-[#64748B] dark:text-gray-400">
                    {gainer.cap}
                  </div>
                  <div className="col-span-2 text-right text-xs font-bold text-[#0F172A] dark:text-white">
                    {gainer.price}
                  </div>
                  <div className="col-span-3 text-right text-xs font-bold text-[#0F172A] dark:text-white flex items-center justify-end gap-1">
                    <span>{gainer.dynamic}</span>
                    <span className="text-[10px] text-gray-400">︽</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Real-Time Market Overview Screener */}
      <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9] dark:border-[#232B3B]">
          {/* Scrollable Categories Ribbon */}
          <div className="flex items-center gap-1.5 bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 overflow-x-auto max-w-full pb-1.5 sm:pb-1">
            {MARKET_CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setMarketCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs ${
                  marketCategory === cat.id 
                    ? 'bg-white dark:bg-[#121722] text-gray-900 dark:text-white shadow-2xs font-black' 
                    : 'hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex items-center w-full xl:w-64 flex-shrink-0">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search coin or pair..."
              value={marketSearch}
              onChange={(e) => setMarketSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl text-xs font-medium text-gray-800 dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                <th className="py-3 px-4"># Pair</th>
                <th className="py-3 px-4">Last Price</th>
                <th className="py-3 px-4">24h Change</th>
                <th className="py-3 px-4">7d Change</th>
                <th className="py-3 px-4">24h High / Low</th>
                <th className="py-3 px-4">24h Volume</th>
                <th className="py-3 px-4">7d Trend</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
              {filteredMarketTickers.map((ticker, idx) => {
                const isPos = ticker.price_change_pct_24h >= 0;
                const priceFormatted = ticker.last_price < 10 && ticker.last_price % 1 !== 0
                  ? ticker.last_price.toFixed(4)
                  : ticker.last_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const highFormatted = ticker.high_24h < 10 && ticker.high_24h % 1 !== 0
                  ? ticker.high_24h.toFixed(4)
                  : ticker.high_24h.toFixed(2);
                const lowFormatted = ticker.low_24h < 10 && ticker.low_24h % 1 !== 0
                  ? ticker.low_24h.toFixed(4)
                  : ticker.low_24h.toFixed(2);
                const volFormatted = ticker.quote_volume_24h >= 1_000_000
                  ? `$${(ticker.quote_volume_24h / 1_000_000).toFixed(2)}M`
                  : `$${(ticker.quote_volume_24h / 1_000).toFixed(2)}K`;

                return (
                  <tr
                    key={ticker.symbol}
                    className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onNavigateToTrade(ticker.symbol)}
                  >
                    <td className="py-4 px-4 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(ticker.symbol, e)}
                        className="p-1 -ml-1 text-gray-400 hover:scale-110 transition-transform cursor-pointer"
                        title={favoriteSymbols.includes(ticker.symbol) ? 'Remove from Favorites' : 'Add to Favorites'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 transition-colors ${
                            favoriteSymbols.includes(ticker.symbol)
                              ? 'fill-[#FBBF24] text-[#FBBF24]'
                              : 'text-gray-300 dark:text-gray-600 hover:text-[#FBBF24]'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] font-semibold text-gray-400 w-4">{idx + 1}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-2xs"
                        style={{ backgroundColor: ticker.icon_color || '#0B3B3C' }}
                      >
                        {ticker.base_asset[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0F172A] dark:text-white text-sm">{ticker.name}</span>
                        <span className="font-semibold text-[#94A3B8] dark:text-gray-400 text-[11px] uppercase">{ticker.symbol}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-black text-[#0F172A] dark:text-white text-sm font-mono">
                      ${priceFormatted}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`font-bold px-2 py-0.5 rounded ${isPos ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]' : 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'}`}>
                        {isPos ? '▲ +' : '▼ '}
                        {ticker.price_change_pct_24h.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`font-bold ${ticker.price_change_pct_7d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {ticker.price_change_pct_7d >= 0 ? '+' : ''}{ticker.price_change_pct_7d.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                      <div>H: ${highFormatted}</div>
                      <div className="text-gray-400 dark:text-gray-500">L: ${lowFormatted}</div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {volFormatted}
                    </td>

                    <td className="py-4 px-4">
                      <Sparkline data={ticker.sparkline_7d && ticker.sparkline_7d.length > 0 ? ticker.sparkline_7d : [ticker.last_price * 0.98, ticker.last_price * 0.99, ticker.last_price]} isPositive={isPos} width={90} height={28} />
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToTrade(ticker.symbol);
                        }}
                        className="px-4 py-1.5 bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-bold text-xs rounded-xl hover:bg-[#0F4C4E] dark:hover:bg-teal-400 transition-all shadow-2xs cursor-pointer"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
