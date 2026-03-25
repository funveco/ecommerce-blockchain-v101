'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';
import { useCompany, Company } from '@/hooks/useCompany';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id ? BigInt(params.id as string) : null;
  
  const { company, fetchCompany, isLoading, toggleCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'invoices'>('overview');
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchCompany(companyId);
    }
  }, [companyId, fetchCompany]);

  const handleToggle = async () => {
    if (!companyId) return;
    setIsToggling(true);
    try {
      await toggleCompany(companyId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading && !company) {
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
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Companies
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Tax ID: {company.taxId}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  company.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={handleToggle}
                  disabled={isToggling}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  {isToggling ? '...' : company.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex gap-6 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab('products');
                  router.push(`/company/${companyId}/products`);
                }}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => {
                  setActiveTab('invoices');
                  router.push(`/company/${companyId}/invoices`);
                }}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'invoices'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Invoices
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Company Address</h3>
                  <p className="text-sm font-mono bg-gray-50 p-3 rounded-lg break-all">
                    {company.companyAddress}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Company ID</h3>
                  <p className="text-sm font-mono bg-gray-50 p-3 rounded-lg">
                    {company.companyId.toString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
