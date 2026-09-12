import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PartnerHubClient from "./PartnerHubClient";

export default async function PartnerHubPage() {
  const supabase = await createClient();
  
  // 1. Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Verify VIP Partner Status
  const { data: profile } = await supabase
    .from("users")
    .select("username, is_partner")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_partner) {
    redirect("/dashboard?error=unauthorized_partner");
  }

  // 3. Fetch Vanity Invite Details
  const { data: invite } = await supabase
    .from("partner_invites")
    .select("vanity_code, group_name")
    .eq("used_by", user.id)
    .single();

  // --- 🔴 THE LIVE DATA ENGINE ---

  // A. Find everyone this partner referred
  const { data: referredUsers } = await supabase
    .from("users")
    .select("id")
    .eq("referred_by_admin", user.id);

  const referredIds = referredUsers?.map(u => u.id) || [];

  // B. Fetch all commission earnings for this partner
  const { data: commissions } = await supabase
    .from("transactions")
    .select("id, amount, created_at, reference")
    .eq("user_id", user.id)
    .eq("type", "affiliate_commission")
    .order("created_at", { ascending: false });

  // Sum up their total historical earnings
  const commissionEarned = commissions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

  // C. Fetch Duel Stats for their referrals
  let activeDuelsCount = 0;
  let completedDuelsCount = 0;
  let totalVolume = 0;

  if (referredIds.length > 0) {
    // Format array for Supabase .or() syntax: (id1,id2,id3)
  //  const idsString = `(${referredIds.join(',')})`;
  // Wraps each UUID in double quotes so PostgREST parses them perfectly
const idsString = `(${referredIds.map(id => `"${id}"`).join(',')})`;

    // Count open/active duels
    const { count: activeCount } = await supabase
      .from("duels")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "active"])
      .or(`creator_id.in.${idsString},acceptor_id.in.${idsString}`);
    
    activeDuelsCount = activeCount || 0;

    // Fetch settled duels to calculate total volume
    const { data: settledDuels } = await supabase
      .from("duels")
      .select("stake_amount")
      .eq("status", "settled")
      .or(`creator_id.in.${idsString},acceptor_id.in.${idsString}`);

    completedDuelsCount = settledDuels?.length || 0;
    // Volume = The total pot size (stake * 2) of every completed game their referrals played
    totalVolume = settledDuels?.reduce((sum, d) => sum + (d.stake_amount * 2), 0) || 0;
  }

  // D. Build the Secure Stats Object
  const adminStats = {
    adminName: profile.username || "Admin",
    groupName: invite?.group_name || `${profile.username}'s VIP Hub`,
    totalVolume: totalVolume, 
    commissionEarned: commissionEarned, 
    activeDuels: activeDuelsCount, 
    completedDuels: completedDuelsCount, 
    referralCode: `bantr.lol/join/${invite?.vanity_code || user.id.substring(0,8)}`,
  };

  // E. Transform recent commissions into the Activity Feed UI
  // We grab the last 5 commission payouts
  const topCommissions = commissions?.slice(0, 5) || [];
  
  const recentActivity = await Promise.all(topCommissions.map(async (tx) => {
    // Our reference format from SQL is: aff_comm_{duel_id}_{user_id}_{epoch}
    const parts = tx.reference.split('_');
    const duelId = parts[2];
    
    let matchName = "Bantr Rumble/Duel";
    
    // Optionally fetch the match name if it was a duel
    if (duelId && duelId.length === 36) { // basic UUID check
      const { data: duelData } = await supabase
        .from("duels")
        .select("match_id")
        .eq("id", duelId)
        .maybeSingle();
      if (duelData) matchName = duelData.match_id;
    }

    return {
      id: tx.id,
      users: "VIP Referral Win", 
      match: matchName,
      // If the partner took a 2.5% cut, the total pot was (cut / 0.025)
      stake: tx.amount * 40, 
      time: new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      cut: tx.amount
    };
  }));

  return (
    <PartnerHubClient 
      adminStats={adminStats} 
      recentActivity={recentActivity} 
    />
  );
}