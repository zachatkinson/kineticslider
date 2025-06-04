import { vi } from 'vitest';

/**
 * Utility function to check if an image appears to be high quality
 *
 * @param imageUrl - The URL of the image to check
 *
 * @returns Whether the image appears to be high quality
 *
 */
export function isHighQualityImage(imageUrl: string): boolean {
  // Simple heuristic - in practice you might check actual image dimensions
  // In a real implementation, this would check image dimensions, file size, etc.
  return !imageUrl.includes("thumbnail") && !imageUrl.includes("small");
}

/**
 * Test Helper Utilities
 * 
 * Centralized utilities for testing that are used across multiple test files.
 * This reduces duplication and ensures consistent testing patterns.
 */

/**
 * Mock getBoundingClientRect for testing elements with specific dimensions
 *
 * @param width - Width of the element
 *
 * @param height - Height of the element
 *
 * @param x - X position (optional)
 *
 * @param y - Y position (optional)
 *
 * @returns Mock function that returns a DOMRect
 *
 */
export const mockGetBoundingClientRect = (
  width: number, 
  height: number, 
  x: number = 0, 
  y: number = 0
): (() => DOMRect) => {
  return () => ({
    width,
    height,
    x,
    y,
    top: y,
    left: x,
    bottom: y + height,
    right: x + width,
    toJSON: () => ({ width, height, x, y, top: y, left: x, bottom: y + height, right: x + width })
  });
};

/**
 * Create a ResizeObserver mock for testing
 *
 * @param callback - Optional callback to execute on observe
 *
 * @returns Mock ResizeObserver instance
 *
 */
export const createMockResizeObserver = (callback?: () => void): typeof ResizeObserver => {
  return class MockResizeObserver {
    observe = vi.fn(() => callback?.());
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
};

/**
 * Create a mock IntersectionObserver for testing
 *
 * @param callback - Optional callback to execute on observe
 *
 * @returns Mock IntersectionObserver instance
 *
 */
export const createMockIntersectionObserver = (callback?: () => void): typeof IntersectionObserver => {
  return class MockIntersectionObserver {
    observe = vi.fn(() => callback?.());
    unobserve = vi.fn();
    disconnect = vi.fn();
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    takeRecords = vi.fn(() => []);
  };
};

/**
 * Setup performance timing mock
 *
 * @returns Object with performance mocking utilities
 *
 */
export const setupPerformanceMock = (): {
  mockRequestAnimationFrame: typeof requestAnimationFrame;
  resetMockTime: () => void;
  getCurrentMockTime: () => number;
} => {
  let mockTime = 0;
  
  const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
    mockTime += 16.67; // Simulate ~60fps
    setTimeout(() => callback(mockTime), 0);
    return mockTime;
  });

  const resetMockTime = (): void => {
    mockTime = 0;
  };

  return {
    mockRequestAnimationFrame,
    resetMockTime,
    getCurrentMockTime: (): number => mockTime
  };
};

/**
 * Common page evaluation patterns for E2E tests
 */
export const pageEvaluationHelpers = {
  /**
   * Get canvas rendering data from page
   *
   * @returns Promise that resolves to canvas image data
   *
   */
  getCanvasData: () => {
    return `
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return {
        width: imageData.width,
        height: imageData.height,
        hasData: imageData.data.some(pixel => pixel > 0)
      };
    `;
  },

  /**
   * Get FPS measurement from page
   *
   * @returns Promise that resolves to current FPS
   *
   */
  getFPS: () => {
    return `
      let lastTime = performance.now();
      let frameCount = 0;
      
      return new Promise((resolve) => {
        function measureFPS() {
          const now = performance.now();
          frameCount++;
          
          if (now - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (now - lastTime));
            resolve(fps);
          } else {
            requestAnimationFrame(measureFPS);
          }
        }
        requestAnimationFrame(measureFPS);
      });
    `;
  },

  /**
   * Get WebGL availability from page
   *
   * @returns Promise that resolves to WebGL support status
   *
   */
  getWebGLSupport: () => {
    return `
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    `;
  },

  /**
   * Wait for element to be visible
   *
   * @param selector - CSS selector for the element
   *
   * @param timeout - Timeout in milliseconds
   *
   * @returns Promise that resolves when element is visible
   *
   */
  waitForElementVisible: (selector: string, timeout: number = 5000) => {
    return `
      new Promise((resolve, reject) => {
        const element = document.querySelector('${selector}');
        if (!element) {
          reject(new Error('Element not found: ${selector}'));
          return;
        }
        
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            observer.disconnect();
            resolve(true);
          }
        });
        
        observer.observe(element);
        
        setTimeout(() => {
          observer.disconnect();
          reject(new Error('Timeout waiting for element visibility'));
        }, ${timeout});
      });
    `;
  }
};

/**
 * Memory usage measurement utility for testing
 *
 * @param operation - Function to measure memory usage for
 *
 * @returns Promise with operation result and memory usage data
 *
 */
export const measureMemoryUsage = async <T>(
  operation: () => T | Promise<T>
): Promise<{ result: T; memoryUsage: { before: number; after: number; delta: number } }> => {
  // Force garbage collection if available
  if ('gc' in global && typeof global.gc === 'function') {
    global.gc();
  }

  const memoryBefore = process.memoryUsage().heapUsed;
  const result = await operation();
  const memoryAfter = process.memoryUsage().heapUsed;

  return {
    result,
    memoryUsage: {
      before: memoryBefore,
      after: memoryAfter,
      delta: memoryAfter - memoryBefore
    }
  };
};

/**
 * Create a timeout promise for testing async operations
 *
 * @param ms - Timeout in milliseconds
 *
 * @param reason - Reason for timeout (optional)
 *
 * @returns Promise that rejects after timeout
 *
 */
export const createTimeoutPromise = (ms: number, reason?: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(reason || `Timeout after ${ms}ms`));
    }, ms);
  });
};

/**
 * Wait for a condition to be true with timeout
 *
 * @param condition - Function that returns true when condition is met
 *
 * @param timeout - Timeout in milliseconds
 *
 * @param interval - Check interval in milliseconds
 *
 * @returns Promise that resolves when condition is met
 *
 */
export const waitForCondition = (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    
    const check = (): void => {
      Promise.resolve(condition())
        .then((result) => {
          if (result) {
            resolve();
            return;
          }
          
          if (Date.now() - startTime >= timeout) {
            reject(new Error(`Condition not met within ${timeout}ms`));
            return;
          }
          
          setTimeout(check, interval);
        })
        .catch((error) => {
          reject(error);
        });
    };
    
    check();
  });
}; 