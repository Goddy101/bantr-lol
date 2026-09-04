"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const refCode = formData.get("refCode") as string; // <-- 1. Extract the referral code

  if (!email || !password || !username) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().replace(/\s+/g, ""), // Clean username
      },
    },
  });

  if (error) return { error: error.message };

  // 2. Affiliate Hook: If a referral code exists, update the user's row in the database!
  // (We do this safely so if the ref code is fake/invalid, it doesn't break their signup)
  if (refCode && data.user) {
    const { error: linkError } = await supabase
      .from("users")
      .update({ referred_by_admin: refCode })
      .eq("id", data.user.id);
      
    if (linkError) {
      console.error("Failed to link affiliate:", linkError.message);
    }
  }
  
  // Instantly teleport them to the dashboard
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}