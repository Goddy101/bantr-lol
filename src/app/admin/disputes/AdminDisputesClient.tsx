// src/app/admin/disputes/AdminDisputesClient.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AdminDisputesClient({ initialMatches }: { initialMatches: any[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResolution = async (matchId: string, action: "award" | "refund", winnerId?: string) => {
    const confirmMessage = action === "award" 
      ? "Are you sure you want to award the pot to this player?" 
      : "Are you sure you want to void this duel and refund both players?";
      
    if (!confirm(confirmMessage)) return;

    setProcessingId(matchId);
    try {
      const res = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action, winnerId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Duel successfully ${action === "award" ? "awarded" : "refunded"}.`);
        setMatches((prev) => prev.filter((m) => m.id !== matchId));
      } else {
        toast.error(data.error || "Resolution failed.");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center">
        <h3 className="text-xl font-bold text-neutral-400">No active disputes.</h3>
        <p className="text-neutral-600 mt-2">Everyone is playing fair right now. 🤝</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Match Details */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                Action Required
              </span>
              <span className="text-neutral-500 text-xs font-bold">
                Duel ID: {match.id.split('-')[0]}...
              </span>
            </div>
            <div className="text-xl font-black text-white">
              @{match.creator?.username} <span className="text-neutral-600 font-normal">vs</span> @{match.acceptor?.username}
            </div>
            <div className="text-yellow-500 font-bold mt-1">
              Stake: ₦{match.stake_amount.toLocaleString()} (Pot: ₦{(match.stake_amount * 2).toLocaleString()})
            </div>
            <div className="text-neutral-500 text-xs mt-1">
              Game ID: {match.match_id}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleResolution(match.id, "award", match.creator.id)}
              disabled={processingId === match.id}
              className="bg-neutral-800 hover:bg-white hover:text-black text-white font-bold px-4 py-3 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              🏆 Award @{match.creator?.username}
            </button>

            {/* Render the Acceptor button ONLY if an acceptor exists */}
            {match.acceptor && (
              <button
                onClick={() => handleResolution(match.id, "award", match.acceptor.id)}
                disabled={processingId === match.id}
                className="bg-neutral-800 hover:bg-white hover:text-black text-white font-bold px-4 py-3 rounded-xl transition-all text-sm disabled:opacity-50"
              >
                🏆 Award @{match.acceptor?.username}
              </button>
            )}

            <button
              onClick={() => handleResolution(match.id, "refund")}
              disabled={processingId === match.id}
              className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold px-4 py-3 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              ↩️ Void & Refund
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}