import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { useContract } from './useContract';

export interface Company {
  companyId: bigint;
  name: string;
  companyAddress: string;
  taxId: string;
  isActive: boolean;
}

export interface UseCompanyReturn {
  company: Company | null;
  companyId: bigint | null;
  isLoading: boolean;
  error: string | null;
  registerCompany: (name: string, taxId: string) => Promise<void>;
  toggleCompany: (companyId: bigint) => Promise<void>;
  fetchCompany: (companyId: bigint) => Promise<void>;
  refresh: () => void;
}

export function useCompany(): UseCompanyReturn {
  const { address, isConnected } = useWallet();
  const { ecommerceContract, ecommerceContractWithSigner, isLoading: isContractLoading } = useContract();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyByOwner = useCallback(async () => {
    if (!ecommerceContract || !address) return;

    try {
      setIsLoading(true);
      setError(null);
      const id = await ecommerceContract.getCompanyByOwner(address);
      
      if (id && id > 0n) {
        setCompanyId(id);
        try {
          const companyData = await ecommerceContract.getCompany(id);
          setCompany({
            companyId: companyData.companyId,
            name: companyData.name,
            companyAddress: companyData.companyAddress,
            taxId: companyData.taxId,
            isActive: companyData.isActive,
          });
        } catch (companyErr: any) {
          console.warn('Company found but failed to get details:', companyErr);
          setCompany(null);
          setCompanyId(null);
        }
      } else {
        setCompany(null);
        setCompanyId(null);
      }
    } catch (err: any) {
      console.warn('No company found for this owner:', err?.message || err);
      setCompany(null);
      setCompanyId(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract, address]);

  useEffect(() => {
    if (isConnected && !isContractLoading) {
      fetchCompanyByOwner();
    }
  }, [isConnected, isContractLoading, fetchCompanyByOwner]);

  const registerCompany = async (name: string, taxId: string) => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await ecommerceContractWithSigner.registerCompany(name, taxId);
      await tx.wait();
      
      await fetchCompanyByOwner();
    } catch (err: any) {
      console.error('Failed to register company:', err);
      const errorMessage = err.message || 'Failed to register company';
      if (errorMessage.includes('AddressAlreadyRegistered') || errorMessage.includes('execution reverted')) {
        setError('Ya tienes una company registrada con esta dirección de wallet');
      } else {
        setError(errorMessage);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCompany = async (id: bigint) => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await ecommerceContractWithSigner.toggleCompany(id);
      await tx.wait();
      
      await fetchCompanyByOwner();
    } catch (err: any) {
      console.error('Failed to toggle company:', err);
      setError(err.message || 'Failed to toggle company');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompany = useCallback(async (id: bigint) => {
    if (!ecommerceContract) {
      setError('Contract not initialized');
      return;
    }

    if (!id || id === 0n) {
      setError('Invalid company ID');
      setCompany(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const companyData = await ecommerceContract.getCompany(id);
      setCompany({
        companyId: companyData.companyId,
        name: companyData.name,
        companyAddress: companyData.companyAddress,
        taxId: companyData.taxId,
        isActive: companyData.isActive,
      });
    } catch (err: any) {
      console.warn('Company not found or error fetching:', err?.message || err);
      setError('Company not found');
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract]);

  const refresh = () => {
    fetchCompanyByOwner();
  };

  return {
    company,
    companyId,
    isLoading: isLoading || isContractLoading,
    error,
    registerCompany,
    toggleCompany,
    fetchCompany,
    refresh,
  };
}