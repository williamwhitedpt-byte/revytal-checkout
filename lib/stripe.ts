import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export interface CheckoutProduct {
  product_name: string;
  sku: string;
  supplier: string;
  price: number; // dollars
  cost: number;
}

export async function createCheckoutSession(product: CheckoutProduct) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(product.price * 100), // cents
          product_data: {
            name: product.product_name,
            metadata: {
              sku: product.sku,
              supplier: product.supplier,
            },
          },
        },
        quantity: 1,
      },
    ],
    // Collect shipping address so we can route to supplier
    shipping_address_collection: {
      allowed_countries: ['US'],
    },
    // Pass metadata so webhook can reconstruct the order
    metadata: {
      sku: product.sku,
      product_name: product.product_name,
      supplier: product.supplier,
      price: String(product.price),
      cost: String(product.cost),
    },
    success_url: `${appUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/`,
  });

  return session;
}
