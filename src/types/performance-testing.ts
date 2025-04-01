/**
 * Performance testing and benchmarking type definitions
 * @module
 * @version 1.0.0
 * @internal This module contains types used only for performance testing and benchmarking
 * 
 * This module contains types specifically for performance testing and benchmarking.
 * For runtime monitoring types, see performance.ts
 * For shared types between testing and monitoring, see performance-shared.ts
 */

import type { FeatureFlag } from './feature-flags';
import type { MetricSummary, BasePerformanceMetric } from './performance-shared';

/** 
 * Types of metrics that can be tested 
 * @internal
 */
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

/** 
 * Implementation types for A/B testing 
 * @internal
 */
export enum ImplementationType {
  LEGACY = 'legacy',
  NEW = 'new'
}

/** 
 * Result of a single performance test 
 * @internal
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
 * @internal
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
 * @internal
 */
export interface TestPerformanceMetric extends BasePerformanceMetric {
  featureFlags: Record<FeatureFlag, boolean>;
}

/** 
 * Result of a benchmark test run 
 * @internal
 */
export interface BenchmarkResult {
  name: string;
  summary: MetricSummary;
  timestamp: Date;
} 