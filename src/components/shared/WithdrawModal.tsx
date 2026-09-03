"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxBalance: number;
}

const NIGERIAN_BANKS = [
  { code: "033", name: "UBA" },
  { code: "058", name: "GTBank" },
  { code: "044", name: "Access Bank" },
  { code: "011", name: "First Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "123236", name: "Opay" },
  { code: "123234", name: "Moniepoint" }
];

export default function WithdrawModal({ isOpen, onClose, maxBalance }: WithdrawModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | "">("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[0].code);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    if (!amount || Number(amount) < 1000) {
      alert("Minimum withdrawal is ₦1,000.");
      return;
    }
    if (Number(amount) > maxBalance) {
      alert("You cannot withdraw more than your balance.");
      return;
    }
    if (accountNumber.length !== 10) {
      alert("Please enter a valid 10-digit account number.");
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await fetch("/api/payments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: Number(amount),
          accountNumber,
          bankCode
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Alert has been sent to your bank! 💸");
        onClose();
        router.refresh(); // Refresh the page to update the new wallet balance
      } else {
        alert(data.error || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdrawal error", error);
      alert("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white tracking-wide">Cash Out</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="space-y-5">
          {/* Amount Input */}
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex justify-between">
              <span>Amount</span>
              <button onClick={() => setAmount(maxBalance)} className="text-green-400 hover:text-green-300">Max: ₦{maxBalance.toLocaleString()}</button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-neutral-500">₦</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                placeholder="0.00"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 pl-10 pr-4 text-2xl font-black text-white focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Select Bank</div>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-neutral-600 appearance-none"
              >
                {NIGERIAN_BANKS.map(bank => (
                  <option key={bank.code} value={bank.code}>{bank.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Account No.</div>
              <input
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} // Only allow digits
                placeholder="0123456789"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={isLoading || !amount || Number(amount) < 1000 || accountNumber.length !== 10}
            className="w-full mt-4 bg-neutral-100 text-black font-black text-lg py-4 rounded-xl hover:bg-white transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isLoading ? "Processing Transfer..." : `Withdraw ₦${Number(amount || 0).toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}