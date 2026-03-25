import { NextResponse } from 'next/server';
import { confirmPaymentIntent, isPaymentSuccessful } from '@/lib/stripe';
import { Wallet, JsonRpcProvider, parseUnits, Contract, getAddress, zeroPadValue, toBeHex } from 'ethers';

const EURO_TOKEN_DECIMALS = 6;

function normalizeAddress(addr: string): string {
  try {
    return getAddress(addr);
  } catch {
    return addr.toLowerCase();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, walletAddress, amount } = body;

    if (!paymentIntentId || !walletAddress) {
      return NextResponse.json(
        { error: 'paymentIntentId and walletAddress are required' },
        { status: 400 }
      );
    }

    const paymentIntent = await confirmPaymentIntent(paymentIntentId);

    if (!isPaymentSuccessful(paymentIntent)) {
      return NextResponse.json(
        { error: 'Payment not completed', status: paymentIntent.status },
        { status: 400 }
      );
    }

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
    const euroTokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

    if (!privateKey || !euroTokenAddress) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    const normalizedTokenAddress = normalizeAddress(euroTokenAddress);
    const normalizedRecipientAddress = normalizeAddress(walletAddress);

    const euroTokenAbi = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
    ];

    const euroToken = new Contract(normalizedTokenAddress, euroTokenAbi, wallet);

    const amountInUnits = amount 
      ? parseUnits(amount.toString(), EURO_TOKEN_DECIMALS)
      : parseUnits(paymentIntent.amount.toString(), 2);

    const deployerBalance = await euroToken.balanceOf(wallet.address);
    if (deployerBalance < amountInUnits) {
      return NextResponse.json(
        { error: `Insufficient balance. Deployer has ${deployerBalance}, need ${amountInUnits}` },
        { status: 400 }
      );
    }

    const tx = await euroToken.transfer(normalizedRecipientAddress, amountInUnits);
    await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      amount: paymentIntent.amount / 100,
      walletAddress: normalizedRecipientAddress,
    });
  } catch (error) {
    console.error('Error in rescue mint:', error);
    return NextResponse.json(
      { error: 'Failed to rescue mint' },
      { status: 500 }
    );
  }
}
