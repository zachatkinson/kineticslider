/**
 * Global type augmentations
 */
import type { GsapInstance as _GsapInstance } from './gsap';
import type { WindowWithAnalytics as _WindowWithAnalytics } from './performance';

// All global type declarations have been moved to src/types/global.ts
// This file is kept for declaration merging and re-exports

export {};

// Global type declarations
declare global {
  interface Window {
    setErrorBoundaryRecovery?: (value: boolean) => void;
    asyncErrorBoundaryTest?: (callback: () => Promise<void>) => Promise<void>;
    errorTracker?: {
      captureError: (error: Error, context?: Record<string, unknown>) => void;
    };
    registerWorker?: (worker: Worker) => void;
    __WORKER_REGISTRY__?: Set<Worker>;
  }
}

// Environment type declarations
declare namespace _NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
