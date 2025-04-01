/**
 * Migration type definitions and re-exports
 * @module
 * @version 1.0.0
 */

// Re-export feature flag types for backward compatibility
export type {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagContextType,
  FeatureFlagProviderProps
} from './feature-flags';

// Re-export performance metric types
export type {
  PerformanceResult,
  TestConfig,
  TestPerformanceMetric as PerformanceMetric,
  BenchmarkResult
} from './performance-testing';

export {
  MetricType,
  ImplementationType
} from './performance-testing';

// Re-export feature monitoring types
export type {
  FeatureEvent,
  FeatureMetrics
} from './feature-monitoring';

// Re-export shared performance types
export type {
  MetricSummary
} from './performance-shared';