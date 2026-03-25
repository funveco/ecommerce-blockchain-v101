import { NextResponse } from 'next/server';
import { Wallet, JsonRpcProvider, parseUnits } from 'ethers';

const EURO_TOKEN_DECIMALS = 6;

const ADMIN_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const RPC_URL = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
const EURO_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

export async function POST(request: Request) {
  let response: NextResponse;
  
  try {
    if (!ADMIN_PRIVATE_KEY || !EURO_TOKEN_ADDRESS) {
      response = NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      response = NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const provider = new JsonRpcProvider(RPC_URL);
    const adminWallet = new Wallet(ADMIN_PRIVATE_KEY, provider);

    const euroTokenAbi = [
      'function mint(address to, uint256 amount) external onlyOwner',
      'function balanceOf(address account) view returns (uint256)',
    ];

    const euroToken = new (await import('ethers')).Contract(
      EURO_TOKEN_ADDRESS,
      euroTokenAbi,
      adminWallet
    );

    const amountInUnits = parseUnits(amount.toString(), EURO_TOKEN_DECIMALS);

    console.log(`Minting ${amount} EURT to admin wallet: ${adminWallet.address}`);

    const tx = await euroToken.mint(adminWallet.address, amountInUnits);
    const receipt = await tx.wait();

    const newBalance = await euroToken.balanceOf(adminWallet.address);

    response = NextResponse.json({
      success: true,
      txHash: tx.hash,
      amount,
      newBalance: (Number(newBalance) / 1e6).toFixed(2),
      adminWallet: adminWallet.address,
    });
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Mint failed:', error);
    response = NextResponse.json(
      { error: error.message || 'Failed to mint tokens' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export async function GET() {
  let response: NextResponse;
  
  try {
    if (!ADMIN_PRIVATE_KEY || !EURO_TOKEN_ADDRESS) {
      response = NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    const provider = new JsonRpcProvider(RPC_URL);
    const adminWallet = new Wallet(ADMIN_PRIVATE_KEY, provider);

    const euroTokenAbi = [
      'function balanceOf(address account) view returns (uint256)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
    ];

    const euroToken = new (await import('ethers')).Contract(
      EURO_TOKEN_ADDRESS,
      euroTokenAbi,
      provider
    );

    const balance = await euroToken.balanceOf(adminWallet.address);
    const name = await euroToken.name();
    const symbol = await euroToken.symbol();

    response = NextResponse.json({
      tokenName: name,
      tokenSymbol: symbol,
      adminWallet: adminWallet.address,
      balance: (Number(balance) / 1e6).toFixed(2),
      balanceRaw: balance.toString(),
    });
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Failed to get token info:', error);
    response = NextResponse.json(
      { error: error.message || 'Failed to get token info' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}