import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

const TARGET_CHAIN_ID = 31337;

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    isConnected: false,
    isCorrectNetwork: false,
  });
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask not installed');
      return;
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const balance = await browserProvider.getBalance(accounts[0]);

      const chainId = Number(network.chainId);

      setWallet({
        address: accounts[0],
        chainId,
        balance: (Number(balance) / 1e18).toFixed(4),
        isConnected: true,
        isCorrectNetwork: chainId === TARGET_CHAIN_ID,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      chainId: null,
      balance: null,
      isConnected: false,
      isCorrectNetwork: false,
    });
    setProvider(null);
  }, []);

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const checkExistingConnection = async () => {
      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        
        if (accounts && accounts.length > 0) {
          setProvider(browserProvider);
          const network = await browserProvider.getNetwork();
          const balance = await browserProvider.getBalance(accounts[0]);
          const chainId = Number(network.chainId);

          setWallet({
            address: accounts[0],
            chainId,
            balance: (Number(balance) / 1e18).toFixed(4),
            isConnected: true,
            isCorrectNetwork: chainId === TARGET_CHAIN_ID,
          });
        }
      } catch (error) {
        console.error('Failed to check existing connection:', error);
      }
    };

    checkExistingConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (wallet.address && accounts[0] !== wallet.address) {
        connect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [connect, disconnect, wallet.address]);

  return {
    ...wallet,
    provider,
    connect,
    disconnect,
  };
}
