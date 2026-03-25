import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProducts } from '../useProducts';

vi.mock('../useContract', () => ({
  useContract: () => ({
    ecommerceContract: {
      addProduct: vi.fn(),
      updateProduct: vi.fn(),
      toggleProduct: vi.fn(),
      getProduct: vi.fn(),
      getAllProducts: vi.fn(),
      getProductsByCompany: vi.fn(),
    },
    euroTokenContract: null,
    isLoading: false,
  }),
}));

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', async () => {
    const { result } = renderHook(() => useProducts());
    
    expect(result.current.products).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add a product', async () => {
    const mockAddProduct = vi.fn().mockResolvedValue(BigInt(1));
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          addProduct: mockAddProduct,
          updateProduct: vi.fn(),
          toggleProduct: vi.fn(),
          getProduct: vi.fn(),
          getAllProducts: vi.fn(),
          getProductsByCompany: vi.fn(),
        },
        euroTokenContract: null,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useProducts());
    
    await act(async () => {
      await result.current.addProduct(1, 'Test Product', 'Description', 100, 10, 'ipfs://hash');
    });
    
    expect(mockAddProduct).toHaveBeenCalledWith(1, 'Test Product', 'Description', BigInt(100), BigInt(10), 'ipfs://hash');
  });

  it('should update a product', async () => {
    const mockUpdateProduct = vi.fn().mockResolvedValue(undefined);
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          addProduct: vi.fn(),
          updateProduct: mockUpdateProduct,
          toggleProduct: vi.fn(),
          getProduct: vi.fn(),
          getAllProducts: vi.fn(),
          getProductsByCompany: vi.fn(),
        },
        euroTokenContract: null,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useProducts());
    
    await act(async () => {
      await result.current.updateProduct(1, 150, 20);
    });
    
    expect(mockUpdateProduct).toHaveBeenCalledWith(1, BigInt(150), BigInt(20));
  });

  it('should toggle a product', async () => {
    const mockToggleProduct = vi.fn().mockResolvedValue(undefined);
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          addProduct: vi.fn(),
          updateProduct: vi.fn(),
          toggleProduct: mockToggleProduct,
          getProduct: vi.fn(),
          getAllProducts: vi.fn(),
          getProductsByCompany: vi.fn(),
        },
        euroTokenContract: null,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useProducts());
    
    await act(async () => {
      await result.current.toggleProduct(1);
    });
    
    expect(mockToggleProduct).toHaveBeenCalledWith(1);
  });

  it('should fetch all products', async () => {
    const mockProducts = [
      { productId: BigInt(1), companyId: BigInt(1), name: 'Product 1', description: 'Desc 1', price: BigInt(100), stock: BigInt(10), ipfsImageHash: 'ipfs://hash1', isActive: true },
      { productId: BigInt(2), companyId: BigInt(1), name: 'Product 2', description: 'Desc 2', price: BigInt(200), stock: BigInt(20), ipfsImageHash: 'ipfs://hash2', isActive: true },
    ];
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          addProduct: vi.fn(),
          updateProduct: vi.fn(),
          toggleProduct: vi.fn(),
          getProduct: vi.fn(),
          getAllProducts: vi.fn().mockResolvedValue(mockProducts),
          getProductsByCompany: vi.fn(),
        },
        euroTokenContract: null,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useProducts());
    
    await act(async () => {
      await result.current.fetchAllProducts();
    });
    
    expect(result.current.products).toHaveLength(2);
  });
});
