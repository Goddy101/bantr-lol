import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-bachs-signature');
    const timestampHeader = req.headers.get('x-bachs-timestamp');

    // 1. Ensure required security headers exist
    if (!signatureHeader || !timestampHeader) {
      return NextResponse.json(
        { error: 'Missing X-Bachs-Signature or X-Bachs-Timestamp' },
        { status: 401 }
      );
    }

    const secret = process.env.BACHS_WEBHOOK_SECRET;
    if (!secret) {
      console.error('CRITICAL: BACHS_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 2. Reject stale deliveries (5-minute tolerance window)
    const timestamp = parseInt(timestampHeader, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(timestamp) || Math.abs(currentTime - timestamp) > 300) {
      console.error('CRITICAL: Webhook timestamp is outside the 300-second window.');
      return NextResponse.json({ error: 'Stale or invalid timestamp' }, { status: 401 });
    }

    // 3. Compute expected signature: HMAC-SHA256 of "{timestamp}.{raw_body}"
    const message = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message, 'utf8')
      .digest('hex');

    // 4. Timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      console.error('CRITICAL: Invalid Bachs webhook signature detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // 5. Only process successful collections
    if (event.type !== 'collection.succeeded') {
      return NextResponse.json({ message: `Ignored event: ${event.type}` }, { status: 200 });
    }

    const data = event.data;

    // Decimal string conversion (e.g. "5000.00" -> 5000 integer for wallet_balance)
    const amount = Math.floor(parseFloat(data.amount || '0'));
    const reference = data.reference || data.checkout_id || event.id;
    const userId = data.metadata?.user_id;

    if (!userId) {
      throw new Error('No user_id found in metadata');
    }

    // 6. Execute atomic credit to the user's vault
    const { error } = await supabaseAdmin.rpc('process_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_reference: reference,
    });

    if (error) {
      // Catch Postgres unique violation (idempotency / duplicate webhook)
      if (error.code === '23505') {
        console.log(`Duplicate webhook ignored for ref: ${reference}`);
        return NextResponse.json({ message: 'Duplicate webhook.' }, { status: 200 });
      }
      throw error;
    }

    console.log(`[Bachs Webhook] Successfully credited ₦${amount} to user ${userId}`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error('Bachs Webhook Error:', err.message);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}