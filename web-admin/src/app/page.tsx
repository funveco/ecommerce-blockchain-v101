'use client';

import { useState } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { CompanyRegistration } from '@/components/CompanyRegistration';
import { useCompany } from '@/hooks/useCompany';

export default function Dashboard() {
  const { company, companyId, isLoading } = useCompany();
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-blue-900">WEB Admin Company</h1>
              <nav className="hidden md:flex gap-4 ml-8">
                <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/companies" className="text-gray-600 hover:text-gray-900">Companies</a>
                <a href="/admin/tokens" className="text-gray-600 hover:text-gray-900">Tokens</a>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage your company and products</p>
        </div>

        {!company && !isLoading && (
          <div className="max-w-md">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800">
                Welcome! Register your company to start selling products.
              </p>
            </div>
            <CompanyRegistration />
          </div>
        )}

        {company && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Your Company</h3>
              <p className="text-xl font-semibold text-gray-900 mt-1">{company.name}</p>
              <p className="text-sm text-gray-500 mt-1">Tax ID: {company.taxId}</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                company.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {company.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Quick Actions</h3>
              <div className="mt-3 space-y-2">
                <a
                  href={`/company/${company.companyId}/products`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage Products
                </a>
                <a
                  href={`/company/${company.companyId}/invoices`}
                  className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Invoices
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Company Address</h3>
              <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                {company.companyAddress}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                ID: {company.companyId.toString()}
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}
      </div>
    </main>
  );
}
