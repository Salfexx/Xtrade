import React, { useState, useRef, useEffect } from 'react';
import { 
  User, ShieldCheck, CheckCircle2, Copy, Check, Key, Percent, 
  History, Settings, LogOut, ChevronRight, Wallet, Layers, Zap, 
  Target, Shield, Smartphone, Lock
} from 'lucide-react';
import { PortfolioSummary } from '../types';

interface ProfileFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
  portfolio?: PortfolioSummary | null;
  isDark?: boolean;
}

export const ProfileFlyout: React.FC<ProfileFlyoutProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  portfolio,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'SECURITY'>('OVERVIEW');
  const flyoutRef = useRef<HTMLDivElement>(null);

  const USER_UID = '849204192';
  const USER_EMAIL = 'oripios@gmail.com';
  const USER_NAME = 'Oripio Sajibur';

  // Handle click outside to close flyout
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCopyUid = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(USER_UID);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={flyoutRef}
      className="absolute right-0 top-12 w-[360px] sm:w-[390px] bg-white dark:bg-[#161B26] border border-[#E5E9EB] dark:border-[#232B3B] rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2"
    >
      {/* 1. Header Identity Banner */}
      <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] dark:from-[#1A2232] dark:to-[#121722] border-b border-[#E5E9EB] dark:border-[#232B3B]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar with Online Beacon */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-[#10B981] flex items-center justify-center border-2 border-[#10B981]/30 font-black text-lg shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] border-2 border-white dark:border-[#161B26] rounded-full ring-1 ring-emerald-500/20" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-[#0F172A] dark:text-white leading-tight">
                  {USER_NAME}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] tracking-tight border border-amber-500/30">
                  VIP 2
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mt-0.5">
                {USER_EMAIL}
              </span>
              
              {/* UID & 1-Click Copy */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-mono font-bold text-gray-400 dark:text-gray-500">
                  UID: <span className="text-gray-700 dark:text-gray-300">{USER_UID}</span>
                </span>
                <button
                  onClick={handleCopyUid}
                  title="Copy User ID"
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                >
                  {copiedUid ? (
                    <>
                      <Check className="w-3 h-3 text-[#10B981]" />
                      <span className="text-[#10B981] font-bold text-[9.5px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[9.5px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Verified (L2)
            </span>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="grid grid-cols-2 gap-1 bg-white/60 dark:bg-[#121722]/60 p-1 rounded-xl text-xs font-bold mt-3 border border-gray-200/50 dark:border-gray-800/50">
          <button
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`py-1 rounded-lg transition-all text-center cursor-pointer ${
              activeSubTab === 'OVERVIEW'
                ? 'bg-white dark:bg-[#1A2232] text-[#0F172A] dark:text-white shadow-2xs font-black'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Account Overview
          </button>
          <button
            onClick={() => setActiveSubTab('SECURITY')}
            className={`py-1 rounded-lg transition-all text-center cursor-pointer ${
              activeSubTab === 'SECURITY'
                ? 'bg-white dark:bg-[#1A2232] text-[#0F172A] dark:text-white shadow-2xs font-black'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Security & KYC
          </button>
        </div>
      </div>

      {/* 2. Body Content */}
      <div className="p-4 space-y-3.5 max-h-[420px] overflow-y-auto no-scrollbar">
        {activeSubTab === 'OVERVIEW' ? (
          <>
            {/* Wallet Assets Summary */}
            <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 p-3 rounded-xl border border-gray-100 dark:border-[#2E384D] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#10B981]" />
                  Total Net Assets
                </span>
                <span className="text-xs font-black font-mono text-[#0F172A] dark:text-white">
                  ${portfolio ? portfolio.total_equity_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '50,000.00'} USDT
                </span>
              </div>

              {/* Sub-account breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 dark:border-gray-700/60 text-[11px]">
                <div className="bg-white dark:bg-[#161B26] p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-400 text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Spot Wallet
                  </div>
                  <div className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                    $24,500.00
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161B26] p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-400 text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Margin (3x-10x)
                  </div>
                  <div className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                    $15,000.00
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161B26] p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-400 text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Futures (100x)
                  </div>
                  <div className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                    $8,500.00
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161B26] p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-400 text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Binary Desk
                  </div>
                  <div className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                    $2,000.00
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Fee Tier Card */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#10B981]" />
                <div>
                  <span className="font-bold text-emerald-950 dark:text-emerald-300 block text-[11.5px]">
                    VIP 2 Trading Fees
                  </span>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
                    Maker: 0.06% | Taker: 0.08%
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#10B981] text-white text-[10px] font-black rounded-md">
                -25% Fee
              </span>
            </div>

            {/* Navigation Action Links */}
            <div className="space-y-1 pt-1">
              <button
                onClick={() => {
                  onNavigateToTab('Portfolio');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-200 transition-colors text-xs font-bold cursor-pointer group"
              >
                <span className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-gray-400 group-hover:text-[#10B981] transition-colors" />
                  Detailed Portfolio & Asset History
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onNavigateToTab('News');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-200 transition-colors text-xs font-bold cursor-pointer group"
              >
                <span className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  API Keys & Algorithmic Trading
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </>
        ) : (
          /* SECURITY & KYC TAB */
          <div className="space-y-2.5">
            {/* KYC Level 2 Card */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-gray-100 dark:border-[#2E384D] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  KYC Verification
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[10px] font-black">
                  Level 2 Passed
                </span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>24h Crypto Withdrawal:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 font-mono">100.00 BTC ($6.5M)</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Fiat Deposit / Wire:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 font-mono">Unlimited</span>
                </div>
              </div>
            </div>

            {/* 2FA & Security Parameters */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-gray-100 dark:border-[#2E384D] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-200">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  Google 2FA Authenticator
                </span>
                <span className="text-[#10B981] font-bold text-[11px]">Enabled</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200/50 dark:border-gray-700/50">
                <span className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-200">
                  <Lock className="w-3.5 h-3.5 text-purple-500" />
                  Anti-Phishing Code
                </span>
                <span className="font-mono text-gray-500 text-[11px]">XT-SECURE-2026</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200/50 dark:border-gray-700/50">
                <span className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-200">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Withdrawal Whitelist
                </span>
                <span className="text-[#10B981] font-bold text-[11px]">Active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer: Session & Log Out */}
      <div className="p-3 bg-gray-50 dark:bg-[#121722] border-t border-[#E5E9EB] dark:border-[#232B3B] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Device: macOS • IP: 185.220.***</span>
        </div>
        
        <button 
          onClick={() => {
            onClose();
          }}
          className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-bold text-xs hover:underline cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
