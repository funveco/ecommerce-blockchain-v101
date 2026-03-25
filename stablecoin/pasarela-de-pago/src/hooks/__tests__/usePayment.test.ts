import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePayment } from '../usePayment';

vi.mock('../useContract', () => ({
  useContract: () => ({
    ecommerceContract: {
      createInvoice: vi.fn(),
      processPayment: vi.fn(),
      getInvoice: vi.fn(),
    },
    euroTokenContract: {
      approve: vi.fn(),
      allowance: vi.fn(),
    },
    isLoading: false,
  }),
}));

vi.mock('../useWallet', () => ({
  useWallet: () => ({
    address: '0x1234567890123456789012345678901234567890',
    provider: {
      getBalance: vi.fn().mockResolvedValue(BigInt(1000000000000000000n)),
    },
    isConnected: true,
    isCorrectNetwork: true,
  }),
}));

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', async () => {
    const { result } = renderHook(() => usePayment({
      invoiceId: '1',
      companyId: '1',
      amount: '1000000',
    }));
    
    expect(result.current.status).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should approve tokens', async () => {
    const mockApprove = vi.fn().mockResolvedValue({ hash: '0x123' });
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          createInvoice: vi.fn(),
          processPayment: vi.fn(),
          getInvoice: vi.fn(),
        },
        euroTokenContract: {
          approve: mockApprove,
          allowance: vi.fn().mockResolvedValue(BigInt(0)),
        },
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => usePayment({
      invoiceId: '1',
      companyId: '1',
      amount: '1000000',
    }));
    
    await act(async () => {
      await result.current.approveTokens();
    });
    
    expect(mockApprove).toHaveBeenCalled();
  });

  it('should process payment', async () => {
    const mockProcessPayment = vi.fn().mockResolvedValue({ hash: '0x123' });
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          createInvoice: vi.fn(),
          processPayment: mockProcessPayment,
          getInvoice: vi.fn(),
        },
        euroTokenContract: {
          approve: vi.fn(),
          allowance: vi.fn().mockResolvedValue(BigInt(1000000000000)),
        },
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => usePayment({
      invoiceId: '1',
      companyId: '1',
      amount: '1000000',
    }));
    
    await act(async () => {
      const success = await result.current.processPayment(BigInt(1));
      expect(success).toBe(true);
    });
    
    expect(mockProcessPayment).toHaveBeenCalled();
  });
});
