"use client";

import { useState, Suspense } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { useSearchParams } from "next/navigation";

// 1. We extract the actual form logic into its own component
function AuthForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  // UX Trick: If they came from a referral link, automatically default to the Sign Up view!
  const [isSignUp, setIsSignUp] = useState(!!refCode); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    
    // Call the respective Server Action
    const result = isSignUp ? await signUp(formData) : await signIn(formData);

    // If there is an error, the server action returns it. Otherwise, it redirects.
    if (result?.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
          bantr<span className="text-green-500">.lol</span>
        </h1>
        <p className="text-neutral-400 font-medium">Put your money where your mouth is.</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 2. The Silent Affiliate Tracker */}
          {isSignUp && refCode && (
            <input type="hidden" name="refCode" value={refCode} />
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold p-3 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-black">@</span>
                <input
                  name="username"
                  type="text"
                  required={isSignUp}
                  placeholder="odogwu"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white font-bold focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-black font-black text-lg py-4 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.2)] mt-2"
          >
            {isLoading ? "Authenticating..." : isSignUp ? "ENTER THE ARENA" : "LOGIN"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
            className="text-neutral-400 text-sm font-medium hover:text-white transition-colors"
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. We wrap the form in a Suspense boundary for Next.js App Router compatibility
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Suspense fallback={<div className="text-green-500 font-black animate-pulse z-10">LOADING ARENA...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}