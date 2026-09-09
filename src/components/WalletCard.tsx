"use client";

import { useState } from "react";

interface WalletCardProps {
  walletBalance: number;
  unwageredBalance: number;
}

export default function WalletCard({ walletBalance, unwageredBalance }: WalletCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  // The exact math from our backend
  const withdrawable = Math.max(0, walletBalance - unwageredBalance);
  const locked = unwageredBalance;

  return (
    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
      {/* Huge Total Balance */}
      <div className="text-center mb-6">
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Total Balance</h2>
        <div className="text-5xl font-black text-white">
          <span className="text-neutral-600">₦</span>{walletBalance.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Withdrawable Cash */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-[10px] font-bold text-green-500/70 uppercase tracking-widest mb-1">
            Withdrawable
          </div>
          <div className="text-xl font-black text-green-400">
            ₦{withdrawable.toLocaleString()}
          </div>
        </div>

        {/* Locked (Unplayed) Cash */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center relative cursor-pointer hover:border-neutral-700 transition-colors" onClick={() => setShowInfo(!showInfo)}>
          <div className="text-[10px] font-bold text-orange-500/70 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            Unplayed
            <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px]">
              ?
            </span>
          </div>
          <div className="text-xl font-black text-orange-400">
            ₦{locked.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Playthrough Explainer Dropdown */}
      {showInfo && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-black text-orange-400 mb-1">The 1x Playthrough Rule</h4>
          <p className="text-xs font-medium text-orange-200/80 leading-relaxed">
            To prevent fraud, deposits must be played in a Rumble at least once before they can be withdrawn. <strong className="text-white">Your winnings are always instantly withdrawable!</strong>
          </p>
        </div>
      )}
    </div>
  );
}