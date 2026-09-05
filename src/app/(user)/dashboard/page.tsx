import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // 1. Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch their profile data safely
  const { data: profile } = await supabase
    .from("users")
    .select("username, wallet_balance, ball_iq_points")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // 3. Construct the userData object - WITH THE ID INCLUDED (This fixes the build error!)
  const userData = {
    id: user.id, 
    username: profile.username || "Unknown",
    walletBalance: profile.wallet_balance || 0,
    ballIqPoints: profile.ball_iq_points || 0,
    rank: (profile.ball_iq_points || 0) > 500 ? "Odogwu" : "Rookie", 
  };

  // 4. Fetch Active Duels (open or active)
  const { data: activeDuels } = await supabase
    .from("duels")
    .select("*")
    .in("status", ["open", "active"])
    .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

  // 5. Fetch Past Duels (settled or cancelled)
  const { data: pastDuels } = await supabase
    .from("duels")
    .select("*")
    .in("status", ["settled", "cancelled"])
    .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

  return (
    <DashboardClient 
      userData={userData} 
      activeDuels={activeDuels || []} 
      pastDuels={pastDuels || []} 
    />
  );
}