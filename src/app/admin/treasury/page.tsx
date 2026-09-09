// src/app/admin/treasury/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TreasuryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. SECURE THE ROUTE
  if (!user) redirect("/login");
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) redirect("/");

  // 2. FETCH PLATFORM METRICS
  // In a production app, you might aggregate this via an SQL RPC call for performance, 
  // but we can query the core tables here for the dashboard.
  
  // Get all users
  const { count: totalUsers } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get sum of all platform fees collected (the 10% vig)
  const { data: feeData } = await supabaseAdmin
    .from("transactions")
    .select("amount")
    .eq("type", "platform_fee")
    .eq("status", "completed");

  const totalRevenue = feeData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  // Get active escrow (money currently locked in pending duels)
  const { data: activeDuels } = await supabaseAdmin
    .from("matches")
    .select("stake_amount")
    .eq("status", "in_progress");

  // Escrow = stake_amount * 2 (since both players put it in)
  const totalEscrow = activeDuels?.reduce((acc, curr) => acc + (Number(curr.stake_amount) * 2), 0) || 0;

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Treasury & Ops</h1>
          <p className="text-neutral-500 font-bold mt-1">Monitor platform liquidity and revenue.</p>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500 text-6xl font-black">₦</div>
            <h3 className="text-neutral-500 font-bold text-xs uppercase tracking-widest mb-2">Total Vig Collected</h3>
            <div className="text-4xl font-black text-white">
              ₦{totalRevenue.toLocaleString()}
            </div>
            <div className="mt-4 text-xs font-bold text-green-500 bg-green-500/10 inline-block px-2 py-1 rounded">
              Goal: ₦30M / month
            </div>
          </div>

          {/* Escrow Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h3 className="text-neutral-500 font-bold text-xs uppercase tracking-widest mb-2">Active Escrow Locked</h3>
            <div className="text-4xl font-black text-yellow-500">
              ₦{totalEscrow.toLocaleString()}
            </div>
            <div className="mt-4 text-xs font-bold text-neutral-500">
              Funds currently in active Rumbles
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h3 className="text-neutral-500 font-bold text-xs uppercase tracking-widest mb-2">Registered Users</h3>
            <div className="text-4xl font-black text-white">
              {totalUsers?.toLocaleString() || 0}
            </div>
            <div className="mt-4 text-xs font-bold text-blue-500 bg-blue-500/10 inline-block px-2 py-1 rounded">
              Active Accounts
            </div>
          </div>
        </div>

        {/* USER MANAGEMENT SECTION */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-white">User Search & Management</h2>
            <input 
              type="text" 
              placeholder="Search by username or ID..." 
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 w-64"
            />
          </div>
          
          <div className="text-center py-12 text-neutral-600 font-bold text-sm border-2 border-dashed border-neutral-800 rounded-2xl">
            Search for a user to view their wallet balance, match history, or freeze their account.
          </div>
        </div>

      </div>
    </div>
  );
}