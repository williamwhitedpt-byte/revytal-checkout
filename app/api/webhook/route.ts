import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateOrderStatus } from '@/lib/supabase';
import { sendSupplierEmail } from '@/lib/email';
import Stripe from 'stripe';

// Must disable body parsing for Stripe signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const { sku, product_name, supplier, price, cost } = session.metadata ?? {};
    const sessionId = session.id;
    const customerEmail = session.customer_details?.email ?? undefined;
    const shippingDetails = session.shipping_details;

    // Format address
    const addr = shippingDetails?.address;
    const patientAddress = addr
      ? [
          shippingDetails?.name,
          addr.line1,
          addr.line2,
          `${addr.city}, ${addr.state} ${addr.postal_code}`,
          addr.country,
        ]
          .filter(Boolean)
          .join('\n')
      : undefined;

    const amountPaid = (session.amount_total ?? 0) / 100;

    try {
      // 1. Mark order as paid
      await updateOrderStatus(sessionId, 'paid', {
        patient_email: customerEmail,
        patient_address: patientAddress,
      });

      // 2. Send email to supplier
      await sendSupplierEmail({
        order_id: sessionId,
        product_name: product_name ?? 'Unknown',
        sku: sku ?? 'Unknown',
        supplier: supplier ?? 'Unknown',
        patient_email: customerEmail,
        patient_address: patientAddress,
        amount: amountPaid,
      });

      // 3. Mark as sent_to_supplier
      await updateOrderStatus(sessionId, 'sent_to_supplier');

      console.log(`[webhook] Order ${sessionId} processed and routed to ${supplier}`);
    } catch (err) {
      console.error('[webhook] Error processing order:', err);
      return NextResponse.json({ error: 'Order processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
