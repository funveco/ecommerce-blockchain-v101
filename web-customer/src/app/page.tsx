'use client';

import { useEffect } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { ProductCard } from '@/components/ProductCard';
import { ProductListSkeleton } from '@/components/Skeletons';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';

export default function Home() {
  const { products, fetchAllProducts, isLoading, error } = useProducts();
  const { addToCart, itemCount } = useCart();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">E-commerce Store</h1>
            <div className="flex items-center gap-4">
              <a
                href="/cart"
                className="relative px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cart
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </a>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Browse our collection</p>
        </div>

        {isLoading && products.length === 0 && (
          <ProductListSkeleton count={8} />
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">No products available</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.productId.toString()}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
