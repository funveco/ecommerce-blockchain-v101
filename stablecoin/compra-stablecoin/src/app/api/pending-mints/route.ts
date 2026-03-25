import { NextResponse } from 'next/server';
import { getPendingMints } from '@/lib/daily-limit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    const pendingMints = getPendingMints(walletAddress);

    return NextResponse.json({
      pendingMints,
    });
  } catch (error) {
    console.error('Error fetching pending mints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending mints' },
      { status: 500 }
    );
  }
}
