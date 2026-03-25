'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';
import { CartItem } from '@/components/CartItem';
import { useCart } from '@/hooks/useCart';
import { useInvoices } from '@/hooks/useInvoices';
import { useWallet } from '@/hooks/useWallet';
import { useEURTBalance } from '@/hooks/useEURTBalance';
import { useToast } from '@/components/Toast';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, total, updateQuantity, removeFromCart, clearCart, syncWithBlockchain } = useCart();
  const { createInvoice, createInvoicesFromCart } = useInvoices();
  const { address, provider, isConnected } = useWallet();
  const { formattedBalance, hasEnoughBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useEURTBalance(provider, address);
  const { addToast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const shouldClearCart = searchParams.get('clearCart');
    if (shouldClearCart === 'true') {
      localStorage.removeItem('ecommerce_cart');
      window.location.href = '/cart';
      return;
    }
    syncWithBlockchain();
  }, [searchParams, syncWithBlockchain]);

  const formatPrice = (price: bigint) => {
    return (Number(price) / 1000000).toFixed(2);
  };

  const handleCheckout = async () => {
    if (!isConnected) {
      addToast('error', 'Please connect your wallet first');
      return;
    }
    if (items.length === 0) return;

    if (!hasEnoughBalance(total)) {
      addToast('error', `Insufficient EURT balance. You have ${formattedBalance} EURT but need ${(Number(total) / 1000000).toFixed(2)} EURT. Please purchase more EURT.`);
      return;
    }

    setIsCheckingOut(true);
    try {
      const uniqueCompanies = new Set(items.map(item => item.companyId.toString()));
      
      if (uniqueCompanies.size > 1) {
        const invoiceIds = await createInvoicesFromCart();
        
        if (invoiceIds.length === 0) {
          throw new Error('Failed to create invoices');
        }
        
        if (invoiceIds.length === 1) {
          window.location.href = `http://localhost:6002?invoiceId=${invoiceIds[0]}&companyId=${items[0].companyId}&amount=${total}`;
        } else {
          window.location.href = `http://localhost:6002?invoiceIds=${invoiceIds.join(',')}&amount=${total}`;
        }
      } else {
        const companyId = items[0].companyId;
        const invoiceId = await createInvoice(companyId);
        
        if (invoiceId === BigInt(0)) {
          throw new Error('Failed to create invoice');
        }
        
        window.location.href = `http://localhost:6002?invoiceId=${invoiceId}&companyId=${companyId}&amount=${total}`;
      }
    } catch (error: any) {
      console.error('Checkout failed:', error);
      addToast('error', error.message || 'Checkout failed. Make sure your wallet is connected and on Anvil network.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-bold text-gray-900">E-commerce Store</a>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <a href="/" className="text-blue-600 hover:underline">
              Continue Shopping
            </a>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <CartItem
                  key={item.productId.toString()}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {isConnected && (
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Your EURT Balance</span>
                  <span className={`text-sm font-medium ${hasEnoughBalance(total) ? 'text-green-600' : 'text-red-600'}`}>
                    {isLoadingBalance ? 'Loading...' : `${formattedBalance} EURT`}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(total)} EURT
                </span>
              </div>

              {!hasEnoughBalance(total) && isConnected && !isLoadingBalance && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-red-700">
                    Insufficient balance.{' '}
                    <a href="http://localhost:6001" className="underline font-medium">Buy EURT</a>
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={clearCart}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={!isConnected || isCheckingOut || (!hasEnoughBalance(total) && !isLoadingBalance)}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </div>
              
              {!isConnected && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  Connect your wallet to checkout
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
