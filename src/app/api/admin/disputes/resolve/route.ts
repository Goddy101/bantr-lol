import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 1. SECURITY: Ensure user is logged in
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. SECURITY: Verify Admin Privileges via Database
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    // 3. PARSE & VALIDATE PAYLOAD
    const { matchId, action, winnerId } = await req.json();

    if (!matchId || !action) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (action === 'award' && !winnerId) {
      return NextResponse.json({ error: 'A winnerId is required to award the pot.' }, { status: 400 });
    }

    // 4. EXECUTE THE ATOMIC SQL RPC
    const { data, error: rpcError } = await supabaseAdmin.rpc('admin_resolve_dispute', {
      p_match_id: matchId,
      p_action: action,
      p_winner_id: winnerId || null // Pass null if refunding
    });

    if (rpcError) {
      console.error('RPC Dispute Resolution Error:', rpcError);
      return NextResponse.json({ error: rpcError.message || 'Failed to resolve dispute.' }, { status: 400 });
    }

    // 5. SUCCESS
    return NextResponse.json({ 
      success: true, 
      message: data?.message || 'Dispute resolved successfully.' 
    });

  } catch (error: any) {
    console.error('Dispute API Route Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}