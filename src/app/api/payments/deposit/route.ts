import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // 2. RISK CONTROL CIRCUIT BREAKER
    if (amount > INSTANT_PAYOUT_LIMIT) {
      console.log(`[Risk Control] Withdrawal of ₦${amount} flagged for manual review: ${reference}`);
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'pending_review' })
        .eq('reference', reference);

      return NextResponse.json({ 
        success: true, 
        message: 'Large withdrawal queued for admin security review.',
        isPendingReview: true 
      });
    }

    const bachsKey = process.env.BACHS_SECRET_KEY || "";
    if (!bachsKey) throw new Error('Missing Bachs Secret Key');

    const isSandbox = bachsKey.startsWith('sk_sandbox_');
    const baseUrl = isSandbox 
      ? 'https://sandbox-api.bachs.io'
      : 'https://api.bachs.io';

    const stringAmount = Number(amount).toFixed(2);

    try {
      // ==========================================
      // STEP A: CREATE PAYOUT DESTINATION
      // ==========================================
      console.log(`[Bachs] Registering Destination for ${accountNumber}...`);
      
      const destResponse = await fetch(`${baseUrl}/v1/payouts/destinations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bachsKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: accountName,
          currency: 'NGN',
          type: 'bank_account',
          account_number: accountNumber,
          bank_code: bankCode
        })
      });

      const destData = await destResponse.json();
      if (!destResponse.ok) throw new Error(destData.detail || 'Failed to register bank destination');

      const destinationId = destData.id;
      if (!destinationId) throw new Error('Destination ID missing from gateway response');

      // ==========================================
      // STEP B: CREATE A PAYOUT QUOTE (USD -> NGN)
      // ==========================================
      // Since your sandbox balance is in USD, we estimate or request a quote to convert USD to cover this NGN amount.
      // Assuming a safe exchange rate or requesting via quote endpoint.
      // Let's approximate the USD equivalent needed (or quote based on target amount if supported, 
      // but quote endpoint requires 'amount' in 'from_currency'). 
      // Let's request a USD quote (e.g. converting $5 USD which covers ~₦7,500, or calculate dynamically).
      // Alternatively, let's request a quote for an estimated USD value matching the NGN amount (e.g. amount / 1500).
      
      const estimatedUsd = (Number(amount) / 1500).toFixed(2); // Using a standard 1500 rate mapping
      
      console.log(`[Bachs] Requesting Payout Quote for ~${estimatedUsd} USD to deliver ${stringAmount} NGN...`);
      
      const quoteResponse = await fetch(`${baseUrl}/v1/payouts/quotes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bachsKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_currency: 'USD',
          to_currency: 'NGN',
          amount: estimatedUsd
        })
      });

      const quoteData = await quoteResponse.json();
      if (!quoteResponse.ok) throw new Error(quoteData.detail || 'Failed to generate payout quote');

      const quoteId = quoteData.quote_id;
      console.log(`[Bachs] Quote Generated: ${quoteId}. Initiating Cross-Currency Payout...`);

      // ==========================================
      // STEP C: SEND THE CROSS-CURRENCY PAYOUT
      // ==========================================
      const payoutResponse = await fetch(`${baseUrl}/v1/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bachsKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': reference
        },
        body: JSON.stringify({
          destination: destinationId,
          quote_id: quoteId,
          currency: 'NGN'
        })
      });

      const payoutData = await payoutResponse.json();
      if (!payoutResponse.ok) throw new Error(payoutData.detail || 'Failed to initiate payout');

      return NextResponse.json({ success: true, message: 'Transfer queued successfully', reference });

    } catch (transferError: any) {
      // SECURE ROLLBACK ON FAILURE
      console.error('Transfer failed, refunding user:', transferError.message);
      await supabaseAdmin.rpc('resolve_withdrawal', { p_reference: reference, p_status: 'failed' });

      return NextResponse.json({ 
        error: `Bank network error: ${transferError.message}. Your funds have been securely refunded.` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Fatal Withdrawal Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




// // src/app/api/payments/deposit/route.ts
// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function POST(req: Request) {
//   try {
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { amount } = await req.json();

//     if (!amount || isNaN(amount) || amount < 500) {
//       return NextResponse.json({ error: "Minimum deposit is ₦500" }, { status: 400 });
//     }

//     const apiKey = process.env.BACHS_SECRET_KEY || "";
//     if (!apiKey) throw new Error("Payment gateway not configured.");

//     const baseUrl = apiKey.startsWith("sk_live_")
//       ? "https://api.bachs.io"
//       : "https://sandbox-api.bachs.io";

//     // Format money strictly as a decimal string (e.g. "1000.00")
//     const formattedAmount = Number(amount).toFixed(2);
//     const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bantr.lol";

//     const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${apiKey}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
        
//         // 🚨 THE FIX: Use the Bachs 'pricing' object for ad-hoc amounts
//         pricing: {
//           amount: formattedAmount,
//           currency: "NGN"
//         },
        
//         customer: {
//           email: user.email || "no-reply@bantr.lol",
//           name: user.user_metadata?.username || "Bantr Player"
//         },
//         metadata: {
//           user_id: user.id 
//         },
//         success_url: `${appUrl}/dashboard?deposit=success`,
//         cancel_url: `${appUrl}/dashboard?deposit=cancelled`
//       }),
//       cache: "no-store"
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       console.error("Bachs Checkout Error:", err);
//       return NextResponse.json({ error: "Failed to generate payment link" }, { status: res.status });
//     }

//     const data = await res.json();
//     return NextResponse.json({ success: true, url: data.checkout_url }); // Note: I also updated this to match their spec's 'checkout_url' return field!

//   } catch (error: any) {
//     console.error("Deposit initialization error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }




// // src/app/api/payments/deposit/route.ts
// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function POST(req: Request) {
//   try {
//     // 1. SECURE AUTH: Get the user_id securely from the active server session
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { amount } = await req.json(); // e.g. 5000

//     if (!amount || isNaN(amount) || amount < 500) {
//       return NextResponse.json({ error: "Minimum deposit is ₦500" }, { status: 400 });
//     }

//     const apiKey = process.env.BACHS_SECRET_KEY || "";
//     if (!apiKey) throw new Error("Payment gateway not configured.");

//     const baseUrl = apiKey.startsWith("sk_live_")
//       ? "https://api.bachs.io"
//       : "https://sandbox-api.bachs.io";

//     // 2. FORMAT MONEY: Bachs strict rule - must be a decimal string, NO minor units.
//     const formattedAmount = Number(amount).toFixed(2);

//     // 🚨 FIX: Bulletproof App URL Fallback
//     // If NEXT_PUBLIC_APP_URL is missing, it safely falls back to bantr.lol
//     const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bantr.lol";

//     // 3. INITIALIZE CHECKOUT
//     const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${apiKey}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         amount: formattedAmount,
//         currency: "NGN",
//         metadata: {
//           user_id: user.id 
//         },
//         // Using the safe appUrl variable we just created
//         success_url: `${appUrl}/dashboard?deposit=success`,
//         cancel_url: `${appUrl}/dashboard?deposit=cancelled`
//       }),
//       cache: "no-store"
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       console.error("Bachs Checkout Error:", err);
//       return NextResponse.json({ error: "Failed to generate payment link" }, { status: res.status });
//     }

//     const data = await res.json();
    
//     return NextResponse.json({ success: true, url: data.url }); 

//   } catch (error: any) {
//     console.error("Deposit initialization error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }







// // src/app/api/payments/deposit/route.ts
// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function POST(req: Request) {
//   try {
//     // 1. SECURE AUTH: Get the user_id securely from the active server session
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { amount } = await req.json(); // e.g. 5000

//     if (!amount || isNaN(amount) || amount < 500) {
//       return NextResponse.json({ error: "Minimum deposit is ₦500" }, { status: 400 });
//     }

//     const apiKey = process.env.BACHS_SECRET_KEY || "";
//     if (!apiKey) throw new Error("Payment gateway not configured.");

//     const baseUrl = apiKey.startsWith("sk_live_")
//       ? "https://api.bachs.io"
//       : "https://sandbox-api.bachs.io";

//     // 2. FORMAT MONEY: Bachs strict rule - must be a decimal string, NO minor units.
//     // So 5000 becomes "5000.00"
//     const formattedAmount = Number(amount).toFixed(2);

//     // 3. INITIALIZE CHECKOUT
//     const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${apiKey}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         amount: formattedAmount,
//         currency: "NGN",
//         // 🚨 THIS IS THE METADATA HOOK 🚨
//         // Anything put in this object gets attached to the webhook later
//         metadata: {
//           user_id: user.id 
//         },
//         // Where to send the user after they pay (or cancel)
//         success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=success`,
//         cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=cancelled`
//       }),
//       cache: "no-store"
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       console.error("Bachs Checkout Error:", err);
//       return NextResponse.json({ error: "Failed to generate payment link" }, { status: res.status });
//     }

//     const data = await res.json();
    
//     // Bachs will return a hosted checkout URL (e.g., https://checkout.bachs.io/chk_...)
//     return NextResponse.json({ success: true, url: data.url }); 

//   } catch (error: any) {
//     console.error("Deposit initialization error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }




