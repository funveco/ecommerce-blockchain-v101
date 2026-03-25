import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

declare global {
  interface Window {
    ethereum: {
      isMetaMask?: boolean;
      request: vi.fn;
      on: vi.fn;
      removeListener: vi.fn;
    };
  }
}

vi.stubGlobal('window', {
  ethereum: {
    isMetaMask: true,
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
});
