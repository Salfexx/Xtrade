import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('500');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      await api.walletAction({ action: 'withdraw', asset, amount: parseFloat(amount), address });
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Withdraw failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#161B26] rounded-3xl max-w-md w-full p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#232B3B]">
          <h3 className="text-lg font-black text-[#0F172A] dark:text-white">Withdraw Funds</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Select Asset</label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
          >
            <option value="USDT">USDT (Tether USD)</option>
            <option value="BTC">BTC (Bitcoin)</option>
            <option value="ETH">ETH (Ethereum)</option>
            <option value="SOL">SOL (Solana)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Destination Address</label>
          <input
            type="text"
            placeholder="Enter recipient wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Withdraw Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-gray-200 dark:border-[#2E384D] rounded-xl text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
          />
        </div>

        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="w-full py-3 bg-[#EF4444] text-white font-bold text-sm rounded-xl hover:bg-rose-600 transition-all shadow-sm"
        >
          {loading ? 'Processing...' : `Confirm Withdrawal of ${amount} ${asset}`}
        </button>
      </div>
    </div>
  );
};
