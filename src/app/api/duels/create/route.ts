import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate the user securely
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { match_id, prediction, stake_amount } = body;

    // 2. Strict Type & Input Validation
    if (!match_id || !prediction || stake_amount === undefined) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
    }

    if (!['home', 'away', 'draw'].includes(prediction)) {
      return NextResponse.json({ error: 'Invalid prediction type.' }, { status: 400 });
    }

    if (typeof stake_amount !== 'number' || !Number.isInteger(stake_amount) || stake_amount < 500) {
      return NextResponse.json({ error: 'Stake must be a whole number of at least ₦500.' }, { status: 400 });
    }

    // 3. The "Time Traveler" Check: Verify the match hasn't started
    const apiResponse = await fetch(`https://v3.football.api-sports.io/fixtures?id=${match_id}`, {
      headers: {
        'x-rapidapi-key': process.env.API_FOOTBALL_KEY!,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      },
      // Cache for a few seconds just in case they double-click, but keep it mostly live
      next: { revalidate: 5 } 
    });
    
    const apiData = await apiResponse.json();
    
    if (!apiData.response || apiData.response.length === 0) {
      return NextResponse.json({ error: 'Invalid Match ID.' }, { status: 400 });
    }

    const matchStatus = apiData.response[0].fixture.status.short;
    
    // 'NS' = Not Started, 'TBD' = To Be Defined
    if (!['NS', 'TBD'].includes(matchStatus)) {
      return NextResponse.json({ error: 'Too late! This match has already started.' }, { status: 400 });
    }

    // 4. Execute the Atomic Postgres Function
    const { data: duelId, error } = await supabaseAdmin.rpc('create_duel', {
      p_user_id: user.id,
      p_match_id: match_id.toString(),
      p_prediction: prediction,
      p_stake_amount: stake_amount
    });

    if (error) {
      // Return the exact error we wrote in SQL (e.g., "Insufficient funds.")
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 5. Return success and the new Duel ID
    return NextResponse.json({ success: true, duel_id: duelId }, { status: 200 });

  } catch (error: any) {
    console.error('Create Duel Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}