// src/app/api/payments/deposit/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || isNaN(amount) || amount < 500) {
      return NextResponse.json({ error: "Minimum deposit is ₦500" }, { status: 400 });
    }

    const apiKey = process.env.BACHS_SECRET_KEY || "";
    if (!apiKey) throw new Error("Payment gateway not configured.");

    const baseUrl = apiKey.startsWith("sk_live_")
      ? "https://api.bachs.io"
      : "https://sandbox-api.bachs.io";

    const formattedAmount = Number(amount).toFixed(2);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bantr.lol";

    const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: formattedAmount,
        currency: "NGN",
        
        // 🚨 ADD THIS REQUIRED CUSTOMER FIELD 🚨
        customer: {
          email: user.email || "no-reply@bantr.lol", // Provide fallback just in case
          name: user.user_metadata?.username || "Bantr Player"
        },

        metadata: {
          user_id: user.id 
        },
        success_url: `${appUrl}/dashboard?deposit=success`,
        cancel_url: `${appUrl}/dashboard?deposit=cancelled`
      }),
      cache: "no-store"
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Bachs Checkout Error:", err);
      return NextResponse.json({ error: "Failed to generate payment link" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, url: data.url }); 

  } catch (error: any) {
    console.error("Deposit initialization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}




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




