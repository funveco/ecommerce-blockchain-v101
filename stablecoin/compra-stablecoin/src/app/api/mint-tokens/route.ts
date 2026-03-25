import { NextResponse } from 'next/server';
import { confirmPaymentIntent, isPaymentSuccessful } from '@/lib/stripe';
import { recordPendingMint } from '@/lib/daily-limit';
import { Wallet, JsonRpcProvider, parseUnits } from 'ethers';

const EURO_TOKEN_DECIMALS = 6;

const processedPayments = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, walletAddress, amount } = body;

    if (!paymentIntentId || !walletAddress || !amount) {
      return NextResponse.json(
        { error: 'paymentIntentId, walletAddress, and amount are required' },
        { status: 400 }
      );
    }

    if (processedPayments.has(paymentIntentId)) {
      return NextResponse.json(
        { error: 'Payment already processed' },
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

    processedPayments.add(paymentIntentId);

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
    const euroTokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

    if (!privateKey || !euroTokenAddress) {
      recordPendingMint(walletAddress, amount, paymentIntentId);
      return NextResponse.json({
        success: false,
        pendingMintId: `pm_${paymentIntentId}`,
        message: 'Tokens pending — claim from your account',
      });
    }

    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);

      const euroTokenAbi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address account) view returns (uint256)',
      ];

      const euroToken = new (await import('ethers')).Contract(
        euroTokenAddress,
        euroTokenAbi,
        wallet
      );

      const amountInUnits = parseUnits(amount.toString(), EURO_TOKEN_DECIMALS);

      const serverBalance = await euroToken.balanceOf(wallet.address);
      if (serverBalance < amountInUnits) {
        console.error('Insufficient server balance:', serverBalance.toString());
        recordPendingMint(walletAddress, amount, paymentIntentId);
        return NextResponse.json({
          success: false,
          error: 'Server wallet has insufficient tokens. Please contact support.',
        }, { status: 400 });
      }

      const tx = await euroToken.transfer(walletAddress, amountInUnits);
      
      const receipt = await tx.wait();

      return NextResponse.json({
        success: true,
        txHash: tx.hash,
        amount,
        walletAddress,
      });
    } catch (transferError) {
      console.error('Transfer failed:', transferError);
      recordPendingMint(walletAddress, amount, paymentIntentId);
      
      return NextResponse.json({
        success: false,
        error: transferError instanceof Error ? transferError.message : 'Transfer failed',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing transfer:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}
