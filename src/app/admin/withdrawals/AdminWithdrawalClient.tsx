"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AdminWithdrawalClient({ initialWithdrawals }: { initialWithdrawals: any[] }) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) return;
    
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/withdrawals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: id, action }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Withdrawal ${action}d successfully.`);
        setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      } else {
        toast.error(data.error || `Failed to ${action}`);
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  if (withdrawals.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center">
        <h3 className="text-xl font-bold text-neutral-400">No pending withdrawals.</h3>
        <p className="text-neutral-600 mt-2">Go take a break, Odogwu. 🌴</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-950 text-neutral-500 uppercase tracking-widest text-[10px]">
          <tr>
            <th className="px-6 py-4 font-black">User</th>
            <th className="px-6 py-4 font-black">Bank Details</th>
            <th className="px-6 py-4 font-black">Amount</th>
            <th className="px-6 py-4 font-black">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {withdrawals.map((w) => (
            <tr key={w.id} className="hover:bg-neutral-800/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-white">@{w.users?.username}</div>
                <div className="text-xs text-neutral-500">{new Date(w.created_at).toLocaleString()}</div>
              </td>
              <td className="px-6 py-4">
                <div className="font-bold text-white">{w.bank_details.accountName}</div>
                <div className="text-xs text-neutral-400">
                  {w.bank_details.account} • Bank Code: {w.bank_details.bank}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="font-black text-green-400">₦{w.amount.toLocaleString()}</div>
                <div className="text-xs text-neutral-500">Fee taken: ₦{w.fee}</div>
              </td>
              <td className="px-6 py-4 flex gap-2">
                <button
                  onClick={() => handleAction(w.id, "approve")}
                  disabled={processingId === w.id}
                  className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {processingId === w.id ? "..." : "Approve"}
                </button>
                <button
                  onClick={() => handleAction(w.id, "reject")}
                  disabled={processingId === w.id}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}