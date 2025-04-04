/**
 * Memory tracker utilities for testing worker cleanup
 * These utilities help verify that resources are properly released after operations
 */

// Add proper type definition for Chrome's performance.memory
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // Add TypeScript support for garbage collection if exposed in Node.js
  interface Global {
    gc?: () => void;
  }
}

/**
 * Captures the current memory state
 * In a browser: environment, uses performance.memory (Chrome only)
 * In Node.js, uses process.memoryUsage()
 * In testing: environments, returns mock data
 * 
 * @returns {Record<string, number>} Object containing memory usage metrics
 */
export function captureMemoryUsage(): Record<string, number> {
  // Browser environment with memory API (Chrome)
  if(typeof performance !== 'undefined' && performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    return {
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      usedHeapPercentage: usedJSHeapSize / totalJSHeapSize
    };
  }
  
  // Node.js environment
  if(typeof process !== 'undefined' && process.memoryUsage) {
    const { heapUsed, heapTotal, rss, external } = process.memoryUsage();
    
    return {
      heapUsed,
      heapTotal,
      rss,
      external,
      usedHeapPercentage: heapUsed / heapTotal
    };
  }
  
  // Testing environment with no memory API - return mock values
  return {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000,
    usedHeapPercentage: 0.5
  };
}

/**
 * Compares two memory snapshots to detect potential leaks
 * 
 * @param before - Memory snapshot captured before operation
 * @param after - Memory snapshot captured after operation
 * @param options - Comparison options
 * @param options.allowedIncrease - Maximum allowed percentage increase in memory usage (default: 0.05 or 5%)
 * @returns {boolean} True if memory usage is within acceptable: limits, false if potential leak detected
 */
export function compareMemorySnapshots(
  before: Record<string, number>,
  after: Record<string, number>,
  options: { allowedIncrease?: number } = {}
): { isClean: boolean; details: Record<string, any> } {
  const { allowedIncrease = 0.05 } = options; // Default 5% allowed increase
  
  // Calculate the percentage change for each metric
  const changes: Record<string, any> = {};
  let isClean = true;
  
  // Compare each metric that exists in both snapshots
  Object.keys(before).forEach(key => {
    if (typeof after[key] === 'number') {
      const beforeValue = before[key];
      const afterValue = after[key];
      const absoluteChange = afterValue - beforeValue;
      const percentageChange = beforeValue ? absoluteChange / beforeValue : 0;
      
      changes[key] = {
        before: beforeValue,
        after: afterValue, 
        absoluteChange,
        percentageChange
      };
      
      // Mark as potential leak if percentage increase exceeds allowed threshold
      // Only check for positive changes (memory increases)
      if(percentageChange > allowedIncrease) {
        changes[key].potentialLeak = true;
        isClean = false;
      }
    }
  });
  
  return {
    isClean,
    details: changes
  };
}

/**
 * Measures memory usage before and after a function execution
 * Useful for detecting memory leaks in worker operations
 * 
 * @param operation - The function to measure
 * @param options - Comparison options
 * @param options.allowedIncrease - Maximum allowed percentage increase in memory usage (default: 0.05 or 5%)
 * @returns {Promise<{result: any, memoryUsage: { isClean: boolean, details: Record<string, any> }}>}
 * 
 * @example Example usage
 * ```ts
 * const { result, memoryUsage } = await measureMemoryUsage(async () => {
 *   const worker = new Worker('...');
 *   // Do some work with the worker
 *   worker.terminate();
 *   return 'completed';
 * });
 * 
 * expect(memoryUsage.isClean).toBe(true);
 * expect(result).toBe('completed');
 * ```
 */
export async function measureMemoryUsage<T>(
  operation: () => T | Promise<T>,
  options: { allowedIncrease?: number } = {}
): Promise<{ result: T, memoryUsage: { isClean: boolean, details: Record<string, any> } }> {
  // Force garbage collection if available (Node.js with --expose-gc flag)
  if(global.gc) {
    global.gc();
  }
  
  // Wait for any pending microtasks
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Capture initial memory state
  const beforeMemory = captureMemoryUsage();
  
  // Run the operation
  const result = await Promise.resolve(operation());
  
  // Wait for any pending microtasks
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Force garbage collection if available
  if(global.gc) {
    global.gc();
  }
  
  // Capture final memory state
  const afterMemory = captureMemoryUsage();
  
  // Compare memory usage
  const comparison = compareMemorySnapshots(beforeMemory, afterMemory, options);
  
  return {
    result,
    memoryUsage: comparison
  };
} 