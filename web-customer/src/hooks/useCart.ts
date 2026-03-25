import { useState, useCallback, useEffect } from 'react';
import { useContract } from './useContract';
import { useWallet } from './useWallet';

export interface CartItem {
  productId: bigint;
  companyId: bigint;
  name: string;
  price: bigint;
  quantity: number;
  maxStock: bigint;
}

interface SerializedCartItem {
  productId: string;
  companyId: string;
  name: string;
  price: string;
  quantity: number;
  maxStock: string;
}

export interface UseCartReturn {
  items: CartItem[];
  total: bigint;
  itemCount: number;
  addToCart: (product: { productId: bigint; companyId: bigint; name: string; price: bigint; stock: bigint }, quantity: number) => Promise<void>;
  removeFromCart: (productId: bigint) => Promise<void>;
  updateQuantity: (productId: bigint, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithBlockchain: () => Promise<void>;
  isLoading: boolean;
}

const CART_STORAGE_KEY = 'ecommerce_cart';

function serializeCart(items: CartItem[]): string {
  const serialized: SerializedCartItem[] = items.map(item => ({
    productId: item.productId.toString(),
    companyId: item.companyId.toString(),
    name: item.name,
    price: item.price.toString(),
    quantity: item.quantity,
    maxStock: item.maxStock.toString(),
  }));
  return JSON.stringify(serialized);
}

function deserializeCart(json: string): CartItem[] {
  const parsed: SerializedCartItem[] = JSON.parse(json);
  return parsed.map(item => ({
    productId: BigInt(item.productId),
    companyId: BigInt(item.companyId),
    name: item.name,
    price: BigInt(item.price),
    quantity: item.quantity,
    maxStock: BigInt(item.maxStock),
  }));
}

export function useCart(): UseCartReturn {
  const { ecommerceContractWithSigner } = useContract();
  const { address, isConnected } = useWallet();
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(deserializeCart(stored));
      } catch (e) {
        console.error('Failed to parse cart from storage');
      }
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, serializeCart(items));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [items]);

  const total = items.reduce((sum, item) => sum + item.price * BigInt(item.quantity), 0n);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback(async (
    product: { productId: bigint; companyId: bigint; name: string; price: bigint; stock: bigint },
    quantity: number
  ) => {
    setIsLoading(true);
    try {
      setItems(prev => {
        const existing = prev.find(item => item.productId === product.productId);
        if (existing) {
          return prev.map(item =>
            item.productId === product.productId
              ? { ...item, quantity: Math.min(item.quantity + quantity, Number(product.stock)) }
              : item
          );
        }
        return [...prev, {
          productId: product.productId,
          companyId: product.companyId,
          name: product.name,
          price: product.price,
          quantity: Math.min(quantity, Number(product.stock)),
          maxStock: product.stock,
        }];
      });

      if (ecommerceContractWithSigner) {
        try {
          console.log('Adding to blockchain cart:', product.productId.toString(), quantity);
          await ecommerceContractWithSigner.addToCart(product.productId, quantity);
          console.log('Successfully added to blockchain cart');
        } catch (err: any) {
          console.error('Failed to sync cart to blockchain:', err);
          console.error('Error code:', err.code);
          console.error('Error data:', err.data);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContractWithSigner]);

  const removeFromCart = useCallback(async (productId: bigint) => {
    setIsLoading(true);
    try {
      setItems(prev => prev.filter(item => item.productId !== productId));

      if (ecommerceContractWithSigner) {
        try {
          await ecommerceContractWithSigner.removeFromCart(productId);
        } catch (err) {
          console.error('Failed to sync cart to blockchain:', err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContractWithSigner]);

  const updateQuantity = useCallback(async (productId: bigint, quantity: number) => {
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        setItems(prev => prev.filter(item => item.productId !== productId));
      } else {
        setItems(prev => prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.min(quantity, Number(item.maxStock)) }
            : item
        ));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);

      if (ecommerceContractWithSigner) {
        try {
          await ecommerceContractWithSigner.clearCart();
        } catch (err) {
          console.error('Failed to sync cart to blockchain:', err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [ecommerceContractWithSigner]);

  const syncWithBlockchain = useCallback(async () => {
    if (!ecommerceContractWithSigner || !address) return;

    try {
      console.log('Syncing cart with blockchain for address:', address);
      const blockchainCart = await ecommerceContractWithSigner.getCart(address);
      console.log('Blockchain cart length:', blockchainCart?.length);
      
      if (!blockchainCart || blockchainCart.length === 0) {
        console.log('Blockchain cart is empty, clearing localStorage');
        setItems([]);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to sync with blockchain:', err);
    }
  }, [ecommerceContractWithSigner, address]);

  return {
    items,
    total,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncWithBlockchain,
    isLoading,
  };
}
