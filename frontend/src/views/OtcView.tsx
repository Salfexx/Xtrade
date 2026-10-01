import React, { useState, useEffect } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { api } from '../services/api';
import { OtcQuoteResponse } from '../types';

interface OtcViewProps {
  onSuccessSwap: () => void;
  isDark?: boolean;
}

export const OtcView: React.FC<OtcViewProps> = ({ onSuccessSwap }) => {
  const [fromAsset, setFromAsset] = useState('USDT');
  const [toAsset, setToAsset] = useState('BTC');
  const [fromAmount, setFromAmount] = useState('5000');
  const [quote, setQuote] = useState<OtcQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const fetchQuote = async () => {
    try {
      const q = await api.requestOtcQuote(fromAsset, toAsset, parseFloat(fromAmount) || 100);
      setQuote(q);
      setCountdown(30);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote();
    }
  }, [fromAsset, toAsset, fromAmount]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQuote();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fromAsset, toAsset, fromAmount]);

  const handleExecute = async () => {
    if (!quote) return;
    setLoading(true);
    try {
      await api.executeOtcSwap(quote.quote_id);
      alert('OTC Swap Executed Successfully!');
      onSuccessSwap();
      fetchQuote();
    } catch (e: any) {
      alert(e.message || 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">Xtrade OTC & Instant Convert</h2>
        <p className="text-sm font-medium text-[#64748B] dark:text-gray-400">
          Guaranteed price execution with zero slippage and direct settlement.
        </p>
      </div>

      {/* OTC Card */}
      <div className="bg-white dark:bg-[#161B26] rounded-3xl p-8 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-6 transition-colors">
        {/* You Pay */}
        <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2E384D]">
          <div className="flex justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
            <span>You Pay</span>
            <span>Available: Free Balance</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="bg-transparent text-3xl font-black text-[#0F172A] dark:text-white focus:outline-none w-full font-mono"
            />
            <select
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value)}
              className="bg-white dark:bg-[#121722] border border-gray-200 dark:border-[#2E384D] px-4 py-2 rounded-xl text-base font-bold text-gray-800 dark:text-white shadow-2xs cursor-pointer"
            >
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
            </select>
          </div>
        </div>

        {/* Swap Switch Button */}
        <div className="flex justify-center -my-3">
          <button
            onClick={() => {
              const temp = fromAsset;
              setFromAsset(toAsset);
              setToAsset(temp);
            }}
            className="p-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 text-[#0B3B3C] dark:text-[#14B8A6] transition-transform hover:rotate-180"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* You Receive */}
        <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2E384D]">
          <div className="flex justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
            <span>You Receive (Estimated)</span>
            <span>Direct Settlement</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-3xl font-black text-[#0F172A] dark:text-white font-mono">
              {quote ? quote.to_amount.toFixed(6) : '0.000000'}
            </span>
            <select
              value={toAsset}
              onChange={(e) => setToAsset(e.target.value)}
              className="bg-white dark:bg-[#121722] border border-gray-200 dark:border-[#2E384D] px-4 py-2 rounded-xl text-base font-bold text-gray-800 dark:text-white shadow-2xs cursor-pointer"
            >
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="bg-[#F1F5F9]/60 dark:bg-[#1E293B]/60 p-4 rounded-2xl space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Price Rate:</span>
              <span className="font-mono text-gray-900 dark:text-white font-bold">1 {fromAsset} ≈ {quote.exchange_rate.toFixed(6)} {toAsset}</span>
            </div>
            <div className="flex justify-between">
              <span>Guaranteed Quote Time:</span>
              <span className="font-mono text-[#0B3B3C] dark:text-[#14B8A6] font-bold">{countdown}s remaining</span>
            </div>
            <div className="flex justify-between">
              <span>Slippage & Platform Fee:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.00% (Guaranteed)</span>
            </div>
          </div>
        )}

        <button
          onClick={handleExecute}
          disabled={loading || !quote}
          className="w-full py-4 bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-black text-base rounded-2xl hover:bg-[#0F4C4E] dark:hover:bg-teal-400 transition-all shadow-md flex items-center justify-center gap-2"
        >
          {loading ? 'Executing Settlement...' : `Convert ${fromAmount} ${fromAsset} to ${toAsset}`}
        </button>
      </div>
    </div>
  );
};
