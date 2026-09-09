import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 1. ADMIN SECURITY CHECK
    const ADMIN_EMAILS = ['godwinojonimi@gmail.com']; 
    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });
    }

    // 2. FETCH THE WITHDRAWAL RECORD
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('*, users(username)')
      .eq('id', reference) 
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal record not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending_review') {
      return NextResponse.json({ error: `Cannot approve. Status is ${withdrawal.status}` }, { status: 400 });
    }

    const bankDetails = withdrawal.bank_details;

    // 3. LOCK DATABASE STATE (Prevent race conditions)
    await supabaseAdmin.from('withdrawals').update({ status: 'processing' }).eq('id', reference);
    await supabaseAdmin.from('transactions').update({ status: 'pending' }).eq('reference', 'withdraw_' + reference);

    // 4. RESOLVE BACHS ENVIRONMENT
    const bachsKey = process.env.BACHS_SECRET_KEY;
    if (!bachsKey) throw new Error('Missing Bachs Secret Key');

    const baseUrl = bachsKey.startsWith('sk_live_') 
      ? 'https://api.bachs.io'
      : 'https://sandbox-api.bachs.io';

    try {
      // ------------------------------------------------------------------
      // STEP 1: CREATE PAYOUT DESTINATION (/v1/payouts/destinations)
      // ------------------------------------------------------------------
      const destResponse = await fetch(`${baseUrl}/v1/payouts/destinations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bachsKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `dest_${reference}`
        },
        body: JSON.stringify({
          name: `Bantr - @${withdrawal.users?.username || 'user'}`,
          currency: 'NGN',
          type: 'bank_account',
          account_number: bankDetails.account,
          bank_code: bankDetails.bank
        })
      });

      const destData = await destResponse.json();
      if (!destResponse.ok) {
        throw new Error(destData.detail || 'Failed to register payout destination');
      }

      const destinationId = destData.id; // e.g., "pd_7Kq2mNv..."

      // ------------------------------------------------------------------
      // STEP 2: CREATE PAYOUT (/v1/payouts)
      // ------------------------------------------------------------------
      // Strict precision rule: Must be a decimal string like "5000.00"
      const stringAmount = Math.abs(Number(withdrawal.amount)).toFixed(2);

      const payoutResponse = await fetch(`${baseUrl}/v1/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bachsKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `payout_${reference}` // Prevents duplicate payouts on retry
        },
        body: JSON.stringify({
          destination: destinationId,
          amount: stringAmount,
          reference: 'withdraw_' + reference
        })
      });

      const payoutData = await payoutResponse.json();
      if (!payoutResponse.ok) {
        throw new Error(payoutData.detail || 'Payout execution failed at gateway');
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payout successfully registered and queued at Bachs.' 
      });

    } catch (transferError: any) {
      // 5. ROLLBACK: If gateway rejects it, instantly refund the user via SQL
      console.error('Bachs payout failed, triggering refund:', transferError.message);
      
      await supabaseAdmin.rpc('refund_withdrawal', { 
        p_withdrawal_id: reference, 
        p_user_id: withdrawal.user_id,
        p_amount_to_refund: Math.abs(withdrawal.amount) + withdrawal.fee
      });

      return NextResponse.json({ 
        error: `Bachs rejected payout: ${transferError.message}. User has been refunded.` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Admin Approval Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




// import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';
// import { supabaseAdmin } from '@/lib/supabase/admin';

// export async function POST(req: Request) {
//   try {
//     const supabase = await createClient();
//     const { data: { user }, error: authError } = await supabase.auth.getUser();

//     // 1. SECURITY
//     const ADMIN_EMAILS = ['your_email@example.com']; 
//     if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
//       return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
//     }

//     const { reference } = await req.json();
//     if (!reference) return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });

//     // 2. FETCH THE WITHDRAWAL 
//     const { data: withdrawal, error: fetchError } = await supabaseAdmin
//       .from('withdrawals')
//       .select('*, users(username)')
//       .eq('id', reference) 
//       .single();

//     if (fetchError || !withdrawal) {
//       return NextResponse.json({ error: 'Withdrawal record not found' }, { status: 404 });
//     }

//     if (withdrawal.status !== 'pending_review') {
//       return NextResponse.json({ error: `Cannot approve. Status is ${withdrawal.status}` }, { status: 400 });
//     }

//     const bankDetails = withdrawal.bank_details;

//     // 3. LOCK STATE IN DATABASE (Prevent double-clicks)
//     await supabaseAdmin.from('withdrawals').update({ status: 'processing' }).eq('id', reference);
//     await supabaseAdmin.from('transactions').update({ status: 'pending' }).eq('reference', `withdraw_${reference}`);

//     // 4. PREPARE BACHS CREDENTIALS
//     const bachsKey = process.env.BACHS_SECRET_KEY;
//     if (!bachsKey) throw new Error('Missing Bachs Secret Key');

//     const baseUrl = bachsKey.startsWith('sk_live_') 
//       ? 'https://api.bachs.io'
//       : 'https://sandbox-api.bachs.io';

//     try {
//       // ====================================================================
//       // STEP A: CREATE THE PAYOUT DESTINATION (Per the OpenAPI spec)
//       // ====================================================================
//       const destinationRes = await fetch(`${baseUrl}/v1/payouts/destinations`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${bachsKey}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           name: `Bantr Cashout - ${withdrawal.users?.username}`,
//           currency: 'NGN',
//           type: 'bank_account',
//           account_number: bankDetails.account,
//           bank_code: bankDetails.bank
//         })
//       });

//       const destData = await destinationRes.json();
//       if (!destinationRes.ok) throw new Error(destData.detail || 'Failed to register bank destination');
      
//       const destinationId = destData.id; // e.g., "pd_7Kq2mNv..."

//       // ====================================================================
//       // STEP B: EXECUTE THE PAYOUT TO THAT DESTINATION
//       // ====================================================================
//       const stringAmount = Math.abs(Number(withdrawal.amount)).toFixed(2);

//       const payoutRes = await fetch(`${baseUrl}/v1/payouts`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${bachsKey}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           amount: stringAmount, 
//           currency: 'NGN',
//           destination: destinationId, // Map directly to the ID we just created!
//           reference: `withdraw_${reference}`, // Links back to our webhook!
//           narration: 'Bantr Admin Approved Cashout'
//         })
//       });

//       const payoutData = await payoutRes.json();
//       if (!payoutRes.ok) throw new Error(payoutData.detail || 'Bank transfer failed at gateway');

//       return NextResponse.json({ 
//         success: true, 
//         message: 'Withdrawal approved and queued successfully.' 
//       });

//     } catch (transferError: any) {
//       // 5. ROLLBACK: Bachs instantly rejected it
//       console.error('Admin approval failed, refunding user:', transferError.message);
      
//       await supabaseAdmin.rpc('refund_withdrawal', { 
//         p_withdrawal_id: reference, 
//         p_user_id: withdrawal.user_id,
//         p_amount_to_refund: Math.abs(withdrawal.amount) + withdrawal.fee
//       });

//       return NextResponse.json({ 
//         error: `Bachs rejected the transfer: ${transferError.message}. User refunded.` 
//       }, { status: 500 });
//     }

//   } catch (error: any) {
//     console.error('Admin Approval Error:', error.message);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }