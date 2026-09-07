import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-bachs-signature');
    const timestampHeader = req.headers.get('x-bachs-timestamp');

    if (!signatureHeader || !timestampHeader) {
      return NextResponse.json({ error: 'Missing security headers' }, { status: 401 });
    }

    const secret = process.env.BACHS_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const timestamp = parseInt(timestampHeader, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(timestamp) || Math.abs(currentTime - timestamp) > 300) {
      return NextResponse.json({ error: 'Stale or invalid timestamp' }, { status: 401 });
    }

    const message = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex');
    const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const data = event.data;

    // ---------------------------------------------------------
    // 1. HANDLE DEPOSITS
    // ---------------------------------------------------------
    if (event.type === 'collection.succeeded') {
      const amount = Math.floor(parseFloat(data.amount || '0'));
      const reference = data.reference || data.checkout_id || event.id;
      const userId = data.metadata?.user_id;

      if (!userId) throw new Error('No user_id found in metadata');

      const { error } = await supabaseAdmin.rpc('process_deposit', {
        p_user_id: userId,
        p_amount: amount,
        p_reference: reference,
      });

      if (error && error.code === '23505') {
        return NextResponse.json({ message: 'Duplicate deposit webhook.' }, { status: 200 });
      } else if (error) throw error;

      console.log(`[Webhook] Credited ₦${amount} to ${userId}`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ---------------------------------------------------------
    // 2. HANDLE WITHDRAWALS
    // ---------------------------------------------------------
    else if (event.type === 'payout.paid' || event.type === 'payout.failed') {
      const reference = data.reference;
      if (!reference) throw new Error('No reference found in payout webhook');

      const finalStatus = event.type === 'payout.paid' ? 'completed' : 'failed';

      const { error } = await supabaseAdmin.rpc('resolve_withdrawal', {
        p_reference: reference,
        p_status: finalStatus
      });

      if (error) {
        // If it says it's already completed/failed, it's just a duplicate webhook. Safe to ignore.
        if (error.message.includes('already')) {
          return NextResponse.json({ message: 'Duplicate payout webhook ignored.' }, { status: 200 });
        }
        throw error;
      }

      console.log(`[Webhook] Withdrawal ${reference} marked as ${finalStatus}`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Ignore other events
    return NextResponse.json({ message: `Ignored event: ${event.type}` }, { status: 200 });

  } catch (err: any) {
    console.error('Bachs Webhook Error:', err.message);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}