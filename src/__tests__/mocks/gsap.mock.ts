/**
 * Mock implementations for GSAP animations
 */
import { vi } from "vitest";

// Mock GSAP timeline
const mockTimeline = vi.fn().mockImplementation(() => ({
  to: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  fromTo: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  add: vi.fn().mockReturnThis(),
  kill: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  progress: vi.fn(),
}));

// Mock GSAP object
const mockGsap = {
  timeline: mockTimeline,
  to: vi.fn().mockImplementation((target: any, config: any) => {
    if (config?.onComplete) {
      setTimeout(() => config.onComplete(), 0);
    }
    return { kill: vi.fn() };
  }),
  from: vi.fn().mockImplementation((target: any, config: any) => {
    if (config?.onComplete) {
      setTimeout(() => config.onComplete(), 0);
    }
    return { kill: vi.fn() };
  }),
  fromTo: vi
    .fn()
    .mockImplementation((target: any, fromVars: any, toVars: any) => {
      if (toVars?.onComplete) {
        setTimeout(() => toVars.onComplete(), 0);
      }
      return { kill: vi.fn() };
    }),
  set: vi.fn(),
  killTweensOf: vi.fn(),
  getProperty: vi.fn().mockReturnValue(0),
  getTweensOf: vi.fn().mockReturnValue([]),
  config: vi.fn(),
};

export default mockGsap;
