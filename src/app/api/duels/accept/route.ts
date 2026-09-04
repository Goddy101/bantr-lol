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
    const { duel_id, prediction } = body;

    if (!duel_id || !prediction) {
      return NextResponse.json({ error: 'Missing duel_id or prediction.' }, { status: 400 });
    }

    // 2. Fetch the duel to get the match_id
    const { data: duel, error: fetchError } = await supabaseAdmin
      .from('duels')
      .select('match_id, status')
      .eq('id', duel_id)
      .single();

    if (fetchError || !duel) {
      return NextResponse.json({ error: 'Duel not found.' }, { status: 404 });
    }

    if (duel.status !== 'open') {
      return NextResponse.json({ error: 'Duel is no longer open.' }, { status: 400 });
    }

    // 3. The "Time Traveler" Check: Ask FOOTBALL-DATA.ORG
    const apiResponse = await fetch(`https://api.football-data.org/v4/matches/${duel.match_id}`, {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || ''
      },
      next: { revalidate: 5 } 
    });
    
    const apiData = await apiResponse.json();
    
    // Check for API errors or invalid ID
    if (apiData.errorCode || !apiData.status) {
      return NextResponse.json({ error: 'Invalid Match ID.' }, { status: 400 });
    }

    // Football-Data uses 'SCHEDULED' or 'TIMED' for matches that haven't kicked off yet
    if (!['SCHEDULED', 'TIMED'].includes(apiData.status)) {
      return NextResponse.json({ error: 'Too late! This match has already started.' }, { status: 400 });
    }

    // 4. Execute the Atomic Postgres Function to lock the opponent's funds
    // const { error: acceptError } = await supabaseAdmin.rpc('accept_duel', {
    //   p_duel_id: duel_id,
    //   p_opponent_id: user.id
    // });

    const { error: acceptError } = await supabaseAdmin.rpc('accept_duel', {
      p_duel_id: duel_id,
      p_opponent_id: user.id,
      p_prediction: prediction // <-- ADD THIS LINE!
    });

    if (acceptError) {
      // Return the exact error from SQL (e.g., "Insufficient funds")
      return NextResponse.json({ error: acceptError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Accept Duel Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



// import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';
// import { supabaseAdmin } from '@/lib/supabase/admin';

// export async function POST(req: Request) {
//   try {
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//     const { duel_id, prediction } = await req.json(); // <-- Grab prediction
//     if (!duel_id || !prediction) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

//     const { error } = await supabaseAdmin.rpc('accept_duel', {
//       p_user_id: user.id,
//       p_duel_id: duel_id,
//       p_prediction: prediction // <-- Pass prediction to SQL
//     });

//     if (error) return NextResponse.json({ error: error.message }, { status: 400 });
//     return NextResponse.json({ success: true });

//   } catch (error: any) {
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }