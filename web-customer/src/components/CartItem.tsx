'use client';

import { CartItem as CartItemType } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: bigint, quantity: number) => void;
  onRemove: (productId: bigint) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const formatPrice = (price: bigint) => {
    return (Number(price) / 1000000).toFixed(2);
  };

  const subtotal = Number(item.price) * item.quantity / 1000000;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{item.name}</h4>
        <p className="text-sm text-gray-500">{formatPrice(item.price)} EURT each</p>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          -
        </button>
        <span className="w-12 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          disabled={item.quantity >= Number(item.maxStock)}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          +
        </button>
      </div>
      
      <div className="w-24 text-right">
        <span className="font-medium text-gray-900">{subtotal.toFixed(2)} EURT</span>
      </div>
      
      <button
        onClick={() => onRemove(item.productId)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
