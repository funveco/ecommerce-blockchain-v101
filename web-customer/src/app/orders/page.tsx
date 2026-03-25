'use client';

import { useEffect, useState } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { InvoiceStatus } from '@/components/InvoiceStatus';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useWallet } from '@/hooks/useWallet';

export default function OrdersPage() {
  const { address, isConnected } = useWallet();
  const { invoices, getInvoicesByCustomer, isLoading, error } = useInvoices();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected) {
      getInvoicesByCustomer();
    }
  }, [mounted, isConnected, getInvoicesByCustomer]);

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1000000).toFixed(2);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isConnected) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Connect your wallet to view your orders</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-bold text-gray-900">E-commerce Store</a>
              <nav className="hidden md:flex gap-4 ml-8">
                <a href="/" className="text-gray-600 hover:text-gray-900">Products</a>
                <a href="/cart" className="text-gray-600 hover:text-gray-900">Cart</a>
                <a href="/orders" className="text-gray-900 font-medium">Orders</a>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>

        {isLoading && invoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!isLoading && invoices.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
            <a href="/" className="text-blue-600 hover:underline">
              Start Shopping
            </a>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.invoiceId.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      #{invoice.invoiceId.toString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(invoice.totalAmount)} EURT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InvoiceStatus 
                        isPaid={invoice.isPaid} 
                        txHash={invoice.paymentTxHash}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
