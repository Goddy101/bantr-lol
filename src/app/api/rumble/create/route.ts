import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; // Using Admin to bypass RLS securely on the server

export async function POST(req: Request) {
  try {
    // 1. Verify the user normally (Securely checks their cookies)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { match_id, match_name, entry_fee, prediction } = body;

    // 2. Basic Validation
    if (!match_id || !match_name || entry_fee < 500 || !prediction) {
      return NextResponse.json({ success: false, error: "Invalid inputs. Minimum entry is ₦500." }, { status: 400 });
    }

    // 3. FETCH REAL KICKOFF TIME
    const apiResponse = await fetch(`https://api.football-data.org/v4/matches/${match_id}`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || '' },
      cache: 'no-store' // Never cache this!
    });

    if (!apiResponse.ok) {
      return NextResponse.json({ success: false, error: "Could not verify live match details." }, { status: 400 });
    }

    const fixture = await apiResponse.json();
    
    if (['IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'CANCELLED'].includes(fixture.status)) {
      return NextResponse.json({ success: false, error: "This match is no longer available for predictions." }, { status: 400 });
    }

    // 4. CALCULATE DYNAMIC LOCK TIME (Kickoff minus 5 minutes)
    const kickoffTime = new Date(fixture.utcDate);
    const locksAt = new Date(kickoffTime.getTime() - 5 * 60 * 1000);
    const now = new Date();

    if (now >= locksAt) {
      return NextResponse.json({ success: false, error: "Too late! Rumbles lock 5 minutes before kickoff." }, { status: 400 });
    }

    // 5. THE ATOMIC FIX: Use the create_rumble RPC
    // This locks the user row, deducts money, creates the pool, and adds the participant all at once.
    // If they don't have enough money, the DB rejects it instantly—no need for manual .delete() rollbacks!
    const { data: rumbleId, error: dbError } = await supabaseAdmin.rpc('create_rumble', {
      p_creator_id: user.id,
      p_match_id: match_id.toString(),
      p_match_name: match_name,
      p_entry_fee: Number(entry_fee),
      p_prediction: prediction,
      p_locks_at: locksAt.toISOString()
    });

    if (dbError) {
      // The SQL function uses RAISE EXCEPTION for insufficient funds, which we catch here
      console.error("Database Error:", dbError.message);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 400 });
    }

    // Success! Return the newly created ID
    return NextResponse.json({ success: true, rumbleId: rumbleId });

  } catch (error: any) {
    console.error("Rumble Create Error:", error.message);
    return NextResponse.json({ success: false, error: "Network error. Please try again." }, { status: 500 });
  }
}




// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";
// import { supabaseAdmin } from "@/lib/supabase/admin"; // Using Admin to bypass RLS securely on the server

// export async function POST(req: Request) {
//   try {
//     // 1. Verify the user normally (Securely checks their cookies)
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { match_id, match_name, entry_fee, prediction } = body;

//     // 2. Basic Validation
//     if (!match_id || !match_name || entry_fee < 500 || !prediction) {
//       return NextResponse.json({ success: false, error: "Invalid inputs. Minimum entry is ₦500." }, { status: 400 });
//     }

//     // 3. FETCH REAL KICKOFF TIME
//     const apiResponse = await fetch(`https://api.football-data.org/v4/matches/${match_id}`, {
//       headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || '' },
//       cache: 'no-store' // Never cache this!
//     });

//     if (!apiResponse.ok) {
//       return NextResponse.json({ success: false, error: "Could not verify live match details." }, { status: 400 });
//     }

//     const fixture = await apiResponse.json();
    
//     if (['IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'CANCELLED'].includes(fixture.status)) {
//       return NextResponse.json({ success: false, error: "This match is no longer available for predictions." }, { status: 400 });
//     }

//     // 4. CALCULATE DYNAMIC LOCK TIME (Kickoff minus 5 minutes)
//     const kickoffTime = new Date(fixture.utcDate);
//     const locksAt = new Date(kickoffTime.getTime() - 5 * 60 * 1000);
//     const now = new Date();

//     if (now >= locksAt) {
//       return NextResponse.json({ success: false, error: "Too late! Rumbles lock 5 minutes before kickoff." }, { status: 400 });
//     }

//     // 5. THE ATOMIC FIX: Use the create_rumble RPC
//     // This locks the user row, deducts money, creates the pool, and adds the participant all at once.
//     // If they don't have enough money, the DB rejects it instantly—no need for manual .delete() rollbacks!
//     const { data: rumbleId, error: dbError } = await supabaseAdmin.rpc('create_rumble', {
//       p_creator_id: user.id,
//       p_match_id: match_id.toString(),
//       p_match_name: match_name,
//       p_entry_fee: Number(entry_fee),
//       p_prediction: prediction,
//       p_locks_at: locksAt.toISOString()
//     });

//     if (dbError) {
//       // The SQL function uses RAISE EXCEPTION for insufficient funds, which we catch here
//       console.error("Database Error:", dbError.message);
//       return NextResponse.json({ success: false, error: dbError.message }, { status: 400 });
//     }

//     // Success! Return the newly created ID
//     return NextResponse.json({ success: true, rumbleId: rumbleId });

//   } catch (error: any) {
//     console.error("Rumble Create Error:", error.message);
//     return NextResponse.json({ success: false, error: "Network error. Please try again." }, { status: 500 });
//   }
// }