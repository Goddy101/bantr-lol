import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Helper for Gamified Ranks
const getRankTitle = (points: number) => {
  if (points >= 500) return { title: "Odogwu", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" };
  if (points >= 200) return { title: "Senior Man", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" };
  if (points >= 50) return { title: "Agba Baller", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" };
  if (points > 0) return { title: "Talkative", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" };
  return { title: "Learner", color: "text-neutral-500", bg: "bg-neutral-800", border: "border-neutral-700" };
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // 1. Authenticate User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch Data in Parallel
  const [profileRes, duelsRes, txRes] = await Promise.all([
    // A. Profile Data
    supabase.from("users").select("*").eq("id", user.id).single(),
    
    // B. Settled Duels (Where they are Creator OR Acceptor)
    supabase.from("duels")
      .select(`*, creator:users!duels_creator_id_fkey(username), acceptor:users!duels_acceptor_id_fkey(username)`)
      .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`)
      .eq("status", "settled")
      .order("updated_at", { ascending: false }),

    // C. Lifetime Earnings (Only counting positive payouts from wins)
    supabase.from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .in("type", ["duel_win", "jackpot_win"])
  ]);

  const profile = profileRes.data;
  const history = duelsRes.data || [];
  const winnings = txRes.data || [];

  // 3. Crunch the Stats
  const totalMatches = history.length;
  const totalWins = history.filter((duel) => duel.winner_id === user.id).length;
  const totalLosses = totalMatches - totalWins;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  
  const lifetimeEarnings = winnings.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const rank = getRankTitle(profile?.ball_iq_points || 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-32 font-sans selection:bg-green-500/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Header */}
      <div className="sticky top-0 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-5 py-4 z-50 flex justify-between items-center shadow-sm">
        <Link href="/dashboard" className="text-neutral-400 font-bold hover:text-white flex items-center gap-1 text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Dashboard
        </Link>
        <h1 className="font-black tracking-widest text-sm uppercase">My Profile</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 relative z-10 space-y-6">
        
        {/* Identity Card */}
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 text-center shadow-xl">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[3px] shadow-[0_0_20px_rgba(52,211,153,0.2)] mb-4">
            <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black text-3xl">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-1">@{profile?.username}</h2>
          <div className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${rank.bg} ${rank.color} ${rank.border}`}>
            {rank.title} • {profile?.ball_iq_points || 0} IQ
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
            <div className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Lifetime Winnings</div>
            <div className="text-2xl sm:text-3xl font-black text-green-400 tracking-tight">₦{lifetimeEarnings.toLocaleString()}</div>
          </div>
          
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
            <div className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Win Rate</div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{winRate}%</div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
            <div className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Wins</div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{totalWins}</div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
            <div className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Losses</div>
            <div className="text-2xl sm:text-3xl font-black text-red-400 tracking-tight">{totalLosses}</div>
          </div>
        </div>

        {/* Battle History Log */}
        <div>
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 ml-1 mt-6">Combat History</h3>
          
          {history.length === 0 ? (
            <div className="text-center py-12 px-4 bg-neutral-900/40 border border-neutral-800/50 rounded-2xl border-dashed">
              <h3 className="text-white font-black text-lg mb-1">No Scars Yet</h3>
              <p className="text-neutral-500 text-sm font-medium">You haven't completed any wagers. Head to the Arena.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((duel) => {
                const isWinner = duel.winner_id === user.id;
                const isCreator = duel.creator_id === user.id;
                const opponentName = isCreator 
                  ? (duel.acceptor?.username || "Unknown") 
                  : (duel.creator?.username || "Unknown");

                // If they won, they get the full payout minus commissions. If they lost, they lost their stake.
                // We'll show an approximate payout here for UI flare.
                const payoutDisplay = isWinner ? `+ ₦${((duel.stake_amount * 2) * 0.90).toLocaleString()}` : `- ₦${duel.stake_amount.toLocaleString()}`;

                return (
                  <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${isWinner ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {isWinner ? 'W' : 'L'}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white mb-0.5">vs @{opponentName}</div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{duel.match_id || "Duel"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-lg tracking-tight ${isWinner ? 'text-green-400' : 'text-red-500'}`}>
                        {payoutDisplay}
                      </div>
                      <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">
                        {new Date(duel.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}