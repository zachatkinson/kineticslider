/**
 * KineticSlider Migration Tools
 * 
 * This module exports all the tools needed for the phased migration 
 * from the legacy slider implementation to the new rewritten version.
 */

// Feature flag system
export { 
  FeatureFlag, 
  FeatureFlagProvider, 
  useFeatureFlags,
  useFeature,
  getFeatureFlag
} from './feature-flags';

// Migration dashboard for tracking progress
export { 
  MigrationDashboard,
  MigrationPhase,
  PhaseStatus
} from './migration-dashboard';

// Performance benchmarking utilities
export {
  MetricType,
  ImplementationType,
  measureExecutionTime,
  measureAnimationSmoothness,
  measureMemoryUsage,
  measureLayoutShifts,
  measureInteractionResponsiveness,
  runPerformanceTestSuite,
  compareImplementations,
  loadBenchmarkResults,
  saveBenchmarkResults,
  addBenchmarkResult,
  clearBenchmarkResults
} from './performance-benchmark'; 