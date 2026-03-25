import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from './useWallet';
import { getEuroTokenContract, getEcommerceContract } from '../lib/contracts';

export interface ContractState {
  ecommerceContract: any;
  ecommerceContractWithSigner: any;
  euroTokenContract: any;
  euroTokenContractWithSigner: any;
  isLoading: boolean;
  error: string | null;
}

const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS;
const euroTokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

export function useContract() {
  const { provider, isConnected, isCorrectNetwork, address } = useWallet();
  const [state, setState] = useState<ContractState>({
    ecommerceContract: null,
    ecommerceContractWithSigner: null,
    euroTokenContract: null,
    euroTokenContractWithSigner: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isConnected || !isCorrectNetwork || !provider) {
      setState({
        ecommerceContract: null,
        ecommerceContractWithSigner: null,
        euroTokenContract: null,
        euroTokenContractWithSigner: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    const initContracts = async () => {
      try {
        const signer = await provider.getSigner();
        
        const ecommerceContract = ecommerceAddress
          ? getEcommerceContract(ecommerceAddress, provider)
          : null;
        
        const ecommerceContractWithSigner = ecommerceAddress
          ? getEcommerceContract(ecommerceAddress, signer)
          : null;
        
        const euroTokenContract = euroTokenAddress
          ? getEuroTokenContract(euroTokenAddress, provider)
          : null;
        
        const euroTokenContractWithSigner = euroTokenAddress
          ? getEuroTokenContract(euroTokenAddress, signer)
          : null;

        setState({
          ecommerceContract,
          ecommerceContractWithSigner,
          euroTokenContract,
          euroTokenContractWithSigner,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to initialize contracts:', error);
        setState({
          ecommerceContract: null,
          ecommerceContractWithSigner: null,
          euroTokenContract: null,
          euroTokenContractWithSigner: null,
          isLoading: false,
          error: 'Failed to initialize contracts',
        });
      }
    };

    initContracts();
  }, [provider, isConnected, isCorrectNetwork]);

  return state;
}
