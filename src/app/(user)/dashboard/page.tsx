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
    .select("username, wallet_balance, ball_iq_points, is_partner")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // 3. Construct the userData object - WITH THE ID INCLUDED
  const userData = {
    id: user.id, 
    username: profile.username || "Unknown",
    walletBalance: profile.wallet_balance || 0,
    ballIqPoints: profile.ball_iq_points || 0,
    isPartner: profile.is_partner || false,
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

  // 6. Generate the Daily Roast on the SERVER to prevent hydration mismatches
  const ROASTS = [
    "Put your money where your mouth is. Or keep quiet.",
    "Football is not played on paper, and clearly not in your head either.",
    "Talk is cheap. Escrow keeps receipts.",
    "You're one bad prediction away from dropping to Rookie.",
    "That ₦5,000 stake is looking real shaky right now."
  ];
  const selectedRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

  return (
    <DashboardClient 
      userData={userData} 
      activeDuels={activeDuels || []} 
      pastDuels={pastDuels || []} 
      dailyRoast={selectedRoast} // <-- Handed to the client safely!
    />
  );
}