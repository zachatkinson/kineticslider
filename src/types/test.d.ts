import { gsap } from 'gsap';
import type { Mock } from 'jest';

// Test environment types
export interface GlobalWithMocks {
  ResizeObserver: typeof ResizeObserver;
  gsap: typeof gsap;
}

export interface MockTimelineVars {
  defaults?: Record<string, unknown>;
  paused?: boolean;
}

export interface MockTimeline {
  to: Mock;
  kill: Mock;
  eventCallback: Mock;
  play: Mock;
}

export interface MockGsap {
  timeline: (vars?: MockTimelineVars) => MockTimeline;
  to: Mock;
  set: Mock;
  quickSetter: Mock;
  killTweensOf: Mock;
}

// Window extensions for testing
declare global {
  interface Window {
    analytics?: {
      track: (event: string, data: unknown) => void;
    };
    errorTracker?: {
      captureError: (error: Error, context: unknown) => void;
    };
    webVitals?: {
      getFCP: (cb: (metric: { value: number }) => void) => void;
      getLCP: (cb: (metric: { value: number }) => void) => void;
      getFID: (cb: (metric: { value: number }) => void) => void;
      getCLS: (cb: (metric: { value: number }) => void) => void;
      getTTI: (cb: (metric: { value: number }) => void) => void;
      getTBT: (cb: (metric: { value: number }) => void) => void;
    };
  }
}
