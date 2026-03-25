import { useState, useCallback } from 'react';
import { useContract } from './useContract';
import { useWallet } from './useWallet';

export interface Product {
  productId: bigint;
  companyId: bigint;
  name: string;
  description: string;
  price: bigint;
  stock: bigint;
  ipfsImageHash: string;
  isActive: boolean;
}

export interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  addProduct: (
    companyId: bigint,
    name: string,
    description: string,
    price: number | bigint,
    stock: number | bigint,
    ipfsImageHash: string
  ) => Promise<void>;
  addProductWithOwner: (
    companyId: bigint,
    name: string,
    description: string,
    price: number | bigint,
    stock: number | bigint,
    ipfsImageHash: string,
    ownerAddress: string
  ) => Promise<void>;
  updateProduct: (productId: bigint, price: number | bigint, stock: number | bigint) => Promise<void>;
  toggleProduct: (productId: bigint) => Promise<void>;
  getProduct: (productId: bigint) => Promise<Product | null>;
  fetchAllProducts: () => Promise<void>;
  fetchProductsByCompany: (companyId: bigint) => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const { ecommerceContract, ecommerceContractWithSigner, isLoading: isContractLoading } = useContract();
  const { address: ownerAddress } = useWallet();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformProduct = (data: any): Product => ({
    productId: data.productId,
    companyId: data.companyId,
    name: data.name,
    description: data.description,
    price: data.price,
    stock: data.stock,
    ipfsImageHash: data.ipfsImageHash,
    isActive: data.isActive,
  });

  const addProductWithOwner = async (
    companyId: bigint,
    name: string,
    description: string,
    price: number | bigint,
    stock: number | bigint,
    ipfsImageHash: string,
    ownerAddress: string
  ) => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      return;
    }

    if (!ownerAddress) {
      setError('Wallet no conectada');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const company = await ecommerceContractWithSigner.getCompany(companyId);
      if (company.companyAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        const errorMsg = 'No eres el owner de esta empresa. Solo el dueño puede agregar productos.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!company.isActive) {
        const errorMsg = 'La empresa no está activa. Actívala primero.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const tx = await ecommerceContractWithSigner.addProduct(
        companyId,
        name,
        description,
        BigInt(price),
        BigInt(stock),
        ipfsImageHash
      );
      await tx.wait();
      
      await fetchProductsByCompany(companyId);
    } catch (err: any) {
      console.error('Failed to add product:', err);
      setError(err.message || 'Failed to add product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (
    companyId: bigint,
    name: string,
    description: string,
    price: number | bigint,
    stock: number | bigint,
    ipfsImageHash: string
  ) => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      return;
    }

    if (!ownerAddress) {
      setError('Wallet no conectada');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const company = await ecommerceContractWithSigner.getCompany(companyId);
      if (company.companyAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        const errorMsg = 'No eres el owner de esta empresa. Solo el dueño puede agregar productos.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!company.isActive) {
        const errorMsg = 'La empresa no está activa. Actívala primero.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const tx = await ecommerceContractWithSigner.addProduct(
        companyId,
        name,
        description,
        BigInt(price),
        BigInt(stock),
        ipfsImageHash
      );
      await tx.wait();
    } catch (err: any) {
      console.error('Failed to add product:', err);
      if (err.message.includes('No eres el owner') || err.message.includes('La empresa no')) {
        setError(err.message);
      } else if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Transacción rechazada por el usuario');
      } else {
        setError('Error al agregar producto. Verifica que eres el owner de la empresa.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (productId: bigint, price: number | bigint, stock: number | bigint, ownerAddress: string) => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const product = await ecommerceContractWithSigner.getProduct(productId);
      const company = await ecommerceContractWithSigner.getCompany(product.companyId);
      
      if (company.companyAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        const errorMsg = 'No eres el owner de esta empresa. No puedes modificar sus productos.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const tx = await ecommerceContractWithSigner.updateProduct(productId, BigInt(price), BigInt(stock));
      await tx.wait();
    } catch (err: any) {
      console.error('Failed to update product:', err);
      if (err.message.includes('No eres el owner')) {
        setError(err.message);
      } else if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Transacción rechazada por el usuario');
      } else {
        setError('Error al actualizar producto. Verifica que eres el owner.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProduct = async (productId: bigint, ownerAddress: string) => {
    if (!ecommerceContractWithSigner) {
      setError('Contract not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const product = await ecommerceContractWithSigner.getProduct(productId);
      const company = await ecommerceContractWithSigner.getCompany(product.companyId);
      
      if (company.companyAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        const errorMsg = 'No eres el owner de esta empresa. No puedes modificar sus productos.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const tx = await ecommerceContractWithSigner.toggleProduct(productId);
      await tx.wait();
    } catch (err: any) {
      console.error('Failed to toggle product:', err);
      if (err.message.includes('No eres el owner')) {
        setError(err.message);
      } else if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Transacción rechazada por el usuario');
      } else {
        setError('Error al modificar producto. Verifica que eres el owner.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProduct = async (productId: bigint): Promise<Product | null> => {
    if (!ecommerceContract) {
      setError('Contract not initialized');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ecommerceContract.getProduct(productId);
      return transformProduct(data);
    } catch (err: any) {
      console.error('Failed to get product:', err);
      setError(err.message || 'Failed to get product');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProducts = useCallback(async () => {
    if (!ecommerceContract) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ecommerceContract.getAllProducts();
      setProducts(data.map(transformProduct));
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract]);

  const fetchProductsByCompany = useCallback(async (companyId: bigint) => {
    if (!ecommerceContract) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ecommerceContract.getProductsByCompany(companyId);
      setProducts(data.map(transformProduct));
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract]);

  return {
    products,
    isLoading: isLoading || isContractLoading,
    error,
    addProduct,
    addProductWithOwner,
    updateProduct,
    toggleProduct,
    getProduct,
    fetchAllProducts,
    fetchProductsByCompany,
  };
}
