import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RumbleClientUI from "./RumbleClientUI";

export default async function RumblePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // 1. Fetch the Rumble Pool
  const { data: rumble, error: rumbleError } = await supabase
    .from("rumble_pools")
    .select("*")
    .eq("id", params.id)
    .single();

  if (rumbleError || !rumble) {
    notFound();
  }

  // 2. Fetch the Participants (and join with the users table to get usernames)
  const { data: participants } = await supabase
    .from("rumble_participants")
    .select("prediction, users(username)")
    .eq("rumble_id", params.id)
    .order("joined_at", { ascending: true });

  // 3. Get Auth State
  const { data: { user } } = await supabase.auth.getUser();
  let userBalance = 0;
  let hasJoined = false;

  if (user) {
    // Check if they already joined
    const { data: participantRecord } = await supabase
      .from("rumble_participants")
      .select("id")
      .eq("rumble_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (participantRecord) hasJoined = true;

    // Get their current balance for the Client Zero-Balance guard
    const { data: profile } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();
      
    if (profile) userBalance = profile.wallet_balance || 0;
  }

  return (
    <RumbleClientUI 
      rumble={rumble}
      participants={participants || []}
      currentUserId={user?.id || null}
      hasJoined={hasJoined}
      userBalance={userBalance}
    />
  );
}