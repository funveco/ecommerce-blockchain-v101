import { useState, useCallback, useEffect } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { useContract } from './useContract';
import { useWallet } from './useWallet';

export type PaymentStatus = 'idle' | 'approving' | 'approved' | 'processing' | 'success' | 'error';

export interface PaymentParams {
  invoiceId: string;
  companyId: string;
  amount: string;
}

export interface UsePaymentReturn {
  status: PaymentStatus;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  invoice: any;
  approveTokens: () => Promise<void>;
  processPayment: (invoiceId: bigint) => Promise<boolean>;
  checkAllowance: () => Promise<boolean>;
}

export function usePayment(params: PaymentParams): UsePaymentReturn {
  const { ecommerceContract, ecommerceContractWithSigner, euroTokenContract, euroTokenContractWithSigner, isLoading: isContractLoading } = useContract();
  const { address, provider, isConnected, isCorrectNetwork } = useWallet();
  
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!ecommerceContract || !params.invoiceId) return;

    try {
      const data = await ecommerceContract.getInvoice(BigInt(params.invoiceId));
      setInvoice(data);
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    }
  }, [ecommerceContract, params.invoiceId]);

  useEffect(() => {
    if (!isContractLoading && ecommerceContract) {
      fetchInvoice();
    }
  }, [isContractLoading, ecommerceContract, fetchInvoice]);

  const checkAllowance = useCallback(async (): Promise<boolean> => {
    if (!euroTokenContract || !address || !ecommerceContract) return false;

    try {
      const spender = await ecommerceContract.getAddress();
      const allowance = await euroTokenContract.allowance(address, spender);
      return allowance >= BigInt(params.amount);
    } catch (err) {
      console.error('Failed to check allowance:', err);
      return false;
    }
  }, [euroTokenContract, address, ecommerceContract, params.amount]);

  const approveTokens = useCallback(async () => {
    if (!euroTokenContractWithSigner || !address || !ecommerceContract) {
      setError('Contracts not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('approving');
      setError(null);

      const spender = await ecommerceContract.getAddress();
      const tx = await euroTokenContractWithSigner.approve(spender, BigInt(params.amount));
      await tx.wait();

      setStatus('approved');
    } catch (err: any) {
      console.error('Approval failed:', err);
      setError(err.message || 'Failed to approve tokens');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [euroTokenContractWithSigner, address, ecommerceContract, params.amount]);

  const processPayment = useCallback(async (invoiceId: bigint): Promise<boolean> => {
    if (!ecommerceContractWithSigner || !euroTokenContractWithSigner) {
      setError('Contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      setStatus('processing');
      setError(null);

      console.log('Processing payment for invoiceId:', invoiceId.toString());
      
      // Get the contract address
      const ecommerceAddress = await ecommerceContractWithSigner.getAddress();
      
      // Check allowance and balance
      const allowance = await euroTokenContractWithSigner.allowance(address, ecommerceAddress);
      console.log('Allowance:', allowance.toString());
      
      const balance = await euroTokenContractWithSigner.balanceOf(address);
      console.log('Balance:', balance.toString());
      
      // Get invoice details
      const invoice = await ecommerceContractWithSigner.getInvoice(invoiceId);
      console.log('Invoice totalAmount:', invoice.totalAmount.toString());
      
      if (invoice.isPaid) {
        setError('Invoice already paid');
        setStatus('error');
        return false;
      }
      
      if (allowance < invoice.totalAmount) {
        setError(`Insufficient allowance. Please approve tokens first. Allowance: ${allowance}, Required: ${invoice.totalAmount}`);
        setStatus('error');
        return false;
      }
      
      if (balance < invoice.totalAmount) {
        setError(`Insufficient balance. Balance: ${balance}, Required: ${invoice.totalAmount}`);
        setStatus('error');
        return false;
      }
      
      const tx = await ecommerceContractWithSigner.processPayment(invoiceId, { gasLimit: 500000 });
      const receipt = await tx.wait();

      setTxHash(receipt.hash);
      setStatus('success');
      
      await fetchInvoice();
      
      return true;
    } catch (err: any) {
      console.error('Payment failed:', err);
      console.error('Error data:', err.data);
      const errorMsg = err.message || 'Payment failed';
      if (errorMsg.includes('InsufficientStock')) {
        setError('No hay suficiente stock del producto');
      } else if (errorMsg.includes('TransferFailed')) {
        setError('La transferencia de tokens falló');
      } else if (errorMsg.includes('allowance')) {
        setError('El allowance no es suficiente. Por favor approve los tokens primero.');
      } else {
        setError(errorMsg);
      }
      setStatus('error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContractWithSigner, euroTokenContractWithSigner, address, fetchInvoice]);

  return {
    status,
    isLoading: isLoading || isContractLoading,
    error,
    txHash,
    invoice,
    approveTokens,
    processPayment,
    checkAllowance,
  };
}
