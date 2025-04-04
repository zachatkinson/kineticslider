/**
 * Re-exports feature flag management utilities
 * @module FeatureFlags
 */
export { 
    FeatureFlagProvider, 
    useFeatureFlag 
} from './feature-flags';

/**
 * Re-exports migration dashboard components
 * @module MigrationDashboard
 */
export { 
    MigrationDashboard
} from './migration-dashboard';

/**
 * Re-exports performance benchmarking utilities
 * @module PerformanceBenchmark
 */
export { 
    measureExecutionTime, 
    measureAnimationSmoothness, 
    runBenchmark,
    loadBenchmarkResults, 
    saveBenchmarkResults, 
    addBenchmarkResult, 
    clearBenchmarkResults 
} from './performance-benchmark';

/**
 * Re-exports feature monitoring utilities
 * @module FeatureMonitoring
 */
export {
    featureMonitoring,
    trackFeatureUsage,
    getFeatureMetrics
} from './feature-monitoring';

/**
 * Re-exports error boundary components
 * @module ErrorBoundary
 */
export {
    FeatureErrorBoundary,
    MigrationErrorBoundary,
    withFeatureErrorBoundary
} from './error-boundary';
