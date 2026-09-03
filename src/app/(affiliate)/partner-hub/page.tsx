"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mock Data: In production, fetch from Supabase grouping by `referred_by_admin`
const ADMIN_STATS = {
  adminName: "Chief Emeka",
  groupName: "Lagos Arsenal Banter Hub",
  totalVolume: 850000,      // Total money wagered by his group
  commissionEarned: 21250,  // 2.5% of Volume
  activeDuels: 14,
  completedDuels: 142,
  referralCode: "bantr.lol/join/emeka-gunners",
  bonusTarget: 1000000,     // Target volume for extra bonus
};

const RECENT_ACTIVITY = [
  { id: 1, users: "Tunde vs Seyi", match: "ARS vs TOT", stake: 10000, time: "2 mins ago", cut: 250 },
  { id: 2, users: "Obi vs Chinedu", match: "MUN vs LIV", stake: 5000, time: "15 mins ago", cut: 125 },
  { id: 3, users: "Femi vs David", match: "CHE vs MCI", stake: 2000, time: "1 hour ago", cut: 50 },
];

export default function PartnerHubPage() {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${ADMIN_STATS.referralCode}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    // Simulate API call to transfer from affiliate ledger to main wallet
    await new Promise(resolve => setTimeout(resolve, 1500));
    router.push("/dashboard?success=commission_withdrawn");
  };

  // Calculate progress to the ₦1M Volume Bonus
  const progressPercent = Math.min((ADMIN_STATS.totalVolume / ADMIN_STATS.bonusTarget) * 100, 100);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-xs text-green-400 font-bold uppercase tracking-widest mb-1">Partner HQ</div>
            <h1 className="text-2xl font-black">{ADMIN_STATS.groupName}</h1>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-neutral-400 text-sm hover:text-white transition-colors"
          >
            Exit Hub
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        
        {/* Your Link Section */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
          <div>
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Your Group Link</h2>
            <p className="text-xs text-neutral-500">Anyone who joins via this link pays you 2.5% of every duel they play. Forever.</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <div className="bg-neutral-950 border border-neutral-800 text-green-400 font-mono px-4 py-3 rounded-xl flex-1 text-center truncate">
              {ADMIN_STATS.referralCode}
            </div>
            <button 
              onClick={handleCopyLink}
              className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-neutral-200 transition-all active:scale-95 whitespace-nowrap"
            >
              {isCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">💰</div>
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Total Commission</div>
            <div className="text-2xl font-black text-green-400">₦{ADMIN_STATS.commissionEarned.toLocaleString()}</div>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Group Volume</div>
            <div className="text-2xl font-black">₦{ADMIN_STATS.totalVolume.toLocaleString()}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Active Duels</div>
            <div className="text-2xl font-black text-yellow-500">{ADMIN_STATS.activeDuels}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Completed Duels</div>
            <div className="text-2xl font-black">{ADMIN_STATS.completedDuels}</div>
          </div>
        </section>

        {/* The Greed Engine: Bonus Progress */}
        <section className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Monthly Boss Bonus 👑</h2>
              <p className="text-sm text-neutral-400">Hit ₦1M in group volume to unlock a ₦10,000 cash drop.</p>
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
          <div className="flex justify-between text-xs text-neutral-500 font-bold mt-2">
            <span>₦{ADMIN_STATS.totalVolume.toLocaleString()}</span>
            <span>₦1,000,000</span>
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
            {RECENT_ACTIVITY.map((activity, i) => (
              <div key={activity.id} className={`p-4 flex justify-between items-center ${i !== RECENT_ACTIVITY.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div>
                  <div className="font-bold text-sm mb-1">{activity.users}</div>
                  <div className="text-xs text-neutral-500">{activity.match} • Staked ₦{activity.stake.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-sm">+ ₦{activity.cut}</div>
                  <div className="text-xs text-neutral-600">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Bar */}
        <div className="pt-4">
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || ADMIN_STATS.commissionEarned < 1000}
            className="w-full bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 active:scale-95"
          >
            {isWithdrawing ? "Processing..." : `Withdraw ₦${ADMIN_STATS.commissionEarned.toLocaleString()} to Main Wallet`}
          </button>
          <p className="text-center text-xs text-neutral-600 mt-3 font-bold">Minimum withdrawal: ₦1,000</p>
        </div>

      </div>
    </div>
  );
}