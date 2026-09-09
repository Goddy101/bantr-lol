import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 1. SECURITY: Ensure the user is logged in AND is an admin
    const ADMIN_EMAILS = ['your_email@example.com']; // Replace with your actual admin email
    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { reference, freezeAccount, reason } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });
    }

    // 2. FETCH THE TRANSACTION
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Ensure we are only rejecting transactions that are actually under review
    if (transaction.status !== 'pending_review') {
      return NextResponse.json({ 
        error: `Cannot reject transaction. Current status is ${transaction.status}` 
      }, { status: 400 });
    }

    // 3. REJECT THE WITHDRAWAL (Roll the money back into their wallet)
    // We use our existing resolve_withdrawal RPC to keep the ledger math perfect
    const { error: resolveError } = await supabaseAdmin.rpc('resolve_withdrawal', {
      p_reference: reference,
      p_status: 'failed'
    });

    if (resolveError) {
      console.error('Failed to resolve withdrawal:', resolveError);
      return NextResponse.json({ error: 'Failed to rollback transaction' }, { status: 500 });
    }

    // 4. THE KILL SWITCH: Freeze the user's account if requested
    if (freezeAccount) {
      const { error: freezeError } = await supabaseAdmin
        .from('users')
        .update({ is_frozen: true })
        .eq('id', transaction.user_id);

      if (freezeError) {
        console.error('Failed to freeze account:', freezeError);
        return NextResponse.json({ 
          error: 'Withdrawal rejected, but failed to freeze the account.' 
        }, { status: 500 });
      }
      
      console.log(`[FRAUD PREVENTION] Account ${transaction.user_id} has been FROZEN. Reason: ${reason || 'Suspicious withdrawal'}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: freezeAccount 
        ? 'Withdrawal rejected and user account has been successfully frozen.' 
        : 'Withdrawal rejected and funds returned to user vault.'
    });

  } catch (error: any) {
    console.error('Admin Reject Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}