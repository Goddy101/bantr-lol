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
  const [livePot, setLivePot] = useState(rumble.total_pot || 0);
  const [liveParticipants, setLiveParticipants] = useState(participants);

  // Subscribe to real-time Rumble updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`rumble-${rumble.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rumble_pools', filter: `id=eq.${rumble.id}` }, (payload: any) => {
          if (payload.new && payload.new.total_pot !== undefined) setLivePot(payload.new.total_pot);
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
      router.refresh(); 
    } else {
      toast.error(data.error || "Could not join Rumble.");
      setIsJoining(false);
    }
  };

  const isLocked = rumble.status !== 'open';
  // Visually limit avatars so they don't break the layout if 50 people join
  const displayParticipants = liveParticipants.slice(0, 8);
  const extraParticipants = liveParticipants.length > 8 ? liveParticipants.length - 8 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-yellow-500/30 overflow-hidden relative">
      
      {/* Top Navigation Bar */}
      <div className="absolute top-0 w-full z-50 px-5 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/dashboard" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Arena</span>
        </Link>
        
        {currentUserId && (
          <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span>
            <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Vault: ₦{userBalance.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-0 bg-yellow-500/10 animate-pulse duration-1000" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none z-0" />

      <div className="flex-1 w-full max-w-md mx-auto relative z-10 pt-24 px-4 pb-24 flex flex-col justify-center">
        
        {/* Header */}
        <div className="text-center mb-8 animate-in slide-in-from-top-4 fade-in duration-700">
          <div className={`inline-flex items-center justify-center gap-2 border px-3 py-1.5 rounded-full mb-4 shadow-sm backdrop-blur-md ${isLocked ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
            <span className="relative flex h-2 w-2">
              {!isLocked && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLocked ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isLocked ? "RUMBLE LOCKED" : "LIVE MULTIPLAYER RUMBLE"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight text-white/90">{rumble.match_name}</h1>
        </div>

        {/* The VIP Pot Card */}
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden mb-8 group animate-in zoom-in-95 fade-in duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1 relative z-10 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Total Rumble Pot
          </div>
          
          <div className="text-5xl sm:text-6xl font-black tracking-tighter mb-4 relative z-10 bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
            ₦{livePot.toLocaleString()}
          </div>
          
          <div className="inline-block bg-black/40 border border-white/5 rounded-full px-4 py-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-widest relative z-10 shadow-inner">
            Entry Fee: <span className="text-white">₦{rumble.entry_fee.toLocaleString()}</span>
          </div>

          {/* Stacking Avatar Hype Train */}
          <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-4">
              {liveParticipants.length} {liveParticipants.length === 1 ? "Fighter" : "Fighters"} Locked In
            </div>
            
            <div className="flex justify-center -space-x-3">
              {displayParticipants.map((p: any, i: number) => (
                <div key={i} className="relative group cursor-help transition-transform hover:scale-110 hover:z-30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 border-2 border-neutral-900 flex items-center justify-center text-xs font-black shadow-md">
                    {p.users?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-neutral-800 text-[10px] text-white font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-40 whitespace-nowrap shadow-xl pointer-events-none">
                    {p.users?.username} • <span className={p.prediction === 'home' ? 'text-blue-400' : p.prediction === 'away' ? 'text-red-400' : 'text-neutral-400'}>{p.prediction}</span>
                  </div>
                </div>
              ))}
              {extraParticipants > 0 && (
                <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-[10px] font-black shadow-md z-20">
                  +{extraParticipants}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="w-full">
          {!currentUserId ? (
             <Link href="/login" className="w-full block animate-in fade-in slide-in-from-bottom-4">
               <button className="w-full bg-white text-black font-black text-[15px] tracking-wide py-5 rounded-2xl hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]">
                 LOGIN TO JOIN RUMBLE
               </button>
             </Link>
          ) : hasJoined ? (
             <div className="bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-[2rem] p-6 text-center animate-in zoom-in-95 fade-in duration-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
               <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                 <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
               </div>
               <h3 className="text-white font-black text-xl mb-1">You're locked in.</h3>
               <p className="text-neutral-400 text-xs font-medium mb-6">Your entry fee is secured in escrow. Sit back and watch the game.</p>
               <button 
                 onClick={handleShare}
                 className="w-full bg-neutral-900 border border-neutral-800 text-white font-black text-[13px] tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 hover:border-neutral-700 transition-all active:scale-[0.98]"
               >
                 INVITE FRIENDS <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               </button>
             </div>
          ) : isLocked ? (
             <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 text-center animate-in fade-in">
               <div className="text-neutral-500 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 Entries Closed
               </div>
               <p className="text-neutral-600 text-[11px] mt-2 font-bold uppercase">Match is currently in progress</p>
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: "home", label: "HOME", sub: "Team 1" },
                  { id: "draw", label: "DRAW", sub: "Tie" },
                  { id: "away", label: "AWAY", sub: "Team 2" }
                ].map((pick) => (
                  <button
                    key={pick.id}
                    onClick={() => setSelectedPick(pick.id as any)}
                    className={`relative p-4 rounded-2xl text-center transition-all duration-300 overflow-hidden ${
                      selectedPick === pick.id 
                        ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-[1.03] ring-2 ring-yellow-400 ring-offset-2 ring-offset-neutral-950" 
                        : "bg-neutral-900/60 border border-neutral-800 text-neutral-500 hover:bg-neutral-800 hover:border-neutral-700 backdrop-blur-sm"
                    }`}
                  >
                    {selectedPick === pick.id && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    <div className={`text-xs font-black tracking-widest uppercase mb-1 ${selectedPick === pick.id ? "text-black" : "text-white"}`}>
                      {pick.label}
                    </div>
                    <div className={`text-[9px] font-bold tracking-widest uppercase ${selectedPick === pick.id ? "text-black/70" : "text-neutral-600"}`}>
                      {pick.sub}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleJoinRumble}
                disabled={!selectedPick || isJoining}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black text-[15px] tracking-wide py-5 rounded-2xl hover:from-yellow-300 hover:to-yellow-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_10px_30px_rgba(250,204,21,0.2)]"
              >
                {isJoining ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg>
                    SECURING FUNDS...
                  </>
                ) : selectedPick ? `PLACE ₦${rumble.entry_fee.toLocaleString()} ENTRY` : "LOCK YOUR PREDICTION"}
              </button>
            </div>
          )}
        </div>
      </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </div>
  );
}