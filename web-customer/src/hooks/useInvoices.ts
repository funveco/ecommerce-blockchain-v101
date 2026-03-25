import { useState, useCallback } from 'react';
import { useContract } from './useContract';
import { useWallet } from './useWallet';

export interface Invoice {
  invoiceId: bigint;
  companyId: bigint;
  customerAddress: string;
  totalAmount: bigint;
  timestamp: bigint;
  isPaid: boolean;
  paymentTxHash: string;
}

export interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  createInvoice: (companyId: bigint) => Promise<bigint>;
  createInvoicesFromCart: () => Promise<bigint[]>;
  getInvoicesByCustomer: () => Promise<void>;
  getInvoice: (invoiceId: bigint) => Promise<Invoice | null>;
}

export function useInvoices(): UseInvoicesReturn {
  const { ecommerceContract, ecommerceContractWithSigner, isLoading: isContractLoading } = useContract();
  const { address, isConnected } = useWallet();
  
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

  const createInvoice = useCallback(async (companyId: bigint): Promise<bigint> => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      throw new Error('Contract not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Creating invoice for companyId:', companyId.toString());
      
      // Get current invoices before
      const invoicesBefore = await ecommerceContract.getInvoicesByCustomer(address);
      const countBefore = invoicesBefore?.length || 0;
      
      const tx = await ecommerceContractWithSigner.createInvoice(companyId);
      console.log('Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('Receipt status:', receipt.status);
      
      if (!receipt.status) {
        throw new Error('Transaction reverted');
      }
      
      // Get invoices after and find the new one
      const invoicesAfter = await ecommerceContract.getInvoicesByCustomer(address);
      console.log('Invoices before:', countBefore, 'Invoices after:', invoicesAfter.length);
      
      let invoiceId: bigint | undefined;
      if (invoicesAfter.length > countBefore) {
        // Find the newest invoice
        const sorted = [...invoicesAfter].sort((a, b) => Number(b.invoiceId - a.invoiceId));
        invoiceId = sorted[0]?.invoiceId;
      }
      
      if (!invoiceId) {
        throw new Error('Failed to create invoice - no new invoice found');
      }
      
      console.log('Created invoice ID:', invoiceId.toString());
      return invoiceId;
    } catch (err: any) {
      console.error('Failed to create invoice:', err);
      const errorMsg = err.message || 'Failed to create invoice';
      if (errorMsg.includes('EmptyCart')) {
        setError('El carrito está vacío. Agrega productos antes de pagar.');
      } else if (errorMsg.includes('InsufficientStock')) {
        setError('No hay suficiente stock de algunos productos.');
      } else if (errorMsg.includes('CompanyNotActive')) {
        setError('La empresa no está activa.');
      } else if (errorMsg.includes('ProductNotForCompany')) {
        setError('Los productos en el carrito son de diferentes empresas. Por favor, compra de una empresa a la vez.');
      } else if (errorMsg.includes('ProductNotActive')) {
        setError('Uno de los productos no está activo.');
      } else {
        setError(errorMsg);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContractWithSigner, ecommerceContract, address]);

  const createInvoicesFromCart = useCallback(async (): Promise<bigint[]> => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      throw new Error('Contract not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await ecommerceContractWithSigner.createInvoicesFromCart();
      const receipt = await tx.wait();
      
      if (!receipt.status) {
        throw new Error('Transaction reverted');
      }

      const invoiceIds = await ecommerceContract.getInvoicesByCustomer(address);
      if (invoiceIds.length > 0) {
        const sorted = [...invoiceIds].sort((a, b) => Number(b.invoiceId - a.invoiceId));
        const newInvoices = sorted.slice(0, invoiceIds.length);
        return newInvoices.map((inv: any) => inv.invoiceId);
      }
      
      return [];
    } catch (err: any) {
      console.error('Failed to create invoices:', err);
      const errorMsg = err.message || 'Failed to create invoices';
      if (errorMsg.includes('EmptyCart')) {
        setError('El carrito está vacío. Agrega productos antes de pagar.');
      } else if (errorMsg.includes('InsufficientStock')) {
        setError('No hay suficiente stock de algunos productos.');
      } else if (errorMsg.includes('ProductNotActive')) {
        setError('Uno de los productos no está activo.');
      } else {
        setError(errorMsg);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContractWithSigner, ecommerceContract, address]);

  const getInvoicesByCustomer = useCallback(async () => {
    if (!ecommerceContract || !address) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ecommerceContract.getInvoicesByCustomer(address);
      setInvoices(data.map(transformInvoice).reverse());
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract, address]);

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
    createInvoice,
    createInvoicesFromCart,
    getInvoicesByCustomer,
    getInvoice,
  };
}
