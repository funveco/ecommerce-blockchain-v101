import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';

const EURO_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
];

const euroTokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

export function useEURTBalance(provider: BrowserProvider | null, address: string | null) {
  const [balance, setBalance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!provider || !address || !euroTokenAddress) {
      setBalance(0n);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = new Contract(euroTokenAddress, EURO_TOKEN_ABI, provider);
      const rawBalance: bigint = await contract.balanceOf(address);
      setBalance(rawBalance);
    } catch (err: any) {
      console.error('Failed to fetch EURT balance:', err);
      setError(err.message || 'Failed to fetch balance');
      setBalance(0n);
    } finally {
      setIsLoading(false);
    }
  }, [provider, address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const formatBalance = (wei: bigint) => {
    const decimals = 6;
    const divisor = 10n ** BigInt(decimals);
    const whole = wei / divisor;
    const fraction = wei % divisor;
    return `${whole}.${fraction.toString().padStart(decimals, '0').slice(0, 2)}`;
  };

  const hasEnoughBalance = (amount: bigint) => balance >= amount;

  return {
    balance,
    formattedBalance: formatBalance(balance),
    isLoading,
    error,
    refetch: fetchBalance,
    hasEnoughBalance,
  };
}
