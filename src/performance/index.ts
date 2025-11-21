/**
 * @fileoverview Performance optimization modules exports
 *
 * Barrel file for all Phase 5.2 performance optimization components.
 * Provides unified access to virtual rendering, texture atlasing,
 * memory profiling, bundle optimization, and lazy loading.
 */

// Core performance components
export { VirtualRenderer } from './virtual-renderer';
export { TextureAtlas } from './texture-atlas';
export { MemoryProfiler } from './memory-profiler';
export { BundleOptimizer } from './bundle-optimizer';
export { LazyLoader } from './lazy-loader';

// Type exports
export type {
  VirtualItem,
  VirtualRendererConfig,
  Viewport,
  RenderStats,
  VirtualScrollEvents,
} from './virtual-renderer';

export type {
  AtlasFrame,
  AtlasConfig,
  AtlasStats,
  AtlasEvents,
  PackingAlgorithm,
} from './texture-atlas';

export type {
  MemorySnapshot,
  LeakDetectionResult,
  AllocationTrace,
  MemoryProfilerConfig,
  GCStats,
  OptimizationRecommendation,
  MemoryProfilerEvents,
} from './memory-profiler';

export type {
  ModuleDependency,
  BundleAnalysis,
  CodeSplitRecommendation,
  TreeShakingConfig,
  BundleOptimizerConfig,
} from './bundle-optimizer';

export type {
  LoadableFeature,
  LoadingStrategy,
  LoadingCondition,
  LoadResult,
  LoadingStats,
  LazyLoaderConfig,
  LazyLoaderEvents,
} from './lazy-loader';
