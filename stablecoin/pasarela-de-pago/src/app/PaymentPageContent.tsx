'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PaymentConfirmation } from '@/components/PaymentConfirmation';
import { useWallet } from '@/hooks/useWallet';

export function PaymentPageContent() {
  const searchParams = useSearchParams();
  const { address, isConnected, isCorrectNetwork, connect } = useWallet();
  
  const invoiceId = searchParams.get('invoiceId');
  const companyId = searchParams.get('companyId');
  const amount = searchParams.get('amount');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!invoiceId || !companyId || !amount) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Payment Link</h1>
          <p className="text-gray-500">Missing payment parameters</p>
        </div>
      </main>
    );
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Connect Wallet</h1>
          <p className="text-gray-500 mb-4">Please connect your wallet to continue</p>
          <button
            onClick={connect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </main>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Wrong Network</h1>
          <p className="text-gray-500">Please switch to Anvil (localhost:8545)</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <a href="http://localhost:6004" className="text-blue-600 hover:underline text-sm">
            ← Back to Store
          </a>
        </div>
        
        <PaymentConfirmation
          invoiceId={invoiceId}
          companyId={companyId}
          amount={amount}
        />
      </div>
    </main>
  );
}
