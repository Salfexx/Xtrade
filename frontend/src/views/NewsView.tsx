import React, { useState } from 'react';
import { 
  Newspaper, TrendingUp, TrendingDown, Clock, Search, ExternalLink, 
  Flame, Sparkles, Tag, ArrowUpRight, Globe, Filter, Share2, Bookmark, 
  CheckCircle2, Radio, BarChart3, AlertCircle, ChevronRight, Zap
} from 'lucide-react';
import { Ticker } from '../types';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  author: string;
  category: 'Bitcoin' | 'Ethereum' | 'DeFi' | 'Macro' | 'Regulation' | 'AI & Web3' | 'Security';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  publishedAt: string;
  readTime: string;
  tags: string[];
  primaryPair?: string;
  imageUrl?: string;
  impact: 'High' | 'Medium' | 'Low';
  isBreaking?: boolean;
}

interface NewsViewProps {
  tickers: Ticker[];
  onNavigateToTrade: (symbol: string) => void;
  isDark?: boolean;
}

const NEWS_DATA: NewsArticle[] = [
  {
    id: '1',
    title: 'Bitcoin Surges Past Key Resistance as Spot ETF Inflows Reach Record High of $1.2B in 48 Hours',
    summary: 'Institutional demand continues to accelerate following aggressive institutional treasury allocations and global sovereign fund accumulation.',
    content: 'Bitcoin has broken through critical macro resistance levels as institutional accumulation through regulated spot exchange-traded funds (ETFs) reached a staggering $1.2 billion in net inflows over the past 48 hours. Wall Street asset managers report heightened interest from wealth advisory networks and corporate treasuries preparing for the next quarterly balance sheet cycle.',
    source: 'Bloomberg Crypto',
    author: 'Elena Vance',
    category: 'Bitcoin',
    sentiment: 'Bullish',
    publishedAt: '12m ago',
    readTime: '3 min read',
    tags: ['BTC', 'ETFs', 'Inflows', 'WallStreet'],
    primaryPair: 'BTC/USDT',
    impact: 'High',
    isBreaking: true,
  },
  {
    id: '2',
    title: 'Ethereum Layer 2 TVL Hits New All-Time High Following Proto-Danksharding Fee Reductions',
    summary: 'Total Value Locked across Arbitrum, Optimism, and Base surpasses $42B as transaction fees drop to fractions of a cent.',
    content: 'Ethereum Layer-2 rollups have recorded an unprecedented surge in decentralized finance (DeFi) activity. Following network upgrades that slashed blob transaction data gas costs by over 90%, total daily active addresses across top L2 ecosystems have exceeded 3.8 million users.',
    source: 'The Block',
    author: 'Marcus Chen',
    category: 'Ethereum',
    sentiment: 'Bullish',
    publishedAt: '34m ago',
    readTime: '4 min read',
    tags: ['ETH', 'ARB', 'Layer2', 'Rollups'],
    primaryPair: 'ETH/USDT',
    impact: 'High',
  },
  {
    id: '3',
    title: 'Federal Reserve Holds Interest Rates Steady, Signals Potential Easing in Upcoming FOMC Meeting',
    summary: 'Macro liquidity conditions are expected to improve as central banks coordinate forward guidance amid cooling inflation metrics.',
    content: 'Global risk assets rallied after Federal Reserve Chair remarks indicated that inflationary pressures have largely returned to long-term baseline targets. Traders and institutional derivatives markets are pricing in an 82% probability of a 25bps rate cut during the subsequent policy assembly.',
    source: 'Reuters Financial',
    author: 'Sarah Jenkins',
    category: 'Macro',
    sentiment: 'Bullish',
    publishedAt: '1h ago',
    readTime: '5 min read',
    tags: ['Fed', 'Macro', 'InterestRates', 'Liquidity'],
    primaryPair: 'BTC/USDT',
    impact: 'High',
  },
  {
    id: '4',
    title: 'SEC Finalizes Comprehensive Staking Framework for Regulated Custodians',
    summary: 'New guidelines clarify non-custodial staking validator rewards, opening avenues for enterprise liquid staking participation.',
    content: 'Regulatory clarity in North America reached a milestone today as securities and banking watchdogs issued joint guidance outlining requirements for institutional cryptocurrency staking services. The clarity provides registered institutions with clear compliance safe harbors.',
    source: 'CoinDesk',
    author: 'David Sterling',
    category: 'Regulation',
    sentiment: 'Neutral',
    publishedAt: '2h ago',
    readTime: '4 min read',
    tags: ['Regulation', 'SEC', 'Staking', 'Compliance'],
    primaryPair: 'ETH/USDT',
    impact: 'Medium',
  },
  {
    id: '5',
    title: 'Decentralized AI Compute Networks Experience 300% Utilization Growth in Q3',
    summary: 'Decentralized GPU computing clusters and on-chain AI inference models gain massive enterprise traction.',
    content: 'As artificial intelligence developers face global GPU hardware scarcity, decentralized compute marketplaces have emerged as essential infrastructure. Protocols aggregating sovereign data center capacity and consumer hardware reported 300% quarterly throughput expansion.',
    source: 'Decrypt',
    author: 'Alex Thorne',
    category: 'AI & Web3',
    sentiment: 'Bullish',
    publishedAt: '3h ago',
    readTime: '3 min read',
    tags: ['AI', 'TAO', 'RENDER', 'NEAR'],
    primaryPair: 'TAO/USDT',
    impact: 'High',
  },
  {
    id: '6',
    title: 'Cross-Chain Liquidity Protocols Report Sub-Second Settlement for High-Frequency Swaps',
    summary: 'Zero-knowledge proof verification accelerates atomic swaps across disparate blockchain architectures.',
    content: 'Decentralized exchange architects have deployed next-generation zero-knowledge state proofs enabling cross-chain asset settlements within under 800 milliseconds without relying on centralized bridge multi-sigs.',
    source: 'CoinTelegraph',
    author: 'Priya Sharma',
    category: 'DeFi',
    sentiment: 'Bullish',
    publishedAt: '4h ago',
    readTime: '4 min read',
    tags: ['DeFi', 'ZKProofs', 'Liquidity', 'Solana'],
    primaryPair: 'SOL/USDT',
    impact: 'Medium',
  },
  {
    id: '7',
    title: 'Solana DeFi Ecosystem TVL Surges Past $6.8B Amid High-Throughput DEX Volume Spike',
    summary: 'Perpetual DEXs and automated market makers on Solana record highest weekly volume since 2024.',
    content: 'Solana ecosystem decentralized exchanges reported weekly spot and derivative volumes exceeding $22 billion. Ecosystem growth is driven by accelerated memecoin velocity, fast confirmation times, and sub-cent transaction costs.',
    source: 'Blockworks',
    author: 'Nate Rivers',
    category: 'DeFi',
    sentiment: 'Bullish',
    publishedAt: '5h ago',
    readTime: '3 min read',
    tags: ['SOL', 'DEX', 'DeFi', 'Volume'],
    primaryPair: 'SOL/USDT',
    impact: 'Medium',
  },
  {
    id: '8',
    title: 'Major Security Audit Firm Releases Zero-Day Exploit Mitigation for Cross-Chain Bridges',
    summary: 'Proactive formal verification protocol prevents potential re-entrancy vectors across multi-chain smart contracts.',
    content: 'Leading smart contract auditing firms have published a universal security patch after discovering edge-case state synchronization vulnerabilities in legacy bridge contracts, protecting an estimated $1.8B in multi-chain collateral.',
    source: 'CertiK Research',
    author: 'Leon Patel',
    category: 'Security',
    sentiment: 'Neutral',
    publishedAt: '6h ago',
    readTime: '4 min read',
    tags: ['Security', 'Audit', 'SmartContracts', 'ZeroDay'],
    primaryPair: 'BTC/USDT',
    impact: 'Medium',
  },
];

const FLASH_WIRE_ITEMS = [
  '⚡ BREAKING: US Spot Bitcoin ETFs record +$640M single-day net inflow',
  '🟢 MACRO: Core PCE Inflation drops to 2.4%, cementing Fed rate cut expectations',
  '🚀 ETH L2s: Arbitrum & Base process combined 8.2M transactions in 24 hours',
  '🔥 SOLANA: Network achieves 3,200 sustained TPS during high-load stress testing',
];

const TRENDING_NARRATIVES = [
  { tag: '#BitcoinSpotETF', volume: '142.5K posts', isHot: true },
  { tag: '#SolanaDeFi', volume: '98.2K posts', isHot: true },
  { tag: '#DecentralizedAI', volume: '76.4K posts', isHot: false },
  { tag: '#TokenUnlocks', volume: '54.1K posts', isHot: false },
  { tag: '#ProtoDanksharding', volume: '38.9K posts', isHot: false },
];

export const NewsView: React.FC<NewsViewProps> = ({
  tickers,
  onNavigateToTrade,
  isDark = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [flashIndex, setFlashIndex] = useState<number>(0);

  const categories = ['All', 'Bitcoin', 'Ethereum', 'DeFi', 'Macro', 'Regulation', 'AI & Web3', 'Security'];
  const sentiments = ['All', 'Bullish', 'Neutral', 'Bearish'];

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredNews = NEWS_DATA.filter((article) => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSentiment = selectedSentiment === 'All' || article.sentiment === selectedSentiment;
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSentiment && matchesSearch;
  });

  const breakingArticle = NEWS_DATA.find((n) => n.isBreaking) || NEWS_DATA[0];

  // Helper to get real-time price info for tagged pair
  const getPairTicker = (pair?: string) => {
    if (!pair) return null;
    return tickers.find((t) => t.symbol === pair);
  };

  return (
    <div className="space-y-5 max-w-[1680px] mx-auto pb-12">
      {/* 1. TOP LIVE FLASH WIRE MARQUEE */}
      <div className="bg-[#0B3B3C] dark:bg-[#111A24] text-white rounded-xl px-4 py-2 border border-teal-800/40 dark:border-[#232B3B] flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
            <Radio className="w-3 h-3" />
            FLASH WIRE
          </span>
          <span className="text-gray-400 text-xs hidden sm:inline">|</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap w-full text-xs font-bold text-gray-200">
          <span className="inline-block">
            {FLASH_WIRE_ITEMS[flashIndex % FLASH_WIRE_ITEMS.length]}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setFlashIndex((prev) => (prev + 1) % FLASH_WIRE_ITEMS.length)}
            className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            title="Next Alert"
          >
            Next ❯
          </button>
        </div>
      </div>

      {/* 2. TOP BREAKING NEWS HERO BANNER */}
      {breakingArticle && (
        <div className="relative bg-gradient-to-r from-[#0B3B3C] via-[#104D4E] to-[#14532D] dark:from-[#0B151E] dark:via-[#112429] dark:to-[#091F1E] rounded-3xl p-6 md:p-7 text-white shadow-xl border border-teal-800/40 dark:border-teal-900/50 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-[#14B8A6]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-500 text-white font-black text-[11px] rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  Breaking News
                </span>
                <span className="px-2.5 py-0.5 bg-white/15 text-white text-xs font-bold rounded-lg backdrop-blur-md">
                  {breakingArticle.source}
                </span>
                <span className="text-white/70 text-xs flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {breakingArticle.publishedAt}
                </span>
              </div>

              <h1 
                className="text-xl md:text-2xl font-black tracking-tight leading-tight hover:text-teal-200 transition-colors cursor-pointer"
                onClick={() => setActiveArticle(breakingArticle)}
              >
                {breakingArticle.title}
              </h1>

              <p className="text-white/80 text-xs md:text-sm line-clamp-2 leading-relaxed font-normal">
                {breakingArticle.summary}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {breakingArticle.tags.map((tag) => (
                  <span key={tag} className="text-xs font-semibold px-2 py-0.5 bg-black/30 rounded-md text-teal-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                onClick={() => setActiveArticle(breakingArticle)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Read Analysis</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateToTrade(breakingArticle.primaryPair || 'BTC/USDT')}
                className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Trade BTC</span>
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN SECTION: 2-COLUMN LAYOUT (NEWS STREAM + MARKET PULSE SIDEBAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: News Filter Controls & Article Cards */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar & Search */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl p-3.5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white shadow-2xs font-black'
                      : 'bg-[#F8FAFC] dark:bg-[#1E293B] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sentiment & Search */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#1E293B] p-0.5 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400">
                {sentiments.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSentiment(s)}
                    className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                      selectedSentiment === s
                        ? 'bg-white dark:bg-[#121722] text-gray-900 dark:text-white shadow-2xs font-black'
                        : 'hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center w-40 sm:w-52">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-lg text-xs font-medium text-[#0F172A] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                />
              </div>
            </div>
          </div>

          {/* News Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNews.map((article) => {
              const isBookmarked = bookmarkedIds.includes(article.id);
              const ticker = getPairTicker(article.primaryPair);

              return (
                <div
                  key={article.id}
                  className="bg-white dark:bg-[#161B26] rounded-2xl border border-[#E5E9EB] dark:border-[#232B3B] card-shadow card-hover overflow-hidden flex flex-col justify-between transition-all group p-4 space-y-3"
                >
                  <div>
                    {/* Header: Category, Impact & Bookmark */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#F1F5F9] dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 font-bold text-[10px] rounded-md uppercase">
                          {article.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          article.sentiment === 'Bullish'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                            : article.sentiment === 'Bearish'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          {article.sentiment === 'Bullish' ? '▲ ' : article.sentiment === 'Bearish' ? '▼ ' : '● '}
                          {article.sentiment}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleBookmark(article.id)}
                        className="text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>

                    <h3
                      onClick={() => setActiveArticle(article)}
                      className="text-sm font-black text-[#0F172A] dark:text-white group-hover:text-[#0B3B3C] dark:group-hover:text-[#14B8A6] leading-snug line-clamp-2 transition-colors cursor-pointer"
                    >
                      {article.title}
                    </h3>

                    <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  {/* Tagged Coin Price & Action Bar */}
                  <div className="pt-2 border-t border-[#F8FAFC] dark:border-[#1E293B] flex items-center justify-between">
                    {ticker ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                          ${ticker.last_price >= 1 ? ticker.last_price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ticker.last_price.toFixed(4)}
                        </span>
                        <span className={`text-[10px] font-bold ${ticker.price_change_pct_24h >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {ticker.price_change_pct_24h >= 0 ? '+' : ''}{ticker.price_change_pct_24h.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-medium text-gray-400">
                        {article.source} • {article.publishedAt}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {article.primaryPair && (
                        <button
                          onClick={() => onNavigateToTrade(article.primaryPair!)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-[#10B981] text-[#10B981] hover:text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Trade {article.primaryPair.split('/')[0]}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setActiveArticle(article)}
                        className="text-xs font-bold text-[#0B3B3C] dark:text-[#14B8A6] hover:underline cursor-pointer"
                      >
                        Read
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Market Pulse & Trending Narratives Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Crypto Fear & Greed Meter */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl p-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Market Sentiment Index</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]">
                UPDATED TODAY
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-3xl font-black text-[#10B981] font-mono">76</div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  Extreme Greed 🟢
                </span>
              </div>
              <div className="w-32 bg-gray-100 dark:bg-gray-800 rounded-full h-3 p-0.5">
                <div className="bg-gradient-to-r from-emerald-400 to-[#10B981] h-2 rounded-full w-[76%]" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-center text-[10px]">
              <div>
                <span className="text-gray-400 block">Yesterday</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">74 (Greed)</span>
              </div>
              <div>
                <span className="text-gray-400 block">Last Week</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">68 (Greed)</span>
              </div>
              <div>
                <span className="text-gray-400 block">Last Month</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">54 (Neutral)</span>
              </div>
            </div>
          </div>

          {/* Trending Market Narratives */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl p-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Trending Narratives</span>
              <Sparkles className="w-4 h-4 text-[#10B981]" />
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {TRENDING_NARRATIVES.map((item, idx) => (
                <div 
                  key={item.tag} 
                  onClick={() => setSearchQuery(item.tag.replace('#', ''))}
                  className="py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/40 px-1 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400">{idx + 1}</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white hover:text-[#10B981] transition-colors">
                      {item.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.isHot && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 bg-rose-500/10 text-rose-500 rounded">
                        HOT 🔥
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium">{item.volume}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Trade Hot Pairs Desk */}
          <div className="bg-white dark:bg-[#161B26] rounded-2xl p-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Top Volatile Pairs</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-1.5">
              {tickers.slice(0, 4).map((t) => (
                <div 
                  key={t.symbol}
                  onClick={() => onNavigateToTrade(t.symbol)}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#1E293B] hover:bg-teal-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-900 dark:text-white">{t.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                      ${t.last_price >= 1 ? t.last_price.toFixed(2) : t.last_price.toFixed(4)}
                    </span>
                    <span className={`text-[11px] font-black ${t.price_change_pct_24h >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {t.price_change_pct_24h >= 0 ? '+' : ''}{t.price_change_pct_24h.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. ARTICLE DETAIL MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161B26] border border-[#E5E9EB] dark:border-[#232B3B] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#F1F5F9] dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg uppercase">
                  {activeArticle.category}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                  activeArticle.sentiment === 'Bullish'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                    : activeArticle.sentiment === 'Bearish'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-[#EF4444]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                  {activeArticle.sentiment} Impact
                </span>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h2 className="text-lg md:text-xl font-black text-[#0F172A] dark:text-white leading-tight">
              {activeArticle.title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>By <strong>{activeArticle.author}</strong></span>
              <span>•</span>
              <span>{activeArticle.source}</span>
              <span>•</span>
              <span>{activeArticle.publishedAt}</span>
              <span>•</span>
              <span>{activeArticle.readTime}</span>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#2E384D] text-xs font-semibold text-[#0F172A] dark:text-white leading-relaxed">
              {activeArticle.summary}
            </div>

            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed space-y-2.5 font-normal">
              <p>{activeArticle.content}</p>
              <p>
                Market participants continue to monitor related derivative open interest and exchange liquidity reserves to assess subsequent volatility across major trading pairs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F1F5F9] dark:border-[#232B3B]">
              <span className="text-xs font-bold text-gray-400 mr-1">Related Tags:</span>
              {activeArticle.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 bg-[#F1F5F9] dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const pair = activeArticle.primaryPair || 'BTC/USDT';
                  setActiveArticle(null);
                  onNavigateToTrade(pair);
                }}
                className="px-4 py-2 bg-[#0B3B3C] dark:bg-[#14B8A6] hover:opacity-90 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Trade {activeArticle.primaryPair || 'BTC/USDT'}</span>
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
