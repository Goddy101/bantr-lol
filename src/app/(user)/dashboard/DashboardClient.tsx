"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { toast } from "sonner"; 
import WithdrawModal from "@/components/shared/WithdrawModal";
import DepositModal from "@/components/shared/DepositModal";
import ShareReceiptButton from "@/components/shared/ShareReceiptButton";
import AffiliateCard from "@/components/shared/AffiliateCard";
import SponsorCard from "@/components/shared/SponsorCard"; 
import { createClient } from "@/lib/supabase/client";

interface DashboardClientProps {

  userData: {
    id: string;
    username: string;
    walletBalance: number;
    unwageredBalance: number;
    ballIqPoints: number;
    rank: string;
    isPartner?: boolean;
  };
  activeDuels: any[];
  pastDuels: any[];
  dailyRoast: string; 
  sponsor?: any; 
}

export default function DashboardClient({ userData, activeDuels, pastDuels, dailyRoast, sponsor }: DashboardClientProps) {
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // --- Realtime State ---
  const [balance, setBalance] = useState<number>(userData.walletBalance);
  const [unwageredBalance, setUnwageredBalance] = useState<number>(userData.unwageredBalance || 0);
  const [ballIq, setBallIq] = useState<number>(userData.ballIqPoints);

  // --- Modals & UI State ---
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [showPlaythroughInfo, setShowPlaythroughInfo] = useState(false);

  // Progressive Loading State
  const [visibleActive, setVisibleActive] = useState(3);
  const [visibleHistory, setVisibleHistory] = useState(5);

  // --- Math for the UI ---
  const withdrawable = Math.max(0, balance - unwageredBalance);
  const locked = unwageredBalance;

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
            if (payload.new.unwagered_balance !== undefined) setUnwageredBalance(payload.new.unwagered_balance);
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
    toast.success("Link copied! Drop it in the group chat."); 
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateDuel = () => {
    if (balance < 500) {
      toast.error("Insufficient funds. Fund your vault to place a stake!");
      setIsDepositOpen(true); 
    } else {
      router.push("/duel/create");
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Unable to sign out. Please try again.");
      return;
    }
    router.push("/login");
    router.refresh();
  };

  return (
    // INCREASED BOTTOM PADDING TO pb-40 TO PREVENT FAB OVERLAP
    <div className="min-h-screen bg-neutral-950 text-white pb-40 font-sans selection:bg-green-500/30">
      
      {/* Top Navbar */}
      <div className="bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-900 px-5 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[2px] shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black text-lg">
              {userData.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Welcome back</div>
            <div className="font-black text-base leading-tight tracking-wide">@{userData.username}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/leaderboard" className="flex items-center gap-1.5 text-[10px] font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg hover:bg-yellow-500/20 transition-all tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Rank
          </Link>
          <button onClick={handleSignOut} className="flex items-center justify-center w-8 h-8 text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 hover:text-white transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6 mt-2">
        {/* THE BANTR ROAST BAR - Smoother alignment */}
        <div className="bg-red-500/5 border border-red-500/10 py-2 px-3 rounded-xl flex items-center gap-3 overflow-hidden">
          <div className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm whitespace-nowrap">Daily Banter</div>
          <p className="text-xs font-medium text-red-300/80 truncate italic">"{dailyRoast}"</p>
        </div>

        {/* --- THE VAULT CARD --- */}
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-green-500/10 rounded-full blur-3xl transition-all duration-500" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Total Balance
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">₦{balance.toLocaleString()}</div>
            </div>
            
            <div className="text-right bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3 backdrop-blur-md shadow-inner">
              <div className="text-[9px] text-yellow-500 font-black uppercase tracking-widest mb-0.5">Ball IQ</div>
              <div className="text-xl font-black text-white leading-none">{ballIq} <span className="text-xs text-neutral-500 font-bold tracking-normal">pts</span></div>
              <div className="text-[10px] text-neutral-400 mt-1 font-bold">{userData.rank}</div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
            {/* Withdrawable */}
            <div className="bg-neutral-950/60 border border-neutral-800/50 rounded-2xl p-4 text-left shadow-inner flex flex-col justify-center">
              <div className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest mb-1">Withdrawable</div>
              <div className="text-xl font-black text-green-400">₦{withdrawable.toLocaleString()}</div>
            </div>

            {/* Unplayed / Locked */}
            <div 
              onClick={() => setShowPlaythroughInfo(!showPlaythroughInfo)}
              className="bg-neutral-950/60 border border-neutral-800/50 rounded-2xl p-4 text-left shadow-inner cursor-pointer hover:border-orange-500/30 hover:bg-neutral-900/80 transition-all flex flex-col justify-center group/tooltip"
            >
              <div className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest mb-1 flex items-center justify-between">
                Unplayed
                <span className="w-4 h-4 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center text-[10px] font-black group-hover/tooltip:bg-orange-500/20 transition-colors">?</span>
              </div>
              <div className="text-xl font-black text-orange-400">₦{locked.toLocaleString()}</div>
            </div>
          </div>

          {/* Playthrough Explainer Box */}
          {showPlaythroughInfo && (
            <div className="mb-6 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200 relative z-10">
              <h4 className="text-xs font-black text-orange-400 mb-1 uppercase tracking-wider">The 1x Playthrough Rule</h4>
              <p className="text-[11px] font-medium text-orange-200/80 leading-relaxed">
                Deposits must be played in a duel or rumble at least once before withdrawing to prevent fraud. <strong className="text-white">Your winnings are always instantly withdrawable!</strong>
              </p>
            </div>
          )}

          {/* Action Buttons */}
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

        {/* Custom Segmented Tabs */}
        <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800/80 shadow-inner">
          <button 
            onClick={() => setActiveTab("active")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "active" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Active <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === "active" ? "bg-neutral-700 text-white" : "bg-neutral-800 text-neutral-500"}`}>{activeDuels.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "history" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            History <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === "history" ? "bg-neutral-700 text-white" : "bg-neutral-800 text-neutral-500"}`}>{pastDuels.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          
          {/* ACTIVE TAB */}
          {activeTab === "active" && activeDuels.length > 0 && (
            <>
              {activeDuels.slice(0, visibleActive).map((duel) => (
                <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800/60">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {duel.time || "Scheduled"}
                    </div>
                    {duel.status === "open" ? (
                      <button 
                        onClick={() => copyDuelLink(duel.id)}
                        className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-lg uppercase font-black hover:bg-yellow-500/20 transition-colors flex items-center gap-1.5 active:scale-95"
                      >
                        {copiedId === duel.id ? (
                          <>Copied! <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></>
                        ) : (
                          <>Copy Link <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></>
                        )}
                      </button>
                    ) : (
                      <div className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-lg uppercase font-black flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Locked
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex-1">
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Match</div>
                      <div className="font-black text-lg text-white leading-tight pr-4">{duel.match}</div>
                    </div>
                    <div className="text-right pl-4 border-l border-neutral-800">
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Stake</div>
                      <div className="font-black text-xl text-white">₦{(duel.stake_amount || duel.stake || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Sleeker VS Head-to-Head Section */}
                  <div className="bg-neutral-950 rounded-xl p-1.5 flex items-center border border-neutral-800/60 shadow-inner">
                    <div className="flex-1 py-2 px-2 text-center rounded-lg bg-neutral-900/50">
                      <div className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Your Pick</div>
                      <div className="font-black text-white text-sm truncate">{duel.prediction_creator || duel.myPick || "Unknown"}</div>
                    </div>
                    
                    <div className="px-3 flex items-center justify-center">
                      <div className="text-[10px] font-black text-neutral-600 italic">VS</div>
                    </div>

                    <div className="flex-1 py-2 px-2 text-center rounded-lg bg-neutral-900/50">
                      <div className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Opponent</div>
                      {duel.opponent ? (
                         <div className="font-bold text-neutral-300 text-sm truncate">@{duel.opponent}</div>
                      ) : (
                         <div className="font-bold text-neutral-600 text-sm italic">Waiting...</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {visibleActive < activeDuels.length && (
                <button 
                  onClick={() => setVisibleActive(prev => prev + 3)}
                  className="w-full py-4 mt-2 border border-neutral-800 rounded-2xl text-[11px] font-black text-neutral-500 uppercase tracking-widest hover:text-white hover:border-neutral-700 hover:bg-neutral-900 transition-all flex items-center justify-center gap-2"
                >
                  Load More Active Battles
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && pastDuels.length > 0 && (
            <>
              {pastDuels.slice(0, visibleHistory).map((duel) => (
                <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group hover:border-neutral-700 transition-colors animate-in fade-in duration-300">
                  {duel.result === "won" && (
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
                  )}
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex-1 pr-4">
                      <div className="text-xs text-neutral-400 font-bold mb-1 line-clamp-1">{duel.match}</div>
                      <div className="font-black text-lg text-white">vs @{duel.opponent || "Unknown"}</div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className={`text-[9px] px-2 py-1 rounded border uppercase font-black mb-1.5 inline-flex items-center gap-1 ${
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
                        sponsor={sponsor}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {visibleHistory < pastDuels.length && (
                <button 
                  onClick={() => setVisibleHistory(prev => prev + 5)}
                  className="w-full py-4 mt-2 border border-neutral-800 rounded-2xl text-[11px] font-black text-neutral-500 uppercase tracking-widest hover:text-white hover:border-neutral-700 hover:bg-neutral-900 transition-all flex items-center justify-center gap-2"
                >
                  Load Older Battles
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </>
          )}

          {/* Empty States */}
          {activeTab === "active" && activeDuels.length === 0 && (
            <div className="text-center py-16 px-4 bg-neutral-900/40 border border-neutral-800/50 rounded-3xl border-dashed">
              <div className="w-16 h-16 mx-auto bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-white font-black text-lg mb-1">No Active Battles</h3>
              <p className="text-neutral-500 text-sm font-medium">Your schedule is clear. Head to the arena to lock in a prediction.</p>
            </div>
          )}

          {activeTab === "history" && pastDuels.length === 0 && (
            <div className="text-center py-16 px-4 bg-neutral-900/40 border border-neutral-800/50 rounded-3xl border-dashed">
              <h3 className="text-white font-black text-lg mb-1">Clean Slate</h3>
              <p className="text-neutral-500 text-sm font-medium">You haven't finished any duels yet. History is waiting to be written.</p>
            </div>
          )}
        </div>

        {/* NATIVE SPONSOR AD MOUNTED HERE */}
        <SponsorCard sponsor={sponsor} />

        {/* AFFILIATE CARD MOUNTED HERE */}
        <AffiliateCard userId={userData.id} isPartner={userData.isPartner} />

      </div>

      {/* Floating Action Button - Padding fixed by pb-40 on parent */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-10 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent z-40 pointer-events-none">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-2 pointer-events-auto">
          <button 
            onClick={handleCreateDuel}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-black font-black text-[14px] tracking-wide py-4 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_25px_rgba(34,197,94,0.2)] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            CREATE NEW DUEL
          </button>

          <Link href="/rumble/create" className="w-full block">
            <button className="w-full flex items-center justify-center gap-2 bg-neutral-900/90 backdrop-blur-md text-yellow-500 border border-yellow-500/20 font-black text-[14px] tracking-wide py-3.5 rounded-xl hover:bg-neutral-800 transition-all active:scale-[0.98]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              HOST MULTIPLAYER RUMBLE
            </button>
          </Link>
        </div>
      </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} maxBalance={withdrawable} />
    </div>
  );
}

