"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const refCode = formData.get("refCode") as string;

  if (!email || !password || !username) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().replace(/\s+/g, ""),
      },
    },
  });

  if (error) return { error: error.message };

  if (!data.session) {
    return { error: "Account created! Please check your email to verify your account." };
  }

  // PROFILE RESCUE: Ensure they have a vault before letting them into the dashboard
  if (data.user) {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("users").insert({
        id: data.user.id,
        username: username.toLowerCase().replace(/\s+/g, ""),
        wallet_balance: 0,
        ball_iq_points: 0
      });
    }

    if (refCode) {
      await supabase.from("users").update({ referred_by_admin: refCode }).eq("id", data.user.id);
    }
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  if (!data.session) {
    return { error: "Please verify your email address before logging in." };
  }

  // PROFILE RESCUE: Ensure they have a vault before letting them into the dashboard
  if (data.user) {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("users").insert({
        id: data.user.id,
        username: email.split('@')[0],
        wallet_balance: 0,
        ball_iq_points: 0
      });
    }
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}






// "use server";

// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

// export async function signUp(formData: FormData) {
//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;
//   const username = formData.get("username") as string;
//   const refCode = formData.get("refCode") as string; // <-- 1. Extract the referral code

//   if (!email || !password || !username) {
//     return { error: "All fields are required" };
//   }

//   const supabase = await createClient();

//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: {
//         username: username.toLowerCase().replace(/\s+/g, ""), // Clean username
//       },
//     },
//   });

//   if (error) return { error: error.message };

//   // 2. Affiliate Hook: If a referral code exists, update the user's row in the database!
//   // (We do this safely so if the ref code is fake/invalid, it doesn't break their signup)
//   if (refCode && data.user) {
//     const { error: linkError } = await supabase
//       .from("users")
//       .update({ referred_by_admin: refCode })
//       .eq("id", data.user.id);
      
//     if (linkError) {
//       console.error("Failed to link affiliate:", linkError.message);
//     }
//   }
  
//   // THE FIX: Return a clean success object instead of throwing a redirect error
//   return { success: true };
// }

// export async function signIn(formData: FormData) {
//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;

//   if (!email || !password) {
//     return { error: "Email and password are required" };
//   }

//   const supabase = await createClient();

//   const { error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });

//   if (error) return { error: error.message };

//   // THE FIX: Return a clean success object instead of throwing a redirect error
//   return { success: true };
// }

// export async function signOut() {
//   const supabase = await createClient();
//   await supabase.auth.signOut();
//   redirect("/"); // This one is fine because it's called via a native <form action>
// }