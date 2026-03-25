import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, formatUnits } from 'ethers';
import { useWallet } from './useWallet';
import { getEuroTokenContract } from '../lib/contracts';

const EURO_TOKEN_DECIMALS = 6;

export interface EuroTokenState {
  balance: string | null;
  allowance: string | null;
  isLoading: boolean;
  error: string | null;
  lastMintEvent: { amount: string; timestamp: number } | null;
}

export function useEuroToken() {
  const { address, provider, isConnected, isCorrectNetwork } = useWallet();
  const [state, setState] = useState<EuroTokenState>({
    balance: null,
    allowance: null,
    isLoading: true,
    error: null,
    lastMintEvent: null,
  });

  const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

  const fetchBalance = useCallback(async () => {
    if (!address || !provider || !contractAddress || !contractAddress.startsWith('0x')) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const contract = getEuroTokenContract(contractAddress, provider);
      console.log('Fetching balance from contract:', contractAddress);
      const balanceRaw = await contract.balanceOf(address);
      console.log('Balance raw:', balanceRaw);
      const balance = formatUnits(balanceRaw, EURO_TOKEN_DECIMALS);

      setState(prev => ({
        ...prev,
        balance,
        isLoading: false,
        error: null,
      }));
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'BAD_DATA' || err.message?.includes('could not decode') || err.message?.includes('no contract code')) {
        setState(prev => ({
          ...prev,
          balance: '0',
          isLoading: false,
          error: null,
        }));
      } else {
        console.error('Failed to fetch balance:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch balance',
        }));
      }
    }
  }, [address, provider, contractAddress]);

  const fetchAllowance = useCallback(async () => {
    if (!address || !provider || !contractAddress || !contractAddress.startsWith('0x')) return;

    try {
      const contract = getEuroTokenContract(contractAddress, provider);
      const owner = address;
      const spender = contractAddress;
      const allowanceRaw = await contract.allowance(owner, spender);
      const allowance = formatUnits(allowanceRaw, EURO_TOKEN_DECIMALS);

      setState(prev => ({ ...prev, allowance }));
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'BAD_DATA' || err.message?.includes('could not decode') || err.message?.includes('no contract code')) {
        setState(prev => ({ ...prev, allowance: '0' }));
      } else {
        console.error('Failed to fetch allowance:', error);
        setState(prev => ({ ...prev, allowance: '0' }));
      }
    }
  }, [address, provider, contractAddress]);

  const handleMintEvent = useCallback((from: string, to: string, amount: bigint, event: any) => {
    if (to.toLowerCase() === address?.toLowerCase()) {
      setState(prev => ({
        ...prev,
        lastMintEvent: {
          amount: formatUnits(amount, EURO_TOKEN_DECIMALS),
          timestamp: Date.now(),
        },
      }));
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchBalance();
      fetchAllowance();
    } else {
      setState({
        balance: null,
        allowance: null,
        isLoading: false,
        error: null,
        lastMintEvent: null,
      });
    }
  }, [isConnected, isCorrectNetwork, fetchBalance, fetchAllowance]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetchBalance();
    fetchAllowance();
  }, [fetchBalance, fetchAllowance]);

  return {
    ...state,
    refresh,
    contractAddress,
  };
}
