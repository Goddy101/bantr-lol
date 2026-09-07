"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ShareReceiptButtonProps {
  winner: string;
  loser: string;
  amount: number;
  match: string;
  sponsor?: {
    brand_name: string;
    tagline: string;
    logo_url: string;
  } | null;
}

export default function ShareReceiptButton({ winner, loser, amount, match, sponsor }: ShareReceiptButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    setIsGenerating(true);
    
    try {
      // 1. Setup the Canvas (Standard Instagram/WhatsApp Square 1080x1080)
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Could not get canvas context");

      // 2. Draw Background (Deep space gray)
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, 1080, 1080);

      // Add a subtle green radial glow in the center
      const gradient = ctx.createRadialGradient(540, 540, 0, 540, 540, 800);
      gradient.addColorStop(0, "#22c55e15"); 
      gradient.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // 3. Draw Header (BANTR.)
      ctx.font = "900 70px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("BANTR", 540, 140);
      // The green dot
      ctx.fillStyle = "#22c55e"; 
      ctx.fillText(".", 540 + (ctx.measureText("BANTR").width / 2) + 15, 140);

      // 4. Draw Receipt Title
      ctx.font = "800 35px system-ui, sans-serif";
      ctx.fillStyle = "#22c55e";
      ctx.fillText("VICTORY RECEIPT", 540, 210);

      // 5. Draw Match Details
      ctx.font = "bold 32px system-ui, sans-serif";
      ctx.fillStyle = "#a3a3a3";
      ctx.fillText(`MATCH: ${match.toUpperCase()}`, 540, 320);

      // 6. Draw Winner vs Loser
      ctx.font = "900 85px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`@${winner}`, 540, 460);

      ctx.font = "bold 40px system-ui, sans-serif";
      ctx.fillStyle = "#525252";
      ctx.fillText("CLEARED", 540, 550);

      ctx.font = "900 70px system-ui, sans-serif";
      ctx.fillStyle = "#ef4444"; // Red for the loser
      ctx.fillText(`@${loser}`, 540, 640);

      // 7. Draw The Payout
      ctx.font = "bold 35px system-ui, sans-serif";
      ctx.fillStyle = "#a3a3a3";
      ctx.fillText("TOTAL PAYOUT", 540, 780);

      ctx.font = "900 110px system-ui, sans-serif";
      ctx.fillStyle = "#eab308"; // Gold for money
      ctx.fillText(`₦${amount.toLocaleString()}`, 540, 890);

      // 8. Draw NATIVE SPONSOR BANNER
      if (sponsor) {
        // Banner Background
        ctx.fillStyle = "#171717";
        ctx.fillRect(0, 960, 1080, 120);

        // Banner Top Border
        ctx.fillStyle = "#262626";
        ctx.fillRect(0, 960, 1080, 2);

        // Sponsor Branding
        ctx.textAlign = "left";
        ctx.font = "900 24px system-ui, sans-serif";
        ctx.fillStyle = "#eab308";
        ctx.fillText(`POWERED BY ${sponsor.brand_name.toUpperCase()}`, 60, 1010);

        ctx.font = "bold 24px system-ui, sans-serif";
        ctx.fillStyle = "#a3a3a3";
        ctx.fillText(sponsor.tagline, 60, 1045);
      } else {
        // Fallback footer if no active sponsor
        ctx.fillStyle = "#171717";
        ctx.fillRect(0, 960, 1080, 120);
        ctx.fillStyle = "#262626";
        ctx.fillRect(0, 960, 1080, 2);
        
        ctx.textAlign = "center";
        ctx.font = "900 26px system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("JOIN THE ARENA AT BANTR.LOL", 540, 1030);
      }

      // 9. Convert Canvas to Blob and Trigger Share
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to generate receipt image.");
          setIsGenerating(false);
          return;
        }

        const file = new File([blob], `bantr-victory-${winner}.png`, { type: "image/png" });
        
        // Use Native Web Share API if supported (Mobile Safari/Chrome)
        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Bantr Victory',
              text: `I just cleared @${loser} on Bantr for ₦${amount.toLocaleString()}. Who's next?`,
              files: [file],
            });
          } catch (err) {
            console.log("User cancelled share sheet");
          }
        } else {
          // Fallback for Desktop/Unsupported Browsers: Download the file automatically
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bantr-victory-${winner}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Receipt downloaded! Ready to post on Twitter.");
        }
        
        setIsGenerating(false);
      });
      
    } catch (error) {
      console.error(error);
      toast.error("An error occurred generating the receipt.");
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleShare}
      disabled={isGenerating}
      className="w-full bg-neutral-800 text-white font-black text-sm py-4 rounded-xl hover:bg-neutral-700 transition-all border border-neutral-700 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          MINTING RECEIPT...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          SHARE VICTORY RECEIPT
        </>
      )}
    </button>
  );
}