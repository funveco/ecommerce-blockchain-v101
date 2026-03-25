import { useState, useCallback } from 'react';
import { useContract } from './useContract';

export interface Invoice {
  invoiceId: bigint;
  companyId: bigint;
  customerAddress: string;
  totalAmount: bigint;
  timestamp: bigint;
  isPaid: boolean;
  paymentTxHash: string;
}

export type InvoiceFilter = 'all' | 'paid' | 'pending';

export interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  getInvoicesByCompany: (companyId: bigint, filter?: InvoiceFilter) => Promise<void>;
  getInvoice: (invoiceId: bigint) => Promise<Invoice | null>;
}

export function useInvoices(): UseInvoicesReturn {
  const { ecommerceContract, isLoading: isContractLoading } = useContract();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformInvoice = (data: any): Invoice => ({
    invoiceId: data.invoiceId,
    companyId: data.companyId,
    customerAddress: data.customerAddress,
    totalAmount: data.totalAmount,
    timestamp: data.timestamp,
    isPaid: data.isPaid,
    paymentTxHash: data.paymentTxHash,
  });

  const getInvoicesByCompany = useCallback(async (companyId: bigint, filter: InvoiceFilter = 'all') => {
    if (!ecommerceContract) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ecommerceContract.getInvoicesByCompany(companyId);
      let filtered = data.map(transformInvoice).reverse();
      
      if (filter === 'paid') {
        filtered = filtered.filter((inv: Invoice) => inv.isPaid);
      } else if (filter === 'pending') {
        filtered = filtered.filter((inv: Invoice) => !inv.isPaid);
      }
      
      setInvoices(filtered);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract]);

  const getInvoice = useCallback(async (invoiceId: bigint): Promise<Invoice | null> => {
    if (!ecommerceContract) {
      setError('Contract not initialized');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ecommerceContract.getInvoice(invoiceId);
      return transformInvoice(data);
    } catch (err: any) {
      console.error('Failed to get invoice:', err);
      setError(err.message || 'Failed to get invoice');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract]);

  return {
    invoices,
    isLoading: isLoading || isContractLoading,
    error,
    getInvoicesByCompany,
    getInvoice,
  };
}
