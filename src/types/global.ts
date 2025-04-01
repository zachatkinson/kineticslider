import gsap from 'gsap';

/**
 * Global type declarations for the application
 */

declare global {
  /**
   * Window interface extensions
   */
  interface Window {
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
  }

  /**
   * NodeJS global extensions
   */
  namespace NodeJS {
    interface Global {
      gsap: typeof gsap;
    }
  }

  /**
   * Performance interface extensions
   */
  interface Performance {
    readonly memory: {
      readonly jsHeapSizeLimit: number;
      readonly totalJSHeapSize: number;
      readonly usedJSHeapSize: number;
    };
  }
}

export {}; 