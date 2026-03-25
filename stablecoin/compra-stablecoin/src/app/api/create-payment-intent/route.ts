import { NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
import { checkDailyLimit } from '@/lib/daily-limit';

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000;

function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, walletAddress } = body;

    if (!amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Amount and walletAddress are required' },
        { status: 400 }
      );
    }

    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT} EURT` },
        { status: 400 }
      );
    }

    if (!isValidEthAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    const dailyLimitCheck = checkDailyLimit(walletAddress, amount);
    if (!dailyLimitCheck.allowed) {
      return NextResponse.json(
        { error: dailyLimitCheck.message },
        { status: 400 }
      );
    }

    const paymentIntent = await createPaymentIntent(amount, walletAddress);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: 'eur',
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
