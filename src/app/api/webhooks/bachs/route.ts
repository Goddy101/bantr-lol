import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-bachs-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const secret = process.env.BACHS_WEBHOOK_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('CRITICAL: Invalid webhook signature detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Bachs specifically uses 'collection.succeeded'
    if (event.type !== 'collection.succeeded') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const data = event.data;
    
    // Convert Bachs string format ("5000.00") back to integer (5000) for our database
    const amount = Math.floor(parseFloat(data.amount)); 
    
    // Bachs passes top-level metadata and reference into the data payload
    const reference = data.reference || data.checkout_id; 
    const userId = data.metadata?.user_id;

    if (!userId) throw new Error('No user_id found in metadata');

    const { error } = await supabaseAdmin.rpc('process_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_reference: reference
    });

    if (error) {
      if (error.code === '23505') {
        console.log(`Duplicate webhook ignored for ref: ${reference}`);
        return NextResponse.json({ message: 'Duplicate webhook.' }, { status: 200 });
      }
      throw error;
    }

    console.log(`Successfully funded ₦${amount} to user ${userId}`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}