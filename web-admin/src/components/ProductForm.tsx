'use client';

import { useState, useEffect } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';

interface ProductFormProps {
  companyId: bigint;
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ companyId, product, onSuccess, onCancel }: ProductFormProps) {
  const { addProduct, updateProduct, isLoading, error } = useProducts();
  
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? Number(product.price) / 1000000 : 0);
  const [stock, setStock] = useState(product ? Number(product.stock) : 0);
  const [ipfsImageHash, setIpfsImageHash] = useState(product?.ipfsImageHash || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isEditing = !!product;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || price <= 0 || stock < 0) return;
    
    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      if (isEditing && product) {
        await updateProduct(product.productId, Math.floor(price * 1000000), stock);
      } else {
        await addProduct(companyId, name, description, Math.floor(price * 1000000), stock, ipfsImageHash);
      }
      setSuccess(true);
      if (!isEditing) {
        setName('');
        setDescription('');
        setPrice(0);
        setStock(0);
        setIpfsImageHash('');
      }
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h3>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            {isEditing ? 'Product updated successfully!' : 'Product added successfully!'}
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="Product name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="Product description"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (EURT) *
            </label>
            <input
              type="number"
              min={0.000001}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="0"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IPFS Image Hash
          </label>
          <input
            type="text"
            value={ipfsImageHash}
            onChange={(e) => setIpfsImageHash(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="ipfs://Qm..."
          />
          <p className="text-xs text-gray-500 mt-1">Optional: IPFS hash for product image</p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !name || price <= 0 || stock < 0}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
