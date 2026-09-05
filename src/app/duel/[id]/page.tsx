import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import AcceptDuelButton from "@/components/shared/AcceptDuelButton";

interface PageProps {
  params: { id: string };
}

// 1. THE VIRAL META TAG ENGINE (For WhatsApp & Twitter previews)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params; // Await params for Next.js 15 compatibility
  const { id } = resolvedParams;

  const supabase = await createClient();

  const { data: duel } = await supabase
    .from("duels")
    .select("stake_amount, creator:users!creator_id(username)")
    .eq("id", id)
    .single();

  if (!duel) {
    return { title: "Duel Not Found | bantr.lol" };
  }

  // Safely extract the username whether Supabase returns an array or an object
  const creatorUsername = Array.isArray(duel.creator) 
    ? duel.creator[0]?.username 
    : (duel.creator as { username?: string } | null | undefined)?.username;

  const safeUsername = creatorUsername || "A challenger";
  const safeStake = (duel.stake_amount || 0).toLocaleString();

  const title = `🚨 @${safeUsername} just dropped ₦${safeStake} on the table.`;
  const description = `Think they're wrong? Match the ₦${safeStake} stake in escrow and prove it.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "bantr.lol",
      type: "website",
    },
    twitter: {
      card: "summary", 
      title,
      description,
    },
  };
}

// 2. THE SERVER-RENDERED PAGE UI
export default async function DuelPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();
  
  // Fetch the logged-in user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the Duel and safely map relations
  const { data: duel, error: fetchError } = await supabase
    .from("duels")
    .select(`
      *,
      creator:users!creator_id(username),
      acceptor:users!acceptor_id(username)
    `)
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("DUEL FETCH ERROR:", fetchError.message);
  }

  if (!duel) notFound();

  // Determine State
  const isCreator = user?.id === duel.creator_id;
  const isAccepted = duel.status === 'active' || duel.status === 'settled';

  // SAFETY FALLBACKS (Prevents crashes if database schema has older rows)
  const stake = duel.stake_amount || duel.stake || 0;
  const creatorPrediction = duel.prediction_creator || duel.myPick || "Unknown";
  const acceptorPrediction = duel.prediction_acceptor || "The Field";
  
  const creatorUsername = Array.isArray(duel.creator)
    ? duel.creator[0]?.username
    : (duel.creator as { username?: string } | null | undefined)?.username;
  const acceptorUsername = Array.isArray(duel.acceptor)
    ? duel.acceptor[0]?.username
    : (duel.acceptor as { username?: string } | null | undefined)?.username;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-green-500/30">
      
      {/* Background Glow based on status */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none ${isAccepted ? 'bg-indigo-500/10' : 'bg-green-500/10'}`} />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        {/* Branding Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:scale-105 transition-transform">
            <h1 className="text-3xl font-black text-white tracking-tighter flex items-center justify-center gap-1">
              bantr<span className="text-green-500">.</span>
            </h1>
          </Link>
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-2">
            {isAccepted ? "Locked & Loaded" : "Open Challenge"}
          </div>
        </div>

        {/* The Main VS Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Match Details */}
          <div className="text-center mb-8">
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-2">The Match</div>
            <div className="text-2xl font-black text-white leading-tight">{duel.match}</div>
          </div>

          {/* Player vs Player Setup */}
          <div className="flex items-stretch justify-between bg-neutral-950 rounded-2xl p-2 border border-neutral-800/80 mb-8 relative">
            
            {/* VS Badge in Middle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-neutral-900 border border-neutral-700 rounded-full flex items-center justify-center z-10 shadow-xl">
              <span className="text-xs font-black text-neutral-400 italic">VS</span>
            </div>

            {/* Creator Side */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Challenger</div>
              <div className="font-black text-lg text-white mb-1 truncate w-full">@{creatorUsername || "Unknown"}</div>
              <div className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded uppercase font-bold border border-green-500/20 inline-block">
                Pick: {creatorPrediction}
              </div>
            </div>

            {/* Acceptor Side */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 border-l border-neutral-800/80 text-center">
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Opponent</div>
              {isAccepted ? (
                <>
                  <div className="font-black text-lg text-white mb-1 truncate w-full">@{acceptorUsername || 'Unknown'}</div>
                  <div className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase font-bold border border-indigo-500/20 inline-block">
                    Pick: {acceptorPrediction}
                  </div>
                </>
              ) : (
                <div className="font-black text-neutral-600 italic">Waiting...</div>
              )}
            </div>
          </div>

          {/* Call to Action Area */}
          <div className="text-center space-y-6">
            <div>
              <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-1">Total Pot</div>
              <div className="text-4xl font-black text-yellow-500 tracking-tight">
                ₦{(stake * 1.9).toLocaleString()}
              </div>
            </div>

            {/* The interactive client component handles the API lock */}
            {!isAccepted && !isCreator && (
              <AcceptDuelButton 
                duelId={duel.id} 
                stake={stake} 
                isLoggedIn={!!user} 
              />
            )}

            {!isAccepted && isCreator && (
              <div className="bg-neutral-800/50 text-neutral-400 text-sm font-bold p-4 rounded-xl border border-neutral-700/50 animate-pulse">
                Waiting for someone to accept this challenge.
              </div>
            )}

            {isAccepted && (
              <div className="bg-indigo-500/10 text-indigo-400 text-[11px] font-black tracking-widest uppercase p-4 rounded-xl border border-indigo-500/20 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                FUNDS SECURED IN ESCROW
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}