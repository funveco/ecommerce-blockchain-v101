'use client';

import { useEffect, useState } from 'react';
import { usePayment, PaymentStatus } from '@/hooks/usePayment';

interface PaymentConfirmationProps {
  invoiceId: string;
  companyId: string;
  amount: string;
}

export function PaymentConfirmation({ invoiceId, companyId, amount }: PaymentConfirmationProps) {
  const [needsApproval, setNeedsApproval] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'pending' | 'checking' | 'approved' | 'failed'>('idle');
  const { status, error, txHash, invoice, approveTokens, processPayment, checkAllowance, isLoading } = usePayment({
    invoiceId,
    companyId,
    amount,
  });

  useEffect(() => {
    const check = async () => {
      setApprovalStatus('checking');
      const hasAllowance = await checkAllowance();
      setNeedsApproval(!hasAllowance);
      setApprovalStatus(hasAllowance ? 'approved' : 'idle');
    };
    check();
  }, [checkAllowance]);

  const formatAmount = (amt: string) => {
    return (Number(amt) / 1000000).toFixed(2);
  };

  const handleApprove = async () => {
    setApprovalStatus('pending');
    try {
      await approveTokens();
      const hasAllowance = await checkAllowance();
      if (hasAllowance) {
        setNeedsApproval(false);
        setApprovalStatus('approved');
      } else {
        setApprovalStatus('failed');
      }
    } catch (err) {
      console.error('Approval failed:', err);
      setApprovalStatus('failed');
    }
  };

  const handlePay = async () => {
    const invoiceIdBigInt = BigInt(invoiceId);
    await processPayment(invoiceIdBigInt);
  };

  const isPending = status === 'idle' || status === 'approving' || status === 'processing';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Payment Confirmation</h2>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(amount)} EURT</p>
        </div>

        {invoice && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Invoice ID</p>
            <p className="font-mono text-sm text-gray-900">#{invoice.invoiceId?.toString()}</p>
            <p className="text-sm text-gray-500 mt-2">Status</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              invoice.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {invoice.isPaid ? 'Paid' : 'Pending'}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {isSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">Payment successful!</p>
            {txHash && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 underline"
              >
                View Transaction
              </a>
            )}
            <a
              href="http://localhost:6004?clearCart=true"
              className="block mt-3 text-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Store
            </a>
          </div>
        )}

        {!invoice?.isPaid && (
          <div className="space-y-4">
            {needsApproval && (
              <button
                onClick={handleApprove}
                disabled={approvalStatus === 'pending' || approvalStatus === 'checking'}
                className="w-full py-3 px-4 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {approvalStatus === 'checking' ? 'Checking...' : 
                 approvalStatus === 'pending' ? 'Approving...' : 
                 'Approve EURT Tokens'}
              </button>
            )}

            {approvalStatus === 'approved' && !needsApproval && (
              <button
                onClick={handlePay}
                disabled={isLoading || isSuccess}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : `Pay ${formatAmount(amount)} EURT`}
              </button>
            )}
          </div>
        )}

        {invoice?.isPaid && (
          <div className="text-center text-green-600 font-medium">
            This invoice has already been paid
          </div>
        )}
      </div>
    </div>
  );
}
