import React, { useState } from 'react';
import { 
  Gamepad2, Sparkles, TrendingUp, CheckCircle2, Clock, 
  Coins, ArrowUpRight, DollarSign, Search, 
  ChevronRight, Trophy, Zap, Info, Rocket, Globe, FileText, Check,
  Layers, ShieldCheck, AlertTriangle, ExternalLink, Calendar,
  Play, Users, Flame, Swords, Shield, Crosshair, Star
} from 'lucide-react';
import { Ticker } from '../types';

interface IgoProject {
  id: string;
  name: string;
  symbol: string;
  genre: 'Action MMORPG' | 'Tactical ARPG' | 'PvP Metaverse' | 'Sci-Fi Racing' | 'Strategy 4X' | 'Card & TCG';
  chain: string;
  engine: 'Unreal Engine 5' | 'Unity 6' | 'Custom C++';
  platforms: string[];
  bannerGradient: string;
  iconBg: string;
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED';
  priceUsdt: number;
  currentAthRoi?: number;
  targetRaiseUsdt: number;
  raisedUsdt: number;
  participantsCount: number;
  startDate: string;
  endDate: string;
  description: string;
  gameplayUrl?: string;
  tokenomics: {
    totalTokens: string;
    initialMarketCap: string;
    vestingSchedule: string;
    distribution: { label: string; pct: number }[];
  };
  userContributionUsdt?: number;
  userTokensAllocated?: number;
  isClaimed?: boolean;
}

interface GamingGuildTier {
  tierName: string;
  icon: string;
  requiredStake: string;
  poolWeight: string;
  allocationType: string;
  perks: string[];
  color: string;
}

interface AlphaPassItem {
  id: string;
  gameName: string;
  passType: 'Closed Alpha Pass' | 'Founder NFT Mint' | 'Genesis Guild Land' | 'Beta Tester Key';
  chain: string;
  priceUsdt: number;
  supply: string;
  claimedCount: number;
  totalCount: number;
  status: 'Available' | 'Sold Out';
  perks: string;
}

const INITIAL_IGO_PROJECTS: IgoProject[] = [
  {
    id: 'igo-1',
    name: 'Aetheria: Legends of the Void',
    symbol: 'AETH',
    genre: 'Action MMORPG',
    chain: 'ImmutableX',
    engine: 'Unreal Engine 5',
    platforms: ['PC / Windows', 'Epic Games', 'Steam'],
    bannerGradient: 'from-purple-900/80 via-indigo-900/60 to-slate-900',
    iconBg: '#8B5CF6',
    status: 'LIVE',
    priceUsdt: 0.045,
    targetRaiseUsdt: 1800000,
    raisedUsdt: 1540000,
    participantsCount: 4120,
    startDate: '2026-09-12',
    endDate: '2 Days Left',
    description: 'Next-gen cyberpunk open-world MMORPG featuring high-octane real-time combat, sovereign NFT weapon crafting, and player-governed planetary citadels.',
    tokenomics: {
      totalTokens: '1,000,000,000 AETH',
      initialMarketCap: '$1,800,000',
      vestingSchedule: '20% at TGE, 1 month cliff, then linear monthly vesting over 5 months',
      distribution: [
        { label: 'Play-and-Earn Rewards', pct: 35 },
        { label: 'Public IGO Launchpad', pct: 15 },
        { label: 'Early Guild Backers', pct: 18 },
        { label: 'Core Dev Team', pct: 12 },
        { label: 'Ecosystem & Liquidity', pct: 20 },
      ],
    },
    userContributionUsdt: 750,
    userTokensAllocated: 16666.66,
    isClaimed: false,
  },
  {
    id: 'igo-2',
    name: 'ShadowForge: Realm of Shadows',
    symbol: 'SHAD',
    genre: 'Tactical ARPG',
    chain: 'Solana',
    engine: 'Unreal Engine 5',
    platforms: ['PC / Windows', 'Mac (Apple Silicon)', 'Steam'],
    bannerGradient: 'from-amber-950/80 via-orange-950/60 to-slate-900',
    iconBg: '#F59E0B',
    status: 'LIVE',
    priceUsdt: 0.08,
    targetRaiseUsdt: 2400000,
    raisedUsdt: 2190000,
    participantsCount: 5280,
    startDate: '2026-09-10',
    endDate: '18 Hours Left',
    description: 'Grimdark dark-fantasy ARPG with soul-like mechanics, procedural dungeons, high-stakes PvP loot extraction, and player-forged NFT artifacts.',
    tokenomics: {
      totalTokens: '500,000,000 SHAD',
      initialMarketCap: '$2,400,000',
      vestingSchedule: '25% at TGE, linear weekly vesting over 90 days',
      distribution: [
        { label: 'Staking & Arena Battles', pct: 30 },
        { label: 'Public IGO Sale', pct: 20 },
        { label: 'Venture & Private', pct: 20 },
        { label: 'Founding Team', pct: 15 },
        { label: 'Treasury Reserve', pct: 15 },
      ],
    },
    userContributionUsdt: 0,
    userTokensAllocated: 0,
    isClaimed: false,
  },
  {
    id: 'igo-3',
    name: 'CyberRacer 2099',
    symbol: 'RACE',
    genre: 'Sci-Fi Racing',
    chain: 'Arbitrum',
    engine: 'Unity 6',
    platforms: ['PC', 'iOS', 'Android', 'PlayStation 5'],
    bannerGradient: 'from-cyan-950/80 via-blue-950/60 to-slate-900',
    iconBg: '#06B6D4',
    status: 'UPCOMING',
    priceUsdt: 0.025,
    targetRaiseUsdt: 1200000,
    raisedUsdt: 0,
    participantsCount: 0,
    startDate: '2026-09-22',
    endDate: 'Starts in 5 Days',
    description: 'Anti-gravity supersonic combat racing game powered by Web3 micro-transactions, vehicle NFT customization, and cross-platform esports tournaments.',
    tokenomics: {
      totalTokens: '2,000,000,000 RACE',
      initialMarketCap: '$1,200,000',
      vestingSchedule: '30% at TGE, 70% linear monthly over 4 months',
      distribution: [
        { label: 'Esports Prize Pools', pct: 40 },
        { label: 'Public IGO', pct: 15 },
        { label: 'Strategic Backers', pct: 15 },
        { label: 'Team & Advisors', pct: 15 },
        { label: 'Liquidity Pools', pct: 15 },
      ],
    },
  },
  {
    id: 'igo-4',
    name: 'Galactic Dominion: Starfleet',
    symbol: 'DOMIN',
    genre: 'Strategy 4X',
    chain: 'BNB Chain',
    engine: 'Unreal Engine 5',
    platforms: ['PC / WebGL', 'Mac'],
    bannerGradient: 'from-emerald-950/80 via-teal-950/60 to-slate-900',
    iconBg: '#10B981',
    status: 'UPCOMING',
    priceUsdt: 0.06,
    targetRaiseUsdt: 3000000,
    raisedUsdt: 0,
    participantsCount: 0,
    startDate: '2026-09-28',
    endDate: 'Starts in 11 Days',
    description: 'Massive scale 4X interstellar conquest strategy MMO. Build armada fleets, form planetary alliances, and extract cosmic $DOMIN minerals.',
    tokenomics: {
      totalTokens: '750,000,000 DOMIN',
      initialMarketCap: '$3,000,000',
      vestingSchedule: '15% at TGE, 3 months linear distribution',
      distribution: [
        { label: 'Planetary Mining Yield', pct: 35 },
        { label: 'IGO Launchpad Allocation', pct: 20 },
        { label: 'Guild Staking Fund', pct: 20 },
        { label: 'Core Developers', pct: 15 },
        { label: 'DEX Liquidity', pct: 10 },
      ],
    },
  },
  {
    id: 'igo-5',
    name: 'Valoria: Shattered Realms',
    symbol: 'VALOR',
    genre: 'Card & TCG',
    chain: 'Avalanche',
    engine: 'Unity 6',
    platforms: ['iOS', 'Android', 'PC / Steam'],
    bannerGradient: 'from-rose-950/80 via-pink-950/60 to-slate-900',
    iconBg: '#F43F5E',
    status: 'COMPLETED',
    priceUsdt: 0.015,
    currentAthRoi: 24.8,
    targetRaiseUsdt: 950000,
    raisedUsdt: 950000,
    participantsCount: 6840,
    startDate: '2026-08-01',
    endDate: 'Ended (Sold Out)',
    description: 'Fast-paced strategic trading card battler with true asset ownership, seasonal ranking tournaments, and automated prize smart contracts.',
    tokenomics: {
      totalTokens: '1,500,000,000 VALOR',
      initialMarketCap: '$950,000',
      vestingSchedule: '100% Fully Unlocked at TGE (100% TGE Fill)',
      distribution: [
        { label: 'Tournament Rewards', pct: 40 },
        { label: 'Public IGO', pct: 25 },
        { label: 'Early Angels', pct: 15 },
        { label: 'Team', pct: 10 },
        { label: 'Liquidity', pct: 10 },
      ],
    },
    userContributionUsdt: 500,
    userTokensAllocated: 33333.33,
    isClaimed: true,
  },
];

const GUILD_TIERS: GamingGuildTier[] = [
  {
    tierName: 'Scout Gamer',
    icon: '🛡️',
    requiredStake: '500 XTR',
    poolWeight: '1.0x Weight',
    allocationType: 'Lottery / First-Come-First-Serve',
    perks: ['Access to Public IGO Pools', 'Standard Discord Role', 'Basic Game Access'],
    color: 'border-slate-300 dark:border-slate-700',
  },
  {
    tierName: 'Knight Veteran',
    icon: '⚔️',
    requiredStake: '2,500 XTR',
    poolWeight: '2.5x Weight',
    allocationType: 'Guaranteed 85% Allocation',
    perks: ['Guaranteed IGO Ticket', 'Early Alpha Tester Access', '5% Bonus Staking Yield'],
    color: 'border-blue-400 dark:border-blue-600',
  },
  {
    tierName: 'Champion Guild',
    icon: '🏆',
    requiredStake: '10,000 XTR',
    poolWeight: '6.0x Weight',
    allocationType: '100% Guaranteed Allocation',
    perks: ['Guaranteed High Tier Cap', 'Free NFT Founder Mint', 'Direct Game Studio AMA'],
    color: 'border-amber-400 dark:border-amber-600',
  },
  {
    tierName: 'Legend Sovereign',
    icon: '👑',
    requiredStake: '50,000 XTR',
    poolWeight: '15.0x Weight',
    allocationType: 'Guaranteed VIP Maximum Allocation',
    perks: ['VIP Private Seed Round Access', 'Exclusive Game Producer Credits', 'Zero Platform Fees'],
    color: 'border-emerald-400 dark:border-emerald-600',
  },
];

const ALPHA_PASSES: AlphaPassItem[] = [
  {
    id: 'pass-1',
    gameName: 'Aetheria: Legends of the Void',
    passType: 'Closed Alpha Pass',
    chain: 'ImmutableX',
    priceUsdt: 120,
    supply: '1,000 Total',
    claimedCount: 842,
    totalCount: 1000,
    status: 'Available',
    perks: 'Playable build instant access, Exclusive Cyber Saber NFT, 2x AETH farming boost.',
  },
  {
    id: 'pass-2',
    gameName: 'ShadowForge: Realm of Shadows',
    passType: 'Founder NFT Mint',
    chain: 'Solana',
    priceUsdt: 250,
    supply: '500 Total',
    claimedCount: 500,
    totalCount: 500,
    status: 'Sold Out',
    perks: 'Legendary Shadow Cloak, Lifetime 10% marketplace revenue share, Closed Beta key.',
  },
  {
    id: 'pass-3',
    gameName: 'CyberRacer 2099',
    passType: 'Beta Tester Key',
    chain: 'Arbitrum',
    priceUsdt: 50,
    supply: '2,500 Total',
    claimedCount: 1210,
    totalCount: 2500,
    status: 'Available',
    perks: 'Cross-platform beta testing build on Steam/iOS, Neon Hyper-Drift Decal.',
  },
];

interface IgoViewProps {
  tickers?: Ticker[];
  onNavigateToTrade?: (symbol: string) => void;
  isDark?: boolean;
}

export const IgoView: React.FC<IgoViewProps> = ({ onNavigateToTrade, isDark = false }) => {
  const [activeMainTab, setActiveMainTab] = useState<'OFFERINGS' | 'GUILD_TIERS' | 'ALPHA_PASSES' | 'MY_ALLOCATIONS'>('OFFERINGS');
  const [projects, setProjects] = useState<IgoProject[]>(INITIAL_IGO_PROJECTS);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [genreFilter, setGenreFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProject, setSelectedProject] = useState<IgoProject | null>(null);
  const [participateAmount, setParticipateAmount] = useState<string>('500');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleParticipate = () => {
    const amt = parseFloat(participateAmount);
    if (isNaN(amt) || amt <= 0 || !selectedProject) return;

    const tokens = amt / selectedProject.priceUsdt;
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          raisedUsdt: p.raisedUsdt + amt,
          participantsCount: p.participantsCount + 1,
          userContributionUsdt: (p.userContributionUsdt || 0) + amt,
          userTokensAllocated: (p.userTokensAllocated || 0) + tokens,
          isClaimed: false,
        };
      }
      return p;
    }));
    showToast(`🎮 Successfully contributed $${amt.toLocaleString()} USDT to ${selectedProject.name}! Tokens allocated.`);
    setSelectedProject(null);
  };

  const handleClaim = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, isClaimed: true };
      }
      return p;
    }));
    showToast('🎉 Gaming Tokens successfully transferred to your Spot Portfolio!');
  };

  const filteredProjects = projects.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (genreFilter !== 'ALL' && p.genre !== genreFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q) || p.chain.toLowerCase().includes(q);
    }
    return true;
  });

  const myAllocations = projects.filter(p => (p.userContributionUsdt || 0) > 0);

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-16">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#10B981] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 font-bold text-sm border border-white/20">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1A103C] via-[#2A1B54] to-[#0E1A38] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider border border-purple-500/30">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>WEB3 GAMING LAUNCHPAD & INITIAL GAME OFFERINGS</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Initial Game Offerings (IGO) Hub
          </h1>

          <p className="text-sm sm:text-base text-gray-200 font-medium leading-relaxed max-w-2xl">
            Early-stage access to top-tier Web3 video games, playable demos, and in-game token sales. Back vetted game studios before exchange listing.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">Total Gaming Raised</span>
              <span className="text-lg sm:text-xl font-black font-mono text-purple-300 mt-0.5 block">
                $48.5M USD
              </span>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">Web3 Games Launched</span>
              <span className="text-lg sm:text-xl font-black font-mono text-white mt-0.5 block">
                64 Games
              </span>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">Registered Players</span>
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 mt-0.5 block">
                128,400+
              </span>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">Average ATH ROI</span>
              <span className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-0.5 block">
                18.4x 🚀
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Segmented Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-[#232B3B] pb-3">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#161B26] p-1.5 rounded-2xl">
          {[
            { id: 'OFFERINGS', label: '🎮 Game Offerings (IGOs)', icon: Gamepad2 },
            { id: 'GUILD_TIERS', label: '⚔️ Guild Staking Tiers', icon: Swords },
            { id: 'ALPHA_PASSES', label: '🎟️ Alpha Passes & Mints', icon: Trophy },
            { id: 'MY_ALLOCATIONS', label: `💼 My Allocations (${myAllocations.length})`, icon: Coins },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeMainTab === tab.id
                  ? 'bg-white dark:bg-[#1E293B] text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        {activeMainTab === 'OFFERINGS' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search games, tokens, chains..."
                className="pl-8 pr-3 py-1.5 bg-white dark:bg-[#161B26] border border-gray-200 dark:border-[#232B3B] rounded-xl text-xs font-medium text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 w-52 sm:w-64"
              />
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: IGO OFFERINGS */}
      {activeMainTab === 'OFFERINGS' && (
        <div className="space-y-4">
          {/* Status & Genre Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#161B26] p-1 rounded-xl text-xs font-bold">
              {[
                { id: 'ALL', label: 'All Games' },
                { id: 'LIVE', label: '🟢 Live Now' },
                { id: 'UPCOMING', label: '⏳ Upcoming' },
                { id: 'COMPLETED', label: '🏆 Completed' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white font-black shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Genre Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                'ALL', 'Action MMORPG', 'Tactical ARPG', 'PvP Metaverse', 'Sci-Fi Racing', 'Strategy 4X', 'Card & TCG'
              ].map(genre => (
                <button
                  key={genre}
                  onClick={() => setGenreFilter(genre)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    genreFilter === genre
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 font-black'
                      : 'bg-white dark:bg-[#161B26] border-gray-200 dark:border-[#232B3B] text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {genre === 'ALL' ? 'All Genres' : genre}
                </button>
              ))}
            </div>
          </div>

          {/* IGO Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map(p => {
              const progressPct = Math.min(100, Math.round((p.raisedUsdt / p.targetRaiseUsdt) * 100));
              const isLive = p.status === 'LIVE';
              const isUpcoming = p.status === 'UPCOMING';

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#161B26] border border-gray-200 dark:border-[#232B3B] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Card Header & Banner */}
                  <div>
                    <div className={`p-5 bg-gradient-to-br ${p.bannerGradient} text-white relative`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md border border-white/20"
                            style={{ backgroundColor: p.iconBg }}
                          >
                            {p.symbol[0]}
                          </div>
                          <div>
                            <h3 className="font-black text-base leading-tight flex items-center gap-1.5">
                              {p.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-300 font-mono">
                              <span className="font-bold text-purple-300">${p.symbol}</span>
                              <span>•</span>
                              <span>{p.chain}</span>
                              <span>•</span>
                              <span className="text-amber-300">{p.engine}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isLive 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse' 
                            : isUpcoming 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      {/* Platforms Badge */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.platforms.map(plat => (
                          <span key={plat} className="px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-white/10 text-white/90 backdrop-blur-xs">
                            {plat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      {/* Key Token Metrics */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-medium">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">IGO Token Price</span>
                          <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                            ${p.priceUsdt} USDT
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Initial Market Cap</span>
                          <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                            {p.tokenomics.initialMarketCap}
                          </span>
                        </div>
                      </div>

                      {/* Raise Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400">Raised: ${p.raisedUsdt.toLocaleString()} USDT</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400 pt-0.5">
                          <span>Target: ${p.targetRaiseUsdt.toLocaleString()} USDT</span>
                          <span>{p.endDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-5 pt-0 border-t border-gray-100 dark:border-[#232B3B] mt-auto">
                    <div className="pt-3">
                      {isLive ? (
                        <button
                          onClick={() => setSelectedProject(p)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span>Participate in IGO</span>
                        </button>
                      ) : isUpcoming ? (
                        <button
                          onClick={() => setSelectedProject(p)}
                          className="w-full py-2.5 px-4 bg-gray-100 dark:bg-[#1E293B] hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>View Game Tokenomics</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">Sale Completed</span>
                          {p.currentAthRoi && (
                            <span className="font-mono font-black text-[#10B981] bg-emerald-500/10 px-2 py-0.5 rounded">
                              ATH {p.currentAthRoi}x 🚀
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GUILD TIERS */}
      {activeMainTab === 'GUILD_TIERS' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Gaming Guild Allocation & Staking Tiers
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Stake $XTR tokens to unlock guaranteed allocations in hot Web3 game token sales, closed alpha testing keys, and governance voting power.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GUILD_TIERS.map(gt => (
              <div
                key={gt.tierName}
                className={`bg-white dark:bg-[#161B26] border-2 ${gt.color} rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{gt.icon}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                      {gt.poolWeight}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-gray-900 dark:text-white">
                      {gt.tierName}
                    </h3>
                    <div className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                      Required: <span className="text-purple-600 dark:text-purple-400">{gt.requiredStake}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-gray-50 dark:bg-[#1E293B] rounded-xl text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Allocation Rule:</span>
                    {gt.allocationType}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider block">
                      Guild Perks:
                    </span>
                    {gt.perks.map(perk => (
                      <div key={perk} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => showToast(`🎮 Staked required tokens for ${gt.tierName}!`)}
                  className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer mt-2"
                >
                  Stake & Upgrade
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALPHA PASSES & MINTS */}
      {activeMainTab === 'ALPHA_PASSES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ALPHA_PASSES.map(pass => (
              <div
                key={pass.id}
                className="bg-white dark:bg-[#161B26] border border-gray-200 dark:border-[#232B3B] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {pass.chain}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pass.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {pass.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-base text-gray-900 dark:text-white">
                      {pass.passType}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Game: <span className="font-bold text-gray-800 dark:text-gray-200">{pass.gameName}</span>
                    </p>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#1E293B] p-3 rounded-2xl">
                    {pass.perks}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-400 font-medium">Price:</span>
                    <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                      ${pass.priceUsdt} USDT
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Minted: {pass.claimedCount} / {pass.totalCount}</span>
                    <span>{pass.supply}</span>
                  </div>
                </div>

                <button
                  disabled={pass.status === 'Sold Out'}
                  onClick={() => showToast(`🎟️ Successfully minted ${pass.passType} for $${pass.priceUsdt} USDT!`)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
                >
                  {pass.status === 'Sold Out' ? 'Sold Out' : 'Mint Alpha Pass'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MY ALLOCATIONS */}
      {activeMainTab === 'MY_ALLOCATIONS' && (
        <div className="bg-white dark:bg-[#161B26] border border-gray-200 dark:border-[#232B3B] rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-base text-gray-900 dark:text-white">
            My Game Token Allocations & Vesting Schedule
          </h3>

          {myAllocations.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Gamepad2 className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-bold">No active IGO participations yet.</p>
              <p className="text-xs">Participate in live Initial Game Offerings to unlock tokens.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#232B3B] text-[11px] font-bold text-gray-400">
                    <th className="py-3 px-3">Game & Symbol</th>
                    <th className="py-3 px-3">Contributed</th>
                    <th className="py-3 px-3">Allocated Tokens</th>
                    <th className="py-3 px-3">Vesting Rule</th>
                    <th className="py-3 px-3 text-right">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#232B3B]">
                  {myAllocations.map(alloc => (
                    <tr key={alloc.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-black text-xs"
                            style={{ backgroundColor: alloc.iconBg }}
                          >
                            {alloc.symbol[0]}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block">{alloc.name}</span>
                            <span className="text-[10.5px] font-mono text-purple-600 dark:text-purple-400">${alloc.symbol}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900 dark:text-white">
                        ${alloc.userContributionUsdt?.toLocaleString()} USDT
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {alloc.userTokensAllocated?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {alloc.symbol}
                      </td>

                      <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] max-w-xs">
                        {alloc.tokenomics.vestingSchedule}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {alloc.isClaimed ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] border border-emerald-500/30">
                            Claimed to Wallet
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaim(alloc.id)}
                            className="px-3 py-1 bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            Claim Tokens
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PARTICIPATION MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161B26] border border-gray-200 dark:border-[#232B3B] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
                  style={{ backgroundColor: selectedProject.iconBg }}
                >
                  {selectedProject.symbol[0]}
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">
                    {selectedProject.name}
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-mono font-bold">
                    ${selectedProject.symbol} • {selectedProject.genre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            {/* Token Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-[#1E293B] rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">IGO Price</span>
                  <span className="font-mono font-black text-gray-900 dark:text-white">${selectedProject.priceUsdt}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">Total Supply</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedProject.tokenomics.totalTokens}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">Chain</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{selectedProject.chain}</span>
                </div>
              </div>

              {/* Contribution Input */}
              {selectedProject.status === 'LIVE' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Enter Contribution Amount (USDT)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={participateAmount}
                      onChange={e => setParticipateAmount(e.target.value)}
                      placeholder="500"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      USDT
                    </span>
                  </div>

                  {/* Est Tokens */}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                    <span>Est. Tokens Received:</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {((parseFloat(participateAmount) || 0) / selectedProject.priceUsdt).toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedProject.symbol}
                    </span>
                  </div>
                </div>
              )}

              {/* Vesting Schedule */}
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200/50 dark:border-purple-800/40 text-[11px] space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300 block">Vesting & Release Schedule:</span>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedProject.tokenomics.vestingSchedule}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#232B3B]">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl cursor-pointer"
              >
                Close
              </button>
              {selectedProject.status === 'LIVE' && (
                <button
                  type="button"
                  onClick={handleParticipate}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Confirm Contribution
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
