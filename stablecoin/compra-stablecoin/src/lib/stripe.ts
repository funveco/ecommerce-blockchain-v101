import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPaymentIntent(amount: number, walletAddress: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: 'eur',
    metadata: {
      walletAddress,
      amountEURT: amount.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

export function isPaymentSuccessful(paymentIntent: Stripe.PaymentIntent) {
  return paymentIntent.status === 'succeeded';
}
