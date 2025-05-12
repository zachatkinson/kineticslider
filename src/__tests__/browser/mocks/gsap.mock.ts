import { vi } from "vitest";
import type {
  MockGsap,
  MockGsapTimeline,
  MockGsapTween,
} from "../../../types/test/gsap";

// Mock functions for GSAP animations
const mockTo = vi.fn().mockImplementation((target: any, config: any) => {
  if (config && config.onComplete) {
    config.onComplete();
  }
  return { kill: vi.fn() } as MockGsapTween;
});

const mockFromTo = vi
  .fn()
  .mockImplementation((target: any, fromVars: any, toVars: any) => {
    if (toVars && toVars.onComplete) {
      toVars.onComplete();
    }
    return { kill: vi.fn() } as MockGsapTween;
  });

const mockTimeline = vi.fn().mockImplementation(
  () =>
    ({
      to: mockTo,
      from: vi.fn(),
      fromTo: mockFromTo,
      set: vi.fn(),
      add: vi.fn(),
      kill: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      progress: vi.fn(),
    }) as MockGsapTimeline,
);

// Create the consolidated mockGsap object
const mockGsap: MockGsap = {
  to: mockTo,
  from: vi.fn().mockImplementation((target: any, config: any) => {
    if (config && config.onComplete) {
      config.onComplete();
    }
    return { kill: vi.fn() } as MockGsapTween;
  }),
  fromTo: mockFromTo,
  timeline: mockTimeline,
  set: vi.fn(),
  killTweensOf: vi.fn(),
  getProperty: vi.fn().mockReturnValue(0),
  getTweensOf: vi.fn().mockReturnValue([]),
};

// Export the mock and its helper functions
export default mockGsap;
export { mockGsap, mockTo, mockFromTo, mockTimeline };
