// src/app/api/payments/deposit/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // 1. SECURE AUTH: Get the user_id securely from the active server session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json(); // e.g. 5000

    if (!amount || isNaN(amount) || amount < 500) {
      return NextResponse.json({ error: "Minimum deposit is ₦500" }, { status: 400 });
    }

    const apiKey = process.env.BACHS_SECRET_KEY || "";
    if (!apiKey) throw new Error("Payment gateway not configured.");

    const baseUrl = apiKey.startsWith("sk_live_")
      ? "https://api.bachs.io"
      : "https://sandbox-api.bachs.io";

    // 2. FORMAT MONEY: Bachs strict rule - must be a decimal string, NO minor units.
    // So 5000 becomes "5000.00"
    const formattedAmount = Number(amount).toFixed(2);

    // 3. INITIALIZE CHECKOUT
    const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: formattedAmount,
        currency: "NGN",
        // 🚨 THIS IS THE METADATA HOOK 🚨
        // Anything put in this object gets attached to the webhook later
        metadata: {
          user_id: user.id 
        },
        // Where to send the user after they pay (or cancel)
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=cancelled`
      }),
      cache: "no-store"
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Bachs Checkout Error:", err);
      return NextResponse.json({ error: "Failed to generate payment link" }, { status: res.status });
    }

    const data = await res.json();
    
    // Bachs will return a hosted checkout URL (e.g., https://checkout.bachs.io/chk_...)
    return NextResponse.json({ success: true, url: data.url }); 

  } catch (error: any) {
    console.error("Deposit initialization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}








// import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';

// export async function POST(req: Request) {
//   try {
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//     const { amount } = await req.json();

//     if (!amount || amount < 500) {
//       return NextResponse.json({ error: 'Minimum deposit is ₦500' }, { status: 400 });
//     }

//     const stringAmount = Number(amount).toFixed(2); 
//     const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://bantr.lol';

//     // 1. Grab the key
//     const bachsKey = process.env.BACHS_SECRET_KEY;

//     if (!bachsKey) {
//       console.error("FATAL: BACHS_SECRET_KEY is missing from .env.local!");
//       return NextResponse.json({ error: 'Payment configuration missing on server.' }, { status: 500 });
//     }

//     // 2. THE FIX: Smart URL Routing
//     // If the key has 'test' in it, use Sandbox. Otherwise, use Live!
//     const isTestKey = bachsKey.toLowerCase().includes('test');
//     const baseUrl = isTestKey 
//       ? 'https://sandbox-api.bachs.io/v1/checkout-sessions'
//       : 'https://api.bachs.io/v1/checkout-sessions';

//     console.log(`[PAYMENT INIT] Routing to ${isTestKey ? 'Sandbox' : 'Live'} API...`);

//     // 3. Send the request
//     const response = await fetch(baseUrl, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${bachsKey}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         pricing: {
//           currency: 'NGN',
//           amount: stringAmount
//         },
//         customer: { 
//           email: user.email || `${user.id}@bantr.lol` 
//         },
//         success_url: `${origin}/dashboard?deposit=success`,
//         cancel_url: `${origin}/dashboard?deposit=cancelled`,
//         reference: `dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
//         metadata: {
//           user_id: user.id
//         }
//       })
//     });

//     let data;
//     try {
//       data = await response.json();
//     } catch (parseError) {
//       throw new Error(`Bachs API did not return JSON. Status: ${response.status}`);
//     }

//     if (!response.ok || !data.checkout_url) {
//       throw new Error(data.message || data.error || `Payment gateway rejected with status ${response.status}`);
//     }

//     return NextResponse.json({ success: true, checkoutUrl: data.checkout_url });

//   } catch (error: any) {
//     console.error('Deposit Init Error:', error.message);
//     return NextResponse.json({ error: error.message || 'Could not initialize payment' }, { status: 500 });
//   }
// }




// import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';

// export async function POST(req: Request) {
//   try {
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//     const { amount } = await req.json();

//     if (!amount || amount < 500) {
//       return NextResponse.json({ error: 'Minimum deposit is ₦500' }, { status: 400 });
//     }

//     // 1. Bachs Rule: Must be a decimal string, NO minor units.
//     const stringAmount = Number(amount).toFixed(2); 

//     // 2. FIX: Dynamically grab the exact URL of the site, preventing 'undefined' errors on Vercel
//     const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://bantr.lol';

//     // 3. Use Sandbox for development, Live for production
//    const baseUrl = process.env.NODE_ENV === 'production' 

//     // Force Sandbox mode for now, even on Vercel

//      // const baseUrl = process.env.NODE_ENV === 'sandbox'
//      ? 'https://api.bachs.io/v1/checkout-sessions'
//      : 'https://sandbox-api.bachs.io/v1/checkout-sessions';

//   // sandbox mode for now, even on Vercel

//   //const baseUrl = 'https://sandbox-api.bachs.io/v1/checkout-sessions';

//     // Check if we accidentally used a test key in production
//     if (process.env.NODE_ENV === 'production' && process.env.BACHS_SECRET_KEY?.includes('test')) {
//       console.warn("WARNING: You are using a TEST key in a PRODUCTION environment.");
//     }

//     const response = await fetch(baseUrl, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.BACHS_SECRET_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         pricing: {
//           currency: 'NGN',
//           amount: stringAmount
//         },
//         customer: { 
//           email: user.email || `${user.id}@bantr.lol` 
//         },
//         success_url: `${origin}/dashboard?deposit=success`,
//         cancel_url: `${origin}/dashboard?deposit=cancelled`,
//         reference: `dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
//         metadata: {
//           user_id: user.id
//         }
//       })
//     });

//     // We must safely parse the JSON, just in case Bachs throws a 500 HTML error
//     let data;
//     try {
//       data = await response.json();
//     } catch (parseError) {
//       throw new Error(`Bachs API did not return JSON. Status: ${response.status}`);
//     }

//     // 4. Bachs returns 'checkout_url' instead of 'authorization_url'
//     if (!response.ok || !data.checkout_url) {
//       // Throw the EXACT error Bachs gives us
//       throw new Error(data.message || data.error || `Payment gateway failed with status ${response.status}`);
//     }

//     return NextResponse.json({ success: true, checkoutUrl: data.checkout_url });

//   } catch (error: any) {
//     console.error('Deposit Init Error:', error.message);
//     // FIX: Send the REAL error message to the frontend so you can see it in the UI alert!
//     return NextResponse.json({ error: error.message || 'Could not initialize payment' }, { status: 500 });
//   }
// }