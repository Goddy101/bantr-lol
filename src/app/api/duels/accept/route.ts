import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { duel_id, prediction } = await req.json(); // <-- Grab prediction
    if (!duel_id || !prediction) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const { error } = await supabaseAdmin.rpc('accept_duel', {
      p_user_id: user.id,
      p_duel_id: duel_id,
      p_prediction: prediction // <-- Pass prediction to SQL
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}