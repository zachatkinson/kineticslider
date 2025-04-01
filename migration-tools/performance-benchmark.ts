/**
 * Performance Benchmarking Framework for KineticSlider
 * 
 * This module provides tools to measure and track performance metrics
 * for both the legacy and new implementations of the KineticSlider component.
 */

import type { PerformanceResult, TestConfig, MetricType, ImplementationType } from '../src/types/migration';

// Storage key for persisting benchmark results
const BENCHMARK_STORAGE_KEY = 'kinetic-slider-benchmark-results';

/**
 * Loads previously saved benchmark results from localStorage
 */
export const loadBenchmarkResults = (): PerformanceResult[] => {
  try {
    const savedResults = localStorage.getItem(BENCHMARK_STORAGE_KEY);
    if (savedResults) {
      const parsed = JSON.parse(savedResults);
      
      // Convert string dates back to Date objects
      return parsed.map((result: any) => ({
        ...result,
        timestamp: new Date(result.timestamp)
      }));
    }
  } catch (error) {
    console.warn('Failed to load benchmark results from localStorage:', error);
  }
  
  return [];
};

/**
 * Saves benchmark results to localStorage
 */
export const saveBenchmarkResults = (results: PerformanceResult[]): void => {
  try {
    localStorage.setItem(BENCHMARK_STORAGE_KEY, JSON.stringify(results));
  } catch (error) {
    console.warn('Failed to save benchmark results to localStorage:', error);
  }
};

/**
 * Adds a new benchmark result to the stored results
 */
export const addBenchmarkResult = (result: PerformanceResult): void => {
  const results = loadBenchmarkResults();
  results.push(result);
  saveBenchmarkResults(results);
};

/**
 * Clears all stored benchmark results
 */
export const clearBenchmarkResults = (): void => {
  try {
    localStorage.removeItem(BENCHMARK_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear benchmark results from localStorage:', error);
  }
};

/**
 * Measures the time it takes to execute a function
 */
export const measureExecutionTime = async (
  fn: () => Promise<void> | void,
  config: TestConfig
): Promise<PerformanceResult> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;
  
  const result: PerformanceResult = {
    name: config.name,
    duration,
    timestamp: new Date(),
    metricType: config.metricType,
    implementation: config.implementation,
    testContext: config.testContext,
    value: duration,
    unit: 'ms'
  };
  
  addBenchmarkResult(result);
  return result;
};

/**
 * Measure animation frame rate during a transition
 */
export const measureAnimationSmoothness = async (
  startAnimationFn: () => void,
  durationMs: number,
  config: TestConfig
): Promise<PerformanceResult> => {
  return new Promise((resolve) => {
    let frameCount = 0;
    let lastFrameTime = performance.now();
    const frameTimes: number[] = [];
    
    const recordFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      lastFrameTime = now;
      
      if (frameTime > 5) { // Ignore browser throttling
        frameTimes.push(frameTime);
        frameCount++;
      }
      
      if (now - lastFrameTime < durationMs) {
        requestAnimationFrame(recordFrame);
      } else {
        const totalTime = frameTimes.reduce((sum, time) => sum + time, 0);
        const fps = (frameCount * 1000) / totalTime;
        
        const result: PerformanceResult = {
          name: config.name,
          duration: totalTime,
          timestamp: new Date(),
          metricType: config.metricType,
          implementation: config.implementation,
          testContext: config.testContext,
          value: fps,
          unit: 'fps'
        };
        
        addBenchmarkResult(result);
        resolve(result);
      }
    };
    
    startAnimationFn();
    requestAnimationFrame(recordFrame);
  });
};

export async function runBenchmark(config: TestConfig): Promise<PerformanceResult> {
  const startTime = new Date();
  let startMemory: number | undefined;
  let endMemory: number | undefined;
  
  // Safely check for memory API
  try {
    startMemory = (performance as any).memory?.usedJSHeapSize;
  } catch {
    // Memory API not available
  }
  
  // Run warmup iterations if specified
  if (config.warmupIterations) {
    for (let i = 0; i < config.warmupIterations; i++) {
      await runTest(config);
    }
  }

  // Run actual test iterations
  const results: number[] = [];
  for (let i = 0; i < config.iterations; i++) {
    const iterationResult = await runTest(config);
    results.push(iterationResult);
  }

  const endTime = new Date();
  
  // Safely check for memory API
  try {
    endMemory = (performance as any).memory?.usedJSHeapSize;
  } catch {
    // Memory API not available
  }

  return {
    name: config.name,
    duration: calculateAverage(results),
    memoryUsage: endMemory && startMemory ? endMemory - startMemory : undefined,
    cpuUsage: undefined, // Not available in browser
    timestamp: endTime,
    metricType: config.metricType,
    implementation: config.implementation,
    testContext: config.testContext
  };
}

async function runTest(config: TestConfig): Promise<number> {
  const start = performance.now();
  
  try {
    // Add your test implementation here
    await new Promise(resolve => setTimeout(resolve, 100)); // Dummy implementation
    
    const end = performance.now();
    return end - start;
  } catch (error) {
    console.error(`Test failed: ${error}`);
    throw error;
  }
}

function calculateAverage(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}