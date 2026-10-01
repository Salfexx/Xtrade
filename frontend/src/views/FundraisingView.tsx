import React, { useState } from 'react';
import { 
  Sparkles, TrendingUp, CheckCircle2, Clock, 
  Coins, ArrowUpRight, DollarSign, Search, 
  ChevronRight, Trophy, Zap, Info, Rocket, Globe, FileText, Check,
  Building2, Layers, ShieldCheck, AlertTriangle, ExternalLink, Calendar,
  PieChart, Users
} from 'lucide-react';
import { Ticker } from '../types';

interface ProjectSale {
  id: string;
  name: string;
  symbol: string;
  logoBg: string;
  category: string;
  chain: string;
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED';
  priceUsdt: number;
  currentPrice?: number;
  targetRaiseUsdt: number;
  raisedUsdt: number;
  participantsCount: number;
  startDate: string;
  endDate: string;
  description: string;
  tokenomics: {
    totalTokens: string;
    initialMarketCap: string;
    vestingSchedule: string;
    distribution?: { label: string; pct: number }[];
  };
  userContributionUsdt?: number;
  userTokensAllocated?: number;
  isClaimed?: boolean;
}

interface VCFundingRound {
  id: string;
  projectName: string;
  symbol?: string;
  logoBg: string;
  stage: 'Seed' | 'Pre-Seed' | 'Series A' | 'Series B' | 'Strategic';
  amountRaisedUsd: number;
  valuationUsd?: number;
  sector: 'Layer 1 / 2' | 'AI & DePIN' | 'DeFi' | 'Infrastructure' | 'Restaking & Staking' | 'RWA';
  leadInvestors: string[];
  allInvestors: string[];
  date: string;
  description: string;
  website: string;
}

interface TokenUnlockItem {
  id: string;
  symbol: string;
  name: string;
  unlockDate: string;
  daysRemaining: number;
  unlockAmountUsd: number;
  percentOfCirculating: number;
  isHighRisk: boolean;
  recipientType: 'Team & Advisors' | 'Early Investors (Seed)' | 'Ecosystem Growth';
}

const INITIAL_PROJECTS: ProjectSale[] = [
  {
    id: 'proj-1',
    name: 'Nexus AI Layer',
    symbol: 'NEX',
    logoBg: '#10B981',
    category: 'DePIN & Decentralized AI',
    chain: 'Ethereum L2',
    status: 'LIVE',
    priceUsdt: 0.10,
    currentPrice: 0.285,
    targetRaiseUsdt: 2500000,
    raisedUsdt: 2150000,
    participantsCount: 3420,
    startDate: '2026-08-28',
    endDate: '3 Days Left',
    description: 'Decentralized compute marketplace aggregating sovereign GPU clusters for high-performance AI inference and training.',
    tokenomics: {
      totalTokens: '1,000,000,000 NEX',
      initialMarketCap: '$2,500,000',
      vestingSchedule: '25% at TGE, linear monthly vesting over 6 months',
      distribution: [
        { label: 'Ecosystem & Rewards', pct: 35 },
        { label: 'Public Launchpad', pct: 10 },
        { label: 'Early Backers', pct: 20 },
        { label: 'Core Contributors', pct: 15 },
        { label: 'Staking Reserve', pct: 20 },
      ],
    },
    userContributionUsdt: 1000,
    userTokensAllocated: 10000,
    isClaimed: false,
  },
  {
    id: 'proj-2',
    name: 'ZeroSync Privacy',
    symbol: 'ZSYNC',
    logoBg: '#6366F1',
    category: 'ZK-Rollup & Privacy Layer',
    chain: 'Ethereum L2 (ZK)',
    status: 'LIVE',
    priceUsdt: 0.05,
    currentPrice: 0.05,
    targetRaiseUsdt: 1800000,
    raisedUsdt: 1420000,
    participantsCount: 2180,
    startDate: '2026-09-01',
    endDate: '7 Days Left',
    description: 'Zero-knowledge succinct proofs enabling private, low-fee smart contracts and institutional privacy compliance.',
    tokenomics: {
      totalTokens: '2,000,000,000 ZSYNC',
      initialMarketCap: '$1,800,000',
      vestingSchedule: '30% at TGE, 70% linear monthly over 5 months',
      distribution: [
        { label: 'Protocol Treasury', pct: 40 },
        { label: 'Public Sale', pct: 15 },
        { label: 'Seed Investors', pct: 15 },
        { label: 'Core Team', pct: 15 },
        { label: 'Liquidity Pools', pct: 15 },
      ],
    },
    userContributionUsdt: 500,
    userTokensAllocated: 10000,
    isClaimed: false,
  },
  {
    id: 'proj-3',
    name: 'Solana Superchain DEX',
    symbol: 'SSDX',
    logoBg: '#EC4899',
    category: 'High-Frequency Cross-Chain DEX',
    chain: 'Solana SVM',
    status: 'UPCOMING',
    priceUsdt: 0.08,
    targetRaiseUsdt: 3000000,
    raisedUsdt: 0,
    participantsCount: 0,
    startDate: 'Opens in 4 Days',
    endDate: 'TBA',
    description: 'Central limit orderbook engine achieving 50,000 sub-millisecond swaps with native cross-chain liquidity routing.',
    tokenomics: {
      totalTokens: '500,000,000 SSDX',
      initialMarketCap: '$3,000,000',
      vestingSchedule: '20% at TGE, 80% linear over 6 months',
      distribution: [
        { label: 'Community Liquidity', pct: 45 },
        { label: 'Public Launch', pct: 10 },
        { label: 'Venture Backers', pct: 20 },
        { label: 'Founders', pct: 15 },
        { label: 'Advisors', pct: 10 },
      ],
    },
  },
  {
    id: 'proj-4',
    name: 'HyperBore Real World Assets',
    symbol: 'HBOR',
    logoBg: '#0B3B3C',
    category: 'RWA & Tokenized Treasury',
    chain: 'Base L2',
    status: 'COMPLETED',
    priceUsdt: 0.50,
    currentPrice: 1.85,
    targetRaiseUsdt: 5000000,
    raisedUsdt: 5000000,
    participantsCount: 6850,
    startDate: 'Completed',
    endDate: 'Closed',
    description: 'On-chain yield-bearing token backed 1:1 by short-term US Treasury Bills with automated daily rebasing yield.',
    tokenomics: {
      totalTokens: '100,000,000 HBOR',
      initialMarketCap: '$5,000,000',
      vestingSchedule: '100% unlocked at TGE',
      distribution: [
        { label: 'Reserve Vault', pct: 50 },
        { label: 'Public Offering', pct: 20 },
        { label: 'Institutional Seed', pct: 15 },
        { label: 'Team', pct: 15 },
      ],
    },
    userContributionUsdt: 2000,
    userTokensAllocated: 4000,
    isClaimed: true,
  },
];

const GLOBAL_VC_ROUNDS: VCFundingRound[] = [
  {
    id: 'vc-1',
    projectName: 'Movement Labs',
    symbol: 'MOVE',
    logoBg: '#F59E0B',
    stage: 'Series A',
    amountRaisedUsd: 38000000,
    valuationUsd: 350000000,
    sector: 'Layer 1 / 2',
    leadInvestors: ['Polychain Capital', 'Binance Labs', 'Hack VC'],
    allInvestors: ['Foresight Ventures', 'Robot Ventures', 'Nomad Capital'],
    date: '2026-08-22',
    description: 'Modular Move-based execution network bringing the Move programming language to Ethereum layer-2 rollups.',
    website: 'movementlabs.xyz',
  },
  {
    id: 'vc-2',
    projectName: 'Sahara AI',
    symbol: 'SAHARA',
    logoBg: '#10B981',
    stage: 'Seed',
    amountRaisedUsd: 43000000,
    valuationUsd: 220000000,
    sector: 'AI & DePIN',
    leadInvestors: ['Pantera Capital', 'Binance Labs', 'Polychain Capital'],
    allInvestors: ['Samsung Next', 'Matrix Partners', 'dao5'],
    date: '2026-08-14',
    description: 'Decentralized artificial intelligence collaborative platform empowering sovereign data attribution and compute rewards.',
    website: 'sahara.ai',
  },
  {
    id: 'vc-3',
    projectName: 'Morpho Labs',
    symbol: 'MORPHO',
    logoBg: '#3B82F6',
    stage: 'Strategic',
    amountRaisedUsd: 50000000,
    valuationUsd: 450000000,
    sector: 'DeFi',
    leadInvestors: ['a16z crypto', 'Ribbit Capital'],
    allInvestors: ['Coinbase Ventures', 'Brevan Howard', 'Variant'],
    date: '2026-07-30',
    description: 'Peer-to-peer decentralized lending primitive revolutionizing non-custodial money markets and yield optimization.',
    website: 'morpho.org',
  },
  {
    id: 'vc-4',
    projectName: 'Monad Labs',
    symbol: 'MONAD',
    logoBg: '#8B5CF6',
    stage: 'Series A',
    amountRaisedUsd: 225000000,
    valuationUsd: 3000000000,
    sector: 'Layer 1 / 2',
    leadInvestors: ['Paradigm', 'Electric Capital'],
    allInvestors: ['Greenoaks Capital', 'Dragonfly', 'Placeholder'],
    date: '2026-07-18',
    description: 'Ultra-high-throughput parallelized EVM Layer-1 blockchain capable of processing 10,000 transactions per second.',
    website: 'monad.xyz',
  },
  {
    id: 'vc-5',
    projectName: 'Caldera',
    symbol: 'CALD',
    logoBg: '#EC4899',
    stage: 'Series A',
    amountRaisedUsd: 15000000,
    valuationUsd: 120000000,
    sector: 'Infrastructure',
    leadInvestors: ['Founders Fund', 'Dragonfly'],
    allInvestors: ['Sequoia Capital', '1kx', 'Lattice'],
    date: '2026-07-02',
    description: 'One-click customizable rollup deployment engine supporting Arbitrum Orbit, OP Stack, and ZK stacks.',
    website: 'caldera.xyz',
  },
  {
    id: 'vc-6',
    projectName: 'Babylon Chain',
    symbol: 'BBN',
    logoBg: '#EF4444',
    stage: 'Strategic',
    amountRaisedUsd: 70000000,
    valuationUsd: 500000000,
    sector: 'Restaking & Staking',
    leadInvestors: ['Paradigm', 'Polychain Capital', 'Binance Labs'],
    allInvestors: ['Bullish Capital', 'Hack VC', 'Framework Ventures'],
    date: '2026-06-25',
    description: 'Pioneering trustless Bitcoin staking protocol enabling BTC holders to secure proof-of-stake networks without bridging.',
    website: 'babylonchain.io',
  },
  {
    id: 'vc-7',
    projectName: 'Story Protocol',
    symbol: 'STORY',
    logoBg: '#14B8A6',
    stage: 'Series B',
    amountRaisedUsd: 80000000,
    valuationUsd: 2250000000,
    sector: 'Infrastructure',
    leadInvestors: ['a16z crypto', 'Polychain Capital'],
    allInvestors: ['Hashed', 'Mirana Ventures', 'Balaji Srinivasan'],
    date: '2026-06-12',
    description: 'The world’s first programmable intellectual property layer transforming media, creativity, and AI training data into liquid on-chain assets.',
    website: 'storyprotocol.xyz',
  },
  {
    id: 'vc-8',
    projectName: 'Berachain',
    symbol: 'BERA',
    logoBg: '#D97706',
    stage: 'Series B',
    amountRaisedUsd: 100000000,
    valuationUsd: 1500000000,
    sector: 'Layer 1 / 2',
    leadInvestors: ['Brevan Howard', 'Framework Ventures'],
    allInvestors: ['Polychain Capital', 'Hack VC', 'Tribe Capital'],
    date: '2026-05-28',
    description: 'EVM-compatible Layer-1 network powered by the innovative Proof-of-Liquidity consensus mechanism.',
    website: 'berachain.com',
  },
];

const UPCOMING_UNLOCKS: TokenUnlockItem[] = [
  {
    id: 'unl-1',
    symbol: 'TIA',
    name: 'Celestia',
    unlockDate: 'In 6 Days (Sept 10)',
    daysRemaining: 6,
    unlockAmountUsd: 85400000,
    percentOfCirculating: 5.2,
    isHighRisk: true,
    recipientType: 'Early Investors (Seed)',
  },
  {
    id: 'unl-2',
    symbol: 'ARB',
    name: 'Arbitrum',
    unlockDate: 'In 11 Days (Sept 15)',
    daysRemaining: 11,
    unlockAmountUsd: 52100000,
    percentOfCirculating: 2.8,
    isHighRisk: false,
    recipientType: 'Team & Advisors',
  },
  {
    id: 'unl-3',
    symbol: 'SUI',
    name: 'Sui Network',
    unlockDate: 'In 18 Days (Sept 22)',
    daysRemaining: 18,
    unlockAmountUsd: 44200000,
    percentOfCirculating: 3.1,
    isHighRisk: false,
    recipientType: 'Ecosystem Growth',
  },
  {
    id: 'unl-4',
    symbol: 'APT',
    name: 'Aptos',
    unlockDate: 'In 22 Days (Sept 26)',
    daysRemaining: 22,
    unlockAmountUsd: 68900000,
    percentOfCirculating: 4.6,
    isHighRisk: false,
    recipientType: 'Early Investors (Seed)',
  },
];

interface FundraisingViewProps {
  tickers?: Ticker[];
  onNavigateToTrade?: (symbol: string) => void;
  isDark?: boolean;
}

export const FundraisingView: React.FC<FundraisingViewProps> = ({ onNavigateToTrade, isDark = false }) => {
  const [activeMainTab, setActiveMainTab] = useState<'LAUNCHPAD' | 'VC_ROUNDS'>('LAUNCHPAD');
  const [projects, setProjects] = useState<ProjectSale[]>(INITIAL_PROJECTS);
  const [filterTab, setFilterTab] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [vcStageFilter, setVcStageFilter] = useState<string>('ALL');
  const [vcSectorFilter, setVcSectorFilter] = useState<string>('ALL');
  const [vcBackerFilter, setVcBackerFilter] = useState<string>('ALL');

  const [selectedProject, setSelectedProject] = useState<ProjectSale | null>(null);
  const [selectedVcRound, setSelectedVcRound] = useState<VCFundingRound | null>(null);
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
    showToast(`✅ Successfully contributed $${amt.toLocaleString()} USDT! Tokens allocated to your account.`);
    setSelectedProject(null);
  };

  const handleClaim = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, isClaimed: true };
      }
      return p;
    }));
    showToast('🎉 Tokens successfully claimed to your Spot Wallet!');
  };

  const filteredProjects = projects.filter(p => {
    if (filterTab !== 'ALL' && p.status !== filterTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredVcRounds = GLOBAL_VC_ROUNDS.filter(r => {
    if (vcStageFilter !== 'ALL' && r.stage !== vcStageFilter) return false;
    if (vcSectorFilter !== 'ALL' && r.sector !== vcSectorFilter) return false;
    if (vcBackerFilter !== 'ALL' && !r.leadInvestors.some(inv => inv.toLowerCase().includes(vcBackerFilter.toLowerCase()))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.projectName.toLowerCase().includes(q) || r.sector.toLowerCase().includes(q) || r.leadInvestors.some(i => i.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-16">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#10B981] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 font-bold text-sm border border-white/20">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B3B3C] via-[#0D4446] to-[#125A5C] dark:from-[#091D1E] dark:via-[#0E2E2F] dark:to-[#133E3F] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
            <Rocket className="w-4 h-4 text-[#10B981]" />
            <span>GLOBAL CRYPTO FUNDRAISING & LAUNCHPAD</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Web3 Venture Capital & Public Token Launchpad
          </h1>

          <p className="text-sm sm:text-base text-gray-200 font-medium leading-relaxed max-w-2xl">
            Track tier-1 institutional VC deals, token unlock schedules, and participate in verified early-stage token sales before global exchange listings.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">Total Capital Tracked</span>
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-0.5 block">
                $3.42B USD
              </span>
            </div>
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">VC Rounds Audited</span>
              <span className="text-lg sm:text-xl font-black font-mono text-white mt-0.5 block">
                248 Deals
              </span>
            </div>
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">Active Launchpads</span>
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 mt-0.5 block">
                35 Monitored
              </span>
            </div>
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-gray-300 block">All-Time Avg ROI</span>
              <span className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-0.5 block">
                +320% ATH
              </span>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-10">
          <Rocket className="w-80 h-80 text-white" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#161B26] rounded-2xl p-2 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#1E293B] p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveMainTab('LAUNCHPAD')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-black text-xs transition-all cursor-pointer ${
              activeMainTab === 'LAUNCHPAD'
                ? 'bg-[#10B981] text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Public Token Sales (Launchpad)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('VC_ROUNDS')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-black text-xs transition-all cursor-pointer ${
              activeMainTab === 'VC_ROUNDS'
                ? 'bg-[#10B981] text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Global VC & Seed Funding Rounds (CryptoRank Data)</span>
          </button>
        </div>

        <div className="relative flex items-center w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder={activeMainTab === 'LAUNCHPAD' ? 'Search launchpad sales...' : 'Search projects, VCs, sectors...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl text-xs font-medium text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
          />
        </div>
      </div>

      {activeMainTab === 'LAUNCHPAD' && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 w-fit">
            {[
              { id: 'ALL', label: 'All Sales' },
              { id: 'LIVE', label: '🟢 Live Sales' },
              { id: 'UPCOMING', label: '⏳ Upcoming' },
              { id: 'COMPLETED', label: '✅ Completed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-white dark:bg-[#121722] text-gray-900 dark:text-white shadow-2xs font-black'
                    : 'hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map(project => {
              const progress = Math.min(100, (project.raisedUsdt / project.targetRaiseUsdt) * 100);

              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-[#161B26] rounded-3xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow card-hover flex flex-col justify-between transition-all space-y-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md"
                          style={{ backgroundColor: project.logoBg }}
                        >
                          {project.symbol[0]}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 dark:text-white text-base leading-snug">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-gray-400">{project.symbol}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-[#10B981] font-bold">
                              {project.chain}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${
                        project.status === 'LIVE'
                          ? 'bg-emerald-500/15 text-[#10B981] border border-emerald-500/30 animate-pulse'
                          : project.status === 'UPCOMING'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                      }`}>
                        {project.status === 'LIVE' ? '🟢 Live Sale' : project.status === 'UPCOMING' ? '⏳ Upcoming' : '✅ Ended'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>

                    <div className="bg-[#F8FAFC] dark:bg-[#1E293B] rounded-2xl p-3.5 space-y-2 border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400">Total Raised</span>
                        <span className="text-gray-900 dark:text-white font-mono">
                          ${(project.raisedUsdt / 1_000_000).toFixed(2)}M / ${(project.targetRaiseUsdt / 1_000_000).toFixed(2)}M
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#10B981] to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-0.5">
                        <span>{progress.toFixed(1)}% Filled</span>
                        <span>{project.participantsCount.toLocaleString()} Participants</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-400 block text-[10px]">Token Sale Price</span>
                        <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                          ${project.priceUsdt.toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-400 block text-[10px]">Current Market</span>
                        <span className="font-mono font-black text-emerald-500 text-sm">
                          {project.currentPrice ? `$${project.currentPrice.toFixed(2)}` : 'At TGE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        project.status === 'LIVE'
                          ? 'bg-[#10B981] hover:bg-emerald-600 text-white active:scale-95'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {project.status === 'LIVE' ? (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>Participate in Sale</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>View Tokenomics & Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-[#161B26] rounded-3xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>My Launchpad Portfolio & Allocations</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Track your committed fundraising capital, claim tokens, and review vesting schedules.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Contributed</th>
                    <th className="py-3 px-4">Tokens Allocated</th>
                    <th className="py-3 px-4">Current Value</th>
                    <th className="py-3 px-4">Vesting Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                  {projects.filter(p => (p.userContributionUsdt || 0) > 0).map(item => {
                    const curVal = item.currentPrice 
                      ? (item.userTokensAllocated || 0) * item.currentPrice 
                      : item.userContributionUsdt || 0;
                    const pnl = curVal - (item.userContributionUsdt || 0);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4 flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs"
                            style={{ backgroundColor: item.logoBg }}
                          >
                            {item.symbol[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">{item.symbol}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-gray-800 dark:text-gray-200">
                          ${item.userContributionUsdt?.toLocaleString()} USDT
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-gray-800 dark:text-gray-200">
                          {item.userTokensAllocated?.toLocaleString()} {item.symbol}
                        </td>

                        <td className="py-4 px-4 font-mono font-bold">
                          <div className="text-gray-900 dark:text-white">${curVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                          <span className={`text-[10px] font-bold ${pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {item.isClaimed ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[#10B981] font-bold text-[11px] border border-emerald-500/20">
                              Tokens In Wallet
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-bold text-[11px] border border-blue-500/20">
                              Allocated (Claim at TGE)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {!item.isClaimed ? (
                            <button
                              onClick={() => handleClaim(item.id)}
                              className="px-3 py-1.5 bg-[#10B981] text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-2xs cursor-pointer"
                            >
                              Claim Tokens
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-gray-400">Claimed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeMainTab === 'VC_ROUNDS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#161B26] rounded-2xl p-4 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-gray-400 mr-1">Stage:</span>
              {['ALL', 'Seed', 'Series A', 'Series B', 'Strategic'].map(stage => (
                <button
                  key={stage}
                  onClick={() => setVcStageFilter(stage)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    vcStageFilter === stage
                      ? 'bg-[#10B981] text-white font-black shadow-xs'
                      : 'bg-gray-100 dark:bg-[#1E293B] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-gray-400 mr-1">Sector:</span>
              {['ALL', 'Layer 1 / 2', 'AI & DePIN', 'DeFi', 'Infrastructure', 'Restaking & Staking'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setVcSectorFilter(sec)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    vcSectorFilter === sec
                      ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white font-black shadow-xs'
                      : 'bg-gray-100 dark:bg-[#1E293B] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-gray-400 mr-1">Lead VC:</span>
              {['ALL', 'a16z', 'Paradigm', 'Binance', 'Polychain', 'Pantera'].map(vc => (
                <button
                  key={vc}
                  onClick={() => setVcBackerFilter(vc)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    vcBackerFilter === vc
                      ? 'bg-purple-600 text-white font-black shadow-xs'
                      : 'bg-gray-100 dark:bg-[#1E293B] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {vc}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white dark:bg-[#161B26] rounded-3xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#10B981]" />
                    <span>Audited Institutional VC Funding Deals ({filteredVcRounds.length})</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Real-time dataset aggregated across verified SEC Form D filings and venture announcements.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-[11px] font-semibold text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Round</th>
                      <th className="py-3 px-3">Raised</th>
                      <th className="py-3 px-3">Valuation</th>
                      <th className="py-3 px-3">Lead Backers</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                    {filteredVcRounds.map((round) => (
                      <tr key={round.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3 flex items-center gap-2.5">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0"
                            style={{ backgroundColor: round.logoBg }}
                          >
                            {round.projectName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-xs">{round.projectName}</div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                              {round.sector}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            round.stage === 'Seed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]'
                              : round.stage === 'Series A'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-500'
                              : round.stage === 'Series B'
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-500'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-500'
                          }`}>
                            {round.stage}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono font-black text-gray-900 dark:text-white">
                          ${(round.amountRaisedUsd / 1_000_000).toFixed(1)}M
                        </td>

                        <td className="py-3.5 px-3 font-mono text-gray-500 dark:text-gray-400">
                          {round.valuationUsd ? `$${(round.valuationUsd / 1_000_000).toFixed(0)}M` : '—'}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {round.leadInvestors.map((inv) => (
                              <span key={inv} className="px-1.5 py-0.2 bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-700 dark:text-gray-300 rounded">
                                {inv}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-[11px] text-gray-400 font-mono">
                          {round.date}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedVcRound(round)}
                            className="text-xs font-bold text-[#0B3B3C] dark:text-[#14B8A6] hover:underline cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-[#161B26] rounded-3xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#10B981]" />
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Upcoming Token Unlocks Radar
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981]">
                    NEXT 30 DAYS
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Monitor massive supply cliff unlock events across major tokens that could impact liquidity and market volatility.
                </p>

                <div className="space-y-2.5 pt-1">
                  {UPCOMING_UNLOCKS.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3 bg-gray-50 dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-gray-900 dark:text-white">{item.name}</span>
                          <span className="text-[10px] font-bold text-gray-400">{item.symbol}</span>
                        </div>
                        <span className="text-[10px] font-bold font-mono text-[#10B981] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {item.unlockDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Unlock Value:</span>
                        <span className="font-mono font-black text-gray-900 dark:text-white">
                          ${(item.unlockAmountUsd / 1_000_000).toFixed(1)}M USD
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200/50 dark:border-gray-700/40">
                        <span className="text-gray-500 dark:text-gray-400">{item.recipientType}</span>
                        <span className={`font-bold ${item.isHighRisk ? 'text-rose-500' : 'text-gray-400'}`}>
                          {item.percentOfCirculating}% of Supply {item.isHighRisk ? '⚠️' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161B26] w-full max-w-2xl rounded-3xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md"
                  style={{ backgroundColor: selectedProject.logoBg }}
                >
                  {selectedProject.symbol[0]}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{selectedProject.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-gray-400">{selectedProject.symbol}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-[#10B981] font-bold">
                      {selectedProject.chain}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#1E293B] rounded-2xl p-4 space-y-3 border border-gray-100 dark:border-gray-800 text-xs">
              <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-[#10B981]" />
                <span>Token Distribution & Vesting Schedule</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-gray-400 block">Total Supply:</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{selectedProject.tokenomics.totalTokens}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Initial Market Cap:</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{selectedProject.tokenomics.initialMarketCap}</span>
                </div>
              </div>

              {selectedProject.tokenomics.distribution && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-gray-400 block text-[10px]">Allocation Breakdown:</span>
                  <div className="space-y-1">
                    {selectedProject.tokenomics.distribution.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-600 dark:text-gray-300">{d.label}</span>
                        <span className="font-bold font-mono text-gray-900 dark:text-white">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Vesting Schedule:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300 text-[11px]">{selectedProject.tokenomics.vestingSchedule}</span>
              </div>
            </div>

            {selectedProject.status === 'LIVE' && (
              <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#10B981]" />
                  <span>Participate in Public Token Sale</span>
                </h4>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={participateAmount}
                      onChange={(e) => setParticipateAmount(e.target.value)}
                      placeholder="Amount in USDT"
                      className="w-full px-4 py-2 bg-white dark:bg-[#121722] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">USDT</span>
                  </div>
                  <button
                    onClick={handleParticipate}
                    className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Confirm Allocation
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVcRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161B26] w-full max-w-lg rounded-3xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black shadow-md"
                  style={{ backgroundColor: selectedVcRound.logoBg }}
                >
                  {selectedVcRound.projectName[0]}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base">{selectedVcRound.projectName}</h3>
                  <span className="text-xs text-gray-400">{selectedVcRound.sector}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVcRound(null)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {selectedVcRound.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl">
                <span className="text-gray-400 block text-[10px]">Round Raised</span>
                <span className="font-mono font-black text-emerald-500 text-sm">
                  ${(selectedVcRound.amountRaisedUsd / 1_000_000).toFixed(1)}M USD
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl">
                <span className="text-gray-400 block text-[10px]">Valuation</span>
                <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                  {selectedVcRound.valuationUsd ? `$${(selectedVcRound.valuationUsd / 1_000_000).toFixed(0)}M USD` : 'Undisclosed'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-gray-400 block">All Participating Backers:</span>
              <div className="flex flex-wrap gap-1.5">
                {[...selectedVcRound.leadInvestors, ...selectedVcRound.allInvestors].map(inv => (
                  <span key={inv} className="px-2 py-0.5 bg-gray-100 dark:bg-[#1E293B] text-[11px] font-semibold text-gray-700 dark:text-gray-300 rounded-lg">
                    {inv}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-mono text-gray-400">Date: {selectedVcRound.date}</span>
              <button
                onClick={() => setSelectedVcRound(null)}
                className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
