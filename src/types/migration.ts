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
  TestPerformanceMetric,
  BenchmarkResult,
  TestPerformanceMetric as PerformanceMetric 
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

import { ReactNode } from 'react';
import type { FeatureFlag } from './feature-flags';

/**
 * Props for the MigrationErrorBoundary component
 * @example Example usage
 */
export interface MigrationErrorBoundaryProps {
  /**
   * Content to render within the error boundary
   */
  children: ReactNode;
  
  /**
   * Optional fallback UI to render when an error occurs
   */
  fallback?: ReactNode;
  
  /**
   * Optional error handler function
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  /**
   * Optional feature flag associated with this error boundary
   */
  feature?: FeatureFlag;
}

/**
 * State for the MigrationErrorBoundary component
 * @example Example usage
 */
export interface MigrationErrorBoundaryState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * The error that: occurred, if any
   */
  error: Error | null;
}

/**
 * Migration phases representing the step-by-step process
 */
export enum MigrationPhase {
  PREPARATION = 'preparation',
  CORE_SLIDER = 'core_slider',
  CANVAS_SYSTEM = 'canvas_system',
  THEME_SYSTEM = 'theme_system',
  ANIMATION_EFFECTS = 'animation_effects',
  CONTENT_MANAGEMENT = 'content_management',
  PERFORMANCE_OPTIMIZATIONS = 'performance_optimizations',
  ACCESSIBILITY = 'accessibility',
  FINALIZATION = 'finalization'
}

/**
 * Status of a migration phase
 */
export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Metadata about a migration phase
 * @example
 * ```typescript
 * const phaseMetadata: PhaseMetadata = {
 *   label: 'Core Migration',
 *   description: 'Migrating core slider components',
 *   estimatedDuration: '2 hours',
 *   status: PhaseStatus.IN_PROGRESS,
 *   progress: 45,
 *   startedAt: new Date(),
 *   errors: []
 * };
 * ```
 */
export interface PhaseMetadata {
  /** Display name for the phase */
  label: string;
  /** Description of what this phase involves */
  description: string;
  /** Estimated time to complete the phase */
  estimatedDuration: string;
  /** Current status of the phase */
  status: PhaseStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** When the phase was started */
  startedAt?: Date;
  /** When the phase was completed */
  completedAt?: Date;
  /** Any errors that occurred during the phase */
  errors?: string[];
}

/**
 * Progress tracking for all migration phases
 */
export type PhaseProgress = Record<MigrationPhase, PhaseMetadata>;

/**
 * Props for the MigrationDashboard component
 * @example
 * ```tsx
 * <MigrationDashboard isAdmin={true} />
 * ```
 */
export interface MigrationDashboardProps {
  /** Whether the user has admin privileges */
  isAdmin?: boolean;
}

/**
 * Props for the PerformanceMonitor component
 * @example
 * ```tsx
 * const results = [{ name: 'Render Time', summary: { avg: 16.5, min: 12, max: 24 }, timestamp: new Date() }];
 * <PerformanceMonitor results={results} title="Slider Performance" />
 * ```
 */
export interface PerformanceMonitorProps {
  /** Results to display */
  results: import('./performance-testing').BenchmarkResult[];
  /** Title for the monitor component */
  title?: string;
}

/**
 * Props for a single metric card
 * @example
 * ```tsx
 * <MetricCard title="Memory Usage" value={128} unit="MB" />
 * ```
 */
export interface MetricCardProps {
  /** Title of the metric */
  title: string;
  /** Value to display */
  value: number;
  /** Unit of measurement */
  unit: string;
}

/**
 * Props for a metric chart component
 * @example
 * ```tsx
 * const data = [
 *   { timestamp: new Date(), value: 16.5, label: 'Initial' },
 *   { timestamp: new Date(), value: 12.3, label: 'Optimized' }
 * ];
 * <MetricChart data={data} height={300} width={500} unit="ms" />
 * ```
 */
export interface MetricChartProps {
  /** Data to display in the chart */
  data: { timestamp: Date | number; value: number; label?: string }[];
  /** Height of the chart */
  height?: number;
  /** Width of the chart */
  width?: number;
  /** Unit of measurement */
  unit?: string;
}