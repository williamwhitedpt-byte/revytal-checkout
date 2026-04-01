import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { createOrder } from '@/lib/supabase';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_name, sku, supplier, price, cost } = body;

    if (!product_name || !sku || !supplier || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create Stripe Checkout Session
    const session = await createCheckoutSession({
      product_name,
      sku,
      supplier,
      price,
      cost
    });

    // 2. Generate QR code as data URI
    const qrDataUrl = await QRCode.toDataURL(session.url!, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
    });

    // 3. Log pending order in Supabase (NO margin field)
    await createOrder({
      product_name,
      sku,
      supplier,
      price,
      cost: cost ?? 0,
      checkout_url: session.url!,
      qr_code_url: qrDataUrl,
      status: 'pending',
      stripe_session_id: session.id,
    });

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
      qr_code: qrDataUrl,
    });
  } catch (err: unknown) {
    console.error('[create-checkout]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
