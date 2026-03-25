'use client';

import { useWallet } from '@/hooks/useWallet';

export function WalletConnect() {
  const { address, balance, eurTBalance, isConnected, isCorrectNetwork, connect, disconnect } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex items-center gap-4">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">Wrong network. Please switch to Anvil (localhost:8545)</p>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-mono text-gray-700">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>
      
      {balance && (
        <div className="text-sm text-gray-600">
          {balance} ETH
        </div>
      )}
      
      {eurTBalance && (
        <div className="text-sm text-blue-600 font-medium">
          {eurTBalance} EURT
        </div>
      )}
      
      <button
        onClick={disconnect}
        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
