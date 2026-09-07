"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateRumblePage() {
  const router = useRouter();
  const [matchName, setMatchName] = useState("");
  const [entryFee, setEntryFee] = useState<string>("5000");
  const [locksAt, setLocksAt] = useState("");
  const [selectedPick, setSelectedPick] = useState<"home" | "away" | "draw" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchName || !entryFee || !locksAt || !selectedPick) {
      return toast.error("Please fill out all fields and select your pick.");
    }

    if (Number(entryFee) < 500) {
      return toast.error("Minimum entry fee is ₦500.");
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/rumble/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_name: matchName,
          entry_fee: Number(entryFee),
          locks_at: new Date(locksAt).toISOString(),
          prediction: selectedPick
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Rumble created! Prepare for war.");
        router.push(`/rumble/${data.rumble_id}`);
      } else {
        toast.error(data.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error("Failed to connect to servers.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col p-4 font-sans selection:bg-yellow-500/30 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-md mx-auto w-full pt-6 pb-6 flex items-center justify-between relative z-10">
        <Link href="/dashboard" className="text-neutral-400 hover:text-white font-bold text-sm flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Dashboard
        </Link>
        <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
          MULTIPLAYER ARENA
        </div>
      </div>

      <div className="max-w-md mx-auto w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black tracking-tight mb-2">Create Rumble</h1>
        <p className="text-neutral-400 font-medium text-sm mb-8">
          Host a massive multiplayer pool. Winner takes the entire pot.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Match Name */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-inner">
            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-1">Match Fixture</label>
            <input
              type="text"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder="e.g. Arsenal vs Tottenham"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white font-bold placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-lg"
              required
            />
          </div>

          {/* Grid for Fee & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-inner">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-1">Entry Fee (₦)</label>
              <input
                type="number"
                min="500"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white font-black focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-xl"
                required
              />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-inner">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-1">Lock Time</label>
              <input
                type="datetime-local"
                value={locksAt}
                onChange={(e) => setLocksAt(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-3 py-4 text-white font-bold focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-[13px]"
                required
              />
            </div>
          </div>

          {/* Initial Pick */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-inner">
            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 ml-1 text-center">Lock Your Prediction</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "home", label: "HOME", icon: "🏠" },
                { id: "draw", label: "DRAW", icon: "⚖️" },
                { id: "away", label: "AWAY", icon: "✈️" }
              ].map((pick) => (
                <button
                  type="button"
                  key={pick.id}
                  onClick={() => setSelectedPick(pick.id as any)}
                  className={`p-3 rounded-2xl text-center transition-all duration-300 border ${
                    selectedPick === pick.id 
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)] scale-[1.02]" 
                      : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-800"
                  }`}
                >
                  <div className="text-xl mb-1">{pick.icon}</div>
                  <div className={`text-[10px] font-black tracking-widest uppercase ${selectedPick === pick.id ? "text-yellow-500" : ""}`}>
                    {pick.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedPick}
            className="w-full bg-yellow-500 text-black font-black text-[15px] tracking-wide py-5 rounded-2xl hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_30px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                INITIATING RUMBLE...
              </>
            ) : (
              `CREATE RUMBLE (₦${Number(entryFee || 0).toLocaleString()})`
            )}
          </button>

          <p className="text-center text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-4">
            Your stake will be deducted immediately.
          </p>
        </form>
      </div>
    </div>
  );
}