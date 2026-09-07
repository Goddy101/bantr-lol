"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Define the shape of our real production data
interface PartnerHubClientProps {
  adminStats: {
    adminName: string;
    groupName: string;
    totalVolume: number;
    commissionEarned: number;
    activeDuels: number;
    completedDuels: number;
    referralCode: string;
  };
  recentActivity: any[];
}

export default function PartnerHubClient({ adminStats, recentActivity }: PartnerHubClientProps) {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${adminStats.referralCode}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    // TODO: In the future, wire this to a Supabase RPC function that moves commission to wallet_balance
    await new Promise(resolve => setTimeout(resolve, 1500));
    router.push("/dashboard?success=commission_withdrawn");
  };

  // --- DYNAMIC GREED ENGINE LOGIC ---
  const getBonusTier = (volume: number) => {
    if (volume < 1000000) return { level: 1, target: 1000000, reward: "₦10,000 Cash", title: "Boss Bonus 👑" };
    if (volume < 5000000) return { level: 2, target: 5000000, reward: "₦50,000 Cash", title: "Don Bonus 🦅" };
    if (volume < 20000000) return { level: 3, target: 20000000, reward: "₦250,000 Cash", title: "Odogwu Bonus 🦍" };
    return { level: 4, target: 50000000, reward: "₦1,000,000 + Hublot Watch", title: "Chairman Status 🏛️" };
  };

  const currentTier = getBonusTier(adminStats.totalVolume);
  
  // Calculate progress relative to their CURRENT tier
  const previousTarget = currentTier.level === 1 ? 0 : getBonusTier(currentTier.target - 1).target;
  const volumeInCurrentTier = adminStats.totalVolume - previousTarget;
  const targetForCurrentTier = currentTier.target - previousTarget;
  
  const progressPercent = Math.min((volumeInCurrentTier / targetForCurrentTier) * 100, 100);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans selection:bg-yellow-500/30">
      
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-1">VIP Partner HQ</div>
            <h1 className="text-2xl font-black">{adminStats.groupName}</h1>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-neutral-400 text-sm font-bold hover:text-white transition-colors"
          >
            ← Arena
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        
        {/* Your Link Section */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
          <div>
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Your Cartel Link</h2>
            <p className="text-xs text-neutral-500">Anyone who joins via this link pays you 2.5% of every duel they play. Forever.</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <div className="bg-neutral-950 border border-neutral-800 text-yellow-500 font-mono px-4 py-3 rounded-xl flex-1 text-center truncate font-bold">
              {adminStats.referralCode}
            </div>
            <button 
              onClick={handleCopyLink}
              className="bg-yellow-500 text-black font-black px-6 py-3 rounded-xl hover:bg-yellow-400 transition-all active:scale-95 whitespace-nowrap"
            >
              {isCopied ? "COPIED!" : "COPY"}
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl group-hover:scale-110 transition-transform">💰</div>
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Total Commission</div>
            <div className="text-2xl font-black text-green-400">₦{adminStats.commissionEarned.toLocaleString()}</div>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Group Volume</div>
            <div className="text-2xl font-black">₦{adminStats.totalVolume.toLocaleString()}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Active Duels</div>
            <div className="text-2xl font-black text-yellow-500">{adminStats.activeDuels}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Completed Duels</div>
            <div className="text-2xl font-black">{adminStats.completedDuels}</div>
          </div>
        </section>

        {/* The Dynamic Greed Engine: Bonus Progress */}
        <section className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
            Level {currentTier.level}
          </div>

          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">{currentTier.title}</h2>
              <p className="text-sm text-neutral-400">Hit ₦{(currentTier.target / 1000000).toFixed(0)}M in group volume to unlock <span className="text-green-400 font-bold">{currentTier.reward}</span>.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">{(progressPercent).toFixed(0)}%</span>
            </div>
          </div>
          
          <div className="w-full bg-neutral-950 rounded-full h-4 overflow-hidden border border-neutral-800">
            <div 
              className="bg-yellow-500 h-4 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 w-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-[10px] text-neutral-500 font-bold mt-2 uppercase tracking-widest">
            <span>Current: ₦{adminStats.totalVolume.toLocaleString()}</span>
            <span>Target: ₦{currentTier.target.toLocaleString()}</span>
          </div>
        </section>

        {/* Recent Group Activity */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Live Group Activity</h2>
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
              <div key={activity.id} className={`p-4 flex justify-between items-center ${i !== recentActivity.length - 1 ? 'border-b border-neutral-800/50' : ''}`}>
                <div>
                  <div className="font-bold text-sm mb-1">{activity.users}</div>
                  <div className="text-xs text-neutral-500">{activity.match} • Staked ₦{activity.stake.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-sm">+ ₦{activity.cut}</div>
                  <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">{activity.time || "Recently"}</div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-neutral-500 text-sm">
                No activity yet. Share your link to get your group started.
              </div>
            )}
          </div>
        </section>

        {/* Action Bar */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || adminStats.commissionEarned < 1000}
            className="w-full bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isWithdrawing ? "Processing..." : `Withdraw ₦${adminStats.commissionEarned.toLocaleString()} to Main Wallet`}
          </button>
          <p className="text-center text-xs text-neutral-600 mt-3 font-bold uppercase tracking-widest">Minimum withdrawal: ₦1,000</p>
        </div>

      </div>
    </div>
  );
}