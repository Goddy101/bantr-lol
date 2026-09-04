"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

// Define the shape of our live fixture data
interface Fixture {
  id: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  time: string;
  league: string;
}

const STAKE_TIERS = [
  { label: "Sapa Level", amount: 500, glow: false, icon: "🛡️" },
  { label: "Standard Banter", amount: 2000, glow: false, icon: "⚔️" },
  { label: "Men Mount", amount: 10000, glow: true, icon: "🔥" },
  { label: "Odogwu / Whale", amount: 50000, glow: true, icon: "🐋" },
];

// 1. Define the SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CreateDuelPage() {
  const router = useRouter();
  
  // 2. Use SWR instead of useEffect for robust, auto-refreshing live data
  const { data, isLoading } = useSWR('/api/fixtures', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  const fixtures: Fixture[] = data?.success ? data.fixtures : [];
  const isLoadingFixtures = isLoading;
  
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<"home" | "away" | "draw" | null>(null);
  const [stake, setStake] = useState<number>(2000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeMatch = fixtures.find((m) => m.id === selectedMatchId);
  const potentialPayout = stake * 1.9; // Platform takes 10%, winner gets 1.9x

  const handleCreate = async () => {
    if (!selectedMatchId || !prediction || !stake) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const res = await fetch('/api/duels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: selectedMatchId,
          prediction: prediction,
          stake_amount: stake
        })
      });

      const responseData = await res.json();

      if (responseData.success) {
        router.push(`/duel/${responseData.duel_id}`);
      } else {
        setErrorMsg(responseData.error || "Failed to create duel. Check your wallet balance.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Failed to create duel", error);
      setErrorMsg("A network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-32 font-sans selection:bg-green-500/30">
      
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sticky Header */}
      <div className="sticky top-0 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-5 py-4 z-50 flex justify-between items-center shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-1.5 text-neutral-400 font-bold hover:text-white transition-colors group text-sm"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="font-black tracking-widest text-sm uppercase">Create Duel</h1>
        <div className="flex items-center gap-2 text-[10px] font-black text-green-400 bg-green-400/10 border border-green-500/20 px-2.5 py-1.5 rounded-md uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-10 mt-6 relative z-10">
        
        {/* Error State Banner */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {/* STEP 1: Pick a Match */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center font-black text-xs border border-neutral-700 shadow-inner">1</div>
            <h2 className="text-xs font-black text-neutral-300 uppercase tracking-widest">Select Fixture</h2>
          </div>
          
          <div className="space-y-3">
            {isLoadingFixtures ? (
              // Enhanced Premium Skeleton Loader
              [1, 2, 3].map((i) => (
                <div key={i} className="w-full h-[104px] bg-neutral-900/50 border border-neutral-800/50 rounded-2xl animate-pulse p-4 flex flex-col justify-between">
                  <div className="flex justify-between w-full"><div className="w-16 h-3 bg-neutral-800 rounded" /><div className="w-12 h-3 bg-neutral-800 rounded" /></div>
                  <div className="flex justify-between items-center w-full mt-3">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-neutral-800 rounded-full" /><div className="w-20 h-4 bg-neutral-800 rounded" /></div>
                    <div className="flex items-center gap-3"><div className="w-20 h-4 bg-neutral-800 rounded" /><div className="w-8 h-8 bg-neutral-800 rounded-full" /></div>
                  </div>
                </div>
              ))
            ) : fixtures.length > 0 ? (
              fixtures.map((match) => (
                <button
                  key={match.id}
                  onClick={() => {
                    setSelectedMatchId(match.id);
                    setPrediction(null);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 active:scale-[0.99] ${
                    selectedMatchId === match.id 
                      ? "bg-gradient-to-br from-neutral-800 to-neutral-900 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] relative overflow-hidden" 
                      : "bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-600 hover:bg-neutral-800"
                  }`}
                >
                  {selectedMatchId === match.id && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
                  )}
                  
                  <div className="text-[10px] text-neutral-500 mb-3 flex justify-between font-bold uppercase tracking-wider relative z-10">
                    <span className={selectedMatchId === match.id ? "text-neutral-300" : ""}>{match.league}</span>
                    <span className={selectedMatchId === match.id ? "text-green-400 font-black" : "text-neutral-400"}>{match.time}</span>
                  </div>
                  
                  {/* Premium UI with Team Logos */}
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3 flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center p-1.5 border border-white/5">
                        <img src={match.homeLogo} alt={match.home} className="w-full h-full object-contain drop-shadow-md" />
                      </div>
                      <span className={`font-black text-sm sm:text-base truncate ${selectedMatchId === match.id ? "text-white" : "text-neutral-300"}`}>{match.home}</span>
                    </div>
                    
                    <div className="px-3 text-[10px] font-black text-neutral-600 italic tracking-widest">VS</div>
                    
                    <div className="flex items-center gap-3 flex-1 justify-end text-right">
                      <span className={`font-black text-sm sm:text-base truncate ${selectedMatchId === match.id ? "text-white" : "text-neutral-300"}`}>{match.away}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center p-1.5 border border-white/5">
                        <img src={match.awayLogo} alt={match.away} className="w-full h-full object-contain drop-shadow-md" />
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-neutral-900/50 border border-neutral-800/50 rounded-3xl border-dashed">
                <p className="text-neutral-500 text-sm font-medium">No upcoming fixtures found.</p>
              </div>
            )}
          </div>
        </section>

        {/* STEP 2: Pick a Side */}
        {activeMatch && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center font-black text-xs border border-neutral-700 shadow-inner">2</div>
              <h2 className="text-xs font-black text-neutral-300 uppercase tracking-widest">Back Your Talk</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Home Pick */}
              <button
                onClick={() => setPrediction("home")}
                className={`p-4 flex flex-col items-center justify-center gap-3 rounded-2xl border transition-all duration-300 ${
                  prediction === "home" 
                    ? "bg-gradient-to-b from-green-500 to-green-600 text-black border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105 z-10" 
                    : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center p-1.5 ${prediction === "home" ? "bg-black/10" : "bg-white/5"}`}>
                  <img src={activeMatch.homeLogo} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <span className={`block text-[10px] uppercase tracking-widest font-bold mb-0.5 ${prediction === "home" ? "text-green-950" : "text-neutral-500"}`}>Home</span>
                  <span className={`block text-xs font-black line-clamp-1 ${prediction === "home" ? "text-black" : "text-white"}`}>{activeMatch.home}</span>
                </div>
              </button>
              
              {/* Draw Pick */}
              <button
                onClick={() => setPrediction("draw")}
                className={`p-4 flex flex-col items-center justify-center gap-3 rounded-2xl border transition-all duration-300 ${
                  prediction === "draw" 
                    ? "bg-gradient-to-b from-neutral-200 to-neutral-400 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-10" 
                    : "bg-neutral-900/80 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:bg-neutral-800"
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center text-2xl font-black ${prediction === "draw" ? "text-black" : "text-neutral-600"}`}>X</div>
                <div className="text-center">
                  <span className={`block text-[10px] uppercase tracking-widest font-bold mb-0.5 ${prediction === "draw" ? "text-neutral-600" : "text-neutral-600"}`}>Tie</span>
                  <span className={`block text-xs font-black ${prediction === "draw" ? "text-black" : "text-white"}`}>Draw</span>
                </div>
              </button>
              
              {/* Away Pick */}
              <button
                onClick={() => setPrediction("away")}
                className={`p-4 flex flex-col items-center justify-center gap-3 rounded-2xl border transition-all duration-300 ${
                  prediction === "away" 
                    ? "bg-gradient-to-b from-green-500 to-green-600 text-black border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105 z-10" 
                    : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center p-1.5 ${prediction === "away" ? "bg-black/10" : "bg-white/5"}`}>
                  <img src={activeMatch.awayLogo} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <span className={`block text-[10px] uppercase tracking-widest font-bold mb-0.5 ${prediction === "away" ? "text-green-950" : "text-neutral-500"}`}>Away</span>
                  <span className={`block text-xs font-black line-clamp-1 ${prediction === "away" ? "text-black" : "text-white"}`}>{activeMatch.away}</span>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Set Stake */}
        {prediction && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center font-black text-xs border border-neutral-700 shadow-inner">3</div>
              <h2 className="text-xs font-black text-neutral-300 uppercase tracking-widest">Put Money On It</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {STAKE_TIERS.map((tier) => (
                <button
                  key={tier.amount}
                  onClick={() => setStake(tier.amount)}
                  className={`relative p-5 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                    stake === tier.amount 
                      ? "bg-neutral-800 border-neutral-500 shadow-inner" 
                      : "bg-neutral-900/80 border-neutral-800/80 hover:bg-neutral-800"
                  } ${tier.glow && stake === tier.amount ? "shadow-[0_0_20px_rgba(250,204,21,0.15)] border-yellow-500/30" : ""}`}
                >
                  <div className="absolute top-2 right-3 text-lg opacity-80">{tier.icon}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${stake === tier.amount ? "text-neutral-400" : "text-neutral-600"}`}>
                    {tier.label}
                  </div>
                  <div className={`font-black text-2xl tracking-tight ${tier.glow && stake === tier.amount ? "text-yellow-500" : stake === tier.amount ? "text-white" : "text-neutral-300"}`}>
                    ₦{tier.amount.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Bottom Action Bar with Potential Payout */}
      {prediction && stake >= 500 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent animate-in slide-in-from-bottom-full duration-500 z-50">
          <div className="max-w-lg mx-auto">
            {/* Contextual Data above button */}
            <div className="flex justify-between items-center mb-3 px-2">
              <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest">Potential Win</div>
              <div className="text-lg font-black text-green-400">₦{potentialPayout.toLocaleString()}</div>
            </div>
            
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-black font-black text-[15px] tracking-wide py-4.5 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_25px_rgba(34,197,94,0.25)]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  LOCKING ESCROW...
                </>
              ) : (
                `CONFIRM ₦${stake.toLocaleString()} STAKE`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}