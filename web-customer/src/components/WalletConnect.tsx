'use client';

import { useWallet } from '@/hooks/useWallet';
import { ThemeToggle } from './ThemeToggle';

export function WalletConnect() {
  const { address, balance, eurTBalance, isConnected, isCorrectNetwork, connect, disconnect } = useWallet();

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      
      {!isConnected ? (
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      ) : !isCorrectNetwork ? (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">Wrong network</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          
          {balance && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {balance} ETH
            </div>
          )}
          
          {eurTBalance && (
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {eurTBalance} EURT
            </div>
          )}
          
          <button
            onClick={disconnect}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );
}
