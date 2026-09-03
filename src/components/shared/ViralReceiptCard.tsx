"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

interface ViralReceiptProps {
  winnerName: string;
  loserName: string;
  matchTitle: string; // e.g., "Arsenal vs Tottenham"
  stakeAmount: number;
  sponsorBannerUrl?: string; // Optional: If you sold the slot to a brand
}

export default function ViralReceiptCard({
  winnerName,
  loserName,
  matchTitle,
  stakeAmount,
  sponsorBannerUrl = "/default-sponsor-banner.jpg" // Fallback or empty state
}: ViralReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate total pot (Stake * 2) minus 10% commission
  const totalWon = (stakeAmount * 2) * 0.90;

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Convert the DOM element to a high-quality PNG
      const dataUrl = await toPng(receiptRef.current, {
        quality: 1,
        pixelRatio: 3, // High res for crisp WhatsApp viewing
      });

      // 2. Convert the Base64 Data URL to a real File object
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `bantr-win-${winnerName}.png`, { type: "image/png" });

      // 3. Trigger Native Mobile Share (Opens WhatsApp directly on phones)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "bantr.lol Victory",
          text: `Lmaooo I just cleared @${loserName} on bantr.lol for ₦${totalWon}! 😭⚽️`,
        });
      } else {
        // Fallback for Desktop/Unsupported browsers: Download the image
        const link = document.createElement("a");
        link.download = `bantr-win-${winnerName}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Failed to generate receipt:", error);
      alert("Could not generate receipt. Try again!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      
      {/* 
        THE RECEIPT ELEMENT 
        We render it on screen so the user can admire it, but we can also hide it 
        in a real app using absolute positioning off-screen if we prefer. 
      */}
      <div 
        ref={receiptRef}
        className="w-[350px] bg-neutral-950 border-2 border-neutral-800 rounded-2xl overflow-hidden relative"
        style={{ fontFamily: "'Inter', sans-serif" }} // Ensure fonts render cleanly
      >
        {/* Top Header */}
        <div className="bg-neutral-900 border-b border-neutral-800 p-4 text-center">
          <h2 className="text-2xl font-black text-white tracking-tighter">bantr.lol</h2>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Official Settlement</p>
        </div>

        {/* The Humiliation Stamp */}
        <div className="absolute top-16 right-[-20px] transform rotate-[15deg] border-4 border-red-500 text-red-500 font-black text-3xl px-2 py-1 rounded opacity-80 mix-blend-screen">
          COOKED!
        </div>

        {/* Match & Stake Details */}
        <div className="p-6 text-center space-y-6">
          <div>
            <p className="text-xs text-neutral-500 font-bold uppercase mb-1">The Match</p>
            <p className="text-lg font-black text-white">{matchTitle}</p>
          </div>

          <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-xl border border-neutral-800">
            <div className="text-left">
              <p className="text-xs text-neutral-500 font-bold">Winner</p>
              <p className="text-lg font-black text-green-400">@{winnerName}</p>
            </div>
            <div className="text-xl font-black text-neutral-600">⚔️</div>
            <div className="text-right">
              <p className="text-xs text-neutral-500 font-bold">Victim</p>
              <p className="text-lg font-black text-neutral-400 line-through decoration-red-500">@{loserName}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Total Payout</p>
            <p className="text-4xl font-black text-yellow-500">₦{totalWon.toLocaleString()}</p>
          </div>
        </div>

        {/* 
          YOUR REAL ESTATE: THE SPONSOR AD 
          This is what you sell to local brands for ₦150k+/month 
        */}
        <div className="bg-white p-3 text-center border-t border-neutral-800">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Sponsored By</p>
          <div className="flex items-center justify-center gap-2">
            {/* If you have a real banner image, use an <img> tag here. For MVP, we use text. */}
            <div className="bg-black text-white text-xs font-black px-2 py-1 rounded">
              Lagos Streetwear Co.
            </div>
            <p className="text-xs font-bold text-black">Use code <span className="text-green-600">BANTR</span> for 15% off</p>
          </div>
        </div>
      </div>

      {/* The Trigger Button */}
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className="w-[350px] bg-green-500 text-black font-black text-lg py-4 rounded-xl hover:bg-green-600 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95 disabled:opacity-50"
      >
        {isGenerating ? "Cooking Receipt..." : "Share to WhatsApp 🟢"}
      </button>

    </div>
  );
}