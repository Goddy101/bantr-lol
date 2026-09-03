import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();

    if (!amount || amount < 500) {
      return NextResponse.json({ error: 'Minimum deposit is ₦500' }, { status: 400 });
    }

    // 1. Bachs Rule: Must be a decimal string, NO minor units.
    const stringAmount = Number(amount).toFixed(2); 

    // 2. Use Sandbox for development, Live for production
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.bachs.io/v1/checkout-sessions'
      : 'https://sandbox-api.bachs.io/v1/checkout-sessions';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BACHS_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pricing: {
          currency: 'NGN',
          amount: stringAmount
        },
        customer: { 
          email: user.email || `${user.phone}@bantr.lol` 
        },
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?deposit=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?deposit=cancelled`,
        reference: `dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        metadata: {
          user_id: user.id
        }
      })
    });

    const data = await response.json();

    // 3. Bachs returns 'checkout_url' instead of 'authorization_url'
    if (!response.ok || !data.checkout_url) {
      throw new Error(data.message || 'Payment gateway failed');
    }

    return NextResponse.json({ success: true, checkoutUrl: data.checkout_url });

  } catch (error: any) {
    console.error('Deposit Init Error:', error.message);
    return NextResponse.json({ error: 'Could not initialize payment' }, { status: 500 });
  }
}