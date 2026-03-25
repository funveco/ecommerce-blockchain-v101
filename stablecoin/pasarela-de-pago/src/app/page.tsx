'use client';

import { Suspense } from 'react';
import { PaymentPageContent } from './PaymentPageContent';

function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PaymentPageContent />
    </Suspense>
  );
}
