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

    // 2. FIX: Dynamically grab the exact URL of the site, preventing 'undefined' errors on Vercel
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://bantr.lol';

    // 3. Use Sandbox for development, Live for production
    const baseUrl = process.env.NODE_ENV === 'production' 
      //const baseUrl = process.env.NODE_ENV === 'sandbox'
      ? 'https://api.bachs.io/v1/checkout-sessions'
      : 'https://sandbox-api.bachs.io/v1/checkout-sessions';

    // Check if we accidentally used a test key in production
    if (process.env.NODE_ENV === 'production' && process.env.BACHS_SECRET_KEY?.includes('test')) {
      console.warn("WARNING: You are using a TEST key in a PRODUCTION environment.");
    }

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
          email: user.email || `${user.id}@bantr.lol` 
        },
        success_url: `${origin}/dashboard?deposit=success`,
        cancel_url: `${origin}/dashboard?deposit=cancelled`,
        reference: `dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        metadata: {
          user_id: user.id
        }
      })
    });

    // We must safely parse the JSON, just in case Bachs throws a 500 HTML error
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`Bachs API did not return JSON. Status: ${response.status}`);
    }

    // 4. Bachs returns 'checkout_url' instead of 'authorization_url'
    if (!response.ok || !data.checkout_url) {
      // Throw the EXACT error Bachs gives us
      throw new Error(data.message || data.error || `Payment gateway failed with status ${response.status}`);
    }

    return NextResponse.json({ success: true, checkoutUrl: data.checkout_url });

  } catch (error: any) {
    console.error('Deposit Init Error:', error.message);
    // FIX: Send the REAL error message to the frontend so you can see it in the UI alert!
    return NextResponse.json({ error: error.message || 'Could not initialize payment' }, { status: 500 });
  }
}