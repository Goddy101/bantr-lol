import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Referee' }, { status: 401 });
    }

    // 1. FETCH ACTIVE DUELS
    const { data: activeDuels, error: fetchDuelsError } = await supabaseAdmin
      .from('duels')
      .select('id, match_id, creator_id, acceptor_id, prediction_creator, prediction_acceptor, status')
      .in('status', ['open', 'active']);

    // 2. FETCH ACTIVE RUMBLES
    // (Ensure you have added match_id to your rumble_pools table!)
    const { data: activeRumbles, error: fetchRumblesError } = await supabaseAdmin
      .from('rumble_pools')
      .select('id, match_id, status')
      .in('status', ['open', 'locked']);

    const duels = activeDuels || [];
    const rumbles = activeRumbles || [];

    if (duels.length === 0 && rumbles.length === 0) {
      return NextResponse.json({ message: 'No active/open matches to process' }, { status: 200 });
    }

    // 3. COMBINE MATCH IDs (So we only ping the API once per match, even if it has both duels and rumbles)
    const allMatchIds = [
      ...duels.map((d: any) => d.match_id),
      ...rumbles.map((r: any) => r.match_id)
    ].filter(Boolean); // Removes nulls/undefined

    const uniqueMatchIds = [...new Set(allMatchIds)];

    let refundedCount = 0;
    let resolvedCount = 0;
    let rumblesSettledCount = 0;

    const dbOperations: any[] = [];

    // 4. ASK FOOTBALL-DATA FOR MATCH STATUSES
    for (const matchId of uniqueMatchIds) {
      const apiResponse = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || '',
        }
      });

      if (!apiResponse.ok) continue; 

      const fixture = await apiResponse.json();
      const matchStatus = fixture.status;

      const hasStarted = !['SCHEDULED', 'TIMED'].includes(matchStatus);
      const isFinished = matchStatus === 'FINISHED';

      // Determine actual result if the match is finished
      let actualResult = 'draw';
      if (isFinished) {
        const homeGoals = fixture.score?.fullTime?.home ?? 0;
        const awayGoals = fixture.score?.fullTime?.away ?? 0;
        if (homeGoals > awayGoals) actualResult = 'home';
        if (awayGoals > homeGoals) actualResult = 'away';
      }

      // ==========================================
      // PROCESS 1V1 DUELS FOR THIS MATCH
      // ==========================================
      const duelsForThisMatch = duels.filter((d: any) => d.match_id === matchId.toString());

      if (hasStarted) {
        const ghostedDuels = duelsForThisMatch.filter((d: any) => d.status === 'open');
        for (const duel of ghostedDuels) {
          dbOperations.push(
            supabaseAdmin.rpc('refund_ghosted_duel', { p_duel_id: duel.id })
          );
          refundedCount++;
        }
      }

      if (isFinished) {
        const matchedDuels = duelsForThisMatch.filter((d: any) => d.status === 'active');

        for (const duel of matchedDuels) {
          let winnerId: string | null = null;
          let isRefund = false;

          if (duel.prediction_creator === actualResult) {
            winnerId = duel.creator_id;
          } else if (duel.prediction_acceptor === actualResult) {
            winnerId = duel.acceptor_id; 
          } else {
            isRefund = true; 
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

      // ==========================================
      // PROCESS RUMBLES FOR THIS MATCH
      // ==========================================
      if (isFinished) {
        const rumblesForThisMatch = rumbles.filter((r: any) => r.match_id === matchId.toString());

        for (const rumble of rumblesForThisMatch) {
          dbOperations.push(
            supabaseAdmin.rpc('settle_rumble', {
              p_rumble_id: rumble.id,
              p_winning_pick: actualResult
            })
          );
          rumblesSettledCount++;
        }
      }
    }

    // 5. EXECUTE ALL DATABASE LOCKS AND PAYOUTS SIMULTANEOUSLY
    if (dbOperations.length > 0) {
      await Promise.all(dbOperations);
    }

    return NextResponse.json({ 
      success: true, 
      ghosted_refunded: refundedCount,
      duels_resolved: resolvedCount,
      rumbles_settled: rumblesSettledCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Referee Error:', error.message);
    return NextResponse.json({ error: 'Failed to process matches' }, { status: 500 });
  }
}