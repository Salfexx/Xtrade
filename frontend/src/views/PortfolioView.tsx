import React, { useMemo, useState } from 'react';
import { 
  ArrowDownToLine, ArrowUpRight, ArrowRightLeft, History, CheckCircle, 
  Zap, ArrowDownUp, RefreshCw, Sparkles, Coins, BarChart2
} from 'lucide-react';
import { PortfolioSummary, Ticker } from '../types';
import { OtcView } from './OtcView';
import { AnalyticsView } from './AnalyticsView';

interface PortfolioViewProps {
  portfolio: PortfolioSummary | null;
  tickers?: Ticker[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onRefreshPortfolio?: () => void;
  isDark?: boolean;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  tickers = [],
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onRefreshPortfolio,
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState<'HOLDINGS' | 'OTC' | 'HISTORY' | 'ANALYTICS'>('HOLDINGS');
  const [selectedConvertAsset, setSelectedConvertAsset] = useState<string>('USDT');

  // Live dynamic asset balances with real-time mark prices from Binance
  const liveBalances = useMemo(() => {
    if (!portfolio?.balances) return [];
    return portfolio.balances.map((b) => {
      if (b.asset === 'USDT') {
        return { ...b, livePrice: 1.0, liveUsdValue: b.total };
      }
      const sym = `${b.asset}/USDT`;
      const t = tickers.find((tick) => tick.symbol === sym) || tickers.find((tick) => tick.base_asset === b.asset);
      const price = t ? t.last_price : (b.usd_value > 0 ? b.usd_value / b.total : 0);
      const liveUsdValue = b.total * price;
      return {
        ...b,
        livePrice: price,
        liveUsdValue,
      };
    });
  }, [portfolio, tickers]);

  // Live total portfolio valuation
  const liveTotalEquity = useMemo(() => {
    if (liveBalances.length === 0) return portfolio?.total_equity_usd || 102540;
    return liveBalances.reduce((acc, b) => acc + b.liveUsdValue, 0);
  }, [liveBalances, portfolio]);

  const handleRowConvert = (asset: string) => {
    setSelectedConvertAsset(asset);
    setActiveTab('OTC');
  };

  const subAccounts = useMemo(() => {
    if (portfolio?.sub_accounts && portfolio.sub_accounts.length > 0) {
      return portfolio.sub_accounts;
    }
    return [
      { account_id: 'spot', name: 'Spot Trading Account', usd_value: liveTotalEquity * 0.65, percentage: 65.0, color: '#10B981' },
      { account_id: 'margin', name: 'Margin Trading (Cross Margin)', usd_value: liveTotalEquity * 0.18, percentage: 18.0, color: '#F59E0B' },
      { account_id: 'futures', name: 'Leverage Trading (Perpetual Future Trading)', usd_value: liveTotalEquity * 0.10, percentage: 10.0, color: '#8B5CF6' },
      { account_id: 'funding', name: 'Funding / P2P Wallet', usd_value: liveTotalEquity * 0.07, percentage: 7.0, color: '#0EA5E9' },
    ];
  }, [portfolio?.sub_accounts, liveTotalEquity]);

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-12">
      {/* Top Balance Summary Card with Compact Asset Allocation Bar + Account Pills */}
      <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-5 transition-colors">
        {/* Top Valuation & Actions Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">Total Portfolio Valuation</span>
            <div className="text-3xl font-black text-[#0F172A] dark:text-white mt-1 tracking-tight">
              ${liveTotalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>Available: <strong className="text-gray-900 dark:text-white">${portfolio ? portfolio.available_balance_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</strong></span>
              <span>Locked in Orders: <strong className="text-gray-900 dark:text-white">${portfolio ? portfolio.margin_used_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</strong></span>
              <span>Network: <strong className="text-[#0B3B3C] dark:text-[#14B8A6]">{portfolio?.chain || 'BNB Chain'}</strong></span>
            </div>
          </div>

          {/* Action Buttons: Deposit, Withdraw, OTC & Instant Convert, Transfer */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-2 py-2.5 px-4 bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-bold text-xs rounded-xl hover:bg-[#0F4C4E] dark:hover:bg-teal-400 transition-all shadow-sm"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <button
              onClick={onOpenWithdraw}
              className="flex items-center gap-2 py-2.5 px-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] text-[#0F172A] dark:text-white font-bold text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-2xs"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'OTC' ? 'HOLDINGS' : 'OTC')}
              className={`flex items-center gap-2 py-2.5 px-4 border font-bold text-xs rounded-xl transition-all shadow-2xs ${
                activeTab === 'OTC'
                  ? 'bg-amber-400 text-gray-950 border-amber-400 font-black shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>OTC & Instant Convert</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="flex items-center gap-2 py-2.5 px-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] text-[#0F172A] dark:text-white font-bold text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-2xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Option 2: Multi-Account Asset Allocation Bar + Sub-Account Pills */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#232B3B] space-y-3">
          {/* Segmented Multi-Color Allocation Bar */}
          <div className="w-full h-2.5 bg-gray-100 dark:bg-[#1E293B] rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {subAccounts.map((acc) => (
              <div
                key={acc.account_id}
                style={{
                  width: `${Math.max(acc.percentage, 2)}%`,
                  backgroundColor: acc.color,
                }}
                className="h-full rounded-full transition-all duration-500 hover:brightness-110 cursor-pointer"
                title={`${acc.name}: $${acc.usd_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${acc.percentage.toFixed(1)}%)`}
              />
            ))}
          </div>

          {/* Sub-Account Pills with Individual Balances (Increased height by 25%) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {subAccounts.map((acc) => (
              <button
                key={acc.account_id}
                onClick={onOpenTransfer}
                className="flex items-center justify-between py-4 px-4 bg-[#F8FAFC] dark:bg-[#1A2232] hover:bg-gray-100 dark:hover:bg-[#20293D] border border-gray-200 dark:border-[#2A3447] rounded-xl text-left transition-all group cursor-pointer shadow-2xs min-h-[68px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block truncate leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {acc.name}
                    </span>
                    <span className="text-sm font-black text-[#0F172A] dark:text-white font-mono mt-1 block">
                      ${acc.usd_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-lg shrink-0 font-mono ml-2"
                  style={{
                    backgroundColor: `${acc.color}15`,
                    color: acc.color,
                  }}
                >
                  {acc.percentage.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400">
          <button
            onClick={() => setActiveTab('HOLDINGS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'HOLDINGS'
                ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                : 'hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Asset Balances</span>
          </button>
          <button
            onClick={() => setActiveTab('OTC')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'OTC'
                ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                : 'hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Instant OTC Convert</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                : 'hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transaction History</span>
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                : 'hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-emerald-500" />
            <span>Portfolio Analytics</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Asset Holdings Table */}
      {activeTab === 'HOLDINGS' && (
        <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Crypto Asset Holdings</h3>
            <span className="text-xs text-gray-400 font-semibold">{liveBalances.length} Assets Registered</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Free Amount</th>
                  <th className="py-3 px-4">Locked in Orders</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Live Price</th>
                  <th className="py-3 px-4 text-right">USD Value</th>
                  <th className="py-3 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                {liveBalances.map((b) => (
                  <tr key={b.asset} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#0F172A] dark:text-white text-sm">
                      {b.asset}
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {b.free.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className="py-4 px-4 font-mono text-gray-500 dark:text-gray-400">
                      {b.locked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#0F172A] dark:text-white">
                      {b.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-gray-600 dark:text-gray-300">
                      ${b.livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-[#0F172A] dark:text-white text-sm font-mono">
                      ${b.liveUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleRowConvert(b.asset)}
                        className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs font-bold hover:bg-amber-400 hover:text-gray-950 transition-all shadow-2xs"
                      >
                        Convert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: OTC & Instant Convert Terminal */}
      {activeTab === 'OTC' && (
        <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <OtcView onSuccessSwap={onRefreshPortfolio || (() => {})} isDark={isDark} />
        </div>
      )}

      {/* Tab 3: Recent Activity / Transaction Audit Log */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] dark:border-[#232B3B]">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#0B3B3C] dark:text-[#14B8A6]" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Wallet & OTC Transaction History</h3>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-400 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Value (USD)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC] dark:divide-[#1E293B]">
                {portfolio?.recent_activities.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0F172A] dark:text-white">
                      {act.tx_type}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300">{act.asset}</td>
                    <td className="py-3 px-4 font-mono text-gray-800 dark:text-gray-200">{act.amount}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A] dark:text-white">
                      ${act.usd_value.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 dark:text-gray-500 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Portfolio Analytics & PnL Performance */}
      {activeTab === 'ANALYTICS' && (
        <div>
          <AnalyticsView portfolio={portfolio} isDark={isDark} />
        </div>
      )}
    </div>
  );
};
