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
  { label: "Sapa Level", amount: 500, glow: false },
  { label: "Standard Banter", amount: 2000, glow: false },
  { label: "Men Mount", amount: 10000, glow: true },
  { label: "Odogwu / Whale", amount: 50000, glow: true },
];

// 1. Define the SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CreateDuelPage() {
  const router = useRouter();
  
  // 2. Use SWR instead of useEffect for robust, auto-refreshing live data
  const { data, isLoading } = useSWR('/api/fixtures', fetcher, {
    refreshInterval: 60000, // Silently auto-refresh every 60 seconds
    revalidateOnFocus: true, // Refresh instantly if they switch tabs and come back
    dedupingInterval: 10000, // Prevent spamming the API if components re-render
  });

  // Safely extract the fixtures from the SWR payload
  const fixtures: Fixture[] = data?.success ? data.fixtures : [];
  const isLoadingFixtures = isLoading;
  
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<"home" | "away" | "draw" | null>(null);
  const [stake, setStake] = useState<number>(2000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMatch = fixtures.find((m) => m.id === selectedMatchId);

  const handleCreate = async () => {
    if (!selectedMatchId || !prediction || !stake) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/duels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Removed the hardcoded user_id - our Next.js backend extracts this securely from the auth session!
          match_id: selectedMatchId,
          prediction: prediction,
          stake_amount: stake
        })
      });

      const responseData = await res.json();

      if (responseData.success) {
        router.push(`/duel/${responseData.duel_id}`);
      } else {
        alert(responseData.error || "Failed to create duel");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Failed to create duel", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-4 py-4 z-50 flex justify-between items-center shadow-md">
        <button onClick={() => router.back()} className="text-neutral-400 font-medium hover:text-white transition-colors">
          ← Back
        </button>
        <h1 className="font-black tracking-wide">CREATE DUEL</h1>
        <div className="text-sm font-mono text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-1 rounded">
          {/* Note: You can also fetch the actual wallet balance dynamically here later! */}
          Wallet: Live
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-8 mt-4">
        
        {/* STEP 1: Pick a Match */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-black text-sm">1</div>
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Select Fixture</h2>
          </div>
          
          <div className="space-y-3">
            {isLoadingFixtures ? (
              // Skeleton Loader while fetching
              [1, 2, 3].map((i) => (
                <div key={i} className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />
              ))
            ) : fixtures.length > 0 ? (
              fixtures.map((match) => (
                <button
                  key={match.id}
                  onClick={() => {
                    setSelectedMatchId(match.id);
                    setPrediction(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedMatchId === match.id 
                      ? "bg-neutral-800 border-white shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-[1.01]" 
                      : "bg-neutral-900 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800"
                  }`}
                >
                  <div className="text-[10px] text-neutral-500 mb-3 flex justify-between font-bold uppercase tracking-wider">
                    <span>{match.league}</span>
                    <span className="text-green-400">{match.time}</span>
                  </div>
                  
                  {/* Premium UI with Team Logos */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={match.homeLogo} alt={match.home} className="w-8 h-8 object-contain" />
                      <span className="font-bold text-sm sm:text-base truncate">{match.home}</span>
                    </div>
                    
                    <div className="px-3 text-xs font-black text-neutral-600 italic">VS</div>
                    
                    <div className="flex items-center gap-3 flex-1 justify-end text-right">
                      <span className="font-bold text-sm sm:text-base truncate">{match.away}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={match.awayLogo} alt={match.away} className="w-8 h-8 object-contain" />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">No upcoming fixtures found.</div>
            )}
          </div>
        </section>

        {/* STEP 2: Pick a Side */}
        {activeMatch && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-black text-sm">2</div>
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Back Your Talk</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPrediction("home")}
                className={`p-3 flex flex-col items-center justify-center gap-2 rounded-xl border font-bold transition-all ${
                  prediction === "home" ? "bg-green-500 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeMatch.homeLogo} alt="" className="w-8 h-8" />
                <span className="text-xs text-center line-clamp-1">{activeMatch.home}</span>
              </button>
              
              <button
                onClick={() => setPrediction("draw")}
                className={`p-3 flex flex-col items-center justify-center gap-2 rounded-xl border font-bold transition-all ${
                  prediction === "draw" ? "bg-neutral-300 text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center text-xl font-black">X</div>
                <span className="text-xs">Draw</span>
              </button>
              
              <button
                onClick={() => setPrediction("away")}
                className={`p-3 flex flex-col items-center justify-center gap-2 rounded-xl border font-bold transition-all ${
                  prediction === "away" ? "bg-green-500 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeMatch.awayLogo} alt="" className="w-8 h-8" />
                <span className="text-xs text-center line-clamp-1">{activeMatch.away}</span>
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Set Stake */}
        {prediction && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-black text-sm">3</div>
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Put Money On It</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {STAKE_TIERS.map((tier) => (
                <button
                  key={tier.amount}
                  onClick={() => setStake(tier.amount)}
                  className={`relative p-4 rounded-xl border text-left transition-all overflow-hidden ${
                    stake === tier.amount 
                      ? "bg-neutral-800 border-white" 
                      : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                  } ${tier.glow && stake === tier.amount ? "shadow-[0_0_15px_rgba(250,204,21,0.2)] border-yellow-500/50" : ""}`}
                >
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${stake === tier.amount ? "text-neutral-300" : "text-neutral-500"}`}>
                    {tier.label}
                  </div>
                  <div className={`font-black text-xl ${tier.glow && stake === tier.amount ? "text-yellow-400" : "text-white"}`}>
                    ₦{tier.amount.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {prediction && stake >= 500 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent animate-in slide-in-from-bottom-full z-20">
          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full max-w-lg mx-auto block bg-green-500 text-black font-black text-lg py-4 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 active:scale-[0.98] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            {isSubmitting ? "Locking Escrow..." : `Drop ₦${stake.toLocaleString()} on ${
              prediction === "home" ? activeMatch?.home : prediction === "away" ? activeMatch?.away : "Draw"
            }`}
          </button>
        </div>
      )}
    </div>
  );
}