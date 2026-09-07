"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// Define the shape to match YOUR specific /api/fixtures endpoint!
interface Match {
  id: string;
  home: string;
  away: string;
  time: string;
  league: string;
}

export default function CreateRumblePage() {
  const router = useRouter();
  const supabase = createClient();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [prediction, setPrediction] = useState<"home" | "away" | "draw" | "">("");
  const [entryFee, setEntryFee] = useState("500");

  useEffect(() => {
    async function fetchMatches() {
      try {
        // Pointing perfectly to your existing endpoint
        const response = await fetch("/api/fixtures"); 
        if (!response.ok) throw new Error("Failed to fetch matches");
        
        const data = await response.json();
        
        if (data.success && data.fixtures) {
          setMatches(data.fixtures);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error("Error fetching fixtures:", error);
        toast.error("Failed to load live matches.");
      } finally {
        setIsLoadingMatches(false);
      }
    }
    fetchMatches();
  }, []);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !prediction || !entryFee) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (Number(entryFee) < 500) {
      toast.error("Minimum entry fee is ₦500.");
      return;
    }

    setIsSubmitting(true);
    
    // Construct the string "Home vs Away" for the database
    const matchName = selectedMatch 
      ? `${selectedMatch.home} vs ${selectedMatch.away}`
      : "Unknown Match";

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to create a Rumble.");

      const response = await fetch("/api/rumble/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: selectedMatchId,
          match_name: matchName,
          entry_fee: Number(entryFee),
          prediction: prediction
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to create Rumble");
      }

      toast.success("Rumble created successfully! Escrow locked.");
      router.push(`/rumble/${result.rumbleId || ''}`); 

    } catch (error: any) {
      toast.error(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-green-500/30">
      
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" style={{ animationDelay: '1s' }} />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in zoom-in-[0.98] duration-700">
        
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-neutral-500 hover:text-white text-sm font-bold uppercase tracking-widest mb-4 inline-block transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">
            Create <span className="text-green-500">Rumble</span>
          </h1>
          <p className="text-neutral-400 font-medium text-sm">
            Host a high-stakes, winner-takes-all multiplayer pool.
          </p>
        </div>

        <div className="bg-neutral-900/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. SELECT MATCH */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Select Fixture</label>
              <div className="relative group">
                <select
                  value={selectedMatchId}
                  onChange={(e) => {
                    setSelectedMatchId(e.target.value);
                    setPrediction(""); 
                  }}
                  disabled={isLoadingMatches}
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-2xl py-4 pl-4 pr-10 text-white font-bold focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  required
                >
                  <option value="" disabled>
                    {isLoadingMatches ? "LOADING LIVE FIXTURES..." : (matches.length > 0 ? "CHOOSE A MATCH" : "NO LIVE FIXTURES FOUND")}
                  </option>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.home} vs {match.away} ({match.time})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* 2. MAKE PREDICTION */}
            {selectedMatch && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Your Prediction</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrediction("home")}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${prediction === "home" ? "bg-green-500 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-neutral-950/50 text-neutral-400 border-neutral-800 hover:border-neutral-600"}`}
                  >
                    {selectedMatch.home}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrediction("draw")}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${prediction === "draw" ? "bg-green-500 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-neutral-950/50 text-neutral-400 border-neutral-800 hover:border-neutral-600"}`}
                  >
                    DRAW
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrediction("away")}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${prediction === "away" ? "bg-green-500 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-neutral-950/50 text-neutral-400 border-neutral-800 hover:border-neutral-600"}`}
                  >
                    {selectedMatch.away}
                  </button>
                </div>
              </div>
            )}

            {/* 3. SET ENTRY FEE */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Entry Fee (₦)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-black group-focus-within:text-green-500 transition-colors">₦</span>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-2xl py-4 pl-9 pr-4 text-white font-bold placeholder:text-neutral-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                  required
                />
              </div>
              <p className="text-[10px] font-bold text-neutral-500 text-right pr-1">Minimum: ₦500</p>
            </div>

            {/* 4. SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting || isLoadingMatches || !selectedMatchId}
              className="w-full bg-green-500 text-black font-black text-lg py-4 rounded-2xl hover:bg-green-400 transition-all disabled:opacity-50 active:scale-[0.98] shadow-[0_0_25px_rgba(34,197,94,0.2)] mt-6 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg>
                  LOCKING ESCROW...
                </>
              ) : (
                "INITIALIZE RUMBLE"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}