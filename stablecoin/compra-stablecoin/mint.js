const ethers = require('ethers');

async function main() {
  const rpcUrl = 'http://localhost:8545';
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const euroTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const recipient = process.argv[2];
  const amount = process.argv[3] || '100';

  if (!recipient) {
    console.log('Usage: node mint.js <recipient_address> [amount]');
    console.log('Example: node mint.js 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 100');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const euroTokenAbi = ['function mint(address to, uint256 amount) external'];
  const euroToken = new ethers.Contract(euroTokenAddress, euroTokenAbi, wallet);

  const amountInUnits = ethers.parseUnits(amount, 6);
  console.log(`Minting ${amount} EURT to ${recipient}...`);

  const tx = await euroToken.mint(recipient, amountInUnits);
  console.log(`Transaction sent: ${tx.hash}`);
  
  await tx.wait();
  console.log(`Success! ${amount} EURT minted to ${recipient}`);
}

main().catch(console.error);
