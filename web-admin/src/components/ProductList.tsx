'use client';

import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { useProducts } from '@/hooks/useProducts';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onEdit?: (product: Product) => void;
  onRefresh?: () => void;
}

export function ProductList({ products, isLoading, onEdit, onRefresh }: ProductListProps) {
  const { toggleProduct } = useProducts();
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleToggle = async (productId: bigint) => {
    setActionLoading(Number(productId));
    try {
      await toggleProduct(productId);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: bigint) => {
    return (Number(price) / 1000000).toFixed(2);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        No products found. Add your first product!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.productId.toString()} className={!product.isActive ? 'bg-gray-50' : ''}>
              <td className="px-4 py-4">
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">{product.description}</div>
              </td>
              <td className="px-4 py-4 text-gray-900">
                {formatPrice(product.price)} EURT
              </td>
              <td className="px-4 py-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  Number(product.stock) > 10 ? 'bg-green-100 text-green-800' :
                  Number(product.stock) > 0 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.stock.toString()}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-4 text-right space-x-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(product)}
                    className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleToggle(product.productId)}
                  disabled={actionLoading === Number(product.productId)}
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  {actionLoading === Number(product.productId) ? '...' : product.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
