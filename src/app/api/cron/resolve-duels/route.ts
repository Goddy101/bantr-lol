import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Referee' }, { status: 401 });
    }

    // 1. Fetch BOTH matched and open duels
    const { data: activeDuels, error: fetchError } = await supabaseAdmin
      .from('duels')
      .select('id, match_id, creator_id, opponent_id, creator_prediction, opponent_prediction, status')
      .in('status', ['open', 'matched']);

    if (fetchError || !activeDuels || activeDuels.length === 0) {
      return NextResponse.json({ message: 'No active/open duels to process' }, { status: 200 });
    }

    const uniqueMatchIds = [...new Set(activeDuels.map(d => d.match_id))];

    const apiResponse = await fetch(`https://v3.football.api-sports.io/fixtures?ids=${uniqueMatchIds.join('-')}`, {
      headers: {
        'x-rapidapi-key': process.env.API_FOOTBALL_KEY!,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    const apiData = await apiResponse.json();
    let refundedCount = 0;
    let resolvedCount = 0;

    for (const fixture of apiData.response) {
      const shortStatus = fixture.fixture.status.short;
      
      // 'NS' = Not Started, 'TBD' = To Be Defined. Anything else means the ball is rolling!
      const hasStarted = !['NS', 'TBD'].includes(shortStatus);
      const isFinished = ['FT', 'AET', 'PEN'].includes(shortStatus);
      
      const duelsForThisMatch = activeDuels.filter(d => d.match_id === fixture.fixture.id.toString());

      // ACTION 1: REFUND GHOSTED DUELS
      if (hasStarted) {
        const ghostedDuels = duelsForThisMatch.filter(d => d.status === 'open');
        for (const duel of ghostedDuels) {
          await supabaseAdmin.rpc('refund_ghosted_duel', { p_duel_id: duel.id });
          refundedCount++;
        }
      }

      // ACTION 2: PAYOUT FINISHED DUELS
      if (isFinished) {
        const matchedDuels = duelsForThisMatch.filter(d => d.status === 'matched');
        
        const homeGoals = fixture.goals.home;
        const awayGoals = fixture.goals.away;
        let actualResult = 'draw';
        if (homeGoals > awayGoals) actualResult = 'home';
        if (awayGoals > homeGoals) actualResult = 'away';

        for (const duel of matchedDuels) {
          let winnerId = null;
          let isRefund = false;

          if (duel.creator_prediction === actualResult) {
            winnerId = duel.creator_id;
          } else if (duel.opponent_prediction === actualResult) {
            winnerId = duel.opponent_id;
          } else {
            isRefund = true; // E.g., Match was a draw, but they picked Home vs Away
          }

          await supabaseAdmin.rpc('resolve_duel', {
            p_duel_id: duel.id,
            p_winner_id: winnerId,
            p_is_refund: isRefund
          });
          resolvedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      ghosted_refunded: refundedCount,
      matches_resolved: resolvedCount 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Referee Error:', error.message);
    return NextResponse.json({ error: 'Failed to process duels' }, { status: 500 });
  }
}







// import { NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabase/admin';

// export async function GET(req: Request) {
//   try {
//     // 1. Security Check: Ensure only your authorized Cron job can trigger this
//     const authHeader = req.headers.get('authorization');
//     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//       return NextResponse.json({ error: 'Unauthorized Referee' }, { status: 401 });
//     }

//     // 2. Find all unique match_ids from duels that are currently 'matched'
//     const { data: activeDuels, error: fetchError } = await supabaseAdmin
//       .from('duels')
//       .select('id, match_id, creator_id, opponent_id, creator_prediction, opponent_prediction')
//       .eq('status', 'matched');

//     if (fetchError || !activeDuels || activeDuels.length === 0) {
//       return NextResponse.json({ message: 'No active duels to resolve' }, { status: 200 });
//     }

//     // Get unique match IDs so we don't query the API multiple times for the same game
//     const uniqueMatchIds = [...new Set(activeDuels.map(d => d.match_id))];

//     // 3. Check API-Football for the real-life results
//     const apiResponse = await fetch(`https://v3.football.api-sports.io/fixtures?ids=${uniqueMatchIds.join('-')}`, {
//       headers: {
//         'x-rapidapi-key': process.env.API_FOOTBALL_KEY!,
//         'x-rapidapi-host': 'v3.football.api-sports.io'
//       }
//     });
    
//     const apiData = await apiResponse.json();
//     let resolvedCount = 0;

//     // 4. Loop through the matches and resolve duels
//     for (const fixture of apiData.response) {
//       // API-Football status codes: 'FT' (Full Time), 'AET' (After Extra Time), 'PEN' (Penalties)
//       const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short);
      
//       if (!isFinished) continue; // Match is still playing or delayed

//       // Determine the actual outcome
//       const homeGoals = fixture.goals.home;
//       const awayGoals = fixture.goals.away;
//       let actualResult = 'draw';
//       if (homeGoals > awayGoals) actualResult = 'home';
//       if (awayGoals > homeGoals) actualResult = 'away';

//       // Find all duels tied to this specific match
//       const duelsForThisMatch = activeDuels.filter(d => d.match_id === fixture.fixture.id.toString());

//       for (const duel of duelsForThisMatch) {
//         let winnerId = null;
//         let isRefund = false;

//         // Check who got it right
//         if (duel.creator_prediction === actualResult) {
//           winnerId = duel.creator_id;
//         } else if (duel.opponent_prediction === actualResult) {
//           winnerId = duel.opponent_id;
//         } else {
//           // If the match was a draw, but they picked Home vs Away, it's a refund.
//           isRefund = true;
//         }

//         // 5. Execute the Payout
//         await supabaseAdmin.rpc('resolve_duel', {
//           p_duel_id: duel.id,
//           p_winner_id: winnerId,
//           p_is_refund: isRefund
//         });

//         resolvedCount++;
//       }
//     }

//     return NextResponse.json({ success: true, duels_resolved: resolvedCount }, { status: 200 });

//   } catch (error: any) {
//     console.error('Referee Error:', error.message);
//     return NextResponse.json({ error: 'Failed to resolve duels' }, { status: 500 });
//   }
// }