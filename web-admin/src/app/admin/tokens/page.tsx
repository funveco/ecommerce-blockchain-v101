'use client';

import { useState, useEffect } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { useWallet } from '@/hooks/useWallet';

const ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

interface TokenInfo {
  tokenName: string;
  tokenSymbol: string;
  adminWallet: string;
  balance: string;
  balanceRaw: string;
}

export default function TokenManagement() {
  const { address, isConnected } = useWallet();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mintAmount, setMintAmount] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  const hasZeroBalance = tokenInfo && parseFloat(tokenInfo.balance) === 0;

  useEffect(() => {
    if (isConnected) {
      fetchTokenInfo();
    }
  }, [isConnected]);

  const fetchTokenInfo = async () => {
    try {
      const res = await fetch('/api/admin-mint');
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setTokenInfo(data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch token info' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setIsMinting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(mintAmount) }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Successfully minted ${data.amount} EURT!` });
        setMintAmount('');
        fetchTokenInfo();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to mint tokens' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to mint tokens' });
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-gray-900">Token Management</h1>
              <WalletConnect />
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Connect your wallet to access token management</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-gray-900">Token Management</h1>
              <WalletConnect />
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-500">Access denied. Only the admin wallet can access this page.</p>
            <p className="text-gray-500 mt-2">Admin address: {ADMIN_ADDRESS}</p>
            <p className="text-gray-500 mt-1">Your address: {address}</p>
            
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Become Admin</h3>
              <p className="text-blue-700 mb-4">
                To mint tokens, you need to switch to the admin wallet in MetaMask.
              </p>
              <button
                onClick={async () => {
                  try {
                    await window.ethereum.request({
                      method: 'wallet_requestPermissions',
                      params: [{ eth_accounts: {} }]
                    });
                    window.location.reload();
                  } catch (err) {
                    console.error('Failed to request account switch:', err);
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch to Admin Account
              </button>
              <p className="text-xs text-blue-600 mt-4">
                Click the button above, then select the admin account (0xf39F...) in MetaMask
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Token Management</h1>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Admin
              </span>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">EURT Token Administration</h2>
          <p className="text-gray-600 mt-1">Manage EURT token supply</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {hasZeroBalance && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Balance is 0 - Action Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The server wallet has 0 EURT. To enable customers to purchase EURT, you must mint new tokens first.</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Enter the amount of EURT to mint in the form below</li>
                    <li>Click "Mint Tokens"</li>
                    <li>Wait for the transaction to complete</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading token info...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Token Name</span>
                  <span className="font-medium text-gray-900">{tokenInfo?.tokenName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Symbol</span>
                  <span className="font-medium text-gray-900">{tokenInfo?.tokenSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Admin Wallet</span>
                  <span className="font-mono text-sm text-gray-900">
                    {tokenInfo?.adminWallet?.slice(0, 6)}...{tokenInfo?.adminWallet?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-500 font-medium">Current Balance</span>
                  <span className={`font-bold text-xl ${hasZeroBalance ? 'text-red-600' : 'text-gray-900'}`}>
                    {tokenInfo?.balance} EURT
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mint New Tokens</h3>
              <form onSubmit={handleMint}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (EURT)
                  </label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="Enter amount to mint"
                    min="1"
                    step="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isMinting || !mintAmount}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMinting ? 'Minting...' : 'Mint Tokens'}
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  New tokens will be minted to the admin wallet
                </p>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
          <div className="flex gap-4">
            <button
              onClick={fetchTokenInfo}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
            >
              Refresh Balance
            </button>
            <a
              href="http://localhost:6001"
              target="_blank"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
            >
              Go to EURT Purchase Page
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}