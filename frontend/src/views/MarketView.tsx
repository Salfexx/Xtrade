import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Ticker } from '../types';
import { Sparkline } from '../components/Sparkline';

interface MarketViewProps {
  tickers: Ticker[];
  onSelectTrade: (symbol: string) => void;
  isDark?: boolean;
}

export const MarketView: React.FC<MarketViewProps> = ({ tickers, onSelectTrade }) => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'Spot' | 'Gainers' | 'High Volume'>('All');
  const [search, setSearch] = useState('');

  const filteredTickers = tickers.filter((t) => {
    const matchesSearch = t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterCategory === 'Gainers') return t.price_change_pct_24h > 5;
    if (filterCategory === 'High Volume') return t.volume_24h > 5000;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B3B3C] dark:from-[#0F2E2E] to-[#145355] dark:to-[#163E3E] text-white rounded-3xl p-8 shadow-md border border-transparent dark:border-[#232B3B]">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Markets Overview</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Real-Time Cryptocurrency Screener</h2>
          <p className="text-sm text-gray-200 mt-2 font-medium">
            Explore 100+ spot & futures pairs with live matching engine depth, 24-hour volume stats, and institutional execution.
          </p>
        </div>
      </div>

      {/* Market Screener Table Card */}
      <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9] dark:border-[#232B3B]">
          {/* Categories */}
          <div className="flex items-center gap-2 bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300">
            {(['All', 'Spot', 'Gainers', 'High Volume'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  filterCategory === cat 
                    ? 'bg-white dark:bg-[#121722] text-gray-900 dark:text-white shadow-2xs font-black' 
                    : 'hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex items-center w-full sm:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search coin or pair..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {filteredTickers.map((ticker, idx) => {
                const isPos = ticker.price_change_pct_24h >= 0;
                return (
                  <tr
                    key={ticker.symbol}
                    className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectTrade(ticker.symbol)}
                  >
                    <td className="py-4 px-4 flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-gray-400 w-4">{idx + 1}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-2xs"
                        style={{ backgroundColor: ticker.icon_color || '#0B3B3C' }}
                      >
                        {ticker.base_asset[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0F172A] dark:text-white text-sm">{ticker.name}</span>
                        <span className="font-semibold text-[#94A3B8] dark:text-gray-400 text-[11px]">{ticker.symbol}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-black text-[#0F172A] dark:text-white text-sm font-mono">
                      ${ticker.last_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300 font-mono">
                      <div>H: ${ticker.high_24h.toFixed(2)}</div>
                      <div className="text-gray-400 dark:text-gray-500">L: ${ticker.low_24h.toFixed(2)}</div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-gray-800 dark:text-gray-200">
                      ${(ticker.quote_volume_24h / 1_000_000).toFixed(2)}M
                    </td>

                    <td className="py-4 px-4">
                      <Sparkline data={ticker.sparkline_7d} isPositive={isPos} width={90} height={28} />
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrade(ticker.symbol);
                        }}
                        className="px-4 py-1.5 bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-bold text-xs rounded-xl hover:bg-[#0F4C4E] dark:hover:bg-teal-400 transition-all shadow-2xs"
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
