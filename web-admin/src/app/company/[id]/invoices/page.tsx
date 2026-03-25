'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';
import { InvoiceList } from '@/components/InvoiceList';
import { useCompany } from '@/hooks/useCompany';

export default function CompanyInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id ? BigInt(params.id as string) : null;
  
  const { company, fetchCompany, isLoading: isCompanyLoading } = useCompany();

  useEffect(() => {
    if (companyId) {
      fetchCompany(companyId);
    }
  }, [companyId, fetchCompany]);

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
          <h2 className="text-2xl font-bold text-gray-900">Invoices - {company.name}</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            {companyId && <InvoiceList companyId={companyId} />}
          </div>
        </div>
      </div>
    </main>
  );
}
