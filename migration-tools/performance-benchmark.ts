/**
 * Performance Benchmarking Framework for KineticSlider
 * 
 * This module provides tools to measure and track performance metrics
 * for both the legacy and new implementations of the KineticSlider component.
 */

// Types of metrics to measure
export enum MetricType {
  RENDER_TIME = 'render-time',
  ANIMATION_SMOOTHNESS = 'animation-smoothness',
  MEMORY_USAGE = 'memory-usage',
  INITIAL_LOAD_TIME = 'initial-load-time',
  INTERACTION_RESPONSIVENESS = 'interaction-responsiveness',
  RESOURCE_LOADING = 'resource-loading',
  LAYOUT_SHIFTS = 'layout-shifts',
  GESTURE_HANDLING = 'gesture-handling'
}

// Implementation type for comparison
export enum ImplementationType {
  LEGACY = 'legacy',
  NEW = 'new'
}

// Structure for performance test results
export interface PerformanceResult {
  metricType: MetricType;
  implementation: ImplementationType;
  value: number;
  unit: string;
  timestamp: Date;
  testContext?: Record<string, any>;
}

// Performance test configuration
export interface TestConfig {
  metricType: MetricType;
  implementation: ImplementationType;
  iterations?: number;
  warmupIterations?: number;
  timeout?: number;
  testContext?: Record<string, any>;
}

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
  const { 
    metricType, 
    implementation,
    iterations = 5,
    warmupIterations = 2,
    testContext 
  } = config;
  
  // Warm-up to reduce variance
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }
  
  // Actual measurements
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  // Calculate average time
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  
  const result: PerformanceResult = {
    metricType,
    implementation,
    value: averageTime,
    unit: 'ms',
    timestamp: new Date(),
    testContext
  };
  
  // Store result
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
    const { metricType, implementation, testContext } = config;
    let frameCount = 0;
    let lastFrameTime = performance.now();
    const frameTimes: number[] = [];
    
    // Start recording frames
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
        // Calculate average FPS
        const totalTime = frameTimes.reduce((sum, time) => sum + time, 0);
        const averageFps = (frameCount / totalTime) * 1000;
        
        const result: PerformanceResult = {
          metricType,
          implementation,
          value: averageFps,
          unit: 'fps',
          timestamp: new Date(),
          testContext
        };
        
        // Store result
        addBenchmarkResult(result);
        
        resolve(result);
      }
    };
    
    // Start animation and measurement
    startAnimationFn();
    requestAnimationFrame(recordFrame);
  });
};

/**
 * Measure memory usage during slider operation
 */
export const measureMemoryUsage = async (
  config: TestConfig
): Promise<PerformanceResult | null> => {
  const { metricType, implementation, testContext } = config;
  
  // Check if the performance API can monitor memory
  if (performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    
    const result: PerformanceResult = {
      metricType,
      implementation,
      value: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
      unit: 'MB',
      timestamp: new Date(),
      testContext
    };
    
    // Store result
    addBenchmarkResult(result);
    
    return result;
  }
  
  console.warn('Memory API not available in this browser');
  return null;
};

/**
 * Measure layout shifts during slider operation
 */
export const measureLayoutShifts = async (
  fn: () => Promise<void> | void,
  config: TestConfig
): Promise<PerformanceResult | null> => {
  const { metricType, implementation, testContext } = config;
  
  // Check if the performance API can monitor CLS
  if ('PerformanceObserver' in window) {
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];
    
    // Create CLS observer
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        // Check if it has the expected layout shift data structure
        if (entry && 'value' in entry) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      }
    });
    
    // Start observing layout shifts
    observer.observe({ type: 'layout-shift', buffered: true });
    
    // Execute the test function
    await fn();
    
    // Disconnect the observer
    observer.disconnect();
    
    const result: PerformanceResult = {
      metricType,
      implementation,
      value: clsValue,
      unit: 'CLS value',
      timestamp: new Date(),
      testContext: {
        ...testContext,
        numShifts: clsEntries.length
      }
    };
    
    // Store result
    addBenchmarkResult(result);
    
    return result;
  }
  
  console.warn('Layout Shift API not available in this browser');
  return null;
};

/**
 * Measure interaction responsiveness (time to respond to user input)
 */
export const measureInteractionResponsiveness = async (
  interactionFn: () => Promise<void> | void,
  config: TestConfig
): Promise<PerformanceResult> => {
  const { metricType, implementation, iterations = 5, testContext } = config;
  
  const interactionTimes: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await interactionFn();
    const end = performance.now();
    interactionTimes.push(end - start);
  }
  
  // Calculate average responsiveness time
  const averageTime = interactionTimes.reduce((sum, time) => sum + time, 0) / interactionTimes.length;
  
  const result: PerformanceResult = {
    metricType,
    implementation,
    value: averageTime,
    unit: 'ms',
    timestamp: new Date(),
    testContext
  };
  
  // Store result
  addBenchmarkResult(result);
  
  return result;
};

/**
 * Compare performance between legacy and new implementations
 */
export const compareImplementations = (
  metricType: MetricType,
  options?: {
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }
): { 
  legacy: PerformanceResult | null; 
  new: PerformanceResult | null;
  improvement: number | null; 
  unit: string;
} => {
  const results = loadBenchmarkResults();
  const { timeRange, limit = 10 } = options || {};
  
  // Filter results by metric type and time range
  let filteredResults = results.filter(result => result.metricType === metricType);
  
  if (timeRange) {
    filteredResults = filteredResults.filter(
      result => result.timestamp >= timeRange.start && result.timestamp <= timeRange.end
    );
  }
  
  // Get the most recent results for each implementation
  const legacyResults = filteredResults
    .filter(result => result.implementation === ImplementationType.LEGACY)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
    
  const newResults = filteredResults
    .filter(result => result.implementation === ImplementationType.NEW)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
  
  // Calculate averages
  const legacyAvg = legacyResults.length > 0
    ? legacyResults.reduce((sum, result) => sum + result.value, 0) / legacyResults.length
    : null;
    
  const newAvg = newResults.length > 0
    ? newResults.reduce((sum, result) => sum + result.value, 0) / newResults.length
    : null;
  
  // Determine unit from the most recent result
  const unit = filteredResults.length > 0 ? filteredResults[0].unit : 'unknown';
  
  // Calculate improvement percentage
  const improvement = (legacyAvg !== null && newAvg !== null)
    ? calculateImprovement(metricType, legacyAvg, newAvg)
    : null;
  
  return {
    legacy: legacyResults[0] || null,
    new: newResults[0] || null,
    improvement,
    unit
  };
};

/**
 * Calculate improvement percentage based on metric type
 * Some metrics are better when higher (FPS), others when lower (load time)
 */
const calculateImprovement = (
  metricType: MetricType,
  legacyValue: number,
  newValue: number
): number => {
  // For these metrics, higher values are better
  const higherIsBetter = [
    MetricType.ANIMATION_SMOOTHNESS
  ];
  
  if (higherIsBetter.includes(metricType)) {
    return ((newValue - legacyValue) / legacyValue) * 100;
  } else {
    // For other metrics, lower values are better
    return ((legacyValue - newValue) / legacyValue) * 100;
  }
};

/**
 * Run a suite of performance tests
 */
export const runPerformanceTestSuite = async (
  implementation: ImplementationType,
  tests: {
    renderComponent: () => Promise<void> | void;
    animateSlider: () => void;
    interactWithSlider: () => Promise<void> | void;
  },
  options: {
    durationMs?: number;
    iterations?: number;
  } = {}
): Promise<Record<MetricType, PerformanceResult | null>> => {
  const { durationMs = 3000, iterations = 5 } = options;
  
  const results: Record<MetricType, PerformanceResult | null> = {} as any;
  
  // Measure render time
  results[MetricType.RENDER_TIME] = await measureExecutionTime(
    tests.renderComponent,
    {
      metricType: MetricType.RENDER_TIME,
      implementation,
      iterations
    }
  );
  
  // Measure animation smoothness
  results[MetricType.ANIMATION_SMOOTHNESS] = await measureAnimationSmoothness(
    tests.animateSlider,
    durationMs,
    {
      metricType: MetricType.ANIMATION_SMOOTHNESS,
      implementation
    }
  );
  
  // Measure memory usage
  results[MetricType.MEMORY_USAGE] = await measureMemoryUsage({
    metricType: MetricType.MEMORY_USAGE,
    implementation
  });
  
  // Measure layout shifts
  results[MetricType.LAYOUT_SHIFTS] = await measureLayoutShifts(
    tests.animateSlider,
    {
      metricType: MetricType.LAYOUT_SHIFTS,
      implementation
    }
  );
  
  // Measure interaction responsiveness
  results[MetricType.INTERACTION_RESPONSIVENESS] = await measureInteractionResponsiveness(
    tests.interactWithSlider,
    {
      metricType: MetricType.INTERACTION_RESPONSIVENESS,
      implementation,
      iterations
    }
  );
  
  return results;
}; 