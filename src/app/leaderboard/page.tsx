import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      
      {/* Sticky Header */}
      <div className="sticky top-0 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-4 py-4 z-50 flex justify-between items-center shadow-md">
        <Link href="/dashboard" className="text-neutral-400 font-medium hover:text-white transition-colors">
          ← Arena
        </Link>
        <h1 className="font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          HALL OF FAME
        </h1>
        <div className="w-12"></div> {/* Spacer for centering */}
      </div>

      <div className="p-4 max-w-lg mx-auto mt-4">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2">Global Leaderboard</h2>
          <p className="text-neutral-400 text-sm">Win duels to steal points. Lose duels, lose your respect.</p>
        </div>

        <div className="space-y-3">
          {topUsers?.map((player, index) => {
            const rankStyle = getRankTitle(player.ball_iq_points);
            const isMe = user?.id === player.id;
            
            // Top 3 get special styling
            const isTop3 = index < 3;
            const rankBadgeColors = [
              "bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]", // 1st - Gold
              "bg-neutral-300 text-black shadow-[0_0_15px_rgba(212,212,216,0.3)]", // 2nd - Silver
              "bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.3)]"    // 3rd - Bronze
            ];

            return (
              <div 
                key={player.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isMe 
                    ? "bg-green-500/10 border-green-500/50 scale-[1.02] shadow-lg" 
                    : isTop3 
                      ? "bg-neutral-900 border-neutral-700" 
                      : "bg-neutral-900/50 border-neutral-800"
                }`}
              >
                {/* Left Side: Rank & Name */}
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    isTop3 ? rankBadgeColors[index] : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-black text-lg">
                        @{player.username}
                        {isMe && <span className="ml-2 text-[10px] bg-green-500 text-black px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-block mt-1 border ${rankStyle.bg} ${rankStyle.color} ${rankStyle.border}`}>
                      {rankStyle.title}
                    </div>
                  </div>
                </div>

                {/* Right Side: Points */}
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{player.ball_iq_points.toLocaleString()}</div>
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">IQ Pts</div>
                </div>
              </div>
            );
          })}

          {topUsers?.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              The arena is empty. Go win the first duel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}