import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Expecting accountName as well, default to 'Bantr User' if they don't provide it
    const { amount, accountNumber, bankCode, accountName = 'Bantr User' } = await req.json();

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 });
    }

    const reference = `with_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // 1. DEDUCT THE MONEY FIRST (Secure Atomic Lock)
    // We pass all the bank details to satisfy the RPC we just created
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

    const bachsKey = process.env.BACHS_SECRET_KEY;
    if (!bachsKey) {
      throw new Error('Server configuration error: Missing Bachs Secret Key');
    }

    // Smart Sandbox vs Live routing
    const isTestKey = bachsKey.toLowerCase().includes('test');
    const baseUrl = isTestKey 
      ? 'https://sandbox-api.bachs.io/v1/payouts/transfer'
      : 'https://api.bachs.io/v1/payouts/transfer';

    // Bachs specifically requires string decimals (e.g., "5000.00")
    const stringAmount = Number(amount).toFixed(2);

    // 2. SEND REAL MONEY VIA PAYMENT GATEWAY
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
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Bachs API did not return JSON. Status: ${response.status}`);
      }

      // If Bachs rejects the transfer instantly
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Bank transfer failed');
      }

      return NextResponse.json({ success: true, message: 'Transfer queued successfully', reference });

    } catch (transferError: any) {
      // 3. SECURE ROLLBACK: The bank API failed, so we refund them and mark the transaction as failed.
      console.error('Transfer failed, refunding user:', transferError.message);
      
      await supabaseAdmin.rpc('resolve_withdrawal', {
        p_reference: reference,
        p_status: 'failed'
      });

      return NextResponse.json({ 
        error: `Bank network error: ${transferError.message}. Your funds have been securely refunded to your vault.` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Fatal Withdrawal Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}