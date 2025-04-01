import gsap from 'gsap';
import type { GsapInstance } from './gsap';
import type { WindowWithAnalytics } from './performance';

/**
 * Global type declarations for the application
 */

declare global {
  /**
   * Window interface extensions
   */
  interface Window extends WindowWithAnalytics {
    /**
     * Analytics service
     */
    analytics: {
      track: (event: string, data: Record<string, unknown>) => void;
    };

    /**
     * Error tracking service
     */
    errorTracker: {
      captureError: (
        error: Error | null,
        context: Record<string, unknown>
      ) => void;
    };

    /**
     * GSAP instance
     */
    gsap: GsapInstance;

    /**
     * Extended Performance interface with memory metrics
     */
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
  }

  /**
   * NodeJS global extensions
   */
  namespace NodeJS {
    interface Global {
      gsap: typeof gsap;
    }
  }
}

export {}; 