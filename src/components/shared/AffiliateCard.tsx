import Link from "next/link";

interface AffiliateCardProps {
  userId: string;
  isPartner?: boolean; // We pass this from the dashboard
}

export default function AffiliateCard({ userId, isPartner = false }: AffiliateCardProps) {
  const defaultRefLink = `bantr.lol/join/${userId.substring(0, 8)}`;

  if (isPartner) {
    // --- VIP PARTNER UI ---
    return (
      <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-600/20 border border-yellow-500/30 rounded-2xl p-5 relative overflow-hidden group shadow-[0_5px_20px_rgba(234,179,8,0.1)]">
        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
          VIP Partner
        </div>
        <h3 className="font-black text-yellow-500 text-lg mb-1">Enter Partner HQ</h3>
        <p className="text-xs text-yellow-500/70 mb-4 pr-10">
          Track your group's volume, monitor active duels, and cash out your lifetime 2.5% commissions.
        </p>
        <Link href="/partner-hub" className="block">
          <button className="w-full bg-yellow-500 text-black font-black text-sm py-3 rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
            OPEN DASHBOARD
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
        </Link>
      </div>
    );
  }

  // --- REGULAR AFFILIATE UI ---
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-xl border border-green-500/20">
          💸
        </div>
        <div>
          <h3 className="font-black text-white text-base leading-tight">Free ₦500 Bonus</h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Refer & Earn</p>
        </div>
      </div>
      
      <p className="text-xs text-neutral-500 mb-4">
        Invite a friend to Bantr. When they deposit their first ₦1,000, you both get ₦500 in Bonus Cash instantly.
      </p>

      <div className="flex items-stretch gap-2">
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 flex items-center overflow-hidden">
          <span className="text-xs text-neutral-400 font-mono truncate">{defaultRefLink}</span>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(`https://${defaultRefLink}`)}
          className="bg-white text-black font-black text-xs px-4 py-3 rounded-xl hover:bg-neutral-200 transition-all whitespace-nowrap"
        >
          COPY
        </button>
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-800/60 text-center">
        <p className="text-[10px] text-neutral-500">
          Think you can bring 50+ players? <a href="mailto:partners@bantr.lol" className="text-yellow-500 underline">Apply to be a VIP Partner.</a>
        </p>
      </div>
    </div>
  );
}







// "use client";

// import { useState } from "react";

// export default function AffiliateCard({ userId }: { userId: string }) {
//   const [isCopied, setIsCopied] = useState(false);

//   const referralLink = typeof window !== "undefined" 
//     ? `${window.location.origin}/login?ref=${userId}` 
//     : "";

//   const handleCopy = () => {
//     if (!referralLink) return;
//     navigator.clipboard.writeText(referralLink);
//     setIsCopied(true);
//     setTimeout(() => setIsCopied(false), 2000);
//   };

//   return (
//     <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden mt-6">
//       {/* Background glow */}
//       <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
      
//       <div className="relative z-10">
//         <div className="flex items-center gap-2 mb-2">
//           <span className="text-xl">🤝</span>
//           <h3 className="text-white font-black text-lg uppercase tracking-wider">The Odogwu Network</h3>
//         </div>
        
//         <p className="text-indigo-200/80 text-sm font-medium mb-5 leading-relaxed">
//           Invite your guys to the arena. When they join and play, you get a lifetime cut of their platform fees straight into your vault.
//         </p>

//         <div className="flex items-center gap-2 bg-neutral-950/80 border border-indigo-500/20 rounded-xl p-1.5">
//           <div className="flex-1 overflow-hidden px-3">
//             <p className="text-xs text-indigo-400 font-mono truncate select-all">
//               {referralLink || "Loading link..."}
//             </p>
//           </div>
//           <button 
//             onClick={handleCopy}
//             className="bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-[0_0_15px_rgba(99,102,241,0.3)]"
//           >
//             {isCopied ? "Copied!" : "Copy Link"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }