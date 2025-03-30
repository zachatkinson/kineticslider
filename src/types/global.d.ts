/**
 * Global type augmentations
 */
import type { GsapInstance } from './gsap';
import type { WindowWithAnalytics } from './performance';

declare global {
  interface Window extends WindowWithAnalytics {
    gsap: GsapInstance;
    // Add performance with memory
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
  }
}

export {};
