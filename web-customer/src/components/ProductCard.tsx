'use client';

import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { useWallet } from '@/hooks/useWallet';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { isConnected } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (price: bigint) => {
    return (Number(price) / 1000000).toFixed(2);
  };

  const handleAddToCart = async () => {
    if (!isConnected) return;
    
    setIsAdding(true);
    try {
      onAddToCart(product, quantity);
      setQuantity(1);
    } finally {
      setIsAdding(false);
    }
  };

  const ipfsUrl = product.ipfsImageHash 
    ? product.ipfsImageHash.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {ipfsUrl ? (
          <img 
            src={ipfsUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            No Image
          </div>
        )}
        {Number(product.stock) === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{product.description}</p>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(product.price)} EURT
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            Number(product.stock) > 10 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
            Number(product.stock) > 0 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
            'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
            {product.stock.toString()} in stock
          </span>
        </div>
        
        {isConnected && Number(product.stock) > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={Number(product.stock)}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value), Number(product.stock))))}
              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-center"
            />
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        )}
        
        {!isConnected && Number(product.stock) > 0 && (
          <button
            disabled
            className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
          >
            Connect to Buy
          </button>
        )}
      </div>
    </div>
  );
}
