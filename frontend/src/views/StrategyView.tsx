import React, { useState } from 'react';
import { 
  GraduationCap, TrendingUp, Zap, Target, ShieldCheck, 
  BarChart2, ArrowRight, CheckCircle2, AlertTriangle, Calculator,
  Compass, Flame, Sliders, BookOpen, Search, Lightbulb
} from 'lucide-react';

interface StrategyItem {
  id: string;
  title: string;
  badge: string;
  badgeClass: string;
  category: 'Spot' | 'Leverage' | 'Binary' | 'Risk';
  winRateTarget: string;
  timeframe: string;
  description: string;
  rules: string[];
  riskNote: string;
}

interface GlossaryTerm {
  term: string;
  category: 'Trading' | 'Derivatives' | 'Binary' | 'DeFi' | 'Risk';
  letter: string;
  definition: string;
  example?: string;
  tip?: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Airdrop',
    category: 'DeFi',
    letter: 'A',
    definition: 'A distribution of cryptocurrency tokens or coins directly to wallet addresses, usually for free, to bootstrap liquidity and reward early adopters.',
    example: 'Receiving 1,200 MONAD tokens for testing Devnet protocols.',
    tip: 'Always verify contract addresses before claiming to avoid phishing drains.',
  },
  {
    term: 'Ask Price (Offer)',
    category: 'Trading',
    letter: 'A',
    definition: 'The lowest price a seller is willing to accept for a cryptocurrency in the order book.',
    example: 'BTC ask is $65,420.00; buyers must match this price to buy immediately.',
  },
  {
    term: 'Binary Option',
    category: 'Binary',
    letter: 'B',
    definition: 'A financial contract with a fixed return (e.g., 97%) where you predict whether an asset price will be higher (Call) or lower (Put) than the strike price at expiration.',
    example: 'Placing a $100 Call on BTC at $65,000 for 30s. If BTC is $65,001 at expiry, you get $197 back ($97 net profit).',
    tip: 'Binary trades have strictly defined fixed risk: you can never lose more than your initial stake.',
  },
  {
    term: 'Bid Price',
    category: 'Trading',
    letter: 'B',
    definition: 'The highest price a buyer is willing to pay for an asset in the market order book.',
  },
  {
    term: 'Call Option (▲ Buy / Up)',
    category: 'Binary',
    letter: 'C',
    definition: 'In binary options trading, a Call prediction profits if the settlement price at expiration finishes strictly ABOVE the initial strike price.',
  },
  {
    term: 'Cross Margin',
    category: 'Derivatives',
    letter: 'C',
    definition: 'A margin method where all available balance in the account is shared across open positions to prevent liquidation.',
    tip: 'Use Isolated Margin if you want to cap potential losses strictly to that single trade.',
  },
  {
    term: 'DCA (Dollar-Cost Averaging)',
    category: 'Trading',
    letter: 'D',
    definition: 'An investment strategy of buying a fixed dollar amount of a crypto asset at regular intervals regardless of its market price.',
    example: 'Buying $100 of Bitcoin every Monday morning.',
  },
  {
    term: 'Expiration Time (Expiry)',
    category: 'Binary',
    letter: 'E',
    definition: 'The predetermined timestamp when a binary contract settles and payout is calculated based on live market price.',
  },
  {
    term: 'Funding Rate',
    category: 'Derivatives',
    letter: 'F',
    definition: 'Periodic payments exchanged between long and short traders in perpetual futures contracts to keep the derivative price tethered to the spot price.',
  },
  {
    term: 'In The Money (ITM)',
    category: 'Binary',
    letter: 'I',
    definition: 'A binary contract status where the current market price is favorable to the trader’s prediction (Call > Strike or Put < Strike).',
  },
  {
    term: 'Isolated Margin',
    category: 'Derivatives',
    letter: 'I',
    definition: 'Margin allocated strictly to a specific individual position. If the position liquidates, the rest of your account balance is protected.',
  },
  {
    term: 'Leverage',
    category: 'Derivatives',
    letter: 'L',
    definition: 'Using borrowed capital to amplify trading position size and potential profits (e.g., 10x, 50x, 100x).',
    example: 'With $1,000 margin and 10x leverage, your total trading power is $10,000.',
    tip: 'Higher leverage increases liquidation risk proportionately.',
  },
  {
    term: 'Limit Order',
    category: 'Trading',
    letter: 'L',
    definition: 'An order to buy or sell a crypto asset at a specified price or better. It sits in the order book until filled.',
  },
  {
    term: 'Liquidation Price',
    category: 'Derivatives',
    letter: 'L',
    definition: 'The price level at which a leveraged position is automatically closed by the exchange to prevent negative balance.',
  },
  {
    term: 'Market Order',
    category: 'Trading',
    letter: 'M',
    definition: 'An order that executes immediately against the best available prices in the order book.',
  },
  {
    term: 'Out of The Money (OTM)',
    category: 'Binary',
    letter: 'O',
    definition: 'A binary contract condition where the current market price is currently unfavorable to the trader’s initial prediction.',
  },
  {
    term: 'Payout Ratio (97%)',
    category: 'Binary',
    letter: 'P',
    definition: 'The guaranteed percentage return paid out to the trader on a winning binary trade above their stake.',
    example: 'At 97% payout, a $100 stake returns $197.00 on win.',
  },
  {
    term: 'Perpetual Futures (Perps)',
    category: 'Derivatives',
    letter: 'P',
    definition: 'Derivative contracts that allow traders to speculate on asset prices with leverage without an expiration date.',
  },
  {
    term: 'Put Option (▼ Sell / Down)',
    category: 'Binary',
    letter: 'P',
    definition: 'In binary options trading, a Put prediction profits if the market settlement price at expiration finishes strictly BELOW the strike price.',
  },
  {
    term: 'Risk-to-Reward Ratio (R:R)',
    category: 'Risk',
    letter: 'R',
    definition: 'A calculation comparing the potential profit of a trade relative to the capital risked (e.g., risking $100 to make $300 is a 1:3 R:R).',
  },
  {
    term: 'Slippage',
    category: 'Trading',
    letter: 'S',
    definition: 'The difference between the expected execution price of an order and the actual price at which the trade executes.',
  },
  {
    term: 'Spot Trading',
    category: 'Trading',
    letter: 'S',
    definition: 'Buying and selling actual cryptocurrencies with 1:1 direct ownership, instant settlement, and zero borrowing or liquidation risk.',
  },
  {
    term: 'Stop-Loss Order',
    category: 'Risk',
    letter: 'S',
    definition: 'An automated risk control order placed to sell an asset once it drops to a specified price to cap maximum portfolio loss.',
  },
  {
    term: 'Strike Price',
    category: 'Binary',
    letter: 'S',
    definition: 'The exact market price recorded at the millisecond a binary contract is placed, used as the benchmark for win/loss evaluation.',
  },
  {
    term: 'Volatility',
    category: 'Trading',
    letter: 'V',
    definition: 'A statistical measure of the dispersion of returns for a given security or market index over a specific timeframe.',
  },
];

const STRATEGIES: StrategyItem[] = [
  {
    id: 'strat-1',
    title: 'Bollinger Bands & RSI Mean Reversion (Binary Options)',
    badge: 'Binary Options',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
    category: 'Binary',
    winRateTarget: '68% - 74%',
    timeframe: '30s - 1m Expiry',
    description: 'Capitalizes on price exhaustion at extreme standard deviation boundaries with confirmed RSI reversal.',
    rules: [
      'Wait for price candle to pierce or close outside the Upper/Lower Bollinger Band (20, 2).',
      'Confirm RSI(14) is in Overbought (>70) or Oversold (<30) territory.',
      'Place CALL when price bounces off Lower Band; place PUT when price rejects Upper Band.',
      'Set expiry duration between 30 seconds and 60 seconds with 97% fixed payout.',
    ],
    riskNote: 'Avoid placing binary trades during high-impact macro news announcements (CPI / FOMC).',
  },
  {
    id: 'strat-2',
    title: 'EMA 20/50 Trend-Following Breakout (Leverage 10x-25x)',
    badge: 'Leverage Futures',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-[#0B3B3C] dark:text-[#14B8A6] border border-teal-200 dark:border-teal-800',
    category: 'Leverage',
    winRateTarget: '55% - 62% (1:3 R:R)',
    timeframe: '5m - 1h Chart',
    description: 'Captures sustained directional momentum when fast exponential moving average crosses above slow moving average.',
    rules: [
      'Enter LONG when EMA 20 crosses above EMA 50 with rising volume.',
      'Enter SHORT when EMA 20 crosses below EMA 50.',
      'Set Stop-Loss directly below the recent swing low (max 1.5% capital risk).',
      'Target Take-Profit at minimum 1:2.5 or 1:3 Risk-to-Reward ratio.',
    ],
    riskNote: 'Always use Isolated Margin to ensure liquidation is strictly capped to the allocated stake.',
  },
  {
    id: 'strat-3',
    title: 'Dynamic Dollar-Cost Averaging & Support Accumulation (Spot)',
    badge: 'Spot Trading',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] border border-emerald-200 dark:border-emerald-800',
    category: 'Spot',
    winRateTarget: 'Long-Term Yield',
    timeframe: 'Daily / Weekly',
    description: 'Systematic accumulation of blue-chip crypto assets at major historical support zones with zero borrowing risk.',
    rules: [
      'Allocate fixed weekly capital into core assets (e.g. 60% BTC, 30% ETH, 10% SOL).',
      'Increase buy allocation by 50% when Fear & Greed Index is below 25 (Extreme Fear).',
      'Store acquired assets in secure custodial storage with 0% liquidation risk.',
    ],
    riskNote: 'Eliminates emotional market timing and volatility stress.',
  },
  {
    id: 'strat-4',
    title: 'The 1% Capital Preservation & Kelly Criterion Rule',
    badge: 'Risk Mastery',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-800',
    category: 'Risk',
    winRateTarget: 'Bankroll Survival',
    timeframe: 'Platform Wide',
    description: 'Mathematical position sizing structure guaranteeing you never blow up your trading portfolio.',
    rules: [
      'Never risk more than 1% to 2% of total account balance on any single trade.',
      'Calculate position size = (Total Balance × Risk %) / (Entry Price - Stop Loss).',
      'Immediately stop trading for 24h if you reach a daily loss limit of 3 consecutive trades.',
    ],
    riskNote: 'Consistent risk management separates profitable traders from retail gambling.',
  },
];

export const StrategyView: React.FC<{
  onNavigateToTrade?: (symbol: string, mode?: 'SPOT' | 'LEVERAGE') => void;
  onNavigateToBinary?: (symbol: string) => void;
  isDark?: boolean;
}> = ({ onNavigateToTrade, onNavigateToBinary, isDark = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [glossarySearch, setGlossarySearch] = useState<string>('');

  // Interactive Position Sizer & Risk Calculator State
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(65000);
  const [stopPrice, setStopPrice] = useState<number>(63500);

  const priceDiff = Math.abs(entryPrice - stopPrice) || 1;
  const maxRiskUsd = (balance * riskPct) / 100;
  const positionSizeUnits = maxRiskUsd / priceDiff;
  const totalPositionValue = positionSizeUnits * entryPrice;
  const targetProfit1_2 = maxRiskUsd * 2;
  const targetProfit1_3 = maxRiskUsd * 3;

  const filteredStrategies = STRATEGIES.filter(
    (s) => selectedCategory === 'ALL' || s.category === selectedCategory
  );

  const filteredGlossary = GLOSSARY_TERMS.filter((t) => {
    return (
      t.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      t.definition.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      t.category.toLowerCase().includes(glossarySearch.toLowerCase())
    );
  });

  const categoryPills = [
    { id: 'ALL', label: 'All Strategies' },
    { id: 'Spot', label: 'Spot Strategies' },
    { id: 'Leverage', label: 'Leverage Strategies' },
    { id: 'Binary', label: 'Binary Strategies' },
    { id: 'Risk', label: 'Risk Strategies' },
    { id: 'Glossary', label: '📚 Trading Glossary' },
  ];

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B3B3C] via-[#104A4C] to-[#14B8A6] rounded-2xl p-6 text-white card-shadow relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              XTRADE STRATEGY ACADEMY
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-gray-950 text-[10px] font-black uppercase">
              Pro Trader Masterclass
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Proven Trading Strategies & Risk Management
          </h1>
          <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
            Master high-probability Spot accumulation, 1x–100x Leverage momentum systems, 97% fixed-payout Binary options tactics, and comprehensive A-Z financial glossary.
          </p>
        </div>

        {/* Quick Launch Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => onNavigateToTrade && onNavigateToTrade('BTC/USDT', 'SPOT')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Practice Spot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateToTrade && onNavigateToTrade('BTC/USDT', 'LEVERAGE')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Practice Leverage</span>
          </button>
          <button
            onClick={() => onNavigateToBinary && onNavigateToBinary('BTC/USDT')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Practice Binary (97%)</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Strategies / Glossary + Interactive Position Sizer */}
      <div className="space-y-4">
        {/* Filter Pills with Glossary positioned on right side of Risk Strategies */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 overflow-x-auto">
            {categoryPills.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                    : 'hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-gray-400">
            {selectedCategory === 'Glossary' ? `${filteredGlossary.length} Definitions` : `${filteredStrategies.length} Core Modules`}
          </span>
        </div>

        {/* View 1: Trading Glossary View (when selectedCategory === 'Glossary') */}
        {selectedCategory === 'Glossary' ? (
          <div className="space-y-4">
            {/* Glossary Search Card */}
            <div className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 dark:bg-teal-950/50 text-[#0B3B3C] dark:text-[#14B8A6] rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0F172A] dark:text-white">
                    Crypto & Trading Terminology Encyclopedia
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    A-Z guide covering Spot, Leverage mechanics, Binary options formulas, and Risk management.
                  </span>
                </div>
              </div>

              <div className="relative flex items-center w-full sm:w-72">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search glossary terms..."
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                />
              </div>
            </div>

            {/* Glossary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGlossary.map((item) => (
                <div
                  key={item.term}
                  className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-3 transition-all hover:border-[#0B3B3C]/30 dark:hover:border-[#14B8A6]/40 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-[#0F172A] dark:text-white">
                        {item.term}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-teal-50 dark:bg-teal-950/50 text-[#0B3B3C] dark:text-[#14B8A6] border border-teal-200/50 dark:border-teal-800/50">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.definition}
                    </p>
                  </div>

                  {(item.example || item.tip) && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-[11px]">
                      {item.example && (
                        <div className="text-gray-500 dark:text-gray-400">
                          <strong className="text-gray-700 dark:text-gray-300">Example: </strong>
                          {item.example}
                        </div>
                      )}
                      {item.tip && (
                        <div className="text-teal-700 dark:text-teal-300 flex items-start gap-1 bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-lg">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{item.tip}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* View 2: Strategy Modules + Risk Calculator Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Strategy Modules (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-4">
                {filteredStrategies.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-4 transition-all hover:border-[#0B3B3C]/30 dark:hover:border-[#14B8A6]/40"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                      <div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${s.badgeClass}`}>
                          {s.badge}
                        </span>
                        <h3 className="text-base font-black text-[#0F172A] dark:text-white mt-1.5">
                          {s.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono font-bold shrink-0">
                        <span className="text-gray-400">Target Win Rate:</span>
                        <span className="text-[#10B981] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                          {s.winRateTarget}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {s.description}
                    </p>

                    {/* Step-by-Step Tactical Rules */}
                    <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/70 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                        Execution Checklist:
                      </span>
                      {s.rules.map((rule, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {rule}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Risk Warning Note */}
                    <div className="flex items-start gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{s.riskNote}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Risk & Position Sizer Calculator (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow space-y-5 sticky top-24 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#F1F5F9] dark:border-[#232B3B]">
                <div className="p-2 bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0F172A] dark:text-white">
                    Live Position Size & Risk Calculator
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Institutional Risk Formula
                  </span>
                </div>
              </div>

              {/* Calculator Inputs */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                    Account Portfolio Balance ($)
                  </label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl font-mono font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                    Risk Per Trade ({riskPct}%)
                  </label>
                  <div className="flex items-center gap-2">
                    {[0.5, 1.0, 1.5, 2.0, 3.0].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setRiskPct(pct)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          riskPct === pct
                            ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-black shadow-2xs'
                            : 'bg-gray-100 dark:bg-[#1E293B] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                      Entry Price ($)
                    </label>
                    <input
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl font-mono font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                      Stop Loss ($)
                    </label>
                    <input
                      type="number"
                      value={stopPrice}
                      onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl font-mono font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6]"
                    />
                  </div>
                </div>
              </div>

              {/* Computed Results Box */}
              <div className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Max USD Risk (1R):</span>
                  <span className="font-bold text-[#EF4444]">-${maxRiskUsd.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Recommended Size:</span>
                  <span className="font-black text-[#0F172A] dark:text-white">
                    {positionSizeUnits.toFixed(4)} Units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Position Notional:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    ${totalPositionValue.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-gray-400">Target 1:2 R:R Profit:</span>
                  <span className="font-bold text-[#10B981]">+${targetProfit1_2.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Target 1:3 R:R Profit:</span>
                  <span className="font-bold text-[#10B981]">+${targetProfit1_3.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
