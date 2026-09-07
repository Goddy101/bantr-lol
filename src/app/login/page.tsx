"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client"; 
import { toast } from "sonner"; // Make sure Sonner is in your layout!

function AuthForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [isSignUp, setIsSignUp] = useState(!!refCode); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    const supabase = createClient(); 

    try {
      let authUserId = null;

      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username?.toLowerCase().replace(/\s+/g, "") },
          },
        });

        if (error) throw error;
        
        // TRAP 1: Email Verification
        if (!data.session) {
          toast.success("Account created! Please check your email to verify your account before logging in.");
          setIsLoading(false);
          return; // Stop here, they can't go to the dashboard yet
        }
        
        authUserId = data.user?.id;

      } else {
        // --- LOG IN LOGIC ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // TRAP 1: Email Verification
        if (!data.session) {
          throw new Error("Please verify your email address before logging in.");
        }

        authUserId = data.user?.id;
      }

      // TRAP 2: The Missing Profile Trap
      // Let's check if the Dashboard is going to reject them before we even send them there!
      if (authUserId) {
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("id", authUserId)
          .maybeSingle();

        // If the profile doesn't exist, the dashboard will bounce them. Let's create it right now!
        if (!profile) {
          toast.info("Rescuing missing profile...");
          const { error: insertError } = await supabase.from("users").insert({
            id: authUserId,
            username: username ? username.toLowerCase().replace(/\s+/g, "") : email.split('@')[0],
            wallet_balance: 0,
            ball_iq_points: 0
          });
          
          if (insertError) {
            console.error(insertError);
            throw new Error("Failed to initialize your vault. Please contact support.");
          }
        }
      }

      toast.success("Authentication successful! Entering Arena...");

      // Give the browser 500ms to properly save the Supabase cookie before reloading
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      
    } catch (error: any) {
      setErrorMsg(error.message || "Authentication failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-[0.98] duration-700">
      
      {/* Branding Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block hover:scale-105 transition-transform">
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 flex items-center justify-center gap-1">
            bantr<span className="text-green-500">.</span>
          </h1>
        </Link>
        <p className="text-neutral-400 font-medium text-sm mt-2">
          The global arena for peer-to-peer sports challenges.<br/>
          <span className="text-neutral-500">No house. No bookies. Just you vs them.</span>
        </p>
      </div>

      <div className="bg-neutral-900/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="flex bg-neutral-950/50 p-1 rounded-2xl mb-8 border border-white/5">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(""); }}
            className={`flex-1 text-sm font-black py-3 rounded-xl transition-all duration-300 ${!isSignUp ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(""); }}
            className={`flex-1 text-sm font-black py-3 rounded-xl transition-all duration-300 ${isSignUp ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            JOIN ARENA
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold p-4 rounded-2xl flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {errorMsg}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Username</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-black group-focus-within:text-green-500 transition-colors">@</span>
                <input
                  name="username"
                  type="text"
                  required={isSignUp}
                  placeholder="odogwu"
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-2xl py-4 pl-10 pr-4 text-white font-bold placeholder:text-neutral-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-green-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-2xl py-4 pl-11 pr-4 text-white font-bold placeholder:text-neutral-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1 pr-1">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Password</label>
              {!isSignUp && (
                <Link href="/forgot-password" className="text-[10px] text-green-500 hover:text-green-400 font-bold uppercase tracking-widest transition-colors">
                  Forgot?
                </Link>
              )}
            </div>
            
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-green-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-2xl py-4 pl-11 pr-4 text-white font-bold placeholder:text-neutral-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-black font-black text-lg py-4.5 rounded-2xl hover:bg-green-400 transition-all disabled:opacity-50 active:scale-[0.98] shadow-[0_0_25px_rgba(34,197,94,0.2)] mt-6 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg>
                SECURING CONNECTION...
              </>
            ) : isSignUp ? "ENTER THE ARENA" : "SECURE LOGIN"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-green-500/30">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" style={{ animationDelay: '1s' }} />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      <Suspense fallback={<div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin z-10" />}>
        <AuthForm />
      </Suspense>
    </div>
  );
}