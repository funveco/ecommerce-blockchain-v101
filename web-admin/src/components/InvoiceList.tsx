'use client';

import { useEffect, useState } from 'react';
import { useInvoices, Invoice, InvoiceFilter } from '@/hooks/useInvoices';

interface InvoiceListProps {
  companyId: bigint;
}

export function InvoiceList({ companyId }: InvoiceListProps) {
  const { invoices, getInvoicesByCompany, isLoading, error } = useInvoices();
  const [filter, setFilter] = useState<InvoiceFilter>('all');

  useEffect(() => {
    if (companyId) {
      getInvoicesByCompany(companyId, filter);
    }
  }, [companyId, filter, getInvoicesByCompany]);

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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading && invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading invoices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          No invoices found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.invoiceId.toString()}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    #{invoice.invoiceId.toString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatAddress(invoice.customerAddress)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatAmount(invoice.totalAmount)} EURT
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.timestamp)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.isPaid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {invoice.paymentTxHash && invoice.paymentTxHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? (
                      <a
                        href={`https://etherscan.io/tx/${invoice.paymentTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
