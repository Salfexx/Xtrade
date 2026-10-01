import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, Bookmark, Sparkles, HelpCircle, 
  ArrowUpRight, Tag, Lightbulb, ShieldAlert
} from 'lucide-react';

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
    tip: 'Always verify contract addresses before claiming to avoid phishing drains. Spot margin holders qualify for airdrops because they own real coins; futures contract holders do not.',
  },
  {
    term: 'Ask Price (Offer)',
    category: 'Trading',
    letter: 'A',
    definition: 'The lowest price a seller is willing to accept for a cryptocurrency in the order book.',
    example: 'BTC ask is $64,800.00; buyers must match this price to buy immediately.',
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
    term: 'Borrow Interest Rate',
    category: 'Trading',
    letter: 'B',
    definition: 'The stable hourly or annual percentage rate paid by Spot Margin borrowers to crypto lenders for borrowing capital from the platform liquidity pool.',
    example: 'Borrowing $2,000 USDT at 0.02% daily interest (approx 7.3% APY) costs $0.40 per day.',
    tip: 'Far more predictable and cheaper than perpetual funding rates for multi-week and multi-month swing trades.',
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
    term: 'Crypto Lending (Margin Lending / Earn)',
    category: 'DeFi',
    letter: 'C',
    definition: 'A zero-market-risk passive income mechanism where crypto holders deposit idle USDT or coins into a lending pool to earn interest paid by margin traders. 100% of trading losses are absorbed by the borrower’s collateral, ensuring the lender’s principal is fully protected.',
    example: 'Supplying $10,000 USDT to earn 8.5% APY compounding daily with automatic risk liquidations protecting your principal.',
    tip: 'Lenders earn passive yield without exposure to market crashes or liquidation risk.',
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
    definition: 'Periodic payments exchanged directly between Long and Short traders in Perpetual Futures every 8 hours to anchor the contract price to the real spot index price.',
    example: 'When market is bullish (Perp > Spot), Longs pay Shorts. At a +0.01% rate on a $10,000 position, Long pays $1.00 every 8 hours.',
    tip: 'In extreme bull runs, funding rates can spike to 100%+ annualized, making Spot Margin cheaper for long-term holding.',
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
    term: 'Leverage Trading',
    category: 'Derivatives',
    letter: 'L',
    definition: 'Using margin collateral to control a significantly larger position size (e.g. 10x, 50x, 100x), amplifying both potential profits and risks proportionately.',
    example: 'With $500 margin at 20x leverage, you control a $10,000 BTC position. A +5% market rally generates +$500 profit (+100% ROI on your margin).',
    tip: 'Always set a Stop-Loss order to prevent liquidation during rapid market swings.',
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
    definition: 'The price threshold where an open leveraged position is automatically closed by the exchange to prevent losses from exceeding the trader’s allocated margin.',
    example: 'A 10x Long opened at $65,000 has an estimated liquidation price near $59,150 (~9% drop).',
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
    term: 'Perpetual Futures (Perps / Derivatives)',
    category: 'Derivatives',
    letter: 'P',
    definition: 'High-liquidity synthetic derivative contracts with NO expiration date, high leverage (up to 100x+), and instant two-way trading (Long & Short). Contracts are cash-settled in USDT with zero physical coin delivery.',
    example: 'Opening an instant $50,000 Short on BTC without borrowing physical coins when the market turns bearish.',
    tip: 'Accounts for 90%+ of global crypto volume due to high leverage, deep liquidity, and 1-click execution.',
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
    term: 'Short Selling (Shorting)',
    category: 'Trading',
    letter: 'S',
    definition: 'A trading strategy designed to generate profit when an asset price drops. In Perpetual Futures, you open a Short contract with 1 click; in Spot Margin, you borrow coins, sell them high, and repurchase them low to return to the lender.',
    example: 'Shorting BTC at $65,000 and repurchasing to close at $60,000 yields $5,000 net profit per BTC.',
  },
  {
    term: 'Slippage',
    category: 'Trading',
    letter: 'S',
    definition: 'The difference between the expected execution price of an order and the actual price at which the trade executes.',
  },
  {
    term: 'Spot Margin Trading (Margin Trading)',
    category: 'Trading',
    letter: 'S',
    definition: 'Trading with borrowed liquidity to purchase REAL cryptocurrency tokens (typically 3x to 10x leverage). The trader owns the actual coins, qualifying for airdrops, staking yields, and governance voting. Incur stable borrow interest rather than 8-hour funding rate fees.',
    example: 'Depositing $1,000 USDT to borrow $2,000 USDT and buying $3,000 worth of real Ethereum. If ETH doubles, you make 3x gains while retaining full token ownership.',
    tip: 'Best choice for multi-week/month swing holding, tax-free cash loans against bags, and airdrop snapshot eligibility.',
  },
  {
    term: 'Spot Margin vs Perpetual Futures',
    category: 'Derivatives',
    letter: 'S',
    definition: 'Spot Margin gives real token ownership, 3x-10x leverage, and stable borrow interest (best for swing trading & airdrops). Perpetual Futures offers synthetic cash-settled contracts, up to 100x leverage, instant shorting, and 8-hour funding rates (best for day trading & scalping).',
    example: 'Use Spot Margin to hold Bitcoin for 6 months without high funding rate bleed; use Perpetual Futures for 50x intraday scalps.',
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

export const GlossaryView: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  const categories = ['ALL', 'Trading', 'Derivatives', 'Binary', 'DeFi', 'Risk'];
  
  // Dynamic A-Z letters based on all registered glossary terms
  const alphabet = ['ALL', ...Array.from(new Set(GLOSSARY_TERMS.map((t) => t.letter))).sort()];

  const filteredTerms = GLOSSARY_TERMS.filter((t) => {
    const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchLetter = selectedLetter === 'ALL' || t.letter === selectedLetter;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      t.term.toLowerCase().includes(query) ||
      t.definition.toLowerCase().includes(query) ||
      (t.example && t.example.toLowerCase().includes(query)) ||
      (t.tip && t.tip.toLowerCase().includes(query)) ||
      t.category.toLowerCase().includes(query);
    return matchCat && matchLetter && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#161B26] rounded-2xl p-6 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/50 text-[#0B3B3C] dark:text-[#14B8A6] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Crypto & Trading Financial Glossary
            </h1>
          </div>
          <p className="text-xs md:text-sm text-[#64748B] dark:text-gray-400">
            Comprehensive dictionary of cryptocurrency terminology, binary options concepts, leverage mechanics, and risk formulas.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search glossary definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E384D] rounded-xl text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0B3B3C] dark:focus:ring-[#14B8A6] transition-all"
          />
        </div>
      </div>

      {/* Filter Category Tabs & A-Z Letters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-[#121722] text-[#0F172A] dark:text-white shadow-2xs font-black'
                    : 'hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-gray-400">
            {filteredTerms.length} Terms Found
          </span>
        </div>

        {/* A-Z Letter Jump */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-white dark:bg-[#161B26] rounded-xl border border-[#E5E9EB] dark:border-[#232B3B] text-[11px] font-bold">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedLetter === letter
                  ? 'bg-[#0B3B3C] dark:bg-[#14B8A6] text-white dark:text-gray-950 font-black'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#161B26] rounded-2xl p-5 border border-[#E5E9EB] dark:border-[#232B3B] card-shadow flex flex-col justify-between transition-all hover:border-[#0B3B3C]/40 dark:hover:border-[#14B8A6]/40 group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-black text-[#0F172A] dark:text-white group-hover:text-[#0B3B3C] dark:group-hover:text-[#14B8A6] transition-colors">
                  {item.term}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    item.category === 'Binary'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                      : item.category === 'Derivatives'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0B3B3C] dark:text-[#14B8A6]'
                      : item.category === 'Risk'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                  }`}
                >
                  {item.category}
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2.5 leading-relaxed">
                {item.definition}
              </p>

              {item.example && (
                <div className="mt-3 p-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] leading-relaxed">
                  <span className="font-bold text-[#0F172A] dark:text-gray-200 block mb-0.5">
                    💡 Example:
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-mono">
                    {item.example}
                  </span>
                </div>
              )}
            </div>

            {item.tip && (
              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-start gap-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{item.tip}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
