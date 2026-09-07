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

  // 2. Fetch their profile to verify they are actually a VIP partner
  const { data: profile } = await supabase
    .from("users")
    .select("username, is_partner")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_partner) {
    // If they aren't a partner, kick them back to the main dashboard
    redirect("/dashboard?error=unauthorized_partner");
  }

  // 3. Fetch their custom vanity invite details
  const { data: invite } = await supabase
    .from("partner_invites")
    .select("vanity_code, group_name")
    .eq("used_by", user.id)
    .single();

  // Construct the secure real data object to pass to the client
  // Note: For now, we seed it with placeholder stats so the UI looks alive.
  // As your database scales, you will replace the 0s below with SQL SUM() queries.
  const adminStats = {
    adminName: profile.username || "Admin",
    groupName: invite?.group_name || `${profile.username}'s VIP Hub`,
    totalVolume: 1250000,     // TODO: SUM(duels.stake) where referred_by = user.id
    commissionEarned: 31250,  // TODO: SUM(partner_commissions)
    activeDuels: 14,          // TODO: COUNT(duels)
    completedDuels: 142,      // TODO: COUNT(duels)
    referralCode: `bantr.lol/join/${invite?.vanity_code || user.id.substring(0,8)}`,
  };

  // Mock recent activity until you create a dedicated table for affiliate feeds
  const recentActivity = [
    { id: 1, users: "Tunde vs Seyi", match: "ARS vs TOT", stake: 10000, time: "2 mins ago", cut: 250 },
    { id: 2, users: "Obi vs Chinedu", match: "MUN vs LIV", stake: 5000, time: "15 mins ago", cut: 125 },
    { id: 3, users: "Femi vs David", match: "CHE vs MCI", stake: 2000, time: "1 hour ago", cut: 50 },
  ];

  return (
    <PartnerHubClient 
      adminStats={adminStats} 
      recentActivity={recentActivity} 
    />
  );
}