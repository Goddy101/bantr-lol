"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import DepositModal from "@/components/shared/DepositModal";

interface RumbleClientUIProps {
  rumble: any;
  participants: any[];
  currentUserId: string | null;
  hasJoined: boolean;
  userBalance: number;
}

export default function RumbleClientUI({ rumble, participants, currentUserId, hasJoined, userBalance }: RumbleClientUIProps) {
  const router = useRouter();
  const [selectedPick, setSelectedPick] = useState<"home" | "away" | "draw" | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  
  // Real-time pot & participant state
  const [livePot, setLivePot] = useState(rumble.total_pot);
  const [liveParticipants, setLiveParticipants] = useState(participants);

  // Subscribe to real-time Rumble Pool updates (so they can literally watch the pot grow)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`rumble-${rumble.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rumble_pools', filter: `id=eq.${rumble.id}` }, (payload: any) => {
          if (payload.new && payload.new.total_pot) setLivePot(payload.new.total_pot);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [rumble.id]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: "Bantr Rumble Arena",
      text: `The pot for ${rumble.match_name} is at ₦${livePot.toLocaleString()}! Join the Rumble for ₦${rumble.entry_fee.toLocaleString()} before it locks.`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success("Rumble link copied! Drop it in the group chat.");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleJoinRumble = async () => {
    if (!selectedPick) return toast.error("Select your prediction first.");
    
    // ZERO BALANCE GUARD
    if (userBalance < rumble.entry_fee) {
      toast.error(`You need ₦${rumble.entry_fee.toLocaleString()} to enter. Fund your vault!`);
      return setIsDepositOpen(true);
    }

    setIsJoining(true);
    const supabase = createClient();

    // Call our Atomic Postgres RPC Function!
    const { data, error } = await supabase.rpc('join_rumble', {
      p_user_id: currentUserId,
      p_rumble_id: rumble.id,
      p_prediction: selectedPick
    });

    if (error) {
      toast.error("Failed to join Rumble. Please try again.");
      setIsJoining(false);
      return;
    }

    if (data.success) {
      toast.success("Successfully locked into the Rumble!");
      router.refresh(); // Refreshes the server data to show them in the participant list
    } else {
      toast.error(data.error || "Could not join Rumble.");
      setIsJoining(false);
    }
  };

  const isLocked = rumble.status !== 'open';

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center p-4 pb-20 font-sans selection:bg-yellow-500/30 overflow-hidden relative">
      
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none z-0 bg-yellow-500/10" />

      <div className="w-full max-w-md relative z-10 pt-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <span className="relative flex h-2 w-2">
              {!isLocked && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLocked ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
            </span>
            {isLocked ? "RUMBLE LOCKED" : "LIVE MULTIPLAYER RUMBLE"}
          </div>
          <h1 className="text-3xl font-black tracking-tight">{rumble.match_name}</h1>
        </div>

        {/* The Mega Pot Card */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden mb-6">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-2 relative z-10">Total Rumble Pot</div>
          <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.3)] tracking-tighter mb-2 relative z-10">
            ₦{livePot.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest relative z-10">
            Entry Fee: ₦{rumble.entry_fee.toLocaleString()}
          </div>

          {/* Participants Hype Train */}
          <div className="mt-8 pt-6 border-t border-neutral-800/80 relative z-10">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3">
              {liveParticipants.length} Fighters Locked In
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {liveParticipants.map((p: any, i: number) => (
                <div key={i} className="flex flex-col items-center group relative cursor-help">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-black">
                    {p.users?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  {/* Tooltip on hover showing what they picked */}
                  <div className="absolute -bottom-8 bg-neutral-950 border border-neutral-800 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                    Picked {p.prediction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Area */}
        {!currentUserId ? (
           <Link href="/login" className="w-full block">
             <button className="w-full bg-white text-black font-black text-[15px] tracking-wide py-4.5 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
               LOGIN TO JOIN RUMBLE
             </button>
           </Link>
        ) : hasJoined ? (
           <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
             <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
               <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <h3 className="text-white font-black text-lg mb-1">You're locked in.</h3>
             <p className="text-neutral-400 text-sm mb-5">Your entry fee is secured in escrow. Await the match results.</p>
             <button 
               onClick={handleShare}
               className="w-full bg-white text-black font-black text-[15px] tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200"
             >
               INVITE MORE FRIENDS <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
             </button>
           </div>
        ) : isLocked ? (
           <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center text-neutral-500 font-bold uppercase tracking-widest text-sm">
             Entries are closed. Match in progress.
           </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: "home", label: "HOME", icon: "🏠" },
                { id: "draw", label: "DRAW", icon: "⚖️" },
                { id: "away", label: "AWAY", icon: "✈️" }
              ].map((pick) => (
                <button
                  key={pick.id}
                  onClick={() => setSelectedPick(pick.id as any)}
                  className={`p-3 rounded-2xl text-center transition-all duration-300 border ${
                    selectedPick === pick.id 
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)] scale-[1.02]" 
                      : "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:bg-neutral-900"
                  }`}
                >
                  <div className="text-lg mb-1">{pick.icon}</div>
                  <div className={`text-[10px] font-black tracking-widest uppercase ${selectedPick === pick.id ? "text-yellow-500" : ""}`}>
                    {pick.label}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleJoinRumble}
              disabled={!selectedPick || isJoining}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-black font-black text-[15px] tracking-wide py-4.5 rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_25px_rgba(250,204,21,0.25)]"
            >
              {isJoining ? "LOCKING FUNDS..." : selectedPick ? `JOIN RUMBLE FOR ₦${rumble.entry_fee.toLocaleString()}` : "SELECT YOUR PICK"}
            </button>
          </div>
        )}
      </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </div>
  );
}