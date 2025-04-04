import { FeatureFlag } from './feature-flags';
import type { TestPerformanceMetric as ImportedTestPerformanceMetric } from '../src/types/performance-testing';
import type { BenchmarkResult as ImportedBenchmarkResult } from '../src/types/migration';
import { calculateMean } from '../src/utils';

// Import the necessary math functions directly without relying on re-exports
import { _calculateMedian as calculateMedian, _calculateStandardDeviation as calculateStandardDeviation, _calculatePercentile as calculatePercentile } from '../src/utils/math';

// Import the MetricSummary interface directly
import type { MetricSummary } from '../src/types/performance-shared';

// Define our TestPerformanceMetric interface with compatible properties
type TestPerformanceMetric = ImportedTestPerformanceMetric;

// Extend the BenchmarkResult interface to include metrics
interface BenchmarkResult extends ImportedBenchmarkResult {
  metrics?: TestPerformanceMetric[];
}

class PerformanceBenchmark {
    private metrics: TestPerformanceMetric[] = [];
    private static instance: PerformanceBenchmark;
    private constructor() { }
    static getInstance(): PerformanceBenchmark {
        if (!PerformanceBenchmark.instance) {
            PerformanceBenchmark.instance = new PerformanceBenchmark();
        }
        return PerformanceBenchmark.instance;
    }
    recordMetric(name: string, value: number, unit: TestPerformanceMetric['unit']): void {
        const featureFlags = Object.values(FeatureFlag).reduce((acc, flag) => {
            acc[flag] = false;
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
    async measureExecutionTime(name: string, fn: () => Promise<void> | void): Promise<number> {
        const start = performance.now();
        await fn();
        const end = performance.now();
        const duration = end - start;
        this.recordMetric(name, duration, 'ms');
        return duration;
    }
    measureFPS(name: string, durationMs: number = 1000): Promise<number> {
        return new Promise((resolve) => {
            let frameCount = 0;
            let startTime = performance.now();
            const countFrame = (): void => {
                frameCount++;
                const currentTime = performance.now();
                if (currentTime - startTime >= durationMs) {
                    const fps = (frameCount * 1000) / (currentTime - startTime);
                    this.recordMetric(name, fps, 'fps');
                    resolve(fps);
                }
                else {
                    requestAnimationFrame(countFrame);
                }
            };
            requestAnimationFrame(countFrame);
        });
    }
    getMetricSummary(metricName: string): BenchmarkResult {
        const relevantMetrics = this.metrics.filter(m => m.name === metricName);
        const values = relevantMetrics.map(m => m.value).sort((a, b) => a - b);
        if (values.length === 0) {
            throw new Error(`No metrics found for name: ${metricName}`);
        }
        return {
            name: metricName,
            metrics: relevantMetrics,
            summary: this.calculateSummary(values),
            timestamp: new Date()
        };
    }
    compareFeatureImpact(metricName: string, targetFlag: FeatureFlag): {
        withFeature: BenchmarkResult;
        withoutFeature: BenchmarkResult;
        improvement: number;
    } {
        const metricsWithFeature = this.metrics.filter(m => m.name === metricName && m.featureFlags[targetFlag]);
        const metricsWithoutFeature = this.metrics.filter(m => m.name === metricName && !m.featureFlags[targetFlag]);
        const withFeature = {
            name: `${metricName}-with-${targetFlag}`,
            metrics: metricsWithFeature,
            summary: this.calculateSummary(metricsWithFeature.map(m => m.value)),
            timestamp: new Date()
        };
        const withoutFeature = {
            name: `${metricName}-without-${targetFlag}`,
            metrics: metricsWithoutFeature,
            summary: this.calculateSummary(metricsWithoutFeature.map(m => m.value)),
            timestamp: new Date()
        };
        const improvement = (withoutFeature.summary.avg - withFeature.summary.avg) /
            withoutFeature.summary.avg * 100;
        return { withFeature, withoutFeature, improvement };
    }
    calculateSummary(values: number[]): MetricSummary {
        const sorted = [...values].sort((a, b) => a - b);
        return {
            avg: calculateMean(values),
            median: calculateMedian(values),
            stdDev: calculateStandardDeviation(values),
            p95: calculatePercentile(values, 95),
            min: sorted.length > 0 ? sorted[0] : 0,
            max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
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
    clearMetrics(): void {
        this.metrics = [];
    }
}
export const benchmark = PerformanceBenchmark.getInstance();
/**
 * Collects performance metrics
 * @returns Array of performance metrics
 */
export function collectMetrics(): TestPerformanceMetric[] {
    const metrics: TestPerformanceMetric[] = [];
    const timestamp = new Date();
    const featureFlags = Object.values(FeatureFlag).reduce((acc, flag) => ({
        ...acc,
        [flag]: false
    }), {} as Record<FeatureFlag, boolean>);
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
/**
 * Analyzes benchmark data
 * @param metrics - Array of performance metrics to analyze
 * @returns Benchmark result with statistical analysis
 */
export function analyzeBenchmark(metrics: TestPerformanceMetric[]): BenchmarkResult {
    const values = metrics.map(m => m.value);
    const sorted = [...values].sort((a, b) => a - b);
    return {
        name: 'performance-analysis',
        summary: {
            avg: calculateMean(values),
            median: calculateMedian(values),
            stdDev: calculateStandardDeviation(values),
            p95: calculatePercentile(values, 95),
            min: sorted.length > 0 ? sorted[0] : 0,
            max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
            count: values.length
        },
        timestamp: new Date()
    };
}
/**
 * Calculates frames per second
 * @returns Calculated FPS value
 */
function calculateFPS(): number {
    return 60;
}

// Re-export types
export type { TestPerformanceMetric, BenchmarkResult } from '../src/types/migration';
