"use client";

import { useState } from "react";
import Link from "next/link";
import WithdrawModal from "@/components/shared/WithdrawModal";
import DepositModal from "@/components/shared/DepositModal";
import ShareReceiptButton from "@/components/shared/ShareReceiptButton";
import { signOut } from "@/app/actions/auth";

// Define the shape of our props
interface DashboardClientProps {
  userData: {
    username: string;
    walletBalance: number;
    ballIqPoints: number;
    rank: string;
  };
  activeDuels: any[];
  pastDuels: any[];
}

export default function DashboardClient({ userData, activeDuels, pastDuels }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  
  // Modals State (Must be inside the component)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      
      {/* Top Navbar */}
      <div className="bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-4 py-4 sticky top-0 z-50 flex justify-between items-center">
        
        {/* Left Side: Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[2px]">
            <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black">
              {userData.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-bold">Welcome back,</div>
            <div className="font-black">@{userData.username}</div>
          </div>
        </div>

        {/* Right Side: Logout Button */}
        <form action={signOut}>
          <button 
            type="submit"
            className="text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-all tracking-widest uppercase"
          >
            Leave Arena
          </button>
        </form>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* The Vault Card */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-1">Total Balance</div>
              <div className="text-4xl font-black text-white">₦{userData.walletBalance.toLocaleString()}</div>
            </div>
            
            {/* Ball IQ Status */}
            <div className="text-right bg-neutral-950/50 border border-neutral-800 rounded-xl p-2 backdrop-blur-sm">
              <div className="text-[10px] text-yellow-500 font-bold uppercase mb-0.5">Ball IQ</div>
              <div className="text-lg font-black text-white">{userData.ballIqPoints} <span className="text-xs text-neutral-500 font-normal">pts</span></div>
              <div className="text-[9px] text-neutral-400">{userData.rank}</div>
            </div>
          </div>

          {/* Deposit & Withdraw Action Buttons */}
          <div className="flex gap-3 relative z-10">
            <button 
              onClick={() => setIsDepositOpen(true)}
              className="flex-1 bg-white text-black font-black text-sm py-3 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
            >
              FUND VAULT
            </button>
            <button 
              onClick={() => setIsWithdrawOpen(true)}
              className="flex-1 bg-neutral-800 text-white border border-neutral-700 font-black text-sm py-3 rounded-xl hover:bg-neutral-700 transition-all active:scale-95"
            >
              CASH OUT
            </button>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800">
          <button 
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "active" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500"}`}
          >
            Active Battles ({activeDuels.length})
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "history" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500"}`}
          >
            Past Glory ({pastDuels.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          
          {activeTab === "active" && activeDuels.map((duel) => (
            <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-xs text-neutral-400 font-bold">{duel.time}</div>
                {duel.status === "open" ? (
                  <div className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded uppercase font-black">Link Open</div>
                ) : (
                  <div className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded uppercase font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Escrow Locked
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm text-neutral-500 font-bold mb-1">Match ID</div>
                  <div className="font-black text-lg">{duel.match}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-500 font-bold mb-1">Your Stake</div>
                  <div className="font-black text-lg text-white">₦{duel.stake.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-neutral-950 rounded-xl p-3 flex justify-between items-center border border-neutral-800 text-sm">
                <div className="font-bold text-neutral-300">You Picked: <span className="text-white uppercase">{duel.myPick}</span></div>
                <div className="text-neutral-500 font-bold">vs</div>
                <div className="font-bold text-neutral-400 truncate max-w-[120px]">@{duel.opponent}</div>
              </div>
            </div>
          ))}

          {activeTab === "history" && pastDuels.map((duel) => (
            <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 relative overflow-hidden">
              {duel.result === "won" && (
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl" />
              )}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                  <div className="text-xs text-neutral-400 font-bold mb-1">{duel.match}</div>
                  <div className="font-black text-lg">vs @{duel.opponent}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] border px-2 py-1 rounded uppercase font-black mb-1 inline-block ${
                    duel.result === "won" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                    {duel.result === "won" ? "Victory" : "Cooked"}
                  </div>
                  <div className={`font-black text-lg ${duel.result === "won" ? "text-green-400" : "text-red-500"}`}>
                    {duel.result === "won" ? "+" : "-"}₦{duel.result === "won" ? duel.payout.toLocaleString() : duel.stake.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* The Viral Share Button appears only if the user won */}
              {duel.result === "won" && (
                <div className="mt-3 relative z-10">
                  <ShareReceiptButton 
                    winner={userData.username}
                    loser={duel.opponent}
                    amount={duel.payout}
                    match={duel.match}
                  />
                </div>
              )}
            </div>
          ))}

          {activeTab === "active" && activeDuels.length === 0 && (
            <div className="text-center py-10 text-neutral-500">
              No active battles. Go start a war.
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent">
        <Link href="/duel/create" className="w-full max-w-lg mx-auto block">
          <button className="w-full bg-green-500 text-black font-black text-lg py-4 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-[0.98]">
            CREATE NEW DUEL +
          </button>
        </Link>
      </div>

      {/* Financial Modals loaded at the root level */}
      <DepositModal 
        isOpen={isDepositOpen} 
        onClose={() => setIsDepositOpen(false)} 
      />
      
      <WithdrawModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)} 
        maxBalance={userData.walletBalance} 
      />

    </div>
  );
}