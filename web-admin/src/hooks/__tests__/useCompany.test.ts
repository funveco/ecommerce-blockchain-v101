import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompany } from '../useCompany';

vi.mock('../useContract', () => ({
  useContract: () => ({
    ecommerceContract: {
      registerCompany: vi.fn(),
      getCompany: vi.fn(),
      toggleCompany: vi.fn(),
      getCompanyByOwner: vi.fn(),
    },
    euroTokenContract: null,
    isLoading: false,
  }),
}));

vi.mock('../useWallet', () => ({
  useWallet: () => ({
    address: '0x1234567890123456789012345678901234567890',
    provider: null,
    isConnected: true,
    isCorrectNetwork: true,
  }),
}));

describe('useCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', async () => {
    const { result } = renderHook(() => useCompany());
    
    expect(result.current.company).toBeNull();
    expect(result.current.companyId).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should register a company', async () => {
    const mockRegisterCompany = vi.fn().mockResolvedValue(BigInt(1));
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          registerCompany: mockRegisterCompany,
          getCompany: vi.fn(),
          toggleCompany: vi.fn(),
          getCompanyByOwner: vi.fn(),
        },
        euroTokenContract: null,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useCompany());
    
    await act(async () => {
      await result.current.registerCompany('Test Company', 'B12345678');
    });
    
    expect(mockRegisterCompany).toHaveBeenCalledWith('Test Company', 'B12345678');
  });

  it('should toggle company active status', async () => {
    const mockToggleCompany = vi.fn().mockResolvedValue(undefined);
    
    vi.mock('../useContract', () => ({
      useContract: () => ({
        ecommerceContract: {
          registerCompany: vi.fn(),
          getCompany: vi.fn(),
          toggleCompany: mockToggleCompany,
          getCompanyByOwner: vi.fn(),
        },
        euroTokenContract: null,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => useCompany());
    
    await act(async () => {
      await result.current.toggleCompany(1);
    });
    
    expect(mockToggleCompany).toHaveBeenCalledWith(1);
  });
});
