import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get current logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from("users")
    .select("username, wallet_balance, ball_iq_points")
    .eq("id", user.id)
    .single();

  // 3. Fetch all Duels involving this user (joining the usernames of opponents)
  const { data: rawDuels } = await supabase
    .from("duels")
    .select(`
      *,
      creator:creator_id(username),
      acceptor:acceptor_id(username),
      winner:winner_id(username)
    `)
    .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!profile) return <div>Error loading profile</div>;

  // 4. Transform Database Rows into Frontend Props
  const activeDuels: any[] = [];
  const pastDuels: any[] = [];

  rawDuels?.forEach((duel) => {
    const isCreator = duel.creator_id === user.id;
    
    // Figure out who the opponent is
    let opponentName = "Waiting for victim...";
    if (isCreator && duel.acceptor) opponentName = duel.acceptor.username;
    if (!isCreator && duel.creator) opponentName = duel.creator.username;

    // Figure out what side the user picked
    const myPick = isCreator ? duel.prediction_creator : duel.prediction_acceptor;

    const formattedDuel = {
      id: duel.id,
      opponent: opponentName,
      match: duel.match_id, // e.g., 'm_102' -> later you'll map this to real team names
      stake: duel.stake_amount,
      status: duel.status,
      myPick: myPick || "pending",
      time: new Date(duel.created_at).toLocaleDateString(), // Simple format
    };

    if (duel.status === "open" || duel.status === "active") {
      activeDuels.push(formattedDuel);
    } else if (duel.status === "settled") {
      const isWinner = duel.winner_id === user.id;
      pastDuels.push({
        ...formattedDuel,
        result: isWinner ? "won" : "lost",
        payout: isWinner ? (duel.stake_amount * 2 * 0.90) : 0, // 10% commission deducted
      });
    }
  });

  const userData = {
    username: profile.username,
    walletBalance: profile.wallet_balance,
    ballIqPoints: profile.ball_iq_points,
    rank: "Unranked", // You can calculate real rank via SQL later
  };

  // 5. Pass transformed data to the interactive Client UI
  return (
    <DashboardClient 
      userData={userData} 
      activeDuels={activeDuels} 
      pastDuels={pastDuels} 
    />
  );
}




// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// // Mock Data matching your Database Seed
// const USER_DATA = {
//   username: "Chinedu99",
//   walletBalance: 30000,
//   ballIqPoints: 350,
//   rank: "Top 3% this week",
// };

// const ACTIVE_DUELS = [
//   {
//     id: "f0000000-0000-0000-0000-000000000002",
//     opponent: "Emeka_G",
//     match: "MUN vs LIV",
//     stake: 10000,
//     status: "active",
//     myPick: "away", // Chinedu picked Away
//     time: "Today, 4:30 PM",
//   },
//   {
//     id: "f0000000-0000-0000-0000-000000000009",
//     opponent: "Waiting for victim...",
//     match: "ARS vs TOT",
//     stake: 5000,
//     status: "open",
//     myPick: "home",
//     time: "Tomorrow, 2:00 PM",
//   }
// ];

// const PAST_DUELS = [
//   {
//     id: "f0000000-0000-0000-0000-000000000003",
//     opponent: "Tunde",
//     match: "CHE vs MCI",
//     stake: 5000,
//     result: "won",
//     payout: 9000, // 10k pot minus 10%
//   }
// ];

// export default function DashboardPage() {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState<"active" | "history">("active");

//   return (
//     <div className="min-h-screen bg-neutral-950 text-white pb-24">
      
//       {/* Top Navbar */}
//       <div className="bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-4 py-4 sticky top-0 z-50 flex justify-between items-center">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 p-[2px]">
//             <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center font-black">
//               {USER_DATA.username.charAt(0)}
//             </div>
//           </div>
//           <div>
//             <div className="text-xs text-neutral-400 font-bold">Welcome back,</div>
//             <div className="font-black">@{USER_DATA.username}</div>
//           </div>
//         </div>
//         <button className="text-neutral-400 hover:text-white">
//           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
//         </button>
//       </div>

//       <div className="p-4 max-w-lg mx-auto space-y-6">
        
//         {/* The Vault Card */}
//         <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
//           <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
          
//           <div className="flex justify-between items-start mb-6 relative z-10">
//             <div>
//               <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-1">Total Balance</div>
//               <div className="text-4xl font-black text-white">₦{USER_DATA.walletBalance.toLocaleString()}</div>
//             </div>
            
//             {/* Ball IQ Status */}
//             <div className="text-right bg-neutral-950/50 border border-neutral-800 rounded-xl p-2 backdrop-blur-sm">
//               <div className="text-[10px] text-yellow-500 font-bold uppercase mb-0.5">Ball IQ</div>
//               <div className="text-lg font-black text-white">{USER_DATA.ballIqPoints} <span className="text-xs text-neutral-500 font-normal">pts</span></div>
//               <div className="text-[9px] text-neutral-400">{USER_DATA.rank}</div>
//             </div>
//           </div>

//           <div className="flex gap-3 relative z-10">
//             <button className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-all active:scale-95">
//               Deposit
//             </button>
//             <button className="flex-1 bg-neutral-800 text-white font-bold py-3 rounded-xl border border-neutral-700 hover:bg-neutral-700 transition-all active:scale-95">
//               Withdraw
//             </button>
//           </div>
//         </div>

//         {/* Custom Tabs */}
//         <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800">
//           <button 
//             onClick={() => setActiveTab("active")}
//             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "active" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500"}`}
//           >
//             Active Battles
//           </button>
//           <button 
//             onClick={() => setActiveTab("history")}
//             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "history" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500"}`}
//           >
//             Past Glory
//           </button>
//         </div>

//         {/* Tab Content */}
//         <div className="space-y-4">
          
//           {activeTab === "active" && ACTIVE_DUELS.map((duel) => (
//             <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
//               <div className="flex justify-between items-center mb-3">
//                 <div className="text-xs text-neutral-400 font-bold">{duel.time}</div>
//                 {duel.status === "open" ? (
//                   <div className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded uppercase font-black">Link Open</div>
//                 ) : (
//                   <div className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded uppercase font-black flex items-center gap-1">
//                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Escrow Locked
//                   </div>
//                 )}
//               </div>
              
//               <div className="flex justify-between items-center mb-4">
//                 <div>
//                   <div className="text-sm text-neutral-500 font-bold mb-1">Match</div>
//                   <div className="font-black text-lg">{duel.match}</div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-sm text-neutral-500 font-bold mb-1">Your Stake</div>
//                   <div className="font-black text-lg text-white">₦{duel.stake.toLocaleString()}</div>
//                 </div>
//               </div>

//               <div className="bg-neutral-950 rounded-xl p-3 flex justify-between items-center border border-neutral-800 text-sm">
//                 <div className="font-bold text-neutral-300">You Picked: <span className="text-white uppercase">{duel.myPick}</span></div>
//                 <div className="text-neutral-500 font-bold">vs</div>
//                 <div className="font-bold text-neutral-400 truncate max-w-[120px]">@{duel.opponent}</div>
//               </div>

//               {duel.status === "open" && (
//                 <button className="w-full mt-3 bg-neutral-800 text-white text-sm font-bold py-3 rounded-xl border border-neutral-700 hover:bg-neutral-700 transition-all">
//                   Copy Invite Link
//                 </button>
//               )}
//             </div>
//           ))}

//           {activeTab === "history" && PAST_DUELS.map((duel) => (
//             <div key={duel.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 relative overflow-hidden">
//               {duel.result === "won" && (
//                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl" />
//               )}
//               <div className="flex justify-between items-start mb-3 relative z-10">
//                 <div>
//                   <div className="text-xs text-neutral-400 font-bold mb-1">{duel.match}</div>
//                   <div className="font-black text-lg">vs @{duel.opponent}</div>
//                 </div>
//                 <div className="text-right">
//                   <div className={`text-[10px] border px-2 py-1 rounded uppercase font-black mb-1 inline-block ${
//                     duel.result === "won" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
//                   }`}>
//                     {duel.result === "won" ? "Victory" : "Cooked"}
//                   </div>
//                   <div className={`font-black text-lg ${duel.result === "won" ? "text-green-400" : "text-red-500"}`}>
//                     {duel.result === "won" ? "+" : "-"}₦{duel.result === "won" ? duel.payout.toLocaleString() : duel.stake.toLocaleString()}
//                   </div>
//                 </div>
//               </div>

//               {duel.result === "won" && (
//                 <button className="w-full mt-2 bg-green-500/10 text-green-500 border border-green-500/20 text-sm font-bold py-2.5 rounded-xl hover:bg-green-500/20 transition-all flex items-center justify-center gap-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
//                   Share Receipt
//                 </button>
//               )}
//             </div>
//           ))}

//           {activeTab === "active" && ACTIVE_DUELS.length === 0 && (
//             <div className="text-center py-10 text-neutral-500">
//               No active battles. Go start a war.
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Floating Action Button (Sticky Bottom) */}
//       <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent">
//         <Link href="/duel/create" className="w-full max-w-lg mx-auto block">
//           <button className="w-full bg-green-500 text-black font-black text-lg py-4 rounded-xl hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-[0.98]">
//             CREATE NEW DUEL +
//           </button>
//         </Link>
//       </div>

//     </div>
//   );
// }