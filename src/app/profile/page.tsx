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

  // 2. 🚀 THE MASSIVE PARALLEL DATA ENGINE
  const [
    { data: profile },
    { data: history },
    { data: transactions },
    { data: rumbleData },
    { data: vipReferrals },
    { data: basicReferrals }
  ] = await Promise.all([
    // A. Profile Data
    supabase.from("users").select("*").eq("id", user.id).single(),
    
    // B. Settled Duels (Sorted newest first for streak tracking)
    supabase.from("duels")
      .select(`*, creator:users!duels_creator_id_fkey(username), acceptor:users!duels_acceptor_id_fkey(username)`)
      .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`)
      .eq("status", "settled")
      .order("updated_at", { ascending: false }),

    // C. All Transactions for PnL & Commission Math
    supabase.from("transactions")
      .select("amount, type")
      .eq("user_id", user.id),

    // D. Rumble Participations
    supabase.from("rumble_participants")
      .select(`prediction, rumble_pools!inner(status, winning_pick)`)
      .eq("user_id", user.id),

    // E. VIP Network Referrals
    supabase.from("users").select("id").eq("referred_by_admin", user.id),
    
    // F. Standard Affiliate Referrals
    supabase.from("users").select("id").eq("referred_by_affiliate", user.id)
  ]);

  const duels = history || [];
  const txs = transactions || [];
  const rumbles = rumbleData || [];

  // 3. 🧠 CRUNCHING THE GAMIFIED STATS
  
  // Basic Win/Loss
  const totalMatches = duels.length;
  const wonDuels = duels.filter((d) => d.winner_id === user.id);
  const totalWins = wonDuels.length;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  
  // Win Streak (Counting chronologically backwards from newest)
  let currentStreak = 0;
  for (const duel of duels) {
    if (duel.winner_id === user.id) currentStreak++;
    else break; // The streak is broken!
  }

  // Biggest Payout ("Whale" Status)
  const biggestPayout = wonDuels.length > 0 
    ? Math.max(...wonDuels.map(d => (d.stake_amount * 2) * 0.90)) // Assuming 10% platform fee
    : 0;

  // True Profit/Loss (PnL)
  let winnings = 0;
  let wagers = 0;
  let affiliateEarned = 0;

  txs.forEach(tx => {
    if (["duel_win", "jackpot_win"].includes(tx.type)) winnings += tx.amount;
    if (tx.type === "duel_escrow") wagers += tx.amount;
    if (tx.type === "affiliate_commission") affiliateEarned += tx.amount;
  });

  const pnl = winnings - wagers;
  const pnlColor = pnl > 0 ? "text-green-400" : pnl < 0 ? "text-red-500" : "text-neutral-400";
  const pnlPrefix = pnl > 0 ? "+" : "";

  // Rumble Dominance
  const totalRumbles = rumbles.length;
  const rumblesWon = rumbles.filter(r => {
    // Note: Supabase JS returns single objects for x-to-1 relationships
    const pool = r.rumble_pools as any; 
    return pool?.status === 'settled' && r.prediction === pool?.winning_pick;
  }).length;

  const rank = getRankTitle(profile?.ball_iq_points || 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-32 font-sans selection:bg-green-500/30">
      
      {/* Dynamic Background Glow based on PnL */}
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[150px] pointer-events-none z-0 ${pnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`} />

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
        
        {/* IDENTITY CARD */}
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
          
          {/* VIP Partner Glow Ring */}
          {profile?.is_partner && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500" />
          )}

          <div className={`w-20 h-20 mx-auto rounded-full p-[3px] mb-4 ${profile?.is_partner ? 'bg-gradient-to-tr from-yellow-400 to-amber-600 shadow-[0_0_25px_rgba(250,204,21,0.3)]' : 'bg-gradient-to-tr from-green-400 to-emerald-600 shadow-[0_0_20px_rgba(52,211,153,0.2)]'}`}>
            <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black text-3xl">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center justify-center gap-2">
            @{profile?.username}
            {profile?.is_partner && (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            )}
          </h2>

          <div className="flex items-center justify-center gap-2">
            <div className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${rank.bg} ${rank.color} ${rank.border}`}>
              {rank.title} • {profile?.ball_iq_points || 0} IQ
            </div>
          </div>
        </div>

        {/* 📈 PERFORMANCE MATRIX */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          
          {/* Net PnL */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-center">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              Net Profit/Loss
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${pnlColor}`}>
              {pnlPrefix}₦{Math.abs(pnl).toLocaleString()}
            </div>
          </div>
          
          {/* Win Rate */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-center">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Win Rate</div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{winRate}%</div>
          </div>

          {/* Win Streak */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-center">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Current Streak</div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              {currentStreak} {currentStreak > 2 && <span className="text-orange-500">🔥</span>}
            </div>
          </div>

          {/* Biggest Win */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-center">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Biggest Payout</div>
            <div className="text-2xl sm:text-3xl font-black text-green-400 tracking-tight flex items-center gap-2">
              ₦{biggestPayout.toLocaleString()} {biggestPayout > 10000 && <span className="text-blue-400">🐳</span>}
            </div>
          </div>

        </div>

        {/* ⚔️ RUMBLE DOMINANCE & AFFILIATE TIER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          
          {/* Rumble Stats */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between">
             <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Multiplayer Rumbles</div>
                <div className="font-black text-white text-lg">{rumblesWon} Won <span className="text-neutral-600 text-sm font-bold">/ {totalRumbles} Played</span></div>
             </div>
             <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             </div>
          </div>

          {/* Conditional Affiliate / Partner Block */}
          {(profile?.is_partner || basicReferrals?.length! > 0) && (
            <div className={`border rounded-2xl p-4 flex items-center justify-between ${profile?.is_partner ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-neutral-950 border-neutral-800/80'}`}>
               <div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${profile?.is_partner ? 'text-yellow-600' : 'text-neutral-500'}`}>
                    {profile?.is_partner ? 'VIP Partner Network' : 'Affiliate Network'}
                  </div>
                  <div className="font-black text-white text-lg">
                    {profile?.is_partner ? vipReferrals?.length : basicReferrals?.length} Users
                  </div>
                  <div className="text-[10px] text-green-500 font-bold mt-1">₦{affiliateEarned.toLocaleString()} Earned</div>
               </div>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile?.is_partner ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-800 text-neutral-400'}`}>
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
            </div>
          )}

        </div>

        {/* COMBAT HISTORY LOG */}
        <div>
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 ml-1 mt-6">Combat History</h3>
          
          {duels.length === 0 ? (
            <div className="text-center py-12 px-4 bg-neutral-900/40 border border-neutral-800/50 rounded-2xl border-dashed">
              <h3 className="text-white font-black text-lg mb-1">No Scars Yet</h3>
              <p className="text-neutral-500 text-sm font-medium">You haven't completed any wagers. Head to the Arena.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {duels.map((duel) => {
                const isWinner = duel.winner_id === user.id;
                const isCreator = duel.creator_id === user.id;
                const opponentName = isCreator 
                  ? (duel.acceptor?.username || "Unknown") 
                  : (duel.creator?.username || "Unknown");

                // Payout math: winner takes total pot minus 10% fee. Loser just loses original stake.
                const payoutDisplay = isWinner ? `+ ₦${((duel.stake_amount * 2) * 0.90).toLocaleString()}` : `- ₦${duel.stake_amount.toLocaleString()}`;

                return (
                  <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${isWinner ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {isWinner ? 'W' : 'L'}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white mb-0.5">vs @{opponentName}</div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest truncate max-w-[120px] sm:max-w-[200px]">
                          {duel.match || duel.match_id || "Duel"}
                        </div>
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