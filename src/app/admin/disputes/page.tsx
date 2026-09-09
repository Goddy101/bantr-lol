// src/app/admin/disputes/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDisputesClient from "./AdminDisputesClient";

export default async function AdminDisputesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. SECURITY: Admin Check
  if (!user) redirect("/login");
  
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) redirect("/");

  // 2. FETCH DISPUTED MATCHES
  const { data: disputedMatches, error } = await supabaseAdmin
    .from("matches")
    .select(`
      id,
      stake_amount,
      status,
      created_at,
      creator:creator_id ( id, username ),
      joiner:joiner_id ( id, username )
    `)
    .eq("status", "disputed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching disputes:", error);
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Dispute Resolution</h1>
          <p className="text-neutral-500 font-bold mt-1">Review flagged matches and release escrowed funds.</p>
        </div>

        <AdminDisputesClient initialMatches={disputedMatches || []} />
      </div>
    </div>
  );
}