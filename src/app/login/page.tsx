"use client";

import { useState, Suspense } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  // Default to Sign Up if they came from a referral link
  const [isSignUp, setIsSignUp] = useState(!!refCode); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const result = isSignUp ? await signUp(formData) : await signIn(formData);

    if (result?.error) {
      setErrorMsg(result.error);
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

      {/* Main Glassmorphism Card */}
      <div className="bg-neutral-900/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Sleek Toggle Switch */}
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

        {/* Referral Banner */}
        {isSignUp && refCode && (
          <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold p-3 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            You've been invited to join a private network.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && refCode && <input type="hidden" name="refCode" value={refCode} />}

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
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Password</label>
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

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Funds secured by atomic escrow
        </div>
      </div>
    </div>
  );
}

// 3. We wrap the form in a Suspense boundary for Next.js App Router compatibility
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-green-500/30">
      
      {/* Animated Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" style={{ animationDelay: '1s' }} />
      
      {/* Subtle Grid Pattern for that tech/crypto feel */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      <Suspense fallback={
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-green-500 font-black tracking-widest text-sm uppercase">Loading Arena...</div>
        </div>
      }>
        <AuthForm />
      </Suspense>
    </div>
  );
}







// "use client";

// import { useState, Suspense } from "react";
// import { signIn, signUp } from "@/app/actions/auth";
// import { useSearchParams } from "next/navigation";

// // 1. We extract the actual form logic into its own component
// function AuthForm() {
//   const searchParams = useSearchParams();
//   const refCode = searchParams.get("ref");

//   // UX Trick: If they came from a referral link, automatically default to the Sign Up view!
//   const [isSignUp, setIsSignUp] = useState(!!refCode); 
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMsg("");

//     const formData = new FormData(e.currentTarget);
    
//     // Call the respective Server Action
//     const result = isSignUp ? await signUp(formData) : await signIn(formData);

//     // If there is an error, the server action returns it. Otherwise, it redirects.
//     if (result?.error) {
//       setErrorMsg(result.error);
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-500">
//       <div className="text-center mb-10">
//         <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
//           bantr<span className="text-green-500">.lol</span>
//         </h1>
//         <p className="text-neutral-400 font-medium">Put your money where your mouth is.</p>
//       </div>

//       <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
//         <form onSubmit={handleSubmit} className="space-y-4">
          
//           {/* 2. The Silent Affiliate Tracker */}
//           {isSignUp && refCode && (
//             <input type="hidden" name="refCode" value={refCode} />
//           )}

//           {errorMsg && (
//             <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold p-3 rounded-xl text-center">
//               {errorMsg}
//             </div>
//           )}

//           {isSignUp && (
//             <div>
//               <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Username</label>
//               <div className="relative">
//                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-black">@</span>
//                 <input
//                   name="username"
//                   type="text"
//                   required={isSignUp}
//                   placeholder="odogwu"
//                   className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white font-bold focus:outline-none focus:border-green-500 transition-colors"
//                 />
//               </div>
//             </div>
//           )}

//           <div>
//             <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Email</label>
//             <input
//               name="email"
//               type="email"
//               required
//               placeholder="you@example.com"
//               className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-green-500 transition-colors"
//             />
//           </div>

//           <div>
//             <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Password</label>
//             <input
//               name="password"
//               type="password"
//               required
//               placeholder="••••••••"
//               className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-green-500 transition-colors"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full bg-green-500 text-black font-black text-lg py-4 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.2)] mt-2"
//           >
//             {isLoading ? "Authenticating..." : isSignUp ? "ENTER THE ARENA" : "LOGIN"}
//           </button>
//         </form>

//         <div className="mt-6 text-center">
//           <button
//             type="button"
//             onClick={() => {
//               setIsSignUp(!isSignUp);
//               setErrorMsg("");
//             }}
//             className="text-neutral-400 text-sm font-medium hover:text-white transition-colors"
//           >
//             {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // 3. We wrap the form in a Suspense boundary for Next.js App Router compatibility
// export default function LoginPage() {
//   return (
//     <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
//       {/* Background Effects */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />
      
//       <Suspense fallback={<div className="text-green-500 font-black animate-pulse z-10">LOADING ARENA...</div>}>
//         <AuthForm />
//       </Suspense>
//     </div>
//   );
// }