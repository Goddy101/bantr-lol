import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Ensures the lobby is always fresh

export default async function LobbyPage() {
  const supabase = await createClient();

  // 1. Get current user (so we don't show them their own duels to accept)
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch all open duels and JOIN the users table to get the creator's username
  // We use the exact foreign key name from your schema to ensure the join works perfectly
  const { data: openDuels, error: dbError } = await supabase
    .from('duels')
    .select(`
      *,
      creator:users!duels_creator_id_fkey(username, ball_iq_points)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  // Filter out duels created by the current user
  const availableDuels = openDuels?.filter((d: any) => d.creator_id !== user?.id) || [];

  // 3. Fetch live matches from Football-Data so we can translate match_ids into Team Names
  let fixtures: any[] = [];
  try {
    const apiResponse = await fetch(`https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || '' },
      next: { revalidate: 60 }
    });
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      fixtures = apiData.matches || [];
    }
  } catch (error) {
    console.error("Failed to fetch fixtures for lobby mapping");
  }

  // 4. Map the database duels to the real-world match data
  const mappedDuels = availableDuels.map((duel: any) => {
    // Find the match in the API response using the ID
    const match = fixtures.find((m: any) => m.id.toString() === duel.match_id);
    
    return {
      ...duel,
      homeTeam: match?.homeTeam?.shortName || match?.homeTeam?.name || 'Home Team',
      awayTeam: match?.awayTeam?.shortName || match?.awayTeam?.name || 'Away Team',
      homeLogo: match?.homeTeam?.crest || '',
      awayLogo: match?.awayTeam?.crest || '',
      time: match?.utcDate ? new Intl.DateTimeFormat('en-NG', {
        weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: true
      }).format(new Date(match.utcDate)) : 'Upcoming'
    };
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans selection:bg-green-500/30">
      
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Header */}
      <div className="sticky top-0 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-5 py-5 z-50 shadow-sm relative">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-black tracking-widest text-xl uppercase flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Global Arena
            </h1>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Accept open challenges from strangers</p>
          </div>
          <Link href="/dashboard" className="text-[11px] font-black text-black bg-white px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            MY VAULT
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-4 max-w-3xl mx-auto mt-6 relative z-10">
        
        {mappedDuels.length === 0 ? (
          <div className="text-center py-20 px-4 bg-neutral-900/50 border border-neutral-800/50 rounded-3xl border-dashed">
            <div className="w-16 h-16 mx-auto bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-white font-black text-lg mb-1">The Arena is Quiet</h3>
            <p className="text-neutral-500 text-sm font-medium mb-6">No open challenges right now. Be the first to drop some money.</p>
            <Link href="/duel/create">
              <button className="bg-green-500 text-black font-black text-sm px-6 py-3 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                CREATE A DUEL
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mappedDuels.map((duel: any) => (
              <div key={duel.id} className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-3xl p-5 hover:border-neutral-700 transition-all group flex flex-col justify-between">
                
                {/* Top: User Info & Stake */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[2px]">
                      <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black text-sm">
                        {duel.creator?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    <div>
                      <div className="font-black text-sm">@{duel.creator?.username}</div>
                      <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">{duel.creator?.ball_iq_points || 0} IQ Pts</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-0.5">Stake</div>
                    <div className="font-black text-lg text-white">₦{duel.stake_amount.toLocaleString()}</div>
                  </div>
                </div>

                {/* Middle: The Match */}
                <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800/80 p-3 mb-5 relative overflow-hidden">
                  <div className="text-center text-[9px] font-black text-green-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> {duel.time}
                  </div>
                  
                  <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col items-center flex-1">
                      {duel.homeLogo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={duel.homeLogo} alt="home" className="w-8 h-8 object-contain mb-1" />
                      ) : (
                        <div className="w-8 h-8 bg-neutral-800 rounded-full mb-1" />
                      )}
                      <span className="text-[10px] font-black uppercase text-center line-clamp-1">{duel.homeTeam}</span>
                    </div>

                    <div className="text-[10px] font-black text-neutral-600 italic px-3">VS</div>

                    <div className="flex flex-col items-center flex-1">
                      {duel.awayLogo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={duel.awayLogo} alt="away" className="w-8 h-8 object-contain mb-1" />
                      ) : (
                        <div className="w-8 h-8 bg-neutral-800 rounded-full mb-1" />
                      )}
                      <span className="text-[10px] font-black uppercase text-center line-clamp-1">{duel.awayTeam}</span>
                    </div>
                  </div>
                  
                  {/* Highlight what the creator picked */}
                  <div className="mt-3 bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-center">
                    <span className="text-[9px] text-neutral-500 font-bold uppercase">They Picked: </span>
                    <span className="text-[10px] text-white font-black uppercase">{duel.prediction_creator}</span>
                  </div>
                </div>

                {/* Bottom: Action */}
                <Link href={`/duel/${duel.id}`} className="block w-full">
                  <button className="w-full flex items-center justify-center gap-2 bg-white text-black font-black text-sm py-3.5 rounded-xl hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    ACCEPT CHALLENGE
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent z-40">
        <Link href="/duel/create" className="w-full max-w-3xl mx-auto block">
          <button className="w-full flex items-center justify-center gap-2 bg-green-500 text-black font-black text-[15px] tracking-wide py-4 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_25px_rgba(34,197,94,0.25)] active:scale-[0.98]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            CREATE NEW DUEL
          </button>
        </Link>
      </div>

    </div>
  );
}