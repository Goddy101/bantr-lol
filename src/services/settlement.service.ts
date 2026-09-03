import { supabaseAdmin } from '@/lib/supabase/admin';

// ==========================================
// CORE PLATFORM MATH (10% Total Commission)
// ==========================================
const COMMISSION_RATE = 0.10; 
const JACKPOT_RATE = 0.05;    // 5% of Total Pot goes to Weekly Jackpot
const ADMIN_RATE = 0.025;     // 2.5% of Total Pot goes to Group Admin
const HOUSE_RATE = 0.025;     // 2.5% of Total Pot goes to bantr.lol Master Wallet

export const SettlementService = {
  
  /**
   * STEP 1: ACCEPT & ESCROW
   * When Emeka clicks "Accept", deduct his stake and lock the duel.
   * (Assumes the Creator's stake was already deducted upon creation).
   */
  async acceptDuel(duelId: string, acceptorId: string) {
    // 1. Fetch the duel to get the stake amount
    const { data: duel, error: fetchError } = await supabaseAdmin
      .from('duels')
      .select('*')
      .eq('id', duelId)
      .single();

    if (fetchError || !duel) throw new Error('Duel not found');
    if (duel.status !== 'open') throw new Error('Duel is no longer open');

    const stakeAmount = duel.stake_amount;

    // 2. Execute Escrow Lock via Supabase RPC (Atomic Transaction)
    // We use an RPC here so the balance deduction and duel update happen at the exact same time.
    const { error: escrowError } = await supabaseAdmin.rpc('lock_escrow', {
      p_duel_id: duelId,
      p_acceptor_id: acceptorId,
      p_stake_amount: stakeAmount
    });

    if (escrowError) {
      throw new Error(`Escrow failed: Insufficient funds or database error.`);
    }

    return { success: true, message: 'Duel accepted and funds locked' };
  },

  /**
   * STEP 2: SETTLE MATCH & DISTRIBUTE SPLIT
   * When the match ends, calculate the math and pay everyone out.
   */
  async settleDuel(duelId: string, winnerId: string) {
    // 1. Fetch duel details and the creator's admin referrer (if any)
    const { data: duel, error: duelError } = await supabaseAdmin
      .from('duels')
      .select('*, creator:users!creator_id(referred_by_admin)')
      .eq('id', duelId)
      .single();

    if (duelError || !duel) throw new Error('Duel not found');
    if (duel.status !== 'active') throw new Error('Duel is not active');

    // 2. Calculate the Math
    const totalPot = duel.stake_amount * 2;               // E.g., 1000 * 2 = 2000
    const totalCommission = totalPot * COMMISSION_RATE;   // E.g., 2000 * 0.10 = 200

    const winnerPayout = totalPot - totalCommission;      // E.g., 2000 - 200 = 1800
    const jackpotCut = totalPot * JACKPOT_RATE;           // E.g., 2000 * 0.05 = 100
    const houseCut = totalPot * HOUSE_RATE;               // E.g., 2000 * 0.025 = 50
    const adminCut = totalPot * ADMIN_RATE;               // E.g., 2000 * 0.025 = 50

    // Check if the user was referred by an admin. If not, the house keeps the admin cut.
    const adminId = duel.creator?.referred_by_admin || null;
    const finalHouseCut = adminId ? houseCut : (houseCut + adminCut);
    const finalAdminCut = adminId ? adminCut : 0;

    // 3. Execute the Payout via RPC (Atomic Transaction)
    const { error: settlementError } = await supabaseAdmin.rpc('settle_match_payouts', {
      p_duel_id: duelId,
      p_winner_id: winnerId,
      p_winner_payout: winnerPayout,
      p_jackpot_cut: jackpotCut,
      p_house_cut: finalHouseCut,
      p_admin_id: adminId,
      p_admin_cut: finalAdminCut
    });

    if (settlementError) {
      throw new Error(`Settlement failed: ${settlementError.message}`);
    }

    return { 
      success: true, 
      payouts: { winnerPayout, jackpotCut, finalHouseCut, finalAdminCut } 
    };
  }
};