import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Referee' }, { status: 401 });
    }

    // 1. UPDATED SCHEMA: Fetch BOTH 'active' and 'open' duels with the correct column names
    const { data: activeDuels, error: fetchError } = await supabaseAdmin
      .from('duels')
      .select('id, match_id, creator_id, acceptor_id, prediction_creator, prediction_acceptor, status')
      .in('status', ['open', 'active']);

    if (fetchError || !activeDuels || activeDuels.length === 0) {
      return NextResponse.json({ message: 'No active/open duels to process' }, { status: 200 });
    }

    const uniqueMatchIds = [...new Set(activeDuels.map((d: any) => d.match_id))];
    
    let refundedCount = 0;
    let resolvedCount = 0;
    
    // Using any[] to completely avoid strict TS Promise errors with Supabase
    const dbOperations: any[] = [];

    // 2. UPDATED API: Ask Football-Data for the match statuses
    for (const matchId of uniqueMatchIds) {
      const apiResponse = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || '',
        }
      });

      // If we hit the 10-requests-per-minute free limit, skip and try again on the next cron run
      if (!apiResponse.ok) continue; 
      
      const fixture = await apiResponse.json();
      
      const matchStatus = fixture.status;
      
      // 'SCHEDULED' or 'TIMED' = Not started
      const hasStarted = !['SCHEDULED', 'TIMED'].includes(matchStatus);
      const isFinished = matchStatus === 'FINISHED';
      
      const duelsForThisMatch = activeDuels.filter((d: any) => d.match_id === matchId.toString());

      // ACTION 1: REFUND GHOSTED DUELS
      if (hasStarted) {
        const ghostedDuels = duelsForThisMatch.filter((d: any) => d.status === 'open');
        for (const duel of ghostedDuels) {
          dbOperations.push(
            supabaseAdmin.rpc('refund_ghosted_duel', { p_duel_id: duel.id })
          );
          refundedCount++;
        }
      }

      // ACTION 2: PAYOUT FINISHED DUELS
      if (isFinished) {
        // Look for 'active' duels instead of 'matched'
        const matchedDuels = duelsForThisMatch.filter((d: any) => d.status === 'active');
        
        // Football-Data puts the final scores in score.fullTime
        const homeGoals = fixture.score?.fullTime?.home ?? 0;
        const awayGoals = fixture.score?.fullTime?.away ?? 0;
        
        let actualResult = 'draw';
        if (homeGoals > awayGoals) actualResult = 'home';
        if (awayGoals > homeGoals) actualResult = 'away';

        for (const duel of matchedDuels) {
          let winnerId: string | null = null;
          let isRefund = false;

          // UPDATED: Use the correct prediction and acceptor columns
          if (duel.prediction_creator === actualResult) {
            winnerId = duel.creator_id;
          } else if (duel.prediction_acceptor === actualResult) {
            winnerId = duel.acceptor_id; 
          } else {
            isRefund = true; // Both got it wrong (e.g., Match was a draw, but they picked Home vs Away)
          }

          dbOperations.push(
            supabaseAdmin.rpc('resolve_duel', {
              p_duel_id: duel.id,
              p_winner_id: winnerId,
              p_is_refund: isRefund
            })
          );
          resolvedCount++;
        }
      }
    }

    // Execute all database locks and payouts simultaneously
    if (dbOperations.length > 0) {
      await Promise.all(dbOperations);
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
//     const authHeader = req.headers.get('authorization');
//     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//       return NextResponse.json({ error: 'Unauthorized Referee' }, { status: 401 });
//     }

//     // 1. Fetch BOTH matched and open duels
//     const { data: rawActiveDuels, error: fetchError } = await supabaseAdmin
//       .from('duels')
//       .select('id, match_id, creator_id, opponent_id, creator_prediction, opponent_prediction, status')
//       .in('status', ['open', 'matched']);

//     const activeDuels = rawActiveDuels as any[] | null;

//     if (fetchError || !activeDuels || activeDuels.length === 0) {
//       return NextResponse.json({ message: 'No active/open duels to process' }, { status: 200 });
//     }

//     // Added (d: any) to bypass strict typing errors if Supabase types are missing
//     const uniqueMatchIds = [...new Set(activeDuels.map((d: any) => d.match_id))];

//     const chunkArray = (arr: string[], size: number) => {
//       return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
//         arr.slice(i * size, i * size + size)
//       );
//     };
//     const idBatches = chunkArray(uniqueMatchIds, 20);

//     const apiResponses = await Promise.all(
//       idBatches.map(batch =>
//         fetch(`https://v3.football.api-sports.io/fixtures?ids=${batch.join('-')}`, {
//           headers: {
//             'x-apisports-key': process.env.API_FOOTBALL_KEY || '',
//           }
//         }).then(res => res.json())
//       )
//     );

//     // Added (data: any) so TS doesn't panic about API-Football's unknown JSON structure
//     const allFixtures = apiResponses.flatMap((data: any) => data.response || []);
    
//     let refundedCount = 0;
//     let resolvedCount = 0;
    
//     // Using standard Promise<any> array
//   // ✅ To this:
// const dbOperations: any[] = [];

//     // Added (fixture: any) 
//     for (const fixture of allFixtures as any[]) {
//       // Added optional chaining (?) to prevent runtime crashes if API data is malformed
//       const shortStatus = fixture?.fixture?.status?.short;
//       if (!shortStatus) continue;
      
//       const hasStarted = !['NS', 'TBD'].includes(shortStatus);
//       const isFinished = ['FT', 'AET', 'PEN'].includes(shortStatus);
      
//       const duelsForThisMatch = activeDuels.filter((d: any) => d.match_id === fixture.fixture.id.toString());

//       if (hasStarted) {
//         const ghostedDuels: any[] = duelsForThisMatch.filter((d: any) => d.status === 'open');
//         for (const duel of ghostedDuels) {
//           // PRO TIP: Adding .then(res => res) converts Supabase's weird builder into a pure Promise!
//           dbOperations.push(
//             supabaseAdmin.rpc('refund_ghosted_duel', { p_duel_id: duel.id })
//           );
//           refundedCount++;
//         }
//       }

//       if (isFinished) {
//         const matchedDuels = duelsForThisMatch.filter((d: any) => d.status === 'matched');
        
//         const homeGoals = fixture.goals?.home ?? 0;
//         const awayGoals = fixture.goals?.away ?? 0;
//         let actualResult = 'draw';
//         if (homeGoals > awayGoals) actualResult = 'home';
//         if (awayGoals > homeGoals) actualResult = 'away';

//         for (const duel of matchedDuels) {
//           // Explicitly define this as string | null so it matches the Postgres UUID requirement
//           let winnerId: string | null = null;
//           let isRefund = false;

//           if (duel.creator_prediction === actualResult) {
//             winnerId = duel.creator_id;
//           } else if (duel.opponent_prediction === actualResult) {
//             winnerId = duel.opponent_id;
//           } else {
//             isRefund = true; 
//           }

//           // Convert to pure promise with .then()
//          dbOperations.push(
//   supabaseAdmin.rpc('resolve_duel', {
//     p_duel_id: duel.id,
//     p_winner_id: winnerId,
//     p_is_refund: isRefund
//   })
// );
          
//           resolvedCount++;
//         }
//       }
//     }

//     if (dbOperations.length > 0) {
//       await Promise.all(dbOperations);
//     }

//     return NextResponse.json({ 
//       success: true, 
//       ghosted_refunded: refundedCount,
//       matches_resolved: resolvedCount 
//     }, { status: 200 });

//   } catch (error: any) {
//     console.error('Referee Error:', error.message);
//     return NextResponse.json({ error: 'Failed to process duels' }, { status: 500 });
//   }
// }