import React, { useState } from 'react';
import { Search, Sun, Moon, Bell, Wallet, User } from 'lucide-react';
import { PortfolioSummary } from '../types';
import { ProfileFlyout } from './ProfileFlyout';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  portfolio?: PortfolioSummary | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  portfolio,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const tabs = [
    { id: 'News', label: 'NEWS' },
    { id: 'Trade', label: 'TRADE CRYPTO' },
    { id: 'Binary', label: 'TRADE BINARY' },
    { id: 'Strategy', label: 'LEARN TRADING STRATEGY' },
    { id: 'Airdrop', label: 'AIRDROP' },
    { id: 'IGO', label: 'IGO' },
    { id: 'Fundraising', label: 'FUNDRAISING' },
  ];

  return (
    <header className="w-full bg-white dark:bg-[#121722] border-b border-[#E5E9EB] dark:border-[#232B3B] sticky top-0 z-30 px-4 sm:px-6 py-2.5 transition-colors duration-200">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Logo / Homepage + Nav Links */}
        <div className="flex items-center gap-6 xl:gap-8 overflow-hidden">
          {/* Logo / Homepage Button */}
          <div 
            onClick={() => onSelectTab('Dashboard')}
            title="Xtrade Homepage"
            className={`flex items-center cursor-pointer group select-none shrink-0 px-2 py-1 rounded-xl transition-all ${
              currentTab === 'Dashboard' ? 'bg-[#F1F5F9]/80 dark:bg-[#1E293B]/80' : 'hover:opacity-90'
            }`}
          >
            <span className="text-2xl font-black tracking-tight text-[#0B3B3C] dark:text-[#14B8A6] group-hover:scale-105 transition-all">
              Xtrade
            </span>
          </div>

          {/* Navigation Links in CAPITAL Letters */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all duration-150 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#0F172A] dark:text-white bg-[#F1F5F9] dark:bg-[#1E293B] shadow-2xs'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls: Search, Theme, Notification, Help, Profile */}
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-36 lg:w-40 pl-8 pr-10 py-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6] transition-all"
            />
            <div className="absolute right-2 flex items-center gap-0.5 text-[9px] font-semibold text-[#64748B] dark:text-gray-400 bg-white dark:bg-[#121722] border border-[#E2E8F0] dark:border-[#2E384D] px-1 py-0.5 rounded shadow-2xs">
              <span>⌘K</span>
            </div>
          </div>

          {/* Theme Switcher Sun/Moon */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2E384D] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#64748B] dark:text-gray-300 hover:text-[#0B3B3C] dark:hover:text-[#14B8A6] hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notification Bell */}
          <button className="relative p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2E384D] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#64748B] dark:text-gray-300 hover:text-[#0B3B3C] dark:hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white dark:ring-[#1E293B]"></span>
          </button>

          {/* Two-Tier Portfolio & Available Balance Display Widget */}
          <div className="flex flex-col justify-center px-3 py-1 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl select-none">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight">
              <span>Total:</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono text-[11px]">
                ${(portfolio?.total_equity_usd ?? 102540).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
              <span>Avail:</span>
              <span className="font-bold text-[#10B981] dark:text-[#14B8A6] font-mono text-[10.5px]">
                ${(portfolio?.available_balance_usd ?? 62450).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Wallet Icon (Opens Portfolio / Assets View) */}
          <button 
            onClick={() => onSelectTab('Portfolio')}
            title="Wallet & Portfolio"
            className={`p-2 rounded-xl border transition-all ${
              currentTab === 'Portfolio'
                ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 border-[#0B3B3C] dark:border-[#14B8A6] shadow-2xs font-black'
                : 'border-[#E2E8F0] dark:border-[#2E384D] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#64748B] dark:text-gray-300 hover:text-[#0B3B3C] dark:hover:text-[#14B8A6] hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
          </button>

          {/* User Profile Avatar with Flyout */}
          <div className="relative flex items-center pl-2 border-l border-[#E2E8F0] dark:border-[#2E384D]">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title="Account & Profile Menu"
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                isProfileOpen
                  ? 'bg-[#10B981] text-white border-[#10B981] ring-2 ring-emerald-500/30 shadow-md scale-105'
                  : 'bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#2E384D] text-[#0B3B3C] dark:text-[#14B8A6] border-[#E2E8F0] dark:border-[#2E384D]'
              }`}
            >
              <User className="w-4 h-4" />
            </button>

            {/* Interactive Profile Information Flyout Drawer */}
            <ProfileFlyout
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              onNavigateToTab={onSelectTab}
              portfolio={portfolio}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
