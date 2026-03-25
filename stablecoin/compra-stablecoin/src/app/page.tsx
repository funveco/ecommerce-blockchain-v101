'use client';

import { useState, useEffect } from 'react';
import { EuroTokenPurchase } from '@/components/EuroTokenPurchase';
import { useWallet } from '@/hooks/useWallet';

interface PendingMint {
  id: string;
  amount: number;
  stripePaymentId: string;
  status: string;
  createdAt: string;
}

export default function Home() {
  const { address } = useWallet();
  const [pendingMints, setPendingMints] = useState<PendingMint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rescuePaymentId, setRescuePaymentId] = useState('');
  const [rescueWallet, setRescueWallet] = useState('');
  const [isRescuing, setIsRescuing] = useState(false);
  const [showRescueForm, setShowRescueForm] = useState(false);

  useEffect(() => {
    if (address) {
      fetchPendingMints();
      setRescueWallet(address);
    }
  }, [address]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pending = params.get('pending');
    if (pending) {
      setSuccessMessage(`Payment successful! Your mint is pending. ID: ${pending}`);
    }
    const success = params.get('payment_intent');
    if (success) {
      setSuccessMessage('Payment successful! Tokens will be minted shortly.');
    }
  }, []);

  const fetchPendingMints = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/pending-mints?walletAddress=${address}`);
      const data = await response.json();
      setPendingMints(data.pendingMints || []);
    } catch (error) {
      console.error('Failed to fetch pending mints:', error);
    }
  };

  const handleClaim = async (pendingMintId: string) => {
    setClaimingId(pendingMintId);
    
    try {
      const response = await fetch('/api/claim-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingMintId, walletAddress: address }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Successfully claimed ${data.amount} EURT!`);
        fetchPendingMints();
      } else {
        alert(data.error || 'Failed to claim mint');
      }
    } catch (error) {
      console.error('Failed to claim mint:', error);
      alert('Failed to claim mint');
    } finally {
      setClaimingId(null);
    }
  };

  const handleRescue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescuePaymentId || !rescueWallet) return;

    setIsRescuing(true);
    try {
      const response = await fetch('/api/rescue-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentIntentId: rescuePaymentId,
          walletAddress: rescueWallet 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Successfully rescued ${data.amount} EURT! Tx: ${data.txHash}`);
        setRescuePaymentId('');
        setShowRescueForm(false);
      } else {
        alert(data.error || 'Failed to rescue mint');
      }
    } catch (error) {
      console.error('Failed to rescue mint:', error);
      alert('Failed to rescue mint');
    } finally {
      setIsRescuing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">EuroToken Purchase</h1>
        <p className="text-gray-600 mb-8">Buy EURT with your credit card</p>
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <EuroTokenPurchase />
          </div>
          
          {pendingMints.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Mints</h2>
              <div className="space-y-3">
                {pendingMints.map((mint) => (
                  <div key={mint.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{mint.amount} EURT</p>
                        <p className="text-sm text-gray-500">
                          {new Date(mint.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaim(mint.id)}
                        disabled={claimingId === mint.id}
                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        {claimingId === mint.id ? 'Claiming...' : 'Claim'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showRescueForm ? (
            <button
              onClick={() => setShowRescueForm(true)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Didn't receive your tokens? Rescue payment
            </button>
          ) : (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Rescue Your Tokens</h3>
              <form onSubmit={handleRescue} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Stripe Payment Intent ID (pi_...)
                  </label>
                  <input
                    type="text"
                    value={rescuePaymentId}
                    onChange={(e) => setRescuePaymentId(e.target.value)}
                    placeholder="pi_3TDUxN94PUPs0w7b..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Your Wallet Address
                  </label>
                  <input
                    type="text"
                    value={rescueWallet}
                    onChange={(e) => setRescueWallet(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isRescuing || !rescuePaymentId || !rescueWallet}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isRescuing ? 'Rescuing...' : 'Rescue Tokens'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRescueForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
