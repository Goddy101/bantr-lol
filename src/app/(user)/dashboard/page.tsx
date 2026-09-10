import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; 
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // 1. Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  console.log("🔑 LOGGED-IN AUTH USER ID:", user.id);

  // 2. Fetch profile using supabaseAdmin (Bypasses RLS issues on the server)
  let { data: profile } = await supabaseAdmin
    .from("users")
    .select("username, wallet_balance, unwagered_balance, ball_iq_points, is_partner")
    .eq("id", user.id)
    .maybeSingle();

  // 3. SAFE AUTO-HEALER (Only creates if completely non-existent)
  if (!profile) {
    console.log("🚨 DASHBOARD: Profile truly missing! Creating fresh profile...");
    
    const safeUsername = user.email 
      ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, "") 
      : `player_${Math.floor(Math.random() * 10000)}`;

    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        username: safeUsername,
        wallet_balance: 0,
        unwagered_balance: 0, 
        ball_iq_points: 0,
        is_partner: false
      })
      .select("username, wallet_balance, unwagered_balance, ball_iq_points, is_partner")
      .single();

    if (insertError) {
      console.error("❌ FATAL ERROR CREATING PROFILE:", insertError.message);
      redirect("/login"); 
    } else {
      profile = newProfile;
    }
  }

  console.log("💰 LIVE SERVER BALANCE:", profile?.wallet_balance);

  // 4. Construct the userData object
  const userData = {
    id: user.id, 
    username: profile.username || "Unknown",
    walletBalance: profile.wallet_balance || 0,
    unwageredBalance: profile.unwagered_balance || 0,
    ballIqPoints: profile.ball_iq_points || 0,
    isPartner: profile.is_partner || false,
    rank: (profile.ball_iq_points || 0) > 500 ? "Odogwu" : "Rookie", 
  };

  // 5. Fetch Active Duels
  const { data: activeDuels } = await supabaseAdmin
    .from("duels")
    .select("*")
    .in("status", ["open", "active"])
    .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

  // 6. Fetch Past Duels
  const { data: pastDuels } = await supabaseAdmin
    .from("duels")
    .select("*")
    .in("status", ["settled", "cancelled"])
    .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

  // 7. Generate Daily Roast
  const ROASTS = [
    "Put your money where your mouth is. Or keep quiet.",
    "Football is not played on paper, and clearly not in your head either.",
    "Talk is cheap. Escrow keeps receipts.",
    "You're one bad prediction away from dropping to Rookie.",
    "That ₦5,000 stake is looking real shaky right now."
  ];
  const selectedRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

  // 8. Fetch Sponsor
  const { data: activeSponsor } = await supabaseAdmin
    .from("sponsors")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <DashboardClient 
      userData={userData} 
      activeDuels={activeDuels || []} 
      pastDuels={pastDuels || []} 
      dailyRoast={selectedRoast}
      sponsor={activeSponsor}
    />
  );
}






// import { createClient } from "@/lib/supabase/server";
// import { supabaseAdmin } from "@/lib/supabase/admin"; 
// import DashboardClient from "./DashboardClient";
// import { redirect } from "next/navigation";
// export const dynamic = "force-dynamic";

// export default async function DashboardPage() {
//   const supabase = await createClient();
  
//   // 1. Get the authenticated user
//   const { data: { user }, error: authError } = await supabase.auth.getUser();

//   if (authError || !user) {
//     redirect("/login");
//   }

//   // 2. Fetch their profile data safely (NOW INCLUDES is_partner)
//   let { data: profile } = await supabase
//     .from("users")
//     .select("username, wallet_balance, unwagered_balance, ball_iq_points, is_partner")
//     .eq("id", user.id)
//     .maybeSingle();

//   // 3. THE AUTO-HEALER (Fixed with upsert)
//   if (!profile) {
//     console.log("🚨 DASHBOARD: Profile missing! Auto-healing now...");
    
//     const safeUsername = user.email 
//       ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, "") 
//       : `player_${Math.floor(Math.random() * 10000)}`;

//     const { data: healedProfile, error: upsertError } = await supabaseAdmin
//       .from("users")
//       .upsert({
//         id: user.id,
//         email: user.email, // Best practice to include email during creation
//         username: safeUsername,
//         wallet_balance: 0,
//         unwagered_balance: 0, 
//         ball_iq_points: 0,
//         is_partner: false
//       }, {
//         onConflict: 'id', // This prevents the duplicate key crash!
//       })
//       .select("username, wallet_balance, unwagered_balance, ball_iq_points, is_partner")
//       .single();

//     if (upsertError) {
//       console.error("❌ FATAL ERROR HEALING PROFILE:", upsertError.message);
//       redirect("/login"); 
//     } else {
//       profile = healedProfile;
//       console.log("✅ DASHBOARD: Profile successfully healed! Letting them in.");
//     }
//   }

//   // 4. Construct the userData object
//   const userData = {
//     id: user.id, 
//     username: profile.username || "Unknown",
//     walletBalance: profile.wallet_balance || 0,
//     unwageredBalance: profile.unwagered_balance || 0,
//     ballIqPoints: profile.ball_iq_points || 0,
//     isPartner: profile.is_partner || false,
//     rank: (profile.ball_iq_points || 0) > 500 ? "Odogwu" : "Rookie", 
//   };

//   // 5. Fetch Active Duels
//   const { data: activeDuels } = await supabase
//     .from("duels")
//     .select("*")
//     .in("status", ["open", "active"])
//     .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

//   // 6. Fetch Past Duels
//   const { data: pastDuels } = await supabase
//     .from("duels")
//     .select("*")
//     .in("status", ["settled", "cancelled"])
//     .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

//   // 7. Generate the Daily Roast
//   const ROASTS = [
//     "Put your money where your mouth is. Or keep quiet.",
//     "Football is not played on paper, and clearly not in your head either.",
//     "Talk is cheap. Escrow keeps receipts.",
//     "You're one bad prediction away from dropping to Rookie.",
//     "That ₦5,000 stake is looking real shaky right now."
//   ];
//   const selectedRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

//   // 8. Fetch the currently active sponsor
//   const { data: activeSponsor } = await supabase
//     .from("sponsors")
//     .select("*")
//     .eq("is_active", true)
//     .maybeSingle();


//   console.log("SERVER DB CHECK:", profile.wallet_balance);  

//   return (
//     <DashboardClient 
//       userData={userData} 
//       activeDuels={activeDuels || []} 
//       pastDuels={pastDuels || []} 
//       dailyRoast={selectedRoast}
//       sponsor={activeSponsor}
//     />
//   );
// }








// import { createClient } from "@/lib/supabase/server";
// import { supabaseAdmin } from "@/lib/supabase/admin"; 
// import DashboardClient from "./DashboardClient";
// import { redirect } from "next/navigation";

// export default async function DashboardPage() {
//   const supabase = await createClient();
  
//   // 1. Get the authenticated user
//   const { data: { user }, error: authError } = await supabase.auth.getUser();

//   if (authError || !user) {
//     redirect("/login");
//   }

//   // 2. Fetch their profile data safely (NOW INCLUDES is_partner)
//   let { data: profile } = await supabase
//     .from("users")
//     .select("username, wallet_balance, unwagered_balance, ball_iq_points, is_partner")
//     .eq("id", user.id)
//     .maybeSingle();

//   // 3. THE AUTO-HEALER
//   if (!profile) {
//     console.log("🚨 DASHBOARD: Profile missing! Auto-healing now...");
    
//     const safeUsername = user.email 
//       ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, "") 
//       : `player_${Math.floor(Math.random() * 10000)}`;

//     const { data: newProfile, error: insertError } = await supabaseAdmin
//       .from("users")
//       .insert({
//         id: user.id,
//         username: safeUsername,
//         wallet_balance: 0,
//         unwagered_balance: 0, 
//         ball_iq_points: 0,
//         is_partner: false // Defaults to false for brand new users
//       })
//       .select("username, wallet_balance, unwagered_balance, ball_iq_points, is_partner")
//       .single();

//     if (insertError) {
//       console.error("❌ FATAL ERROR CREATING PROFILE:", insertError.message);
//       redirect("/login"); 
//     } else {
//       profile = newProfile;
//       console.log("✅ DASHBOARD: Profile successfully healed! Letting them in.");
//     }
//   }

//   // 4. Construct the userData object
//   const userData = {
//     id: user.id, 
//     username: profile.username || "Unknown",
//     walletBalance: profile.wallet_balance || 0,
//     unwageredBalance: profile.unwagered_balance || 0,
//     ballIqPoints: profile.ball_iq_points || 0,
//     // 🚨 FETCHED FROM DATABASE NOW
//     isPartner: profile.is_partner || false,
//     rank: (profile.ball_iq_points || 0) > 500 ? "Odogwu" : "Rookie", 
//   };

//   // 5. Fetch Active Duels
//   const { data: activeDuels } = await supabase
//     .from("duels")
//     .select("*")
//     .in("status", ["open", "active"])
//     .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

//   // 6. Fetch Past Duels
//   const { data: pastDuels } = await supabase
//     .from("duels")
//     .select("*")
//     .in("status", ["settled", "cancelled"])
//     .or(`creator_id.eq.${user.id},acceptor_id.eq.${user.id}`);

//   // 7. Generate the Daily Roast
//   const ROASTS = [
//     "Put your money where your mouth is. Or keep quiet.",
//     "Football is not played on paper, and clearly not in your head either.",
//     "Talk is cheap. Escrow keeps receipts.",
//     "You're one bad prediction away from dropping to Rookie.",
//     "That ₦5,000 stake is looking real shaky right now."
//   ];
//   const selectedRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

//   // 8. Fetch the currently active sponsor
//   const { data: activeSponsor } = await supabase
//     .from("sponsors")
//     .select("*")
//     .eq("is_active", true)
//     .maybeSingle();

//   return (
//     <DashboardClient 
//       userData={userData} 
//       activeDuels={activeDuels || []} 
//       pastDuels={pastDuels || []} 
//       dailyRoast={selectedRoast}
//       sponsor={activeSponsor}
//     />
//   );
// }