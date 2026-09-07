import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; // 🚨 IMPORT THE ADMIN BYPASS
import { notFound, redirect } from "next/navigation";
import RumbleClientUI from "./RumbleClientUI";

export default async function RumblePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. We still use the normal client to securely verify WHO is viewing the page
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. THE BYPASS: We use supabaseAdmin to fetch the Rumble Pool so RLS cannot block us
  const { data: rumble, error: rumbleError } = await supabaseAdmin
    .from("rumble_pools")
    .select("*")
    .eq("id", id)
    .single();

  if (rumbleError || !rumble) {
    console.error("Rumble Fetch Error:", rumbleError?.message);
    notFound();
  }

  // 3. THE BYPASS: Fetch the Participants securely
  const { data: participants } = await supabaseAdmin
    .from("rumble_participants")
    .select("prediction, users(username)")
    .eq("rumble_id", id)
    .order("joined_at", { ascending: true });

  let userBalance = 0;
  let hasJoined = false;

  // 4. THE BYPASS: Check participant record and wallet balance
  const { data: participantRecord } = await supabaseAdmin
    .from("rumble_participants")
    .select("id")
    .eq("rumble_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
      
  if (participantRecord) hasJoined = true;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("wallet_balance")
    .eq("id", user.id)
    .maybeSingle();
      
  if (profile) userBalance = profile.wallet_balance || 0;

  return (
    <RumbleClientUI 
      rumble={rumble}
      participants={participants || []}
      currentUserId={user.id}
      hasJoined={hasJoined}
      userBalance={userBalance}
    />
  );
}