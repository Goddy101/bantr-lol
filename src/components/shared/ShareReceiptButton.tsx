"use client";

import { useState } from "react";

interface ShareReceiptButtonProps {
  winner: string;
  loser: string;
  amount: number;
  match: string;
}

export default function ShareReceiptButton({ winner, loser, amount, match }: ShareReceiptButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // 1. Build the URL for the image generator we just created
      const imageUrl = `/api/og/receipt?winner=${encodeURIComponent(winner)}&loser=${encodeURIComponent(loser)}&amount=${amount.toLocaleString()}&match=${encodeURIComponent(match)}`;

      // 2. Fetch the actual image blob in the background
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 3. Convert it to a File object
      const file = new File([blob], `bantr-receipt-${winner}-${loser}.png`, { type: 'image/png' });

      // 4. Check if the device supports native sharing (Most iOS/Android browsers do)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'I just cooked someone on bantr.lol',
          text: `Easy ₦${amount.toLocaleString()} from @${loser}. Join bantr.lol and back your club.`,
        });
      } else {
        // Fallback for Desktop: Automatically download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bantr-receipt-${winner}-${loser}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error sharing receipt:", error);
      alert("Something went wrong while generating your receipt.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button 
      onClick={handleShare}
      disabled={isSharing}
      className="w-full mt-2 bg-green-500/10 text-green-500 border border-green-500/20 text-sm font-bold py-2.5 rounded-xl hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {isSharing ? (
        "Generating Receipt..."
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Share to WhatsApp
        </>
      )}
    </button>
  );
}