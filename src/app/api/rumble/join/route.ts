import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    // 1. Authenticate the user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { rumble_id, prediction } = body;

    if (!rumble_id || !prediction) {
      return NextResponse.json({ success: false, error: 'Missing rumble_id or prediction.' }, { status: 400 });
    }

    if (!['home', 'away', 'draw'].includes(prediction)) {
      return NextResponse.json({ success: false, error: 'Invalid prediction type.' }, { status: 400 });
    }

    // 2. Execute the Atomic Join RPC
    // This SQL function automatically handles the lock time check, balance check, fee deduction, and pot increment!
    const { error: dbError } = await supabaseAdmin.rpc('join_rumble', {
      p_user_id: user.id,
      p_rumble_id: rumble_id,
      p_prediction: prediction
    });

    if (dbError) {
      // Catch specific errors thrown by our SQL RAISE EXCEPTION commands
      console.error('Database Error:', dbError.message);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Successfully joined the Rumble!' }, { status: 200 });

  } catch (error: any) {
    console.error('Join Rumble Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}