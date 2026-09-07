"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    
    setIsLoading(true);
    const supabase = createClient();

    // Supabase automatically uses the session established by clicking the email link
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success("Password updated! Vault secured.");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 selection:bg-green-500/30">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-8 relative z-10">
          <div className="text-2xl font-black tracking-tighter text-white mb-2">BANTR<span className="text-green-500">.</span></div>
          <h1 className="text-xl font-black text-white">Set New Password</h1>
          <p className="text-neutral-400 text-sm mt-1">Make it strong. Your money depends on it.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-black font-black text-[15px] tracking-wide py-4 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_20px_rgba(34,197,94,0.2)] flex justify-center items-center"
          >
            {isLoading ? "SECURING VAULT..." : "UPDATE PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
}