'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/hooks/useCompany';
import { useWallet } from '@/hooks/useWallet';

export function CompanyRegistration() {
  const router = useRouter();
  const { registerCompany, companyId, isLoading, error } = useCompany();
  const { isConnected, isCorrectNetwork, connect } = useWallet();
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredCompanyId, setRegisteredCompanyId] = useState<bigint | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !taxId) return;
    
    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      await registerCompany(name, taxId);
      setSuccess(true);
      setName('');
      setTaxId('');
      setRegisteredCompanyId(companyId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Connect your wallet to register a company</p>
          <button
            onClick={connect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">Wrong network. Please switch to Anvil (31337)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Register Your Company</h2>
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium mb-3">Company registered successfully!</p>
          {companyId && (
            <button
              onClick={() => router.push(`/company/${companyId}/products`)}
              className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Register Products
            </button>
          )}
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
            Company Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="Acme Corp"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax ID (NIF)
          </label>
          <input
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value.toUpperCase())}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="B12345678"
            maxLength={20}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !name || !taxId}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Registering...' : 'Register Company'}
        </button>
      </form>
    </div>
  );
}
