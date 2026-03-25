'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { CompanyRegistration } from '@/components/CompanyRegistration';
import { useCompany } from '@/hooks/useCompany';

export default function CompaniesPage() {
  const { company } = useCompany();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">E-commerce Admin</h1>
              <nav className="hidden md:flex gap-4 ml-8">
                <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/companies" className="text-gray-900 font-medium">Companies</a>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
          <p className="text-gray-600 mt-1">Manage registered companies</p>
        </div>

        {!company && (
          <div className="max-w-md">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800">
                Register your company to start selling products on the platform.
              </p>
            </div>
            <CompanyRegistration />
          </div>
        )}

        {company && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{company.name}</div>
                    <div className="text-sm text-gray-500 font-mono">
                      {company.companyAddress.slice(0, 6)}...{company.companyAddress.slice(-4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {company.taxId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      company.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <a
                      href={`/company/${company.companyId}`}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      View
                    </a>
                    <a
                      href={`/company/${company.companyId}/products`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Products
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
