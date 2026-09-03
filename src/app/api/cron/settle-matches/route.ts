import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SettlementService } from '@/services/settlement.service';

// Standard match duration (90 mins + 15 min half + 10 min stoppage) = ~115 mins.
// We only check matches older than this to save API calls.
const MATCH_DURATION_MS = 115 * 60 * 1000; 

export async function GET(req: Request) {
  // Secure the cron route
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all ACTIVE duels. 
    // In production, your duels table should have a `match_start_time` column.
    const { data: activeDuels, error: fetchError } = await supabaseAdmin
      .from('duels')
      .select('id, match_id, creator_id, acceptor_id, prediction_creator, prediction_acceptor')
      .eq('status', 'active');

    if (fetchError || !activeDuels || activeDuels.length === 0) {
      return NextResponse.json({ message: 'No active duels to settle' }, { status: 200 });
    }

    // 2. Extract UNIQUE matches to save API calls (The "Batching" Hack)
    const uniqueMatchIds = Array.from(new Set(activeDuels.map(duel => duel.match_id)));
    console.log(`Checking ${uniqueMatchIds.length} unique matches for ${activeDuels.length} total duels.`);

    for (const matchId of uniqueMatchIds) {
      // 3. Hit your Free API (e.g., football-data.org or api-football free tier)
      // We only hit this ONCE per match, regardless of how many users bet on it.
      const matchResult = await checkMatchStatusFromAPI(matchId);

      // If the match isn't finished yet, skip to the next one
      if (matchResult.status !== 'FINISHED') continue;

      // 4. Find all duels tied to this specific finished match
      const duelsToSettle = activeDuels.filter(d => d.match_id === matchId);

      // 5. Process payouts for everyone
      for (const duel of duelsToSettle) {
        let winnerId = null;

        // Determine who won based on the real-life result ('home', 'away', or 'draw')
        if (duel.prediction_creator === matchResult.winning_prediction) {
          winnerId = duel.creator_id;
        } else if (duel.prediction_acceptor === matchResult.winning_prediction) {
          winnerId = duel.acceptor_id;
        }

        // Execute the atomic settlement we wrote in settlement.service.ts
        if (winnerId) {
          await SettlementService.settleDuel(duel.id, winnerId);
        } else {
          // Edge Case: If somehow neither won (or it was cancelled), implement a refund logic
          // await SettlementService.refundDuel(duel.id);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Settlement run complete.' }, { status: 200 });

  } catch (error: any) {
    console.error('Settlement Cron Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Helper to fetch data from your Free API.
 * API-Football (RapidAPI) gives 100 free calls/day. 
 * By batching, 100 calls = 100 distinct matches, which easily covers a weekend's top fixtures.
 */
async function checkMatchStatusFromAPI(matchId: string) {
  // Example using API-Football structure:
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${matchId}`, {
    headers: {
      'x-apisports-key': process.env.API_FOOTBALL_KEY!,
    }
  });
  
  const data = await res.json();
  const fixture = data.response[0];

  if (!fixture || fixture.fixture.status.short !== 'FT') {
    return { status: 'PENDING' };
  }

  // Determine the winning prediction based on goals
  const homeGoals = fixture.goals.home;
  const awayGoals = fixture.goals.away;
  
  let winningPrediction = 'draw';
  if (homeGoals > awayGoals) winningPrediction = 'home';
  if (awayGoals > homeGoals) winningPrediction = 'away';

  return {
    status: 'FINISHED',
    winning_prediction: winningPrediction
  };
}