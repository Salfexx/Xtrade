import React, { useState } from 'react';
import { X, ArrowDownUp } from 'lucide-react';
import { api } from '../../services/api';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [fromAsset, setFromAsset] = useState('USDT');
  const [toAsset, setToAsset] = useState('ETH');
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSwap = async () => {
    setLoading(true);
    try {
      const quote = await api.requestOtcQuote(fromAsset, toAsset, parseFloat(amount) || 100);
      await api.executeOtcSwap(quote.quote_id);
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#161B26] rounded-3xl max-w-md w-full p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#232B3B]">
          <h3 className="text-lg font-black text-[#0F172A] dark:text-white">Instant Swap</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-200 dark:border-[#2E384D] flex justify-between items-center">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-xl font-bold text-[#0F172A] dark:text-white focus:outline-none w-full"
            />
            <select
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value)}
              className="bg-white dark:bg-[#121722] border border-gray-200 dark:border-[#2E384D] px-3 py-1.5 rounded-xl font-bold text-xs text-gray-800 dark:text-white shadow-2xs cursor-pointer"
            >
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
            </select>
          </div>

          <div className="flex justify-center -my-1">
            <button
              onClick={() => {
                const temp = fromAsset;
                setFromAsset(toAsset);
                setToAsset(temp);
              }}
              className="p-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-full text-[#0B3B3C] dark:text-[#14B8A6] shadow-sm hover:rotate-180 transition-transform"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-200 dark:border-[#2E384D] flex justify-between items-center">
            <span className="text-xl font-bold text-[#0F172A] dark:text-white">Output (Auto-Quote)</span>
            <select
              value={toAsset}
              onChange={(e) => setToAsset(e.target.value)}
              className="bg-white dark:bg-[#121722] border border-gray-200 dark:border-[#2E384D] px-3 py-1.5 rounded-xl font-bold text-xs text-gray-800 dark:text-white shadow-2xs cursor-pointer"
            >
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
              <option value="SOL">SOL</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={loading}
          className="w-full py-3 bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-bold text-sm rounded-xl hover:bg-[#0F4C4E] dark:hover:bg-teal-400 transition-all shadow-sm"
        >
          {loading ? 'Executing...' : `Convert ${amount} ${fromAsset} to ${toAsset}`}
        </button>
      </div>
    </div>
  );
};
