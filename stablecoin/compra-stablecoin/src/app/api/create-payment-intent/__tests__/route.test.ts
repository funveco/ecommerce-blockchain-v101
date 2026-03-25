import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    paymentIntents: {
      create: vi.fn(),
    },
  })),
}));

vi.mock('@/lib/daily-limit', () => ({
  checkDailyLimit: vi.fn(() => ({ allowed: true, remaining: 4900 })),
}));

describe('POST /api/create-payment-intent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create payment intent for valid amount', async () => {
    const { createPaymentIntent } = await import('../route');
    
    const mockRequest = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        walletAddress: '0x1234567890123456789012345678901234567890',
      }),
    });

    const response = await createPaymentIntent(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clientSecret).toBeDefined();
    expect(data.amount).toBe(100);
    expect(data.currency).toBe('eur');
  });

  it('should reject amount below minimum (1 EURT)', async () => {
    const { createPaymentIntent } = await import('../route');
    
    const mockRequest = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 0.5,
        walletAddress: '0x1234567890123456789012345678901234567890',
      }),
    });

    const response = await createPaymentIntent(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('minimum');
  });

  it('should reject amount above maximum (1000 EURT)', async () => {
    const { createPaymentIntent } = await import('../route');
    
    const mockRequest = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1500,
        walletAddress: '0x1234567890123456789012345678901234567890',
      }),
    });

    const response = await createPaymentIntent(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('maximum');
  });

  it('should reject invalid wallet address', async () => {
    const { createPaymentIntent } = await import('../route');
    
    const mockRequest = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        walletAddress: 'invalid',
      }),
    });

    const response = await createPaymentIntent(mockRequest);

    expect(response.status).toBe(400);
  });

  it('should reject when daily limit exceeded', async () => {
    vi.mock('@/lib/daily-limit', () => ({
      checkDailyLimit: vi.fn(() => ({ 
        allowed: false, 
        remaining: 0,
        message: 'Daily limit exceeded' 
      })),
    }));

    const { createPaymentIntent } = await import('../route');
    
    const mockRequest = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        walletAddress: '0x1234567890123456789012345678901234567890',
      }),
    });

    const response = await createPaymentIntent(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Daily limit');
  });
});
