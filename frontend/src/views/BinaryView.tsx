import React, { useState, useEffect } from 'react';
import { BinaryTradeWidget } from '../components/BinaryTradeWidget';
import { Ticker, BinaryContract, BinaryStats } from '../types';
import { api } from '../services/api';
import { Trophy, Target, Award, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

interface BinaryViewProps {
  tickers: Ticker[];
  onRefreshPortfolio?: () => void;
  isDark?: boolean;
}

export const BinaryView: React.FC<BinaryViewProps> = ({
  tickers,
  onRefreshPortfolio,
  isDark = false,
}) => {
  const [contracts, setContracts] = useState<BinaryContract[]>([]);
  const [stats, setStats] = useState<BinaryStats | null>(null);

  const fetchHistory = async () => {
    try {
      const [cList, s] = await Promise.all([
        api.getBinaryContracts(),
        api.getBinaryStats(),
      ]);
      setContracts(cList);
      setStats(s);
    } catch (e) {
      console.error('Failed to fetch binary history', e);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 max-w-[1680px] mx-auto pb-12">
      {/* Top Banner Stats (Ultra Compact - 50% Further Height Reduction) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Total Binary Profit */}
        <div className="bg-white dark:bg-[#161B26] rounded-xl py-1.5 px-3.5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981] rounded-lg">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] dark:text-gray-400 block leading-tight">Total Profit</span>
              <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 block leading-tight">Net Realized</span>
            </div>
          </div>
          <div className={`text-sm font-black font-mono ${
            (stats?.total_profit_usd || 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
          }`}>
            {(stats?.total_profit_usd || 0) >= 0 ? '+' : ''}${stats ? stats.total_profit_usd.toFixed(2) : '0.00'}
          </div>
        </div>

        {/* Card 2: Binary Win Rate */}
        <div className="bg-white dark:bg-[#161B26] rounded-xl py-1.5 px-3.5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] dark:text-gray-400 block leading-tight">Win Rate</span>
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 block leading-tight">
                {stats?.wins || 0}W / {stats?.losses || 0}L
              </span>
            </div>
          </div>
          <div className="text-sm font-black text-[#0F172A] dark:text-white font-mono">
            {stats ? stats.win_rate_pct.toFixed(1) : '0.0'}%
          </div>
        </div>

        {/* Card 3: Fixed Payout Ratio */}
        <div className="bg-white dark:bg-[#161B26] rounded-xl py-1.5 px-3.5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-teal-50 dark:bg-teal-950/50 text-[#0B3B3C] dark:text-[#14B8A6] rounded-lg">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] dark:text-gray-400 block leading-tight">Fixed Payout</span>
              <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 block leading-tight">Zero Slippage</span>
            </div>
          </div>
          <div className="text-sm font-black text-[#0B3B3C] dark:text-[#14B8A6] font-mono">
            97.00%
          </div>
        </div>

        {/* Card 4: Fast Execution */}
        <div className="bg-white dark:bg-[#161B26] rounded-xl py-1.5 px-3.5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] dark:text-gray-400 block leading-tight">Expiry Range</span>
              <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 block leading-tight">Sub-Second</span>
            </div>
          </div>
          <div className="text-sm font-black text-[#0F172A] dark:text-white font-mono">
            10s - 1H
          </div>
        </div>
      </div>

      {/* Main Interactive Binary Trading Engine */}
      <BinaryTradeWidget
        tickers={tickers}
        onRefreshPortfolio={onRefreshPortfolio}
        isDark={isDark}
      />

      {/* Binary Trade History Table */}
      <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] dark:border-[#232B3B]">
          <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Binary Options History</h3>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{contracts.length} Total Trades</span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                <th className="py-3 px-3">Asset</th>
                <th className="py-3 px-3">Direction</th>
                <th className="py-3 px-3">Stake</th>
                <th className="py-3 px-3">Strike Price</th>
                <th className="py-3 px-3">Exit Price</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Payout</th>
                <th className="py-3 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 dark:text-gray-500 font-semibold">
                    No binary trade history yet. Place your first Call or Put above!
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const isCall = c.direction === 'Call';
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#0F172A] dark:text-white">{c.symbol}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                          isCall ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                        }`}>
                          {c.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-800 dark:text-white">${c.stake_usd.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono text-gray-700 dark:text-gray-300">${c.strike_price.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono text-gray-700 dark:text-gray-300">
                        {c.settlement_price ? `$${c.settlement_price.toFixed(2)}` : 'Pending...'}
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{c.duration_seconds}s</td>
                      <td className="py-3 px-3 font-mono font-black">
                        {c.status === 'Profit' || c.status === 'Won' ? (
                          <span className="text-[#10B981]">+${c.payout_usd.toFixed(2)}</span>
                        ) : c.status === 'Lost' ? (
                          <span className="text-gray-400 dark:text-gray-500">$0.00</span>
                        ) : (
                          <span className="text-gray-400">Est. +${(c.stake_usd * (1 + c.payout_pct)).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {c.status === 'Profit' || c.status === 'Won' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#10B981] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3.5 h-3.5" /> PROFIT
                          </span>
                        ) : c.status === 'Lost' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#EF4444] bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                            <XCircle className="w-3.5 h-3.5" /> LOST
                          </span>
                        ) : c.status === 'Tied' ? (
                          <span className="font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            TIED (REFUND)
                          </span>
                        ) : (
                          <span className="font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
