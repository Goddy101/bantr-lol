import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Vercel Cron Jobs send a GET request
export async function GET(req: Request) {
  // 1. SECURE THE ROUTE: Only Vercel's automated servers can trigger this
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized jackpot trigger attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch the currently accumulating jackpot pool
    const { data: jackpot, error: fetchError } = await supabaseAdmin
      .from('jackpot_pool')
      .select('*')
      .eq('status', 'accumulating')
      .single();

    if (fetchError || !jackpot) {
      return NextResponse.json({ message: 'No active jackpot found' }, { status: 200 });
    }

    const totalPool = jackpot.total_amount;

    // If the pool is empty (no one played this week), just roll it over
    if (totalPool === 0) {
      await supabaseAdmin.rpc('rollover_empty_jackpot', { p_jackpot_id: jackpot.id });
      return NextResponse.json({ message: 'Empty jackpot rolled over' }, { status: 200 });
    }

    // 3. Fetch the Top 3 players based on Ball IQ Points
    const { data: topPlayers, error: playersError } = await supabaseAdmin
      .from('users')
      .select('id, ball_iq_points')
      .order('ball_iq_points', { ascending: false })
      .limit(3);

    if (playersError || !topPlayers || topPlayers.length === 0) {
      throw new Error('Failed to fetch top players');
    }

    // 4. Calculate the 60/20/10 Split
    const firstPlacePayout = Math.floor(totalPool * 0.60);
    const secondPlacePayout = Math.floor(totalPool * 0.20);
    const thirdPlacePayout = Math.floor(totalPool * 0.10);
    const houseBuffer = totalPool - (firstPlacePayout + secondPlacePayout + thirdPlacePayout); // The remaining 10%

    // 5. Execute the Atomic Payout via RPC
    const { error: payoutError } = await supabaseAdmin.rpc('process_weekly_jackpot', {
      p_jackpot_id: jackpot.id,
      p_first_place_id: topPlayers[0]?.id || null,
      p_first_payout: topPlayers[0] ? firstPlacePayout : 0,
      
      p_second_place_id: topPlayers[1]?.id || null,
      p_second_payout: topPlayers[1] ? secondPlacePayout : 0,
      
      p_third_place_id: topPlayers[2]?.id || null,
      p_third_payout: topPlayers[2] ? thirdPlacePayout : 0,
      
      p_house_buffer: houseBuffer
    });

    if (payoutError) {
      throw new Error(`Jackpot payout failed: ${payoutError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Jackpot paid out: ₦${totalPool} distributed.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Weekly Jackpot Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}