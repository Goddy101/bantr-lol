import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  // 1. If there's no token in the URL, kick them to the dashboard
  if (!token) {
    return NextResponse.redirect(new URL('/dashboard?error=missing_vip_token', req.url));
  }

  const supabase = await createClient();

  // 2. Check if the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // If they aren't logged in, send them to login, but remember where they were trying to go!
    // (Ensure your /login page redirects them back to this URL after they sign up)
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', `/vip/claim?token=${token}`);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verify the token exists and is valid
  const { data: invite, error: inviteError } = await supabase
    .from('partner_invites')
    .select('*')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.redirect(new URL('/dashboard?error=invalid_vip_token', req.url));
  }

  // 4. Check if the token was already used
  if (invite.is_used) {
    // If the person who used it is the CURRENT user, just let them through to the Hub
    if (invite.used_by === user.id) {
      return NextResponse.redirect(new URL('/partner-hub', req.url));
    }
    // Otherwise, someone else stole/used their link
    return NextResponse.redirect(new URL('/dashboard?error=token_already_claimed', req.url));
  }

  // 5. THE UPGRADE: Make them a VIP Partner
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ is_partner: true })
    .eq('id', user.id);

  if (userUpdateError) {
    console.error("Failed to upgrade user to partner:", userUpdateError);
    return NextResponse.redirect(new URL('/dashboard?error=upgrade_failed', req.url));
  }

  // 6. BURN THE TOKEN: Mark it as used so it can't be shared
  const { error: tokenUpdateError } = await supabase
    .from('partner_invites')
    .update({ 
      is_used: true, 
      used_by: user.id 
    })
    .eq('id', invite.id);

  if (tokenUpdateError) {
    console.error("Failed to burn VIP token:", tokenUpdateError);
  }

  // 7. Success! Teleport them into the Odogwu Cartel
  return NextResponse.redirect(new URL('/partner-hub?success=vip_claimed', req.url));
}