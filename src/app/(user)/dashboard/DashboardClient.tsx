"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WithdrawModal from "@/components/shared/WithdrawModal";
import DepositModal from "@/components/shared/DepositModal";
import ShareReceiptButton from "@/components/shared/ShareReceiptButton";
import AffiliateCard from "@/components/shared/AffiliateCard";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { generateRoast } from "@/utils/roastEngine";

interface DashboardClientProps {
  userData: {
    id: string;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Realtime state
  const [balance, setBalance] = useState<number>(userData.walletBalance);
  const [ballIq, setBallIq] = useState<number>(userData.ballIqPoints);

  // Modals State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  // Progressive Loading State (Prevents UI Clutter)
  const [visibleActive, setVisibleActive] = useState(3);
  const [visibleHistory, setVisibleHistory] = useState(5);

  const [dailyRoast] = useState(() => generateRoast(userData.walletBalance, userData.ballIqPoints, pastDuels));

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`user-vault-${userData.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userData.id}` },
        (payload: any) => {
          if (payload.new) {
            if (payload.new.wallet_balance !== undefined) setBalance(payload.new.wallet_balance);
            if (payload.new.ball_iq_points !== undefined) setBallIq(payload.new.ball_iq_points);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userData.id]);

  const copyDuelLink = (duelId: string) => {
    const link = `${window.location.origin}/duel/${duelId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(duelId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-28 font-sans selection:bg-green-500/30">
      
      {/* Top Navbar */}
      <div className="bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-5 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[2px] shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black text-lg">
              {userData.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase">Welcome back</div>
            <div className="font-black text-base leading-tight">@{userData.username}</div>
          </div>
        </div>

        <form action={signOut}>
          <button type="submit" className="flex items-center gap-2 text-[10px] font-black text-red-500 bg-red-500/5 border border-red-500/10 px-3 py-2.5 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all tracking-widest uppercase group">
            <span>Exit</span>
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </form>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6 mt-2">
        {/* THE BANTR ROAST BAR */}
        <div className="bg-red-500/10 border-y border-red-500/20 py-2 px-4 flex items-center gap-3 overflow-hidden">
          <div className="bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm whitespace-nowrap">Daily Banter</div>
          <p className="text-xs font-medium text-red-200/80 truncate italic">"{dailyRoast}"</p>
        </div>

        {/* The Vault Card */}
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Total Balance
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">₦{balance.toLocaleString()}</div>
            </div>
            
            <div className="text-right bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 backdrop-blur-sm shadow-inner">
              <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-0.5">Ball IQ</div>
              <div className="text-xl font-black text-white leading-none">{ballIq} <span className="text-xs text-neutral-500 font-bold tracking-normal">pts</span></div>
              <div className="text-[10px] text-neutral-400 mt-1 font-medium">{userData.rank}</div>
            </div>
          </div>

          <div className="flex gap-3 relative z-10">
            <button onClick={() => setIsDepositOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-black text-sm py-3.5 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              FUND
            </button>
            <button onClick={() => setIsWithdrawOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 text-white border border-neutral-700 font-black text-sm py-3.5 rounded-xl hover:bg-neutral-700 transition-all active:scale-[0.98]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CASHOUT
            </button>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-neutral-900 rounded-xl p-1.5 border border-neutral-800 shadow-inner">
          <button 
            onClick={() => setActiveTab("active")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "active" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Active ({activeDuels.length})
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "history" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            History ({pastDuels.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          
          {/* ACTIVE TAB (With Progressive Loading) */}
          {activeTab === "active" && activeDuels.length > 0 && (
            <>
              {activeDuels.slice(0, visibleActive).map((duel) => (
                <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800/60">
                    <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {duel.time || "Scheduled"}
                    </div>
                    {duel.status === "open" ? (
                      <button 
                        onClick={() => copyDuelLink(duel.id)}
                        className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1.5 rounded uppercase font-black hover:bg-yellow-500/20 transition-colors flex items-center gap-1.5 active:scale-95"
                      >
                        {copiedId === duel.id ? (
                          <>Copied! <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></>
                        ) : (
                          <>Copy Link <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></>
                        )}
                      </button>
                    ) : (
                      <div className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1.5 rounded uppercase font-black flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></span> Locked
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex-1">
                      <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Match</div>
                      <div className="font-black text-lg text-white leading-tight pr-4">{duel.match}</div>
                    </div>
                    <div className="text-right pl-4 border-l border-neutral-800">
                      <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Stake</div>
                      <div className="font-black text-xl text-white">₦{(duel.stake_amount || duel.stake || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-neutral-950/80 rounded-xl p-1 flex items-stretch border border-neutral-800/80">
                    <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 bg-neutral-900 rounded-lg text-center">
                      <span className="text-[9px] text-neutral-500 font-bold uppercase mb-0.5">Your Pick</span>
                      <span className="font-black text-white uppercase text-sm truncate w-full px-1">{duel.prediction_creator || duel.myPick || "Unknown"}</span>
                    </div>
                    
                    <div className="flex items-center justify-center px-3">
                      <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 shadow-inner">
                        <span className="text-[9px] font-black text-neutral-400 italic">VS</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center">
                      <span className="text-[9px] text-neutral-500 font-bold uppercase mb-0.5">Opponent</span>
                      {duel.opponent ? (
                         <span className="font-bold text-neutral-300 text-sm truncate w-full px-1">@{duel.opponent}</span>
                      ) : (
                         <span className="font-bold text-neutral-600 text-sm italic">Waiting...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More Active Button */}
              {visibleActive < activeDuels.length && (
                <button 
                  onClick={() => setVisibleActive(prev => prev + 3)}
                  className="w-full py-4 mt-2 border border-neutral-800 rounded-2xl text-[11px] font-black text-neutral-500 uppercase tracking-widest hover:text-white hover:border-neutral-600 hover:bg-neutral-900 transition-all flex items-center justify-center gap-2"
                >
                  Load More Active Battles
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </>
          )}

          {/* HISTORY TAB (With Progressive Loading) */}
          {activeTab === "history" && pastDuels.length > 0 && (
            <>
              {pastDuels.slice(0, visibleHistory).map((duel) => (
                <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group hover:border-neutral-700 transition-colors animate-in fade-in duration-500">
                  {duel.result === "won" && (
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
                  )}
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex-1 pr-4">
                      <div className="text-xs text-neutral-400 font-bold mb-1 line-clamp-1">{duel.match}</div>
                      <div className="font-black text-lg text-white">vs @{duel.opponent || "Unknown"}</div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className={`text-[10px] border px-2 py-1 rounded uppercase font-black mb-1.5 inline-flex items-center gap-1 ${
                        duel.result === "won" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        {duel.result === "won" ? "Victory" : "Defeat"}
                      </div>
                      <div className={`font-black text-xl tracking-tight ${duel.result === "won" ? "text-green-400" : "text-red-500"}`}>
                        {duel.result === "won" ? "+" : "-"}₦{duel.result === "won" ? (duel.payout || 0).toLocaleString() : (duel.stake_amount || duel.stake || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {duel.result === "won" && (
                    <div className="mt-4 pt-4 border-t border-neutral-800/60 relative z-10">
                      <ShareReceiptButton 
                        winner={userData.username}
                        loser={duel.opponent || "Unknown"}
                        amount={duel.payout || 0}
                        match={duel.match}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Load More History Button */}
              {visibleHistory < pastDuels.length && (
                <button 
                  onClick={() => setVisibleHistory(prev => prev + 5)}
                  className="w-full py-4 mt-2 border border-neutral-800 rounded-2xl text-[11px] font-black text-neutral-500 uppercase tracking-widest hover:text-white hover:border-neutral-600 hover:bg-neutral-900 transition-all flex items-center justify-center gap-2"
                >
                  Load Older Battles
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </>
          )}

          {/* Empty States */}
          {activeTab === "active" && activeDuels.length === 0 && (
            <div className="text-center py-16 px-4 bg-neutral-900/50 border border-neutral-800/50 rounded-3xl border-dashed">
              <div className="w-16 h-16 mx-auto bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-white font-black text-lg mb-1">No Active Battles</h3>
              <p className="text-neutral-500 text-sm font-medium">Your schedule is clear. Head to the arena to lock in a prediction.</p>
            </div>
          )}

          {activeTab === "history" && pastDuels.length === 0 && (
            <div className="text-center py-16 px-4 bg-neutral-900/50 border border-neutral-800/50 rounded-3xl border-dashed">
              <h3 className="text-white font-black text-lg mb-1">Clean Slate</h3>
              <p className="text-neutral-500 text-sm font-medium">You haven't finished any duels yet. History is waiting to be written.</p>
            </div>
          )}
        </div>

        {/* AFFILIATE CARD MOUNTED HERE */}
        <AffiliateCard userId={userData.id} />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent z-40">
        <Link href="/duel/create" className="w-full max-w-lg mx-auto block">
          <button className="w-full flex items-center justify-center gap-2 bg-green-500 text-black font-black text-[15px] tracking-wide py-4 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_25px_rgba(34,197,94,0.25)] active:scale-[0.98]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            CREATE NEW DUEL
          </button>
        </Link>
      </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} maxBalance={balance} />
    </div>
  );
}



// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import WithdrawModal from "@/components/shared/WithdrawModal";
// import DepositModal from "@/components/shared/DepositModal";
// import ShareReceiptButton from "@/components/shared/ShareReceiptButton";
// import AffiliateCard from "@/components/shared/AffiliateCard";
// import { signOut } from "@/app/actions/auth";
// import { createClient } from "@/lib/supabase/client";
// import { generateRoast } from "@/utils/roastEngine";

// // Define the shape of our props
// interface DashboardClientProps {
//   userData: {
//     id: string;
//     username: string;
//     walletBalance: number;
//     ballIqPoints: number;
//     rank: string;
//   };
//   activeDuels: any[];
//   pastDuels: any[];
// }

// export default function DashboardClient({ userData, activeDuels, pastDuels }: DashboardClientProps) {
//   const [activeTab, setActiveTab] = useState<"active" | "history">("active");
//   const [copiedId, setCopiedId] = useState<string | null>(null);
  
//   // 1. Local state for live Realtime updates
//   const [balance, setBalance] = useState<number>(userData.walletBalance);
//   const [ballIq, setBallIq] = useState<number>(userData.ballIqPoints);

//   // Modals State
//   const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
//   const [isDepositOpen, setIsDepositOpen] = useState(false);

//   // Only generate this once per mount so it doesn't flicker on re-renders
//   const [dailyRoast] = useState(() => generateRoast(userData.walletBalance, userData.ballIqPoints, pastDuels));

//   // 2. SUPABASE REALTIME LISTENER (Updates vault balance & Ball IQ instantly when webhook or referee cron runs)
//   useEffect(() => {
//     const supabase = createClient();

//     const channel = supabase
//       .channel(`user-vault-${userData.id}`)
//       .on(
//         'postgres_changes',
//         {
//           event: 'UPDATE',
//           schema: 'public',
//           table: 'users',
//           filter: `id=eq.${userData.id}`,
//         },
//         (payload: any) => {
//           if (payload.new) {
//             if (payload.new.wallet_balance !== undefined) {
//               setBalance(payload.new.wallet_balance);
//             }
//             if (payload.new.ball_iq_points !== undefined) {
//               setBallIq(payload.new.ball_iq_points);
//             }
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [userData.id]);

//   // Helper function to copy duel link
//   const copyDuelLink = (duelId: string) => {
//     const link = `${window.location.origin}/duel/${duelId}`;
//     navigator.clipboard.writeText(link);
//     setCopiedId(duelId);
//     setTimeout(() => setCopiedId(null), 2000);
//   };

//   return (
//     <div className="min-h-screen bg-neutral-950 text-white pb-28 font-sans selection:bg-green-500/30">
      
//       {/* Top Navbar */}
//       <div className="bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-5 py-4 sticky top-0 z-50 flex justify-between items-center">
        
//         {/* Left Side: Profile */}
//         <div className="flex items-center gap-3">
//           <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[2px] shadow-[0_0_15px_rgba(52,211,153,0.2)]">
//             <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black text-lg">
//               {userData.username.charAt(0).toUpperCase()}
//             </div>
//           </div>
//           <div>
//             <div className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase">Welcome back</div>
//             <div className="font-black text-base leading-tight">@{userData.username}</div>
//           </div>
//         </div>

//         {/* Right Side: Logout Button */}
//         <form action={signOut}>
//           <button 
//             type="submit"
//             className="flex items-center gap-2 text-[10px] font-black text-red-500 bg-red-500/5 border border-red-500/10 px-3 py-2.5 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all tracking-widest uppercase group"
//           >
//             <span>Exit</span>
//             <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//             </svg>
//           </button>
//         </form>
//       </div>

//       <div className="p-4 max-w-lg mx-auto space-y-6 mt-2">

//         {/* THE BANTR ROAST BAR */}
//         <div className="bg-red-500/10 border-y border-red-500/20 py-2 px-4 flex items-center gap-3 overflow-hidden">
//           <div className="bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
//             Daily Banter
//           </div>
//           <p className="text-xs font-medium text-red-200/80 truncate italic">
//             "{dailyRoast}"
//           </p>
//         </div>

//         {/* The Vault Card */}
//         <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
//           <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500" />
          
//           <div className="flex justify-between items-start mb-8 relative z-10">
//             <div>
//               <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
//                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//                 </svg>
//                 Total Balance
//               </div>
//               <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
//                 ₦{balance.toLocaleString()}
//               </div>
//             </div>
            
//             {/* Ball IQ Status */}
//             <div className="text-right bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 backdrop-blur-sm shadow-inner">
//               <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-0.5">Ball IQ</div>
//               <div className="text-xl font-black text-white leading-none">{ballIq} <span className="text-xs text-neutral-500 font-bold tracking-normal">pts</span></div>
//               <div className="text-[10px] text-neutral-400 mt-1 font-medium">{userData.rank}</div>
//             </div>
//           </div>

//           {/* Deposit & Withdraw Action Buttons */}
//           <div className="flex gap-3 relative z-10">
//             <button 
//               onClick={() => setIsDepositOpen(true)}
//               className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-black text-sm py-3.5 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
//             >
//               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
//               </svg>
//               FUND
//             </button>
//             <button 
//               onClick={() => setIsWithdrawOpen(true)}
//               className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 text-white border border-neutral-700 font-black text-sm py-3.5 rounded-xl hover:bg-neutral-700 transition-all active:scale-[0.98]"
//             >
//               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//               </svg>
//               CASHOUT
//             </button>
//           </div>
//         </div>

//         {/* Custom Tabs */}
//         <div className="flex bg-neutral-900 rounded-xl p-1.5 border border-neutral-800 shadow-inner">
//           <button 
//             onClick={() => setActiveTab("active")}
//             className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "active" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-400"}`}
//           >
//             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
//             </svg>
//             Active ({activeDuels.length})
//           </button>
//           <button 
//             onClick={() => setActiveTab("history")}
//             className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "history" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-400"}`}
//           >
//             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             History ({pastDuels.length})
//           </button>
//         </div>

//         {/* Tab Content */}
//         <div className="space-y-4">
          
//           {activeTab === "active" && activeDuels.map((duel) => (
//             <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors">
//               <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800/60">
//                 <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
//                   <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   {duel.time || "Scheduled"}
//                 </div>
//                 {duel.status === "open" ? (
//                   <button 
//                     onClick={() => copyDuelLink(duel.id)}
//                     className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1.5 rounded uppercase font-black hover:bg-yellow-500/20 transition-colors flex items-center gap-1.5 active:scale-95"
//                   >
//                     {copiedId === duel.id ? (
//                       <>Copied! <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></>
//                     ) : (
//                       <>Copy Link <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></>
//                     )}
//                   </button>
//                 ) : (
//                   <div className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1.5 rounded uppercase font-black flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
//                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></span> Locked
//                   </div>
//                 )}
//               </div>
              
//               <div className="flex justify-between items-center mb-5">
//                 <div className="flex-1">
//                   <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Match</div>
//                   <div className="font-black text-lg text-white leading-tight pr-4">{duel.match}</div>
//                 </div>
//                 <div className="text-right pl-4 border-l border-neutral-800">
//                   <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Stake</div>
//                   <div className="font-black text-xl text-white">₦{(duel.stake_amount || duel.stake || 0).toLocaleString()}</div>
//                 </div>
//               </div>

//               {/* Enhanced VS Card */}
//               <div className="bg-neutral-950/80 rounded-xl p-1 flex items-stretch border border-neutral-800/80">
//                 <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 bg-neutral-900 rounded-lg text-center">
//                   <span className="text-[9px] text-neutral-500 font-bold uppercase mb-0.5">Your Pick</span>
//                   <span className="font-black text-white uppercase text-sm truncate w-full px-1">{duel.prediction_creator || duel.myPick || "Unknown"}</span>
//                 </div>
                
//                 <div className="flex items-center justify-center px-3">
//                   <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 shadow-inner">
//                     <span className="text-[9px] font-black text-neutral-400 italic">VS</span>
//                   </div>
//                 </div>

//                 <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center">
//                   <span className="text-[9px] text-neutral-500 font-bold uppercase mb-0.5">Opponent</span>
//                   {duel.opponent ? (
//                      <span className="font-bold text-neutral-300 text-sm truncate w-full px-1">@{duel.opponent}</span>
//                   ) : (
//                      <span className="font-bold text-neutral-600 text-sm italic">Waiting...</span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}

//           {activeTab === "history" && pastDuels.map((duel) => (
//             <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group hover:border-neutral-700 transition-colors">
//               {duel.result === "won" && (
//                 <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
//               )}
              
//               <div className="flex justify-between items-start mb-4 relative z-10">
//                 <div className="flex-1 pr-4">
//                   <div className="text-xs text-neutral-400 font-bold mb-1 line-clamp-1">{duel.match}</div>
//                   <div className="font-black text-lg text-white">vs @{duel.opponent || "Unknown"}</div>
//                 </div>
//                 <div className="text-right flex flex-col items-end">
//                   <div className={`text-[10px] border px-2 py-1 rounded uppercase font-black mb-1.5 inline-flex items-center gap-1 ${
//                     duel.result === "won" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
//                   }`}>
//                     {duel.result === "won" ? "Victory" : "Defeat"}
//                   </div>
//                   <div className={`font-black text-xl tracking-tight ${duel.result === "won" ? "text-green-400" : "text-red-500"}`}>
//                     {duel.result === "won" ? "+" : "-"}₦{duel.result === "won" ? (duel.payout || 0).toLocaleString() : (duel.stake_amount || duel.stake || 0).toLocaleString()}
//                   </div>
//                 </div>
//               </div>

//               {/* The Viral Share Button appears only if the user won */}
//               {duel.result === "won" && (
//                 <div className="mt-4 pt-4 border-t border-neutral-800/60 relative z-10">
//                   <ShareReceiptButton 
//                     winner={userData.username}
//                     loser={duel.opponent || "Unknown"}
//                     amount={duel.payout || 0}
//                     match={duel.match}
//                   />
//                 </div>
//               )}
//             </div>
//           ))}

//           {/* Enhanced Empty States */}
//           {activeTab === "active" && activeDuels.length === 0 && (
//             <div className="text-center py-16 px-4 bg-neutral-900/50 border border-neutral-800/50 rounded-3xl border-dashed">
//               <div className="w-16 h-16 mx-auto bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
//                 <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <h3 className="text-white font-black text-lg mb-1">No Active Battles</h3>
//               <p className="text-neutral-500 text-sm font-medium">Your schedule is clear. Head to the arena to lock in a prediction.</p>
//             </div>
//           )}

//           {activeTab === "history" && pastDuels.length === 0 && (
//             <div className="text-center py-16 px-4 bg-neutral-900/50 border border-neutral-800/50 rounded-3xl border-dashed">
//               <h3 className="text-white font-black text-lg mb-1">Clean Slate</h3>
//               <p className="text-neutral-500 text-sm font-medium">You haven't finished any duels yet. History is waiting to be written.</p>
//             </div>
//           )}
//         </div>

//         {/* AFFILIATE CARD MOUNTED HERE */}
//         <AffiliateCard userId={userData.id} />

//       </div>

//       {/* Floating Action Button */}
//       <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent z-40">
//         <Link href="/duel/create" className="w-full max-w-lg mx-auto block">
//           <button className="w-full flex items-center justify-center gap-2 bg-green-500 text-black font-black text-[15px] tracking-wide py-4 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_25px_rgba(34,197,94,0.25)] active:scale-[0.98]">
//             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
//             </svg>
//             CREATE NEW DUEL
//           </button>
//         </Link>
//       </div>

//       {/* Financial Modals loaded at the root level */}
//       <DepositModal 
//         isOpen={isDepositOpen} 
//         onClose={() => setIsDepositOpen(false)} 
//       />
      
//       <WithdrawModal 
//         isOpen={isWithdrawOpen} 
//         onClose={() => setIsWithdrawOpen(false)} 
//         maxBalance={balance} 
//       />

//     </div>
//   );
// }