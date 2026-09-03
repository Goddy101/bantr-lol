"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AcceptDuelButtonProps {
  duelId: string;
  stake: number;
  isLoggedIn: boolean;
}

export default function AcceptDuelButton({ duelId, stake, isLoggedIn }: AcceptDuelButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="w-full block">
        <button className="w-full bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          LOGIN TO MATCH ₦{stake.toLocaleString()}
        </button>
      </Link>
    );
  }

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/duels/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duel_id: duelId }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Duel Locked! May the best fan win.");
        router.refresh(); // Refresh the page to show the "LOCKED" UI
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAccept}
      disabled={isLoading}
      className="w-full bg-green-500 text-black font-black text-xl py-5 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_25px_rgba(34,197,94,0.4)] active:scale-95 disabled:opacity-50"
    >
      {isLoading ? "LOCKING ESCROW..." : `MATCH ₦${stake.toLocaleString()}`}
    </button>
  );
}