import { vi } from 'vitest';
import type { MockGsap } from '../../types/test/mocks';

// Mock functions for GSAP animations
const mockTo = vi.fn().mockImplementation((target: any, config: any) => {
  if(config && config.onComplete) {
    config.onComplete();
  }
  return { kill: vi.fn() };
});

const mockFromTo = vi.fn().mockImplementation((target: any, fromVars: any, toVars: any) => {
  if(toVars && toVars.onComplete) {
    toVars.onComplete();
  }
  return { kill: vi.fn() };
});

const mockTimeline = vi.fn().mockImplementation(() => ({
  to: mockTo,
  fromTo: mockFromTo,
  add: vi.fn(),
  kill: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  progress: vi.fn(),
  clear: vi.fn(),
}));

// Create the consolidated mockGsap object
const mockGsap: MockGsap = {
  to: mockTo,
  fromTo: mockFromTo,
  timeline: mockTimeline,
  set: vi.fn(),
  killTweensOf: vi.fn(),
  getProperty: vi.fn().mockReturnValue(0),
  registerPlugin: vi.fn(),
  ticker: {
    add: vi.fn(),
    remove: vi.fn()
  },
  utils: {
    toArray: vi.fn().mockImplementation((selector: any) => 
      Array.isArray(selector) ? selector : [selector]
    )
  },
  config: {
    autoSleep: 120,
    force3D: true,
    nullTargetWarn: false
  }
};

// Export the mock and its helper functions
export default mockGsap;
export { mockGsap, mockTo, mockFromTo, mockTimeline };
