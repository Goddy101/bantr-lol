import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic"; 
export const revalidate = 60; // Cache for 60 seconds

// Helper function to assign toxic/fun ranks based on points
const getRankTitle = (points: number) => {
  if (points >= 500) return { title: "Odogwu", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" };
  if (points >= 200) return { title: "Senior Man", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" };
  if (points >= 50) return { title: "Agba Baller", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" };
  if (points > 0) return { title: "Talkative", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" };
  return { title: "Learner", color: "text-neutral-500", bg: "bg-neutral-800", border: "border-neutral-700" };
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the top 50 users ordered by Ball IQ Points
  const { data: topUsers } = await supabase
    .from("users")
    .select("id, username, ball_iq_points")
    .order("ball_iq_points", { ascending: false })
    .limit(50);

  const players = topUsers || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-green-500/30 pb-20 overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sticky Header */}
      <div className="sticky top-0 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-5 py-4 z-50 flex justify-between items-center shadow-md">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-neutral-400 font-bold hover:text-white transition-colors group text-sm">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Arena
        </Link>
        <h1 className="font-black tracking-widest text-sm uppercase flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          <span className="text-yellow-500">🏆</span> HALL OF FAME
        </h1>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      <div className="max-w-lg mx-auto p-4 mt-2 relative z-10 space-y-6">
        
        <div className="text-center mb-8">
          <p className="text-neutral-400 text-sm font-medium">Win duels to steal points. Lose duels, lose your respect.</p>
        </div>

        {/* --- PREMIUM ANIMATED PODIUM FOR TOP 3 --- */}
        {players.length >= 3 && (
          <div className="flex items-end justify-center gap-2 sm:gap-4 mb-12 mt-8 h-48">
            
            {/* 2nd Place (Silver) */}
            <div className="flex flex-col items-center flex-1 animate-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="text-xs font-black text-neutral-300 mb-1 truncate w-full text-center">@{players[1].username}</div>
              <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2 border ${getRankTitle(players[1].ball_iq_points).bg} ${getRankTitle(players[1].ball_iq_points).color} ${getRankTitle(players[1].ball_iq_points).border}`}>
                {getRankTitle(players[1].ball_iq_points).title}
              </div>
              <div className="w-full bg-neutral-800/80 border border-neutral-700 rounded-t-2xl h-24 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-neutral-400 shadow-[0_0_10px_#9ca3af]" />
                <span className="text-3xl font-black text-neutral-500">2</span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase mt-1">{players[1].ball_iq_points} IQ</span>
              </div>
            </div>

            {/* 1st Place (Gold) - The Odogwu */}
            <div className="flex flex-col items-center flex-1 animate-in slide-in-from-bottom-12 duration-700 z-10">
              <div className="text-2xl mb-1">👑</div>
              <div className="text-sm font-black text-yellow-500 mb-1 truncate w-full text-center">@{players[0].username}</div>
              <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2 border ${getRankTitle(players[0].ball_iq_points).bg} ${getRankTitle(players[0].ball_iq_points).color} ${getRankTitle(players[0].ball_iq_points).border}`}>
                {getRankTitle(players[0].ball_iq_points).title}
              </div>
              <div className="w-full bg-gradient-to-t from-yellow-900/40 to-yellow-600/20 border border-yellow-500/50 rounded-t-2xl h-32 flex flex-col justify-center items-center relative overflow-hidden shadow-[0_-10px_30px_rgba(234,179,8,0.15)]">
                <div className="absolute top-0 w-full h-1 bg-yellow-400 shadow-[0_0_15px_#facc15]" />
                <span className="text-4xl font-black text-yellow-500 drop-shadow-md">1</span>
                <span className="text-xs text-yellow-500/80 font-black uppercase mt-1">{players[0].ball_iq_points} IQ</span>
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex flex-col items-center flex-1 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="text-xs font-black text-amber-600 mb-1 truncate w-full text-center">@{players[2].username}</div>
              <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2 border ${getRankTitle(players[2].ball_iq_points).bg} ${getRankTitle(players[2].ball_iq_points).color} ${getRankTitle(players[2].ball_iq_points).border}`}>
                {getRankTitle(players[2].ball_iq_points).title}
              </div>
              <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-t-2xl h-20 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-amber-700/50 shadow-[0_0_10px_#b45309]" />
                <span className="text-2xl font-black text-neutral-600">3</span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase mt-1">{players[2].ball_iq_points} IQ</span>
              </div>
            </div>
          </div>
        )}

        {/* --- LIST FOR RANKS 4-50 --- */}
        <div className="space-y-3">
          {players.slice(3).map((player, index) => {
            const rankStyle = getRankTitle(player.ball_iq_points);
            const isMe = user?.id === player.id;
            const actualRank = index + 4;

            return (
              <div 
                key={player.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isMe 
                    ? "bg-green-500/10 border-green-500/50 scale-[1.02] shadow-[0_0_15px_rgba(34,197,94,0.15)] z-10 relative" 
                    : "bg-neutral-900/50 border-neutral-800/80 hover:bg-neutral-900"
                }`}
              >
                {/* Left Side: Rank & Name */}
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${isMe ? 'bg-green-500 text-black' : 'bg-neutral-800 text-neutral-500'}`}>
                    {actualRank}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`font-black text-base sm:text-lg ${isMe ? 'text-white' : 'text-neutral-200'}`}>
                        @{player.username}
                        {isMe && <span className="ml-2 text-[9px] bg-green-500 text-black px-2 py-0.5 rounded-full uppercase tracking-widest font-black">You</span>}
                      </div>
                    </div>
                    <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-block mt-1 border ${rankStyle.bg} ${rankStyle.color} ${rankStyle.border}`}>
                      {rankStyle.title}
                    </div>
                  </div>
                </div>

                {/* Right Side: Points */}
                <div className="text-right">
                  <div className={`text-xl font-black ${isMe ? 'text-green-400' : 'text-white'}`}>
                    {player.ball_iq_points.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">IQ Pts</div>
                </div>
              </div>
            );
          })}

          {players.length === 0 && (
            <div className="text-center py-20 text-neutral-500 font-medium border border-neutral-800/50 rounded-3xl border-dashed">
              The arena is empty. Go win the first duel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}