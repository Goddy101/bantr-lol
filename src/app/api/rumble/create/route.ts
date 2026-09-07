import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { match_name, entry_fee, locks_at, prediction } = body;

    // 1. Basic Validation
    if (!match_name || entry_fee < 500 || !locks_at || !prediction) {
      return NextResponse.json({ success: false, error: "Invalid inputs. Minimum entry is ₦500." });
    }

    // 2. Insert the empty Rumble Pool
    const { data: rumble, error: rumbleError } = await supabase
      .from("rumble_pools")
      .insert({
        creator_id: user.id,
        match_name: match_name,
        entry_fee: Number(entry_fee),
        locks_at: locks_at
      })
      .select("id")
      .single();

    if (rumbleError || !rumble) {
      return NextResponse.json({ success: false, error: rumbleError?.message || "Failed to create Rumble" });
    }

    // 3. The Magic: Call the RPC to automatically join the creator to their own Rumble
    const { data: rpcData, error: rpcError } = await supabase.rpc('join_rumble', {
      p_user_id: user.id,
      p_rumble_id: rumble.id,
      p_prediction: prediction
    });

    if (rpcError || !rpcData.success) {
       // If their wallet deduct fails (e.g. insufficient funds), delete the empty pool so it doesn't clutter the DB
       await supabase.from("rumble_pools").delete().eq("id", rumble.id);
       return NextResponse.json({ success: false, error: rpcData?.error || "Insufficient funds to create Rumble." });
    }

    // Success! Return the new ID so the UI can teleport them there
    return NextResponse.json({ success: true, rumble_id: rumble.id });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Network error. Please try again." });
  }
}