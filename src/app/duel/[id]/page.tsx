import { createClient } from "@/lib/supabase/server";
import DuelClientUI from "./DuelClientUI";
import Link from "next/link";
import { Metadata } from "next";

// 1. THE VIRAL META TAG ENGINE
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();

  // Fetch just enough data for the preview card
  const { data: duel } = await supabase
    .from("duels")
    .select("stake_amount, creator:users!creator_id(username)")
    .eq("id", id)
    .single();

  if (!duel) {
    return { title: "Duel Not Found | bantr.lol" };
  }

  // The aggressive copy that shows up in WhatsApp/Twitter
  const title = `🚨 @${duel.creator[0]?.username} just dropped ₦${duel.stake_amount.toLocaleString()} on the table.`;
  const description = `Think they're wrong? Match the ₦${duel.stake_amount.toLocaleString()} stake in escrow and prove it.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "bantr.lol",
      type: "website",
    },
    twitter: {
      card: "summary", // WhatsApp prefers 'summary' layout for text-heavy previews without massive images
      title,
      description,
    },
  };
}


// 2. THE PAGE UI
export default async function DuelPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real duel and creator details for the UI
  const { data: duel, error } = await supabase
    .from("duels")
    .select("*, creator:users!creator_id(username)")
    .eq("id", id)
    .single();

  if (error || !duel) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-black mb-2">404 - Duel Not Found</h1>
        <Link href="/dashboard" className="text-green-400 font-bold hover:underline">Go Home</Link>
      </div>
    );
  }

  return (
    <DuelClientUI 
      duel={duel} 
      currentUserId={user?.id || null} 
      isLoggedIn={!!user} 
    />
  );
}