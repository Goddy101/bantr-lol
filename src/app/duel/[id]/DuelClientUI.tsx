"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DuelClientUIProps {
  duel: any;
  currentUserId: string | null;
  isLoggedIn: boolean;
}

export default function DuelClientUI({ duel, currentUserId, isLoggedIn }: DuelClientUIProps) {
  const router = useRouter();
  const [counterPrediction, setCounterPrediction] = useState<"home" | "away" | "draw" | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCreator = currentUserId === duel.creator_id;
  const isMatched = duel.status !== "open";

  // Determine available counter picks based on what the creator picked
  const getCounterPicks = () => {
    const picks = [];
    if (duel.creator_prediction !== "home") picks.push({ value: "home", label: "Home", color: "from-blue-500 to-blue-600", icon: "🏠" });
    if (duel.creator_prediction !== "draw") picks.push({ value: "draw", label: "Draw", color: "from-neutral-400 to-neutral-500", icon: "⚖️" });
    if (duel.creator_prediction !== "away") picks.push({ value: "away", label: "Away", color: "from-red-500 to-red-600", icon: "✈️" });
    return picks;
  };

  // NATIVE OS SHARE FEATURE
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: "Bantr Arena Challenge",
      text: `I just dropped ₦${duel.stake_amount.toLocaleString()} on Bantr. Are you brave enough to match my stake?`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share sheet closed or failed.");
      }
    } else {
      // Fallback for Desktop
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleAccept = async () => {
    if (!counterPrediction) return;
    setIsAccepting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/duels/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duel_id: duel.id, prediction: counterPrediction }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error);
        setIsAccepting(false);
      }
    } catch (error) {
      setErrorMsg("Network error. Please try again.");
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 pb-20 font-sans selection:bg-green-500/30 overflow-hidden relative">
      
      {/* Dynamic Background Glow based on Status */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-0 transition-colors duration-1000 ${
        isMatched ? "bg-blue-500/10" : "bg-green-500/10"
      }`} />

      <div className="w-full max-w-md relative z-10">
        
        {/* Main Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Status Badge */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-xl font-black tracking-tighter text-white">BANTR<span className="text-green-500">.</span></div>
            <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full ${
              isMatched ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-red-500/10 border-red-500/20 text-red-500"
            }`}>
              {!isMatched && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
              {isMatched && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest">{isMatched ? "Escrow Locked" : "Live Challenge"}</span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col items-center mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[3px] shadow-[0_0_25px_rgba(52,211,153,0.3)] mb-4">
                <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-3xl font-black text-white">
                  {duel.creator?.username?.charAt(0).toUpperCase() || "?"}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md text-neutral-300 shadow-lg whitespace-nowrap">
                Challenger
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-3">
              @{duel.creator?.username}
            </h1>
            <p className="text-neutral-400 mt-2 text-sm max-w-[280px] leading-relaxed font-medium">
              Has dropped money on the table. Are you brave enough to match it?
            </p>
          </div>

          {/* The Stakes & Picks UI */}
          <div className="bg-neutral-950/80 rounded-3xl border border-neutral-800 p-5 mb-8 shadow-inner relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl" />
            
            <div className="text-center mb-6 relative z-10">
              <div className="text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-1">Total Escrow Pot</div>
              <div className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.2)] tracking-tight">
                ₦{(duel.stake_amount * 2).toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-500 font-bold mt-1">WINNER TAKES ALL</div>
            </div>

            {/* VS Board */}
            <div className="flex items-center justify-between relative z-10 bg-neutral-900/50 rounded-2xl p-2 border border-neutral-800/50">
              <div className="flex-1 text-center bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700/50 rounded-xl py-3 px-2 shadow-sm">
                <div className="text-[9px] text-green-400 font-black uppercase tracking-widest mb-1">Their Pick</div>
                <div className="font-black text-white uppercase sm:text-lg text-base">{duel.creator_prediction}</div>
              </div>

              <div className="mx-2 w-10 h-10 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center z-20 shadow-xl relative">
                <div className="absolute inset-0 bg-yellow-500/10 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-neutral-400 italic">VS</span>
              </div>

              <div className={`flex-1 text-center border rounded-xl py-3 px-2 transition-all ${counterPrediction ? "bg-gradient-to-b from-neutral-800 to-neutral-900 border-neutral-600 shadow-sm" : "bg-neutral-900/30 border-neutral-800 border-dashed opacity-60"}`}>
                <div className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">Your Pick</div>
                <div className={`font-black uppercase sm:text-lg text-base ${counterPrediction ? "text-white" : "text-neutral-600"}`}>{counterPrediction || "WAITING"}</div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-3 mb-6 text-sm font-medium animate-in fade-in">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {errorMsg}
            </div>
          )}

          {/* Action Area: For the Opponent */}
          {!isMatched && !isCreator && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-neutral-800 flex-1" />
                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Choose Your Weapon</div>
                <div className="h-px bg-neutral-800 flex-1" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {getCounterPicks().map((pick) => {
                  const isSelected = counterPrediction === pick.value;
                  return (
                    <button
                      key={pick.value}
                      onClick={() => setCounterPrediction(pick.value as any)}
                      className={`relative p-4 rounded-2xl text-center font-bold transition-all duration-300 overflow-hidden border ${
                        isSelected 
                          ? "bg-neutral-800 border-neutral-500 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.02]" 
                          : "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:bg-neutral-900"
                      }`}
                    >
                      <div className="text-xl mb-1 opacity-80">{pick.icon}</div>
                      <span className={`relative z-10 text-sm tracking-wide uppercase ${isSelected ? "text-white font-black" : ""}`}>{pick.label}</span>
                      {isSelected && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {!isLoggedIn ? (
                <Link href="/login" className="w-full block">
                  <button className="w-full bg-white text-black font-black text-[15px] tracking-wide py-4.5 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]">
                    LOGIN TO MATCH ₦{duel.stake_amount.toLocaleString()}
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleAccept}
                  disabled={!counterPrediction || isAccepting}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-black font-black text-[15px] tracking-wide py-4.5 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_25px_rgba(34,197,94,0.25)] relative overflow-hidden group"
                >
                  {isAccepting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      LOCKING FUNDS...
                    </>
                  ) : (
                    <>
                      {counterPrediction ? `MATCH THE ₦${duel.stake_amount.toLocaleString()} STAKE` : "SELECT A PICK FIRST"}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Action Area: For the Creator (NATIVE SHARE UI) */}
          {isCreator && !isMatched && (
             <div className="mt-8 animate-in fade-in duration-500">
               <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 text-center">
                 <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                   </svg>
                 </div>
                 <h3 className="text-white font-black text-lg mb-1">Your duel is live!</h3>
                 <p className="text-neutral-400 text-sm mb-5 font-medium leading-relaxed">
                   Send this page to your opponent so they can lock in their side of the bet.
                 </p>
                 
                 <button 
                   onClick={handleShare}
                   className="w-full bg-white text-black font-black text-[15px] tracking-wide py-4 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                   {isCopied ? (
                     <>
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                       LINK COPIED!
                     </>
                   ) : (
                     <>
                       INVITE OPPONENT
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                     </>
                   )}
                 </button>
               </div>
             </div>
          )}

          {/* Action Area: Matched State */}
          {isMatched && (
            <div className="mt-6 text-center bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
              <svg className="w-8 h-8 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-white font-black text-lg mb-1">Match Locked In</h3>
              <p className="text-neutral-400 text-sm font-medium">Escrow is secured. Return to your dashboard to track the results live.</p>
              
              <Link href="/dashboard" className="mt-5 block w-full bg-neutral-800 text-white font-black text-sm py-3.5 rounded-xl hover:bg-neutral-700 transition-all border border-neutral-700">
                GO TO DASHBOARD
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}