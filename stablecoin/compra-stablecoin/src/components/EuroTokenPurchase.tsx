'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useWallet, switchToAnvil } from '@/hooks/useWallet';
import { useEuroToken } from '@/hooks/useEuroToken';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PurchaseResult {
  success: boolean;
  txHash?: string;
  walletAddress?: string;
  amount?: number;
  error?: string;
}

interface PurchaseFormProps {
  onSuccess?: (result: PurchaseResult) => void;
}

interface CheckoutFormProps {
  amount: number;
  walletAddress: string;
  onSuccess?: (result: PurchaseResult) => void;
}

function CheckoutForm({ amount, walletAddress, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { refresh } = useEuroToken();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'processing' | 'confirming'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);
    setTransferStatus('processing');

    try {
      const returnUrl = `${window.location.origin}/?payment_intent=`;
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setTransferStatus('idle');
        onSuccess?.({ success: false, error: submitError.message });
        throw new Error(submitError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        setError('Payment confirmed. Transferring tokens to your wallet...');

        const mintResponse = await fetch('/api/mint-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            walletAddress: walletAddress,
            amount,
          }),
        });

        const mintData = await mintResponse.json();

        if (mintData.success) {
          setTransferStatus('confirming');
          setError('Transfer complete! Updating balance...');
          setTimeout(() => {
            refresh();
          }, 2000);
          onSuccess?.({
            success: true,
            txHash: mintData.txHash,
            walletAddress: walletAddress,
            amount,
          });
        } else {
          setTransferStatus('idle');
          onSuccess?.({
            success: false,
            error: mintData.error || 'Failed to transfer tokens. Please contact support.',
            walletAddress: walletAddress,
            amount,
          });
        }
      }
    } catch (err) {
      setTransferStatus('idle');
      if (!error) {
        setError(err instanceof Error ? err.message : 'Payment failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Amount: <span className="font-medium">{amount} EURT</span></p>
        <p className="text-xs text-gray-500 mt-1">Destination: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
      </div>

      <PaymentElement />

      {error && (
        <div className={`p-3 border rounded-lg ${transferStatus !== 'idle' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${transferStatus !== 'idle' ? 'text-blue-800' : 'text-red-800'}`}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay ${amount} EURT`}
      </button>
      
      {transferStatus === 'processing' && (
        <div className="text-center">
          <p className="text-xs text-blue-600 animate-pulse">
            Processing payment and transferring tokens...
          </p>
        </div>
      )}
    </form>
  );
}

function PurchaseForm({ onSuccess }: PurchaseFormProps) {
  const wallet = useWallet();
  const address = wallet.address;
  const isCorrectNetwork = wallet.isCorrectNetwork;
  const chainId = wallet.chainId;

  const [amount, setAmount] = useState<number>(100);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'error'>('idle');

  const handlePaymentResult = (result: PurchaseResult) => {
    onSuccess?.(result);
  };

  const handleCreatePaymentIntent = async () => {
    if (!address) return;

    setError(null);
    setPaymentStatus('processing');

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, walletAddress: address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment intent');
      setPaymentStatus('error');
    }
  };

  if (!isCorrectNetwork) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
        <p className="text-yellow-800">
          Current chain: <span className="font-mono">{chainId ?? 'unknown'}</span>. Please switch to Anvil (chainId: 31337)
        </p>
        <button
          onClick={switchToAnvil}
          className="w-full py-2 px-4 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700"
        >
          Switch to Anvil Network
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (EURT)
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
          />
          <p className="text-sm text-gray-500 mt-1">Min: 1 EURT, Max: 1000 EURT</p>
        </div>

        <button
          onClick={handleCreatePaymentIntent}
          disabled={paymentStatus === 'processing'}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentStatus === 'processing' ? 'Creating...' : 'Proceed to Payment'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm amount={amount} walletAddress={address || ''} onSuccess={handlePaymentResult} />
    </Elements>
  );
}

function PaymentResultModal({ 
  result, 
  onClose 
}: { 
  result: PurchaseResult; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        {result.success ? (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Compra Exitosa!
              </h3>
              <p className="text-gray-600">
                Tus tokens EURT han sido mintados correctamente.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Cantidad:</span>
                  <span className="text-green-800 font-bold">{result.amount} EURT</span>
                </div>
                <div className="border-t border-green-200 pt-3">
                  <span className="text-green-700 font-medium block mb-1">Billetera receptora:</span>
                  <p className="text-green-800 font-mono text-sm break-all bg-green-100 p-2 rounded">
                    {result.walletAddress}
                  </p>
                </div>
                {result.txHash && (
                  <div className="border-t border-green-200 pt-3">
                    <span className="text-green-700 font-medium block mb-1">Hash de transacción:</span>
                    <p className="text-green-800 font-mono text-sm break-all bg-green-100 p-2 rounded">
                      {result.txHash}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-700 text-sm">
                <strong>Nota:</strong> Los tokens pueden tardar unos minutos en aparecer en tu balance. 
                Puedes verificar el estado en tu billetera MetaMask.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Error en la Compra
              </h3>
              <p className="text-gray-600">
                {result.error || 'Ocurrió un error durante el proceso de compra.'}
              </p>
            </div>

            {result.walletAddress && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">
                  <strong>Billetera:</strong> {result.walletAddress}
                </p>
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {result.success ? 'Entendido' : 'Cerrar'}
        </button>
      </div>
    </div>
  );
}

export function EuroTokenPurchase() {
  const { address, connect, disconnect, isConnected, isCorrectNetwork, chainId } = useWallet();
  const { balance, isLoading, refresh } = useEuroToken();
  const [showForm, setShowForm] = useState(false);
  const [walletStatus, setWalletStatus] = useState<string>('');
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_intent')) {
      setShowForm(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      setWalletStatus('MetaMask not detected. Please install the MetaMask extension.');
    } else if (!isConnected) {
      setWalletStatus('Wallet not connected. Click the button below to connect.');
    } else if (!isCorrectNetwork) {
      setWalletStatus(`Wrong network. Current: ${chainId ?? 'unknown'}, Required: 31337 (Anvil)`);
    } else {
      setWalletStatus('');
    }
  }, [isConnected, isCorrectNetwork, chainId]);

  const handlePurchaseResult = (result: PurchaseResult) => {
    setPurchaseResult(result);
    if (result.success) {
      refresh();
    }
  };

  const handleCloseModal = () => {
    setPurchaseResult(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {purchaseResult && (
        <PaymentResultModal result={purchaseResult} onClose={handleCloseModal} />
      )}
      
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Buy EuroToken (EURT)</h2>
      
      {walletStatus && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">{walletStatus}</p>
        </div>
      )}
      
      {isConnected ? (
        <>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Your wallet: <span className="font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span></p>
            <p className="text-sm text-gray-600">
              Balance: {isLoading ? 'Loading...' : `${balance || 0} EURT`}
            </p>
          </div>
          
          {!showForm ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowForm(true)}
                disabled={!isCorrectNetwork}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy EURT
              </button>
              <button
                onClick={disconnect}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <PurchaseForm onSuccess={handlePurchaseResult} />
          )}
        </>
      ) : (
        <button
          onClick={connect}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          Connect Wallet to Buy
        </button>
      )}
    </div>
  );
}
