/**
 * E2E Testing Type Definitions
 * 
 * Centralized type definitions for end-to-end testing scenarios.
 * Consolidates interfaces and types used across E2E test files.
 * 
 * @module E2ETestingTypes
 * @version 1.0.0
 */

import type { Page } from '@playwright/test';

/**
 * Common test utilities interface for E2E testing environments
 * 
 * @example
 * Basic test utilities usage
 * ```typescript
 * const utils: TestUtilities = {
 *   getCurrentSlide: () => 0,
 *   getSlideCount: () => 5,
 *   isAnimating: () => false
 * };
 * ```
 */
export interface TestUtilities {
  getCurrentSlide(): number;
  getSlideCount?(): number;
  isAnimating?(): boolean;
  getLastInteractionType?(): string | null;
  getAccessibilityAnnouncement?(): string | null;
}

/**
 * Gesture testing utilities interface for E2E gesture handling tests
 * 
 * @example
 * Gesture testing utilities usage
 * ```typescript
 * const gestureUtils: GestureTestUtilities = {
 *   getCurrentSlide: () => 0,
 *   setGestureEnabled: (enabled) => console.log('Gestures:', enabled),
 *   isGestureEnabled: () => true,
 *   getLastGestureInfo: () => ({ type: 'touch', direction: 'left', distance: 100 }),
 *   goToNext: () => true
 * };
 * ```
 */
export interface GestureTestUtilities {
  getCurrentSlide(): number;
  setGestureEnabled(enabled: boolean): void;
  isGestureEnabled(): boolean;
  getLastGestureInfo(): { type: string; direction: string; distance: number } | null;
  goToNext(): boolean;
}

/**
 * User journey testing utilities interface for E2E user journey tests
 * 
 * @example
 * User journey testing utilities usage
 * ```typescript
 * const journeyUtils: UserJourneyTestUtilities = {
 *   getCurrentSlide: () => 0,
 *   getSlideCount: () => 5,
 *   isAnimating: () => false,
 *   getLastInteractionType: () => 'click',
 *   getAccessibilityAnnouncement: () => 'Slide 1 of 5'
 * };
 * ```
 */
export interface UserJourneyTestUtilities {
  getCurrentSlide(): number;
  getSlideCount(): number;
  isAnimating(): boolean;
  getLastInteractionType(): string | null;
  getAccessibilityAnnouncement(): string | null;
}

/**
 * Worker pool testing utilities interface for E2E worker pool tests
 * 
 * @example
 * Worker pool testing utilities usage
 * ```typescript
 * const workerUtils: WorkerPoolTestUtilities = {
 *   createTestWorkerScript: () => 'self.onmessage = ...',
 *   TestWorkerPool: class TestWorkerPool { ... }
 * };
 * ```
 */
export interface WorkerPoolTestUtilities {
  createTestWorkerScript(): string;
  TestWorkerPool: new (options: { maxWorkers: number; workerScript: string }) => Record<string, unknown>;
}

/**
 * Resource management testing utilities interface for E2E resource management tests
 * 
 * @example
 * Resource management testing utilities usage
 * ```typescript
 * const resourceUtils: ResourceManagementTestUtilities = {
 *   createWorkerPool: (options) => new WorkerPool(options),
 *   createResourcePool: (factory, reset, size) => new ResourcePool(factory, reset, size),
 *   executeTask: (pool, task) => pool.execute(task),
 *   abortTasks: (pool) => pool.abort(),
 *   terminatePool: (pool) => pool.terminate()
 * };
 * ```
 */
export interface ResourceManagementTestUtilities {
  createWorkerPool(options: Record<string, unknown>): Record<string, unknown>;
  createResourcePool(factory: () => unknown, reset: (item: unknown) => void, size: number): Record<string, unknown>;
  executeTask(pool: Record<string, unknown>, task: () => unknown): Promise<unknown>;
  abortTasks(pool: Record<string, unknown>): number;
  terminatePool(pool: Record<string, unknown>): void;
}

/**
 * Canvas responsiveness testing utilities interface
 * 
 * @example
 * Canvas testing utilities usage
 * ```typescript
 * const canvasUtils: CanvasTestUtilities = {
 *   getBreakpoint: () => 'desktop',
 *   getCanvasDimensions: () => ({ width: 800, height: 600 }),
 *   getCanvasMode: () => 'responsive',
 *   setCanvasMode: (mode) => console.log('Canvas mode:', mode),
 *   triggerResize: () => console.log('Resize triggered')
 * };
 * ```
 */
export interface CanvasTestUtilities {
  getBreakpoint(): string;
  getCanvasDimensions(): { width: number; height: number };
  getCanvasMode(): string;
  setCanvasMode(mode: string): void;
  triggerResize(): void;
}

/**
 * E2E test setup function type
 */
export type E2ETestSetupFunction = (page: Page) => Promise<void>;

/**
 * E2E test cleanup function type
 */
export type E2ETestCleanupFunction = () => void | Promise<void>;

/**
 * E2E test configuration interface
 * 
 * @example
 * E2E test configuration usage
 * ```typescript
 * const config: E2ETestConfig = {
 *   timeout: 30000,
 *   retries: 2,
 *   viewport: { width: 1280, height: 720 },
 *   hasTouch: true
 * };
 * ```
 */
export interface E2ETestConfig {
  timeout?: number;
  retries?: number;
  viewport?: { width: number; height: number };
  hasTouch?: boolean;
  isMobile?: boolean;
}

/**
 * Browser capability detection interface for E2E testing
 * 
 * @example
 * Browser capability detection usage
 * ```typescript
 * const capabilities: BrowserCapabilities = {
 *   supportsReliableGestures: (projectName) => projectName === 'chromium',
 *   supportsTouchEvents: (projectName) => ['webkit', 'Mobile Chrome'].includes(projectName),
 *   requiresFallback: (projectName) => projectName === 'firefox'
 * };
 * ```
 */
export interface BrowserCapabilities {
  supportsReliableGestures(projectName: string): boolean;
  supportsTouchEvents(projectName: string): boolean;
  requiresFallback(projectName: string): boolean;
} 