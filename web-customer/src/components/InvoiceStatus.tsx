'use client';

interface InvoiceStatusProps {
  isPaid: boolean;
  txHash?: string;
}

export function InvoiceStatus({ isPaid, txHash }: InvoiceStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isPaid 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isPaid ? (
          <>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Paid
          </>
        ) : (
          <>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </>
        )}
      </span>
      
      {isPaid && txHash && txHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
        <a
          href={`https://etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View Transaction
        </a>
      )}
    </div>
  );
}
