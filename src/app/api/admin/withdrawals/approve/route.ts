import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. SECURITY: Check the actual `is_admin` column in your database!
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!dbUser?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { reference } = await req.json();

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

    if (transaction.status !== 'pending_review') {
      return NextResponse.json({ 
        error: `Cannot approve transaction. Current status is ${transaction.status}` 
      }, { status: 400 });
    }

    const metadata = transaction.metadata;
    if (!metadata || !metadata.account_number || !metadata.bank_code) {
      return NextResponse.json({ error: 'Missing bank details in transaction metadata' }, { status: 400 });
    }

    // 3. PREPARE FOR BACHS: Transition to 'pending'
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'pending' })
      .eq('reference', reference);

    // 4. TRIGGER BACHS PAYOUT
    const bachsKey = process.env.BACHS_SECRET_KEY || "";
    if (!bachsKey) throw new Error('Missing Bachs Secret Key');

    // 👇 UPDATED: Exact Bachs Prefix Detection
    const isSandbox = bachsKey.startsWith("sk_sandbox_");
    const baseUrl = isSandbox 
      ? 'https://sandbox-api.bachs.io/v1/payouts/transfer'
      : 'https://api.bachs.io/v1/payouts/transfer';

    const stringAmount = Number(transaction.amount).toFixed(2);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bachsKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: stringAmount, 
          recipient_account: metadata.account_number,
          recipient_bank: metadata.bank_code,
          reference: reference,
          currency: 'NGN',
          narration: 'Bantr Admin Approved Cashout'
        })
      });

      let data;
      try { data = await response.json(); } catch (e) { throw new Error('Invalid API response'); }

      if (!response.ok) {
        throw new Error(data.detail || data.message || data.error || 'Bank transfer failed at gateway');
      }

      // Success! It remains 'pending' until the Bachs Webhook fires 'payout.paid'
      return NextResponse.json({ 
        success: true, 
        message: 'Withdrawal approved and queued at Bachs successfully.' 
      });

    } catch (transferError: any) {
      // 5. ROLLBACK: Bachs instantly rejected it
      console.error('Admin approval transfer failed, refunding user:', transferError.message);
      
      await supabaseAdmin.rpc('resolve_withdrawal', { 
        p_reference: reference, 
        p_status: 'failed' 
      });

      return NextResponse.json({ 
        error: `Bachs rejected the transfer: ${transferError.message}. The user has been refunded.` 
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

//     // 1. SECURITY: Ensure the user is logged in AND is an admin
//     // In production, you should check an `is_admin` column or use a specific admin email list
//     const ADMIN_EMAILS = ['your_email@example.com']; 
//     if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
//       return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
//     }

//     const { reference } = await req.json();

//     if (!reference) {
//       return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });
//     }

//     // 2. FETCH THE TRANSACTION
//     const { data: transaction, error: fetchError } = await supabaseAdmin
//       .from('transactions')
//       .select('*')
//       .eq('reference', reference)
//       .single();

//     if (fetchError || !transaction) {
//       return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
//     }

//     if (transaction.status !== 'pending_review') {
//       return NextResponse.json({ 
//         error: `Cannot approve transaction. Current status is ${transaction.status}` 
//       }, { status: 400 });
//     }

//     const metadata = transaction.metadata;
//     if (!metadata || !metadata.account_number || !metadata.bank_code) {
//       return NextResponse.json({ error: 'Missing bank details in transaction metadata' }, { status: 400 });
//     }

//     // 3. PREPARE FOR BACHS: Transition to 'pending'
//     // We must do this BEFORE calling Bachs, because our `resolve_withdrawal` fallback 
//     // expects the transaction to be in the 'pending' state.
//     await supabaseAdmin
//       .from('transactions')
//       .update({ status: 'pending' })
//       .eq('reference', reference);

//     // 4. TRIGGER BACHS PAYOUT
//     const bachsKey = process.env.BACHS_SECRET_KEY;
//     if (!bachsKey) throw new Error('Missing Bachs Secret Key');

//     const isTestKey = bachsKey.toLowerCase().includes('test');
//     const baseUrl = isTestKey 
//       ? 'https://sandbox-api.bachs.io/v1/payouts/transfer'
//       : 'https://api.bachs.io/v1/payouts/transfer';

//     const stringAmount = Number(transaction.amount).toFixed(2);

//     try {
//       const response = await fetch(baseUrl, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${bachsKey}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           amount: stringAmount, 
//           recipient_account: metadata.account_number,
//           recipient_bank: metadata.bank_code,
//           reference: reference,
//           currency: 'NGN',
//           narration: 'Bantr Admin Approved Cashout'
//         })
//       });

//       let data;
//       try { data = await response.json(); } catch (e) { throw new Error('Invalid API response'); }

//       if (!response.ok) {
//         throw new Error(data.message || data.error || 'Bank transfer failed at gateway');
//       }

//       // Success! It remains 'pending' until the Bachs Webhook fires 'payout.paid'
//       return NextResponse.json({ 
//         success: true, 
//         message: 'Withdrawal approved and queued at Bachs successfully.' 
//       });

//     } catch (transferError: any) {
//       // 5. ROLLBACK: Bachs instantly rejected it (e.g. invalid account or downtime)
//       console.error('Admin approval transfer failed, refunding user:', transferError.message);
      
//       // Since we changed it to 'pending' in step 3, we can safely use our rollback RPC
//       await supabaseAdmin.rpc('resolve_withdrawal', { 
//         p_reference: reference, 
//         p_status: 'failed' 
//       });

//       return NextResponse.json({ 
//         error: `Bachs rejected the transfer: ${transferError.message}. The user has been refunded.` 
//       }, { status: 500 });
//     }

//   } catch (error: any) {
//     console.error('Admin Approval Error:', error.message);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }