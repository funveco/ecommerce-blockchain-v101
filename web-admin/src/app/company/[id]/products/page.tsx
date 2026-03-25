'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';
import { ProductList } from '@/components/ProductList';
import { ProductForm } from '@/components/ProductForm';
import { useCompany } from '@/hooks/useCompany';
import { useProducts, Product } from '@/hooks/useProducts';
import { useWallet } from '@/hooks/useWallet';

export default function CompanyProductsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id ? BigInt(params.id as string) : null;
  
  const { address: walletAddress, isConnected } = useWallet();
  const { company, fetchCompany, isLoading: isCompanyLoading } = useCompany();
  const { products, fetchProductsByCompany, isLoading: isProductsLoading } = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchCompany(companyId);
    }
  }, [companyId, fetchCompany]);

  useEffect(() => {
    if (companyId) {
      fetchProductsByCompany(companyId);
    }
  }, [companyId, fetchProductsByCompany]);

  useEffect(() => {
    if (company && walletAddress) {
      setIsOwner(company.companyAddress.toLowerCase() === walletAddress.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [company, walletAddress]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    if (companyId) {
      fetchProductsByCompany(companyId);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (isCompanyLoading && !company) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">E-commerce Admin</h1>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Company not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">E-commerce Admin</h1>
              <nav className="hidden md:flex gap-4 ml-8">
                <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/companies" className="text-gray-600 hover:text-gray-900">Companies</a>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Products - {company.name}</h2>
          {isConnected && !isOwner && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Nota:</strong> Estás viendo los productos de otra empresa. No puedes agregar, editar ni eliminar productos.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {companyId && (
                <ProductList
                  products={products}
                  isLoading={isProductsLoading}
                  onEdit={isOwner ? handleEdit : undefined}
                  onRefresh={() => fetchProductsByCompany(companyId)}
                />
              )}
            </div>
          </div>

          <div>
            {isConnected && isOwner ? (
              <>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="w-full mb-4 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showForm ? 'Cancel' : 'Add New Product'}
                </button>

                {showForm && companyId && walletAddress && (
                  <ProductForm
                    companyId={companyId}
                    product={editingProduct || undefined}
                    ownerAddress={walletAddress}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-600 text-sm text-center">
                  {!isConnected 
                    ? 'Conecta tu wallet para gestionar productos' 
                    : 'Solo el owner de la empresa puede gestionar productos'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
