"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email address.");
    
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success("Recovery link sent!");
      setIsSent(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 selection:bg-green-500/30">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Aesthetic Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-8 relative z-10">
          <div className="text-2xl font-black tracking-tighter text-white mb-2">BANTR<span className="text-green-500">.</span></div>
          <h1 className="text-xl font-black text-white">Recover Vault</h1>
          <p className="text-neutral-400 text-sm mt-1">Enter your email to reset your password and access your funds.</p>
        </div>

        {isSent ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-white font-black text-lg mb-2">Check your email</h3>
            <p className="text-neutral-400 text-sm mb-6">We've sent a secure recovery link to <span className="text-white font-bold">{email}</span>.</p>
            <Link href="/login" className="text-green-500 font-bold text-sm hover:text-green-400 transition-colors uppercase tracking-widest">
              ← Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                placeholder="odogwu@bantr.lol"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-black text-[15px] tracking-wide py-4 rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                "SEND RECOVERY LINK"
              )}
            </button>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-[11px] text-neutral-500 font-bold hover:text-white uppercase tracking-widest transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}