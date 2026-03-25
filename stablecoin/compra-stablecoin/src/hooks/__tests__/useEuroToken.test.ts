import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEuroToken } from '../useEuroToken';

vi.mock('../useWallet', () => ({
  useWallet: () => ({
    address: '0x1234567890123456789012345678901234567890',
    provider: {
      getBalance: vi.fn(),
    },
    isConnected: true,
    isCorrectNetwork: true,
  }),
}));

vi.mock('../../lib/contracts', () => ({
  getEuroTokenContract: vi.fn(() => ({
    balanceOf: vi.fn(),
    allowance: vi.fn(),
  })),
}));

describe('useEuroToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state with null values', async () => {
    const { result } = renderHook(() => useEuroToken());
    
    expect(result.current.balance).toBeNull();
    expect(result.current.allowance).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch balance when wallet is connected', async () => {
    const mockBalance = BigInt(1000000); // 1 EURT with 6 decimals
    
    const { result } = renderHook(() => useEuroToken());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.balance).toBe('1.000000');
  });

  it('should handle mint events', async () => {
    const { result } = renderHook(() => useEuroToken());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.lastMintEvent).toBeDefined();
  });
});
