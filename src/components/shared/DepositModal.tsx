"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [
  { label: "Casual", value: 2000 },
  { label: "Standard", value: 5000 },
  { label: "Big Boy", value: 10000 },
  { label: "Odogwu", value: 50000 },
];

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (!amount || Number(amount) < 500) {
      alert("Minimum deposit is ₦500.");
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await fetch("/api/payments/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        // Teleport the user to the payment gateway
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Failed to initialize payment");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Deposit error", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white tracking-wide">Fund Vault</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Custom Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-neutral-500">₦</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="0.00"
              className="w-full bg-neutral-950 border-2 border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-3xl font-black text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Quick Select Buttons */}
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Quick Select</div>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_AMOUNTS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setAmount(tier.value)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    amount === tier.value 
                      ? "bg-green-500/10 border-green-500 text-green-400" 
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase mb-0.5">{tier.label}</div>
                  <div className="font-black">₦{tier.value.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isLoading || !amount || Number(amount) < 500}
            className="w-full bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isLoading ? "Connecting to Bank..." : `Deposit ₦${Number(amount || 0).toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}