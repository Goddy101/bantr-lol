"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Bank {
  code: string;
  name: string;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxBalance: number;
}

export default function WithdrawModal({ isOpen, onClose, maxBalance }: WithdrawModalProps) {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);

  const [amount, setAmount] = useState<number | "">("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const WITHDRAWAL_FEE = 100;
  const requestedAmount = Number(amount) || 0;
  const totalDeduction = requestedAmount > 0 ? requestedAmount + WITHDRAWAL_FEE : 0;
  const canAfford = maxBalance >= totalDeduction;

  // 1. Fetch dynamic list on mount
  useEffect(() => {
    async function loadBanks() {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        if (data.success && data.banks.length > 0) {
          setBanks(data.banks);
          setBankCode(data.banks[0].code);
        }
      } catch (err) {
        console.error("Failed to load banks", err);
      } finally {
        setIsLoadingBanks(false);
      }
    }
    loadBanks();
  }, []);

  // 2. Auto-resolve account name when account number hits 10 digits
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      resolveAccount(accountNumber, bankCode);
    } else {
      setAccountName("");
    }
  }, [accountNumber, bankCode]);

  const resolveAccount = async (accNum: string, bCode: string) => {
    setIsResolvingName(true);
    try {
      const res = await fetch("/api/banks/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: accNum, bankCode: bCode }),
      });
      const data = await res.json();
      if (data.success) {
        setAccountName(data.accountName);
      } else {
        setAccountName("Could not verify account name");
      }
    } catch {
      setAccountName("");
    } finally {
      setIsResolvingName(false);
    }
  };

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    if (!amount || requestedAmount < 1000) return alert("Minimum withdrawal is ₦1,000.");
    if (!canAfford) return alert("Insufficient funds to cover amount + ₦100 fee.");
    if (accountNumber.length !== 10) return alert("Enter a valid 10-digit account number.");

    setIsLoading(true);
    try {
      const res = await fetch("/api/payments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: requestedAmount,
          accountNumber,
          bankCode,
          accountName
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Withdrawal submitted for processing! 💸");
        onClose();
        router.refresh();
      } else {
        alert(data.error || "Withdrawal failed");
      }
    } catch {
      alert("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white tracking-wide">Cash Out</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex justify-between">
              <span>Amount</span>
              <button 
                onClick={() => setAmount(Math.max(0, maxBalance - WITHDRAWAL_FEE))} 
                className="text-green-400 hover:text-green-300"
              >
                Max: ₦{maxBalance.toLocaleString()}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-neutral-500">₦</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                placeholder="1000"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 pl-10 pr-4 text-2xl font-black text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          {/* Dynamic Bank Select */}
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Select Bank</div>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              disabled={isLoadingBanks}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-neutral-600 appearance-none disabled:opacity-50"
            >
              {isLoadingBanks ? (
                <option>Loading banks...</option>
              ) : (
                banks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Account Number</div>
            <input
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="0123456789"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-neutral-600"
            />
            {/* Real-Time Name Resolution Display */}
            {isResolvingName && (
              <p className="text-[11px] text-yellow-500 font-bold mt-1.5 animate-pulse">Verifying account name...</p>
            )}
            {accountName && !isResolvingName && (
              <p className={`text-[11px] font-black uppercase tracking-wider mt-1.5 ${accountName.includes('Could not') ? 'text-red-400' : 'text-green-400'}`}>
                {accountName}
              </p>
            )}
          </div>

          {/* Fee & Deduction Breakdown */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3.5 space-y-1.5 text-xs font-bold">
            <div className="flex justify-between text-neutral-400">
              <span>Amount Received:</span>
              <span className="text-white">₦{requestedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Settlement Fee:</span>
              <span className="text-red-400">- ₦{WITHDRAWAL_FEE}</span>
            </div>
            <div className="pt-2 border-t border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-500 uppercase tracking-widest text-[10px]">Total Vault Deduction:</span>
              <span className={`font-black ${canAfford ? 'text-white' : 'text-red-500'}`}>
                ₦{totalDeduction.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={
              isLoading ||
              !amount ||
              requestedAmount < 1000 ||
              accountNumber.length !== 10 ||
              !canAfford ||
              isResolvingName ||
              accountName.includes("Could not")
            }
            className="w-full mt-2 bg-neutral-100 text-black font-black text-lg py-4 rounded-xl hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isLoading ? "Submitting..." : `Withdraw ₦${requestedAmount.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}














// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// interface WithdrawModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   maxBalance: number;
// }

// const NIGERIAN_BANKS = [
//   { code: "033", name: "UBA" },
//   { code: "058", name: "GTBank" },
//   { code: "044", name: "Access Bank" },
//   { code: "011", name: "First Bank" },
//   { code: "057", name: "Zenith Bank" },
//   { code: "082", name: "Keystone Bank" },
//   { code: "123236", name: "Opay" },
//   { code: "123234", name: "Moniepoint" }
// ];

// export default function WithdrawModal({ isOpen, onClose, maxBalance }: WithdrawModalProps) {
//   const router = useRouter();
//   const [amount, setAmount] = useState<number | "">("");
//   const [accountNumber, setAccountNumber] = useState("");
//   const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[0].code);
//   const [isLoading, setIsLoading] = useState(false);

//   if (!isOpen) return null;

//   const handleWithdraw = async () => {
//     if (!amount || Number(amount) < 1000) {
//       alert("Minimum withdrawal is ₦1,000.");
//       return;
//     }
//     if (Number(amount) > maxBalance) {
//       alert("You cannot withdraw more than your balance.");
//       return;
//     }
//     if (accountNumber.length !== 10) {
//       alert("Please enter a valid 10-digit account number.");
//       return;
//     }
    
//     setIsLoading(true);

//     try {
//       const res = await fetch("/api/payments/withdraw", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           amount: Number(amount),
//           accountNumber,
//           bankCode
//         }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         alert("Alert has been sent to your bank! 💸");
//         onClose();
//         router.refresh(); // Refresh the page to update the new wallet balance
//       } else {
//         alert(data.error || "Withdrawal failed");
//       }
//     } catch (error) {
//       console.error("Withdrawal error", error);
//       alert("A network error occurred.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
//       <div className="absolute inset-0" onClick={onClose} />

//       <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-black text-white tracking-wide">Cash Out</h2>
//           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">✕</button>
//         </div>

//         <div className="space-y-5">
//           {/* Amount Input */}
//           <div>
//             <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex justify-between">
//               <span>Amount</span>
//               <button onClick={() => setAmount(maxBalance)} className="text-green-400 hover:text-green-300">Max: ₦{maxBalance.toLocaleString()}</button>
//             </div>
//             <div className="relative">
//               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-neutral-500">₦</span>
//               <input
//                 type="number"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
//                 placeholder="0.00"
//                 className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 pl-10 pr-4 text-2xl font-black text-white focus:outline-none focus:border-neutral-600 transition-colors"
//               />
//             </div>
//           </div>

//           {/* Bank Details */}
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Select Bank</div>
//               <select
//                 value={bankCode}
//                 onChange={(e) => setBankCode(e.target.value)}
//                 className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-neutral-600 appearance-none"
//               >
//                 {NIGERIAN_BANKS.map(bank => (
//                   <option key={bank.code} value={bank.code}>{bank.name}</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Account No.</div>
//               <input
//                 type="text"
//                 maxLength={10}
//                 value={accountNumber}
//                 onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} // Only allow digits
//                 placeholder="0123456789"
//                 className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-neutral-600"
//               />
//             </div>
//           </div>

//           <button
//             onClick={handleWithdraw}
//             disabled={isLoading || !amount || Number(amount) < 1000 || accountNumber.length !== 10}
//             className="w-full mt-4 bg-neutral-100 text-black font-black text-lg py-4 rounded-xl hover:bg-white transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
//           >
//             {isLoading ? "Processing Transfer..." : `Withdraw ₦${Number(amount || 0).toLocaleString()}`}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }