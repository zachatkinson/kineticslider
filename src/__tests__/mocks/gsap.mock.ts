import { vi } from 'vitest';
import type { MockGsap } from '../../types/test/mocks';

const mockGsap: MockGsap = {
  to: vi.fn(),
  timeline: vi.fn(),
  ticker: {
    add: vi.fn(),
    remove: vi.fn(),
  },
};

export default mockGsap;
