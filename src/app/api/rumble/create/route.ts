import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; // 🚨 IMPORT THE ADMIN KEY!

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
      return NextResponse.json({ success: false, error: "Invalid inputs. Minimum entry is ₦500." });
    }

    const locks_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // 3. THE FIX: Use supabaseAdmin to bypass RLS and force the database to create the pool!
    const { data: rumble, error: rumbleError } = await supabaseAdmin
      .from("rumble_pools")
      .insert({
        creator_id: user.id,
        match_id: match_id,
        match_name: match_name,
        entry_fee: Number(entry_fee),
        locks_at: locks_at
      })
      .select("id")
      .single();

    if (rumbleError || !rumble) {
      return NextResponse.json({ success: false, error: rumbleError?.message || "Failed to create Rumble" });
    }

    // 4. Call the RPC to automatically join the creator
    // We use supabaseAdmin here too just in case your RPC also has RLS blocks!
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('join_rumble', {
      p_user_id: user.id,
      p_rumble_id: rumble.id,
      p_prediction: prediction
    });

    if (rpcError || !rpcData.success) {
       // Refund/Delete logic if wallet deduct fails
       await supabaseAdmin.from("rumble_pools").delete().eq("id", rumble.id);
       return NextResponse.json({ success: false, error: rpcData?.error || "Insufficient funds to create Rumble." });
    }

    // Success! Return the ID
    return NextResponse.json({ success: true, rumbleId: rumble.id });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Network error. Please try again." });
  }
}