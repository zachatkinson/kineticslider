/**
 * Performance testing and benchmarking type definitions
 *
 * @module
 * @version 1.0.0
 * @description This module contains types used only for performance testing and benchmarking
 *
 * This module contains types specifically for performance testing and benchmarking.
 * For runtime monitoring: types, see performance.ts
 * For shared types between testing and: monitoring, see performance-shared.ts
 */

import type { FeatureFlag } from "./feature-flags";
import type {
  MetricSummary,
  BasePerformanceMetric,
} from "./performance-shared";

/**
 * Extended Performance interface with memory property for testing
 * 
 * @description Used in browser tests where performance.memory might not be available
 */
export type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

/**
 * Types of metrics that can be tested
 *
 * @description */
export enum MetricType {
  RENDER_TIME = "render-time",
  ANIMATION_SMOOTHNESS = "animation-smoothness",
  MEMORY_USAGE = "memory-usage",
  INITIAL_LOAD_TIME = "initial-load-time",
  INTERACTION_RESPONSIVENESS = "interaction-responsiveness",
  RESOURCE_LOADING = "resource-loading",
  LAYOUT_SHIFTS = "layout-shifts",
  GESTURE_HANDLING = "gesture-handling",
}

/**
 * Implementation types for A/B testing
 *
 * @description */
export enum ImplementationType {
  LEGACY = "legacy",
  NEW = "new",
}

/**
 * Result of a single performance test
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const result: PerformanceResult = {
 *   name: 'Render Performance',
 *   duration: 16.7,
 *   memoryUsage: 24.5,
 *   cpuUsage: 12.3,
 *   timestamp: new Date(),
 *   metricType: MetricType.RENDER_TIME,
 *   implementation: ImplementationType.NEW,
 *   value: 16.7,
 *   unit: 'ms'
 * };
 * ```
 */
export interface PerformanceResult {
  name: string;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  timestamp: Date;
  metricType: MetricType;
  implementation: ImplementationType;
  testContext?: unknown;
  value?: number;
  unit?: string;
}

/**
 * Configuration for running performance tests
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const config: TestConfig = {
 *   name: 'Animation Smoothness Test',
 *   iterations: 10,
 *   warmupIterations: 2,
 *   timeout: 5000,
 *   metricType: MetricType.ANIMATION_SMOOTHNESS,
 *   implementation: ImplementationType.NEW
 * };
 * ```
 */
export interface TestConfig {
  name: string;
  iterations: number;
  warmupIterations?: number;
  timeout?: number;
  metricType: MetricType;
  implementation: ImplementationType;
  testContext?: unknown;
}

/**
 * Performance metric with feature flag context
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const metric: TestPerformanceMetric = {
 *   name: 'Initial Load Time',
 *   value: 350,
 *   timestamp: new Date(),
 *   featureFlags: {
 *     OPTIMIZED_RENDERING: true,
 *     PARALLEL_LOADING: false
 *   }
 * };
 * ```
 */
export interface TestPerformanceMetric extends BasePerformanceMetric {
  featureFlags: Record<FeatureFlag, boolean>;
}

/**
 * Result of a benchmark test run
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const benchmark: BenchmarkResult = {
 *   name: 'Slider Animation Benchmark',
 *   summary: {
 *     avg: 16.7,
 *     min: 10.2,
 *     max: 28.4,
 *     median: 16.2,
 *     p95: 25.1,
 *     stdDev: 4.3
 *   },
 *   timestamp: new Date()
 * };
 * ```
 */
export interface BenchmarkResult {
  name: string;
  summary: MetricSummary;
  timestamp: Date;
}
