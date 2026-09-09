import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// The threshold for instant payouts (₦50,000)
const INSTANT_PAYOUT_LIMIT = 50000;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, accountNumber, bankCode, accountName = 'Bantr User' } = await req.json();

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 });
    }

    const reference = `with_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // 1. DEDUCT THE MONEY FIRST (Secure Atomic Lock)
    const { error: dbError } = await supabaseAdmin.rpc('request_withdrawal', {
      p_user_id: user.id,
      p_amount: amount,
      p_reference: reference,
      p_bank_code: bankCode,
      p_account_number: accountNumber,
      p_account_name: accountName
    });

    if (dbError) {
      console.error('Withdrawal DB Error:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // 🚨 2. THE CIRCUIT BREAKER: Manual Review for Large Amounts
    if (amount > INSTANT_PAYOUT_LIMIT) {
      console.log(`[Risk Control] Withdrawal of ₦${amount} flagged for manual review: ${reference}`);
      
      // Upgrade the transaction status so it doesn't look like a stalled API request
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'pending_review' })
        .eq('reference', reference);

      // Return early! We do NOT hit the Bachs API.
      return NextResponse.json({ 
        success: true, 
        message: 'Large withdrawal queued for admin security review. This usually takes 1-2 hours.',
        isPendingReview: true 
      });
    }

    // 3. SEND REAL MONEY VIA PAYMENT GATEWAY (For amounts <= ₦50,000)
    const bachsKey = process.env.BACHS_SECRET_KEY;
    if (!bachsKey) throw new Error('Missing Bachs Secret Key');

    const isTestKey = bachsKey.toLowerCase().includes('test');
    const baseUrl = isTestKey 
      ? 'https://sandbox-api.bachs.io/v1/payouts/transfer'
      : 'https://api.bachs.io/v1/payouts/transfer';

    const stringAmount = Number(amount).toFixed(2);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bachsKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: stringAmount, 
          recipient_account: accountNumber,
          recipient_bank: bankCode,
          reference: reference,
          currency: 'NGN',
          narration: 'Bantr Winnings Cashout'
        })
      });

      let data;
      try { data = await response.json(); } catch (e) { throw new Error('Invalid API response'); }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Bank transfer failed');
      }

      return NextResponse.json({ success: true, message: 'Transfer queued successfully', reference });

    } catch (transferError: any) {
      // SECURE ROLLBACK
      console.error('Transfer failed, refunding user:', transferError.message);
      await supabaseAdmin.rpc('resolve_withdrawal', { p_reference: reference, p_status: 'failed' });

      return NextResponse.json({ 
        error: `Bank network error: ${transferError.message}. Your funds have been securely refunded to your vault.` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Fatal Withdrawal Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}