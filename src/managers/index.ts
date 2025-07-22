/**
 * @fileoverview Managers Module Index
 *
 * Exports for Phase 2.3 GSAP Animation Coordination system.
 * Provides centralized imports for all animation management components.
 *
 * @version 2.3.0
 */

// Import manager classes for coordinator
import { AnimationManager } from './animation-manager';
import { PerformanceMonitor } from './performance-monitor';
import { MemoryManager } from './memory-manager';
import { AnimationQueue } from './animation-queue';

// Animation coordination managers
export { AnimationManager } from './animation-manager';
export { PerformanceMonitor } from './performance-monitor';
export { MemoryManager } from './memory-manager';
export { AnimationQueue } from './animation-queue';
export { AutoPlayManager } from './auto-play-manager';
export { LoopManager } from './loop-manager';
export { NavigationManager } from './navigation-manager';
export { StateManager } from './state-manager';
export type { AutoPlayConfig, PauseReason } from './auto-play-manager';
export type {
  LoopConfig,
  LoopMode,
  VirtualSlide,
  LoopTransition,
} from './loop-manager';
export type {
  NavigationConfig,
  NavigationRequest,
  NavigationResult,
  SlideBounds,
  NavigationInputType,
  NavigationDirection,
} from './navigation-manager';
export type {
  SliderState,
  StateHistoryEntry,
  StateValidationResult,
  StateBounds,
  StatePersistenceConfig,
  StateManagerConfig,
} from './state-manager';

// Type exports for external use
export type {
  PerformanceMetrics,
  PerformanceAlert,
} from './performance-monitor';

export type { ResourceInfo, MemoryStats, MemoryLeak } from './memory-manager';

export type { QueueItem, QueueStats } from './animation-queue';

// Manager coordination utilities - exported for external use
export class ManagerCoordinator {
  private animationManager: AnimationManager;
  private performanceMonitor: PerformanceMonitor;
  private memoryManager: MemoryManager;
  private animationQueue: AnimationQueue;

  constructor() {
    this.animationManager = new AnimationManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.memoryManager = new MemoryManager();
    this.animationQueue = new AnimationQueue();
  }

  /**
   * Start all managers
   */
  startAll(): void {
    this.performanceMonitor.start();
    this.memoryManager.start();
    this.animationQueue.start();
  }

  /**
   * Stop all managers
   */
  stopAll(): void {
    this.performanceMonitor.stop();
    this.memoryManager.stop();
    this.animationQueue.stop();
  }

  /**
   * Get all managers
   */
  getManagers(): {
    animationManager: AnimationManager;
    performanceMonitor: PerformanceMonitor;
    memoryManager: MemoryManager;
    animationQueue: AnimationQueue;
  } {
    return {
      animationManager: this.animationManager,
      performanceMonitor: this.performanceMonitor,
      memoryManager: this.memoryManager,
      animationQueue: this.animationQueue,
    };
  }

  /**
   * Dispose all managers
   */
  dispose(): void {
    this.animationManager.dispose();
    this.performanceMonitor.dispose();
    this.memoryManager.dispose();
    this.animationQueue.dispose();
  }
}
