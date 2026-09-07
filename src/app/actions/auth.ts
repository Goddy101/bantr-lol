"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; // Bypass Database Security!
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
      data: { username: username.toLowerCase().replace(/\s+/g, "") },
    },
  });

  if (error) return { error: error.message };
  if (!data.session) return { error: "Account created! Please check your email to verify." };

  // NUCLEAR PROFILE RESCUE: Use Admin Key to force the row creation
  if (data.user) {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabaseAdmin.from("users").insert({
        id: data.user.id,
        username: username.toLowerCase().replace(/\s+/g, ""),
        wallet_balance: 0,
        ball_iq_points: 0
      });
    }

    if (refCode) {
      await supabaseAdmin.from("users").update({ referred_by_admin: refCode }).eq("id", data.user.id);
    }
  }

  // Purge Next.js cache and forcefully redirect from the Server
  revalidatePath("/", "layout");
  redirect("/dashboard"); 
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
  if (!data.session) return { error: "Please verify your email address before logging in." };

  // NUCLEAR PROFILE RESCUE
  if (data.user) {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabaseAdmin.from("users").insert({
        id: data.user.id,
        username: email.split('@')[0],
        wallet_balance: 0,
        ball_iq_points: 0
      });
    }
  }

  // Purge Next.js cache and forcefully redirect from the Server
  revalidatePath("/", "layout");
  redirect("/dashboard");
}