import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, accountNumber, bankCode } = await req.json();

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 });
    }

    const reference = `with_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // 1. DEDUCT THE MONEY FIRST (Secure Atomic Lock)
    const { error: dbError } = await supabaseAdmin.rpc('request_withdrawal', {
      p_user_id: user.id,
      p_amount: amount,
      p_reference: reference
    });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // 2. SEND REAL MONEY VIA PAYMENT GATEWAY (e.g., Paystack / Bachs)
    // We wrap this in a try-catch so if the bank API is down, we can refund the user.
    try {
      const response = await fetch('https://api.bachs.io/v1/payouts/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.BACHS_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount, 
          recipient_account: accountNumber,
          recipient_bank: bankCode,
          reference: reference,
          currency: 'NGN',
          narration: 'Bantr Winnings Cashout'
        })
      });

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || 'Bank transfer failed');
      }

      return NextResponse.json({ success: true, message: 'Transfer successful' });

    } catch (transferError: any) {
      // 3. ROLLBACK: If the bank transfer fails, refund the user's Bantr wallet instantly
      console.error('Transfer failed, refunding user:', transferError.message);
      
      await supabaseAdmin.rpc('process_deposit', {
        p_user_id: user.id,
        p_amount: amount,
        p_reference: `${reference}_refund`
      });

      return NextResponse.json({ 
        error: 'Bank network error. Your funds have been securely refunded to your wallet.' 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Withdrawal Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}