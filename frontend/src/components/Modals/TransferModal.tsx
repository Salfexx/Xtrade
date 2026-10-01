import React, { useState, useEffect } from 'react';
import { X, ArrowUpDown, CheckCircle2, AlertCircle, ShieldCheck, Wallet, Zap, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { PortfolioSummary } from '../../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  portfolio?: PortfolioSummary | null;
}

const ACCOUNTS = [
  { id: 'Spot Trading Account', label: 'Spot Trading Account', desc: 'Main Spot Trading' },
  { id: 'Margin Trading (Cross Margin)', label: 'Margin Trading (Cross Margin)', desc: 'Cross Margin Borrow & Trade' },
  { id: 'Leverage Trading (Perpetual Future Trading)', label: 'Leverage Trading (Perpetual Future Trading)', desc: 'Perpetual Contracts & Leverage' },
  { id: 'Funding / P2P Wallet', label: 'Funding / P2P Wallet', desc: 'OTC & External Flow' },
];

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  portfolio,
}) => {
  const [fromAccount, setFromAccount] = useState('Spot Trading Account');
  const [toAccount, setToAccount] = useState('Margin Trading (Cross Margin)');
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  // Available assets list from portfolio or default standard assets
  const availableAssets = portfolio?.balances && portfolio.balances.length > 0
    ? portfolio.balances.map((b) => b.asset)
    : ['USDT', 'BTC', 'ETH', 'SOL', 'LTC', 'XRP'];

  // Current balance of selected asset
  const currentAssetBalance = portfolio?.balances?.find((b) => b.asset === asset);
  const availableBalance = currentAssetBalance ? currentAssetBalance.free : 0;
  const assetPrice = currentAssetBalance && currentAssetBalance.total > 0
    ? currentAssetBalance.usd_value / currentAssetBalance.total
    : asset === 'USDT' ? 1.0 : 0.0;

  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * (assetPrice || 1.0);

  // Auto-validate amount
  useEffect(() => {
    if (!amount || amount.trim() === '') {
      setError(null);
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount greater than 0');
    } else if (availableBalance > 0 && val > availableBalance) {
      setError(`Amount exceeds available balance (${availableBalance.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${asset})`);
    } else if (fromAccount === toAccount) {
      setError('Source and destination accounts cannot be the same');
    } else {
      setError(null);
    }
  }, [amount, availableBalance, asset, fromAccount, toAccount]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      if (availableBalance > 0 && (!amount || numAmount === 0)) {
        setAmount(Math.min(1000, availableBalance).toString());
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwapDirection = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 350);
    const temp = fromAccount;
    setFromAccount(toAccount);
    setToAccount(temp);
  };

  const handlePercentageSelect = (pct: number) => {
    if (availableBalance <= 0) {
      setAmount('0');
      return;
    }
    const calculated = availableBalance * pct;
    const decimals = asset === 'USDT' || asset === 'XRP' ? 2 : 4;
    setAmount(calculated.toFixed(decimals));
  };

  const handleFromAccountChange = (val: string) => {
    setFromAccount(val);
    if (val === toAccount) {
      const remaining = ACCOUNTS.find((a) => a.id !== val);
      if (remaining) setToAccount(remaining.id);
    }
  };

  const handleToAccountChange = (val: string) => {
    setToAccount(val);
    if (val === fromAccount) {
      const remaining = ACCOUNTS.find((a) => a.id !== val);
      if (remaining) setFromAccount(remaining.id);
    }
  };

  const handleTransfer = async () => {
    if (numAmount <= 0) {
      setError('Please enter a transfer amount');
      return;
    }
    if (fromAccount === toAccount) {
      setError('Source and Destination accounts must be different');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.walletAction({
        action: 'transfer',
        asset,
        amount: numAmount,
        from_wallet: fromAccount,
        to_wallet: toAccount,
      });

      setSuccessMessage(`Successfully transferred ${numAmount.toLocaleString()} ${asset} to ${toAccount}!`);
      onSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1200);
    } catch (e: any) {
      setError(e.message || 'Transfer failed. Please check your balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161B26] rounded-3xl max-w-lg w-full p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-5 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-[#232B3B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-[#0B3B3C] dark:text-[#14B8A6] flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0F172A] dark:text-white leading-none">Internal Account Transfer</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">Instant & zero-fee transfer between your sub-accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer From / To Account Selector Cards */}
        <div className="relative bg-[#F8FAFC] dark:bg-[#1A2232] rounded-2xl p-4 border border-gray-200 dark:border-[#2A3447] space-y-3">
          {/* FROM */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                From (Source)
              </label>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                {fromAccount}
              </span>
            </div>
            <select
              value={fromAccount}
              onChange={(e) => handleFromAccountChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#121722] border border-gray-200 dark:border-[#2E384D] rounded-xl text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6] cursor-pointer shadow-2xs"
            >
              {ACCOUNTS.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reverse Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapDirection}
              title="Reverse transfer direction"
              className={`p-2 bg-white dark:bg-[#121722] border border-gray-200 dark:border-[#2E384D] rounded-full text-[#0B3B3C] dark:text-[#14B8A6] shadow-md hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-all ${
                isRotating ? 'rotate-180 duration-300' : ''
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                To (Destination)
              </label>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                {toAccount}
              </span>
            </div>
            <select
              value={toAccount}
              onChange={(e) => handleToAccountChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#121722] border border-gray-200 dark:border-[#2E384D] rounded-xl text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6] cursor-pointer shadow-2xs"
            >
              {ACCOUNTS.map((acc) => (
                <option key={acc.id} value={acc.id} disabled={acc.id === fromAccount}>
                  {acc.label} {acc.id === fromAccount ? '(Selected as Source)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Asset Selection & Live Balance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Select Asset</label>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Wallet className="w-3.5 h-3.5 text-gray-400" />
              <span>Available in Source:</span>
              <strong className="text-gray-900 dark:text-white font-mono">
                {availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {asset}
              </strong>
            </div>
          </div>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6] cursor-pointer"
          >
            {availableAssets.map((ast) => (
              <option key={ast} value={ast}>
                {ast}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input with Quick-Pick Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Transfer Amount</label>
            {usdValue > 0 && (
              <span className="text-xs font-semibold text-gray-400 font-mono">
                ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full pl-3.5 pr-20 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border rounded-xl text-sm font-bold text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-rose-300 dark:border-rose-600 focus:ring-rose-500'
                  : 'border-gray-200 dark:border-[#2E384D] focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]'
              }`}
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              <span className="text-xs font-black text-gray-400">{asset}</span>
              <button
                type="button"
                onClick={() => handlePercentageSelect(1.0)}
                className="px-2 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700 text-[#0B3B3C] dark:text-[#14B8A6] rounded-lg text-[10px] font-black hover:bg-[#0B3B3C] hover:text-white dark:hover:bg-[#14B8A6] dark:hover:text-gray-950 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Quick Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[0.25, 0.5, 0.75, 1.0].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageSelect(pct)}
                className="py-1.5 px-2 bg-gray-50 dark:bg-[#1E293B] hover:bg-teal-50 dark:hover:bg-teal-950/40 text-gray-600 dark:text-gray-300 hover:text-[#0B3B3C] dark:hover:text-[#14B8A6] border border-gray-200 dark:border-[#2E384D] hover:border-teal-300 dark:hover:border-teal-700 rounded-lg text-xs font-bold transition-all text-center"
              >
                {pct === 1.0 ? '100% (MAX)' : `${pct * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Error or Success feedback */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Transfer Breakdown & Feature Highlights */}
        <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/70 p-3.5 rounded-xl border border-gray-200 dark:border-[#2A3447] text-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Transfer Fee
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">0.00 {asset} (Zero Fee)</span>
          </div>
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Settlement Speed
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">Instant (Real-Time Sub-Ledger)</span>
          </div>
        </div>

        {/* Submit Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={loading || !!error || numAmount <= 0}
          className="w-full py-3.5 bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-black text-sm rounded-xl hover:bg-[#0F4C4E] dark:hover:bg-teal-400 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Processing Transfer...</span>
            </div>
          ) : (
            <span>
              Transfer {numAmount > 0 ? numAmount.toLocaleString() : '0'} {asset} to {toAccount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
