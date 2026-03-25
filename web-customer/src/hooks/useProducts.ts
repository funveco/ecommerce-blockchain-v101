import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';

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
  fetchAllProducts: () => Promise<void>;
  fetchProductsByCompany: (companyId: bigint) => Promise<void>;
  getProduct: (productId: bigint) => Promise<Product | null>;
}

export function useProducts(): UseProductsReturn {
  const { ecommerceContract, isLoading: isContractLoading } = useContract();
  
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

  const fetchAllProducts = useCallback(async () => {
    if (!ecommerceContract) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ecommerceContract.getAllProducts();
      const activeProducts = data
        .map(transformProduct)
        .filter((p: Product) => p.isActive && Number(p.stock) > 0);
      
      setProducts(activeProducts);
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
      const activeProducts = data
        .map(transformProduct)
        .filter((p: Product) => p.isActive && Number(p.stock) > 0);
      
      setProducts(activeProducts);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContract]);

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

  useEffect(() => {
    if (!isContractLoading && ecommerceContract) {
      fetchAllProducts();
    }
  }, [isContractLoading, ecommerceContract, fetchAllProducts]);

  return {
    products,
    isLoading: isLoading || isContractLoading,
    error,
    fetchAllProducts,
    fetchProductsByCompany,
    getProduct,
  };
}
