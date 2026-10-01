import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { PortfolioSummary } from '../types';

interface AnalyticsViewProps {
  portfolio: PortfolioSummary | null;
  isDark?: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ portfolio, isDark = false }) => {
  const pnlHistory = [
    { date: 'Aug 28', pnl: 450 },
    { date: 'Aug 29', pnl: 890 },
    { date: 'Aug 30', pnl: 1420 },
    { date: 'Aug 31', pnl: 1210 },
    { date: 'Sep 01', pnl: 2150 },
    { date: 'Sep 02', pnl: 2890 },
    { date: 'Sep 03', pnl: 3450 },
  ];

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">Cumulative Net Profit</span>
          <div className="text-2xl font-black text-[#10B981] mt-1">+$3,450.80</div>
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 block">▲ +3.4% this month</span>
        </div>

        <div className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">Win Rate</span>
          <div className="text-2xl font-black text-[#0F172A] dark:text-white mt-1">74.2%</div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">89 Wins / 31 Losses</span>
        </div>

        <div className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">Sharpe Ratio</span>
          <div className="text-2xl font-black text-[#0F172A] dark:text-white mt-1">2.84</div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">Institutional Grade</span>
        </div>

        <div className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">Profit Factor</span>
          <div className="text-2xl font-black text-[#0F172A] dark:text-white mt-1">3.15</div>
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 block">Gross Win / Gross Loss</span>
        </div>
      </div>

      {/* Main Charts & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PnL Growth Curve */}
        <div className="lg:col-span-8 bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] dark:border-[#232B3B]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Historical PnL Growth</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">Daily net realized + unrealized profit curve</span>
            </div>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">
              +28.4% All-Time
            </span>
          </div>

          <div className="h-64 mt-6 flex items-end justify-between gap-4 px-2">
            {pnlHistory.map((item) => {
              const heightPct = (item.pnl / 4000) * 100;
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">+${item.pnl}</span>
                  <div
                    className="w-full bg-[#0B3B3C] dark:bg-[#14B8A6] rounded-t-xl hover:bg-[#0F4C4E] dark:hover:bg-teal-400 transition-all cursor-pointer"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white mb-4">Portfolio Asset Allocation</h3>
            <div className="space-y-3">
              {portfolio?.balances.map((b) => {
                const totalEq = portfolio.total_equity_usd || 1;
                const pct = (b.usd_value / totalEq) * 100;
                return (
                  <div key={b.asset}>
                    <div className="flex justify-between text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                      <span>{b.asset}</span>
                      <span className="font-mono">{pct.toFixed(1)}% (${b.usd_value.toLocaleString('en-US', { maximumFractionDigits: 0 })})</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-[#1E293B] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B3B3C] dark:bg-[#14B8A6] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F1F5F9] dark:border-[#232B3B] text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Margin health is well above maintenance limit (98.4%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
