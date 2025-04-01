import { FeatureFlag } from './feature-flags';
import type { PerformanceMetric, BenchmarkResult } from '../src/types/migration';
import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculatePercentile
} from '../src/utils';

class PerformanceBenchmark {
  private metrics: PerformanceMetric[] = [];
  private static instance: PerformanceBenchmark;

  private constructor() {}

  static getInstance(): PerformanceBenchmark {
    if (!PerformanceBenchmark.instance) {
      PerformanceBenchmark.instance = new PerformanceBenchmark();
    }
    return PerformanceBenchmark.instance;
  }

  // Record a performance metric
  recordMetric(name: string, value: number, unit: PerformanceMetric['unit']): void {
    const featureFlags = Object.values(FeatureFlag).reduce((acc, flag) => {
      acc[flag] = false; // Default to false since we removed getFeatureFlag
      return acc;
    }, {} as Record<FeatureFlag, boolean>);

    this.metrics.push({
      name,
      value,
      unit,
      timestamp: new Date(),
      featureFlags,
    });
  }

  // Measure execution time of a function
  async measureExecutionTime(name: string, fn: () => Promise<void> | void): Promise<number> {
    const start = performance.now();
    await fn();
    const end = performance.now();
    const duration = end - start;
    
    this.recordMetric(name, duration, 'ms');
    return duration;
  }

  // Measure FPS during an animation
  measureFPS(name: string, durationMs: number = 1000): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();
      
      const countFrame = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - startTime >= durationMs) {
          const fps = (frameCount * 1000) / (currentTime - startTime);
          this.recordMetric(name, fps, 'fps');
          resolve(fps);
        } else {
          requestAnimationFrame(countFrame);
        }
      };
      
      requestAnimationFrame(countFrame);
    });
  }

  // Calculate summary statistics for a metric
  getMetricSummary(metricName: string): BenchmarkResult {
    const relevantMetrics = this.metrics.filter(m => m.name === metricName);
    const values = relevantMetrics.map(m => m.value).sort((a, b) => a - b);
    
    if (values.length === 0) {
      throw new Error(`No metrics found for name: ${metricName}`);
    }

    return {
      metrics: relevantMetrics,
      summary: this.calculateSummary(values)
    };
  }

  // Compare metrics between feature flag states
  compareFeatureImpact(metricName: string, targetFlag: FeatureFlag): {
    withFeature: BenchmarkResult;
    withoutFeature: BenchmarkResult;
    improvement: number;
  } {
    const metricsWithFeature = this.metrics.filter(
      m => m.name === metricName && m.featureFlags[targetFlag]
    );
    const metricsWithoutFeature = this.metrics.filter(
      m => m.name === metricName && !m.featureFlags[targetFlag]
    );

    const withFeature = {
      metrics: metricsWithFeature,
      summary: this.calculateSummary(metricsWithoutFeature.map(m => m.value))
    };

    const withoutFeature = {
      metrics: metricsWithoutFeature,
      summary: this.calculateSummary(metricsWithoutFeature.map(m => m.value))
    };

    const improvement = 
      (withoutFeature.summary.mean - withFeature.summary.mean) / 
      withoutFeature.summary.mean * 100;

    return { withFeature, withoutFeature, improvement };
  }

  calculateSummary(values: number[]): MetricSummary {
    return {
      mean: calculateMean(values),
      median: calculateMedian(values),
      stdDev: calculateStandardDeviation(values),
      p95: calculatePercentile(values, 95),
      count: values.length
    };
  }

  analyzeBenchmark(name: string): BenchmarkResult {
    const values = this.metrics
      .filter(m => m.name === name)
      .map(m => m.value);

    return {
      name,
      summary: this.calculateSummary(values),
      timestamp: new Date()
    };
  }

  // Clear all recorded metrics
  clearMetrics(): void {
    this.metrics = [];
  }
}

export const benchmark = PerformanceBenchmark.getInstance();

export function collectMetrics(): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = [];
  const timestamp = new Date();
  const featureFlags = Object.values(FeatureFlag).reduce((acc, flag) => ({
    ...acc,
    [flag]: false
  }), {} as Record<FeatureFlag, boolean>);

  // Collect FPS metrics
  const fps = calculateFPS();
  metrics.push({
    name: 'fps',
    value: fps,
    unit: 'fps',
    timestamp,
    featureFlags
  });

  return metrics;
}

export function analyzeBenchmark(metrics: PerformanceMetric[]): BenchmarkResult {
  const values = metrics.map(m => m.value);
  
  return {
    metrics,
    summary: {
      mean: calculateMean(values),
      median: calculateMedian(values),
      standardDeviation: calculateStandardDeviation(values),
      p95: calculatePercentile(values, 95)
    }
  };
}

function calculateFPS(): number {
  // Simple FPS calculation
  return 60; // Placeholder value
}

// Example usage:
/*
// Measure execution time
await benchmark.measureExecutionTime('slider-init', async () => {
  await initializeSlider();
});

// Measure FPS
await benchmark.measureFPS('slider-animation');

// Get metric summary
const summary = benchmark.getMetricSummary('slider-init');

// Compare feature impact
const impact = benchmark.compareFeatureImpact(
  'slider-animation', 
  FeatureFlag.NEW_ANIMATION_SYSTEM
);
*/ 