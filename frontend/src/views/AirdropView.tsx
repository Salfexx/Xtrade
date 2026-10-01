import React, { useState } from 'react';
import { 
  Gift, Sparkles, CheckCircle2, Clock, ExternalLink, Zap, ShieldCheck, 
  ArrowUpRight, Search, Filter, Coins, Trophy, AlertCircle, ChevronRight, Check
} from 'lucide-react';

interface AirdropItem {
  id: string;
  name: string;
  ticker: string;
  logoBg: string;
  chain: string;
  category: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CONFIRMED' | 'ENDED';
  estimatedValue: string;
  tasksCount: number;
  completedTasks: number;
  deadline: string;
  description: string;
  requirements: string[];
  claimableAmount?: string;
  isClaimed?: boolean;
}

const INITIAL_AIRDROPS: AirdropItem[] = [
  {
    id: 'airdrop-1',
    name: 'Berachain Protocol',
    ticker: 'BERA',
    logoBg: '#8B4513',
    chain: 'Berachain L1',
    category: 'Layer 1 / DeFi',
    status: 'ACTIVE',
    estimatedValue: '$850 - $2,400',
    tasksCount: 5,
    completedTasks: 3,
    deadline: '14 Days Left',
    description: 'Proof-of-Liquidity Layer 1 blockchain built on Cosmos SDK with full EVM compatibility.',
    requirements: [
      'Bridge testnet BERA tokens via native faucet',
      'Provide liquidity on BEX decentralized exchange',
      'Mint Honey stablecoin on Bend lending protocol',
      'Execute at least 10 on-chain smart contract transactions',
    ],
    claimableAmount: '450 BERA',
    isClaimed: false,
  },
  {
    id: 'airdrop-2',
    name: 'Monad Network',
    ticker: 'MONAD',
    logoBg: '#6B46C1',
    chain: 'Monad',
    category: 'High-Throughput EVM',
    status: 'ACTIVE',
    estimatedValue: '$1,200 - $3,500',
    tasksCount: 4,
    completedTasks: 4,
    deadline: '21 Days Left',
    description: 'Ultra-high performance 10,000 TPS EVM Layer-1 with parallel execution and pipelined consensus.',
    requirements: [
      'Connect wallet to Devnet RPC',
      'Participate in Discord community role governance',
      'Test ecosystem DEX swaps and liquidity pool staking',
      'Hold testnet developer badge',
    ],
    claimableAmount: '1,200 MONAD',
    isClaimed: false,
  },
  {
    id: 'airdrop-3',
    name: 'Eclipse Mainnet',
    ticker: 'ECLIPSE',
    logoBg: '#0F172A',
    chain: 'Ethereum L2 (SVM)',
    category: 'Layer 2 / SVM',
    status: 'CONFIRMED',
    estimatedValue: '$600 - $1,800',
    tasksCount: 3,
    completedTasks: 2,
    deadline: '8 Days Left',
    description: 'Ethereum fastest Layer-2 powered by the Solana Virtual Machine and Celestia DA layer.',
    requirements: [
      'Bridge ETH from Ethereum Mainnet to Eclipse',
      'Swap on Orca SVM on Eclipse',
      'Hold invariant NFT commemorative pass',
    ],
    claimableAmount: '680 ECLIPSE',
    isClaimed: false,
  },
  {
    id: 'airdrop-4',
    name: 'Hyperliquid Hypurr',
    ticker: 'HYPE',
    logoBg: '#00C896',
    chain: 'Hyperliquid L1',
    category: 'Perp DEX / L1',
    status: 'ACTIVE',
    estimatedValue: '$2,000 - $8,000',
    tasksCount: 4,
    completedTasks: 3,
    deadline: '30 Days Left',
    description: 'Custom Layer-1 optimized for high-performance order book perpetual trading and vaults.',
    requirements: [
      'Generate >$10,000 monthly trading volume on Perps',
      'Deposit liquidity into HLP market maker vault',
      'Maintain positive equity balance on account',
    ],
    claimableAmount: '2,500 HYPE',
    isClaimed: false,
  },
  {
    id: 'airdrop-5',
    name: 'Scroll zkEVM Season 2',
    ticker: 'SCR',
    logoBg: '#FF6B00',
    chain: 'Scroll',
    category: 'Zero-Knowledge L2',
    status: 'UPCOMING',
    estimatedValue: '$400 - $1,100',
    tasksCount: 4,
    completedTasks: 1,
    deadline: 'Starts in 5 Days',
    description: 'Native zkEVM Layer-2 scaling Ethereum security with bytecode-level compatibility.',
    requirements: [
      'Deploy smart contract via Scroll verification tool',
      'Provide >$500 liquidity across approved AMMs',
      'Mint Scroll Canvas soulbound badges',
    ],
    claimableAmount: '350 SCR',
    isClaimed: false,
  },
  {
    id: 'airdrop-6',
    name: 'Grass DePIN Network',
    ticker: 'GRASS',
    logoBg: '#10B981',
    chain: 'Solana',
    category: 'DePIN / AI Data',
    status: 'CONFIRMED',
    estimatedValue: '$300 - $950',
    tasksCount: 2,
    completedTasks: 2,
    deadline: 'Claim Open',
    description: 'Decentralized residential network protocol scraping clean public web data for AI training models.',
    requirements: [
      'Run desktop node with >100 uptime hours',
      'Verify Solana wallet and complete KYC verification',
    ],
    claimableAmount: '820 GRASS',
    isClaimed: false,
  },
];

export const AirdropView: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const [airdrops, setAirdrops] = useState<AirdropItem[]>(INITIAL_AIRDROPS);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ACTIVE' | 'CONFIRMED' | 'UPCOMING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = (id: string) => {
    setClaimingId(id);
    setTimeout(() => {
      setAirdrops((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isClaimed: true } : item
        )
      );
      setClaimingId(null);
    }, 1200);
  };

  const filteredAirdrops = airdrops.filter((item) => {
    const matchesFilter = selectedFilter === 'ALL' || item.status === selectedFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalEstimatedRewards = airdrops
    .filter((a) => a.completedTasks >= a.tasksCount && !a.isClaimed)
    .length;

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B3B3C] via-[#0F4C4E] to-[#14B8A6] rounded-2xl p-6 text-white card-shadow relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              AIRDROP REWARDS HUB
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-gray-950 text-[10px] font-black uppercase">
              100% Free Allocation
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Discover, Track & Claim Web3 Crypto Airdrops
          </h1>
          <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
            Participate in verified testnet campaigns, staking quests, and early protocol incentive pools to claim token allocations directly to your Xtrade portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center min-w-[140px]">
            <span className="text-[11px] font-bold text-teal-200 block">Eligible Airdrops</span>
            <span className="text-2xl font-black font-mono mt-0.5 block text-white">
              {totalEstimatedRewards} Pending
            </span>
          </div>
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center min-w-[140px]">
            <span className="text-[11px] font-bold text-teal-200 block">Est. Portfolio Boost</span>
            <span className="text-2xl font-black font-mono mt-0.5 block text-amber-300">
              +$3,850+
            </span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400">
          {(['ALL', 'ACTIVE', 'CONFIRMED', 'UPCOMING'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedFilter === filter
                  ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                  : 'hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex items-center w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search airdrop, chain, token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#161B26] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Airdrop Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAirdrops.map((item) => {
          const isReadyToClaim = item.completedTasks >= item.tasksCount && !item.isClaimed;
          const progressPct = (item.completedTasks / item.tasksCount) * 100;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col justify-between transition-all hover:border-[#0B3B3C]/30 dark:hover:border-[#14B8A6]/40 hover:-translate-y-0.5 group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                      style={{ backgroundColor: item.logoBg }}
                    >
                      {item.ticker.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white leading-tight group-hover:text-[#0B3B3C] dark:group-hover:text-[#14B8A6] transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400">
                          {item.chain}
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] border border-emerald-200 dark:border-emerald-800'
                        : item.status === 'CONFIRMED'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Rewards & Deadline Specs */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800 text-xs font-semibold">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Est. Value</span>
                    <span className="font-bold text-[#0F172A] dark:text-white font-mono">
                      {item.estimatedValue}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Time Window</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {item.deadline}
                    </span>
                  </div>
                </div>

                {/* Quest Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-600 dark:text-gray-300">Quest Tasks</span>
                    <span className="text-[#0B3B3C] dark:text-[#14B8A6] font-mono">
                      {item.completedTasks}/{item.tasksCount} Completed
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B3B3C] dark:bg-[#14B8A6] rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div className="mt-4 space-y-1.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Protocol Tasks:
                  </span>
                  {item.requirements.map((req, idx) => {
                    const isDone = idx < item.completedTasks;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-[11px]">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" />
                        )}
                        <span className={isDone ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                          {req}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                {item.isClaimed ? (
                  <div className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-4 h-4" />
                    <span>Claimed {item.claimableAmount}</span>
                  </div>
                ) : isReadyToClaim ? (
                  <button
                    onClick={() => handleClaim(item.id)}
                    disabled={claimingId === item.id}
                    className="w-full py-2.5 px-4 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Gift className="w-4 h-4" />
                    <span>
                      {claimingId === item.id ? 'Claiming Allocation...' : `Claim ${item.claimableAmount}`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAirdrops((prev) =>
                        prev.map((a) =>
                          a.id === item.id
                            ? { ...a, completedTasks: Math.min(a.tasksCount, a.completedTasks + 1) }
                            : a
                        )
                      );
                    }}
                    className="w-full py-2.5 px-4 bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-teal-50 dark:hover:bg-teal-950/40 text-[#0F172A] dark:text-white border border-gray-200 dark:border-gray-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 group-hover:border-[#0B3B3C] dark:group-hover:border-[#14B8A6] cursor-pointer"
                  >
                    <span>Complete Next Quest</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
