import { Contract, BrowserProvider } from 'ethers';

const EURO_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount) external',
];

export function getEuroTokenContract(address: string, provider: BrowserProvider): Contract {
  return new Contract(address, EURO_TOKEN_ABI, provider);
}

export function getEuroTokenContractWithSigner(
  address: string,
  provider: BrowserProvider,
  signer: any
): Contract {
  return new Contract(address, EURO_TOKEN_ABI, signer);
}
