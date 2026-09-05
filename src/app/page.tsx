import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering so the live arena feed is always up to date
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  // 1. Fetch live open challenges to create instant FOMO
  // (Adjust the column names if your schema differs slightly)
  const { data: openDuels } = await supabase
    .from("duels")
    .select("id, match, stake, status")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(3)
    .catch(() => ({ data: [] })); // Safe fallback

  // 2. Fetch Top Players to showcase skill/Ball IQ
  const { data: topPlayers } = await supabase
    .from("users")
    .select("username, ball_iq_points")
    .order("ball_iq_points", { ascending: false })
    .limit(3);

  return (
    <div className="min-h-screen bg-neutral-950 font-sans selection:bg-green-500/30 text-white overflow-x-hidden">
      
      {/* --- AMBIENT BACKGROUND EFFECTS --- */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-green-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] pointer-events-none" />

      {/* --- TOP NAVBAR --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="font-black text-2xl tracking-tighter flex items-center gap-1">
          bantr<span className="text-green-500">.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-widest transition-colors">
            Login
          </Link>
          <Link href="/login?signup=true" className="text-xs font-black text-black bg-white px-4 py-2.5 rounded-lg hover:bg-neutral-200 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase tracking-widest">
            Join Arena
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-16 pb-24 px-4 text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-md text-[10px] font-black text-neutral-400 uppercase tracking-widest shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          The Escrow Vault is Live
        </div>

        {/* Hero Copy */}
        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-[1.1] max-w-3xl">
          Settle sports debates. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            Winner takes all.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
          We are not a bookie. There are no odds and no house edge. 
          Lock your funds in atomic escrow, challenge your friends, and let the best Ball IQ win.
        </p>

        {/* Call to Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-green-500 text-black font-black text-[15px] px-10 py-4.5 rounded-2xl hover:bg-green-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 tracking-wide">
              ENTER THE ARENA
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </Link>
          
          <a href="#how-it-works" className="w-full sm:w-auto text-neutral-400 font-bold text-[13px] hover:text-white transition-colors py-4 px-8 uppercase tracking-widest border border-transparent hover:border-neutral-800 rounded-2xl bg-neutral-900/0 hover:bg-neutral-900/50">
            How it works
          </a>
        </div>
      </main>

      {/* --- LIVE ARENA FEED (FOMO ENGINE) --- */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-32">
        <div className="bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Live in the Arena
              </h2>
              <p className="text-sm text-neutral-400 font-medium mt-1">Open challenges waiting for an opponent.</p>
            </div>
            <Link href="/login" className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1.5 rounded uppercase tracking-widest hover:bg-green-500/20 transition-colors">
              View All →
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {openDuels && openDuels.length > 0 ? (
              openDuels.map((duel) => (
                <div key={duel.id} className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 hover:border-green-500/30 transition-colors group">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Open Challenge</div>
                  <div className="font-black text-lg text-white mb-4 line-clamp-1">{duel.match}</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-0.5">Stake</div>
                      <div className="font-black text-green-400">₦{(duel.stake || 0).toLocaleString()}</div>
                    </div>
                    <Link href="/login">
                      <button className="text-[10px] font-black bg-white text-black px-3 py-1.5 rounded hover:bg-neutral-200 transition-colors uppercase tracking-widest">
                        Accept
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Anti-Empty State: Show the Hall of Fame if no duels are open
              topPlayers?.map((player, idx) => (
                <div key={player.username} className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center font-black text-neutral-500">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-black text-white text-lg">@{player.username}</div>
                    <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest">{player.ball_iq_points} IQ Pts</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS / NO HOUSE PITCH --- */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-4 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Peer-to-Peer Prediction.</h2>
          <p className="text-neutral-400 max-w-xl mx-auto font-medium">
            Bookies rig the odds against you. We just hold the money safely until the whistle blows. Pure skill.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-neutral-900/30 border border-neutral-800/50 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 border border-indigo-500/20">
              🤝
            </div>
            <h3 className="text-xl font-black text-white mb-2">Create a Challenge</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
              Pick a match, predict the outcome, and set your stake. Share your unique challenge link in the group chat.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-neutral-900/30 border border-neutral-800/50 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 border border-green-500/20">
              🔒
            </div>
            <h3 className="text-xl font-black text-white mb-2">Atomic Escrow</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
              Both parties' funds are instantly locked in our secure vault. Nobody can back out once the match kicks off.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-neutral-900/30 border border-neutral-800/50 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all" />
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 border border-yellow-500/20">
              📸
            </div>
            <h3 className="text-xl font-black text-white mb-2">Viral Receipts</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
              Winner takes the pot and automatically generates a branded receipt to post on Twitter and WhatsApp for maximum disrespect.
            </p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-neutral-900 py-12 text-center relative z-10">
        <div className="font-black text-xl text-white opacity-50 mb-4">bantr.</div>
        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
          Secured by Atomic Escrow • Powered by Bachs.io
        </p>
      </footer>
    </div>
  );
}









// import Link from "next/link";

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
//       {/* Background Glow */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

//       <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
        
//         {/* Badge */}
//         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 uppercase tracking-widest mx-auto">
//           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//           The Arena is Live
//         </div>

//         {/* Hero Text */}
//         <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter leading-[1.1]">
//           Talk is cheap. <br />
//           <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
//             Back it up.
//           </span>
//         </h1>

//         <p className="text-lg text-neutral-400 font-medium max-w-md mx-auto">
//           The first peer-to-peer banter platform. Put your money where your mouth is, cook your friends, and share the receipts.
//         </p>

//         {/* Call to Action */}
//         <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
//           <Link href="/login" className="w-full sm:w-auto">
//             <button className="w-full bg-green-500 text-black font-black text-lg px-10 py-4 rounded-xl hover:bg-green-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
//               ENTER THE ARENA
//             </button>
//           </Link>
          
//           <a href="#how-it-works" className="w-full sm:w-auto text-neutral-400 font-bold text-sm hover:text-white transition-colors py-4 px-6">
//             How it works
//           </a>
//         </div>
        
//       </div>

//       {/* Footer / Social Proof */}
//       <div className="absolute bottom-10 left-0 right-0 text-center text-xs font-bold text-neutral-600 uppercase tracking-widest">
//         Powered by Bachs.io Escrow
//       </div>
//     </div>
//   );
// }