// src/app/admin/withdrawals/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminWithdrawalClient from "./AdminWithdrawalClient";

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. SECURITY: Ensure the user is logged in
  if (!user) {
    redirect("/login");
  }

  // 2. SECURITY: Check if this specific user has the admin flag set to TRUE
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) {
    redirect("/"); // Instantly bounce unauthorized users back to the main app
  }

  // 3. FETCH DATA: Get all pending withdrawals with user details
  const { data: withdrawals, error } = await supabaseAdmin
    .from("withdrawals")
    .select(`
      id, 
      amount, 
      fee, 
      status, 
      created_at, 
      bank_details,
      user_id,
      users ( username, wallet_balance )
    `)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching withdrawals:", error);
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center</h1>
          <p className="text-neutral-500 font-bold mt-1">Review and approve pending payouts.</p>
        </div>

        {/* 4. PASS DATA TO THE INTERACTIVE CLIENT COMPONENT */}
        <AdminWithdrawalClient initialWithdrawals={withdrawals || []} />
      </div>
    </div>
  );
}