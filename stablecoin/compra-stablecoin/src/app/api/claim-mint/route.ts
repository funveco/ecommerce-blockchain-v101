import { NextResponse } from 'next/server';
import { removePendingMint, getPendingMints } from '@/lib/daily-limit';
import { Wallet, JsonRpcProvider, parseUnits, Contract } from 'ethers';

const EURO_TOKEN_DECIMALS = 6;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pendingMintId, walletAddress } = body;

    if (!pendingMintId || !walletAddress) {
      return NextResponse.json(
        { error: 'pendingMintId and walletAddress are required' },
        { status: 400 }
      );
    }

    const allPendingMints = getPendingMints(walletAddress);
    const pendingMint = allPendingMints.find(pm => pm.id === pendingMintId);

    if (!pendingMint) {
      return NextResponse.json(
        { error: 'Pending mint not found' },
        { status: 404 }
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

    const euroTokenAbi = [
      'function mint(address to, uint256 amount) external',
    ];

    const euroToken = new Contract(euroTokenAddress, euroTokenAbi, wallet);

    const amountInUnits = parseUnits(pendingMint.amount.toString(), EURO_TOKEN_DECIMALS);
    const tx = await euroToken.mint(walletAddress, amountInUnits);    
    await tx.wait();

    removePendingMint(pendingMintId);

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      amount: pendingMint.amount,
    });
  } catch (error) {
    console.error('Error claiming mint:', error);
    return NextResponse.json(
      { error: 'Failed to claim mint' },
      { status: 500 }
    );
  }
}
