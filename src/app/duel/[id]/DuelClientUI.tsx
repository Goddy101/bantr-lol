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

  const isCreator = currentUserId === duel.creator_id;
  const isMatched = duel.status !== "open";

  // Determine available counter picks based on what the creator picked
  const getCounterPicks = () => {
    const picks = [];
    if (duel.creator_prediction !== "home") picks.push({ value: "home", label: "Home Team", color: "from-blue-600 to-blue-400" });
    if (duel.creator_prediction !== "away") picks.push({ value: "away", label: "Away Team", color: "from-red-600 to-red-400" });
    if (duel.creator_prediction !== "draw") picks.push({ value: "draw", label: "Draw", color: "from-neutral-600 to-neutral-400" });
    return picks;
  };

  const handleAccept = async () => {
    if (!counterPrediction) return;
    setIsAccepting(true);

    try {
      const res = await fetch("/api/duels/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duel_id: duel.id, prediction: counterPrediction }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Duel Locked! May the best fan win.");
        router.push("/dashboard");
      } else {
        alert(data.error);
        setIsAccepting(false);
      }
    } catch (error) {
      alert("Network error.");
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black text-white flex flex-col items-center justify-center p-4 pb-20">
      
      <div className="w-full max-w-md relative">
        <div className={`absolute -inset-1 rounded-[2rem] blur-xl opacity-50 ${isMatched ? "bg-gradient-to-r from-red-500/20 to-orange-500/20" : "bg-gradient-to-r from-green-500/20 to-emerald-500/20"}`} />

        <div className="bg-neutral-950/80 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden z-10">
          
          <div className={`absolute top-5 right-5 flex items-center gap-2 border px-3 py-1.5 rounded-full ${isMatched ? "bg-neutral-800/50 border-neutral-700 text-neutral-400" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
            {!isMatched && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">{isMatched ? "Escrow Locked" : "Live Challenge"}</span>
          </div>

          <div className="flex flex-col items-center mt-6 mb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[3px] shadow-[0_0_20px_rgba(52,211,153,0.3)] mb-4">
              <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-3xl font-black text-white">
                {duel.creator.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                @{duel.creator.username}
              </span>
            </h1>
            <p className="text-neutral-400 mt-2 text-sm max-w-[250px] leading-relaxed">
              Dropped the money on the table. Are you brave enough to match it?
            </p>
          </div>

          <div className="relative bg-neutral-900/50 rounded-2xl border border-neutral-800 p-1 mb-8">
            <div className="bg-neutral-950 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-neutral-900/50 transform rotate-45" />
              
              <div className="text-center mb-6 relative z-10">
                <div className="text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-1">Total Escrow Pot</div>
                <div className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  ₦{(duel.stake_amount * 2).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1 text-center bg-green-500/10 border border-green-500/30 rounded-lg py-3 px-2">
                  <div className="text-[10px] text-green-400 font-bold uppercase mb-1">Their Pick</div>
                  <div className="font-black text-white uppercase sm:text-lg text-base">{duel.creator_prediction}</div>
                </div>

                <div className="mx-2 w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center z-20 shadow-xl">
                  <span className="text-xs font-black text-neutral-500 italic">VS</span>
                </div>

                <div className="flex-1 text-center bg-neutral-900 border border-neutral-800 rounded-lg py-3 px-2 opacity-60">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Your Pick</div>
                  <div className="font-black text-white uppercase sm:text-lg text-base">{counterPrediction || "?"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Only show actions if it's open and you aren't the creator */}
          {!isMatched && !isCreator && (
            <>
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px bg-neutral-800 flex-1" />
                  <div className="text-xs font-black text-neutral-400 uppercase tracking-widest">Choose Your Weapon</div>
                  <div className="h-px bg-neutral-800 flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getCounterPicks().map((pick) => {
                    const isSelected = counterPrediction === pick.value;
                    return (
                      <button
                        key={pick.value}
                        onClick={() => setCounterPrediction(pick.value as any)}
                        className={`relative p-4 rounded-xl text-center font-bold transition-all duration-200 overflow-hidden ${
                          isSelected ? "bg-neutral-900 border-white/50 text-white scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)]" : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-900"
                        } border-2`}
                      >
                        {isSelected && <div className={`absolute inset-0 bg-gradient-to-br ${pick.color} opacity-10`} />}
                        <span className="relative z-10">{pick.label}</span>
                        {isSelected && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {!isLoggedIn ? (
                  <Link href="/login" className="w-full block">
                    <button className="w-full bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                      LOGIN TO MATCH ₦{duel.stake_amount.toLocaleString()}
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={handleAccept}
                    disabled={!counterPrediction || isAccepting}
                    className="group relative w-full rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all"
                  >
                    <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 ${!isAccepting && counterPrediction ? 'animate-[bg-pan_3s_linear_infinite] bg-[length:200%_auto]' : ''}`} />
                    <div className="relative px-6 py-5 flex items-center justify-center gap-2">
                      <span className="font-black text-black text-lg tracking-wide">
                        {isAccepting ? "Locking Funds in Escrow..." : `Match the ₦${duel.stake_amount.toLocaleString()}`}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}

          {isCreator && !isMatched && (
             <div className="text-center text-neutral-400 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
               <div className="font-bold mb-2">This is your duel.</div>
               <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link Copied!"); }} className="text-green-400 font-bold hover:underline">Copy Link to Share</button>
             </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bg-pan { 0% { background-position: 0% center; } 100% { background-position: -200% center; } }
      `}} />
    </div>
  );
}