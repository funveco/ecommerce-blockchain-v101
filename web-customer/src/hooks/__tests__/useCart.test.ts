import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../useCart';

vi.mock('../useContract', () => ({
  useContract: () => ({
    ecommerceContract: {
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      getCart: vi.fn(),
      clearCart: vi.fn(),
    },
    euroTokenContract: null,
    isLoading: false,
  }),
}));

vi.mock('../useWallet', () => ({
  useWallet: () => ({
    address: '0x1234567890123456789012345678901234567890',
    provider: null,
    isConnected: true,
    isCorrectNetwork: true,
  }),
}));

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should return initial empty cart', async () => {
    const { result } = renderHook(() => useCart());
    
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  it('should add item to cart', async () => {
    const { result } = renderHook(() => useCart());
    
    await act(async () => {
      await result.current.addToCart({
        productId: BigInt(1),
        name: 'Test Product',
        price: BigInt(1000000),
        stock: BigInt(10),
      }, 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBe(2000000n);
  });

  it('should remove item from cart', async () => {
    const { result } = renderHook(() => useCart());
    
    await act(async () => {
      await result.current.addToCart({
        productId: BigInt(1),
        name: 'Test Product',
        price: BigInt(1000000),
        stock: BigInt(10),
      }, 2);
    });
    
    await act(async () => {
      await result.current.removeFromCart(BigInt(1));
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('should update item quantity', async () => {
    const { result } = renderHook(() => useCart());
    
    await act(async () => {
      await result.current.addToCart({
        productId: BigInt(1),
        name: 'Test Product',
        price: BigInt(1000000),
        stock: BigInt(10),
      }, 1);
    });
    
    await act(async () => {
      await result.current.updateQuantity(BigInt(1), 5);
    });
    
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.total).toBe(5000000n);
  });

  it('should clear cart', async () => {
    const { result } = renderHook(() => useCart());
    
    await act(async () => {
      await result.current.addToCart({
        productId: BigInt(1),
        name: 'Test Product',
        price: BigInt(1000000),
        stock: BigInt(10),
      }, 2);
    });
    
    await act(async () => {
      await result.current.clearCart();
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});
