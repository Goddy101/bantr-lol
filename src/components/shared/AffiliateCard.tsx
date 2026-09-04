"use client";

import { useState } from "react";

export default function AffiliateCard({ userId }: { userId: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const referralLink = typeof window !== "undefined" 
    ? `${window.location.origin}/login?ref=${userId}` 
    : "";

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden mt-6">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🤝</span>
          <h3 className="text-white font-black text-lg uppercase tracking-wider">The Odogwu Network</h3>
        </div>
        
        <p className="text-indigo-200/80 text-sm font-medium mb-5 leading-relaxed">
          Invite your guys to the arena. When they join and play, you get a lifetime cut of their platform fees straight into your vault.
        </p>

        <div className="flex items-center gap-2 bg-neutral-950/80 border border-indigo-500/20 rounded-xl p-1.5">
          <div className="flex-1 overflow-hidden px-3">
            <p className="text-xs text-indigo-400 font-mono truncate select-all">
              {referralLink || "Loading link..."}
            </p>
          </div>
          <button 
            onClick={handleCopy}
            className="bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            {isCopied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}