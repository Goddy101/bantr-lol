"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

interface ShareReceiptButtonProps {
  winner: string;
  loser: string;
  match: string;
  amount: number;
}

export default function ShareReceiptButton({
  winner,
  loser,
  match,
  amount,
}: ShareReceiptButtonProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Convert the off-screen DOM element to a high-quality PNG
      const dataUrl = await toPng(receiptRef.current, {
        quality: 1,
        pixelRatio: 3, // High res for crisp WhatsApp viewing
      });

      // 2. Convert the Base64 Data URL to a real File object
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `bantr-win-${winner}.png`, { type: "image/png" });

      // 3. Trigger Native Mobile Share (Opens WhatsApp directly on phones)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "bantr.lol Victory",
          text: `Lmaooo I just cleared @${loser} on bantr.lol for ₦${amount.toLocaleString()}! 😭⚽️`,
        });
      } else {
        // Fallback for Desktop/Unsupported browsers: Download the image
        const link = document.createElement("a");
        link.download = `bantr-win-${winner}.png`;
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
    <div className="w-full">
      
      {/* 
        OFF-SCREEN RECEIPT 
        We position it way off to the left. The user never sees this HTML, 
        but the 'html-to-image' library can still capture it!
      */}
      <div className="absolute -left-[9999px] top-0">
        <div 
          ref={receiptRef}
          className="w-[350px] bg-neutral-950 border-2 border-neutral-800 rounded-2xl overflow-hidden relative"
          style={{ fontFamily: "'Inter', sans-serif" }}
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
              <p className="text-lg font-black text-white">{match}</p>
            </div>

            <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <div className="text-left">
                <p className="text-xs text-neutral-500 font-bold">Winner</p>
                <p className="text-lg font-black text-green-400">@{winner}</p>
              </div>
              <div className="text-xl font-black text-neutral-600">⚔️</div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 font-bold">Victim</p>
                <p className="text-lg font-black text-neutral-400 line-through decoration-red-500">@{loser}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Total Payout</p>
              <p className="text-4xl font-black text-yellow-500">₦{amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Sponsor Ad */}
          <div className="bg-white p-3 text-center border-t border-neutral-800">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Sponsored By</p>
            <div className="flex items-center justify-center gap-2">
              <div className="bg-black text-white text-xs font-black px-2 py-1 rounded">
                Lagos Streetwear Co.
              </div>
              <p className="text-xs font-bold text-black">Use code <span className="text-green-600">BANTR</span> for 15% off</p>
            </div>
          </div>
        </div>
      </div>

      {/* THE VISIBLE BUTTON */}
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className="w-full bg-neutral-800 border border-neutral-700 text-white font-black text-[13px] py-3 rounded-xl hover:bg-green-500 hover:border-green-500 hover:text-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg>
            GENERATING RECEIPT...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            BRAG & SHARE RECEIPT
          </>
        )}
      </button>

    </div>
  );
}