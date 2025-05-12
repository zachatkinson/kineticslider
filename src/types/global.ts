import gsap from "gsap";
import type { GsapInstance } from "./gsap";
import type { WindowWithAnalytics } from "./performance";

/**
 * Global type declarations for the application
 */

declare global {
  /**
   * Window interface extensions
   *
   * @example Example usage
   */
  interface Window extends WindowWithAnalytics {
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
