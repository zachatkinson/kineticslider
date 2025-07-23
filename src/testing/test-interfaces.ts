/**
 * @fileoverview Testing interfaces for accessing internal methods
 *
 * Provides type-safe access to internal methods for testing without
 * using any types or eslint-disable comments.
 */

import type { PerformanceMonitor } from '../managers/performance-monitor';
import type { AutoPlayManager } from '../managers/auto-play-manager';
import type { NavigationManager } from '../managers/navigation-manager';
import type { LoopManager } from '../managers/loop-manager';
import type { SliderCore } from '../core/slider-core';
import type { SliderConfig } from '../core/types';
import { vi } from 'vitest';

/**
 * Testing interface for PerformanceMonitor internal methods
 */
export interface PerformanceMonitorTestable {
  updateMemoryMetrics(): void;
  recordAnimationStart(): void;
  recordAnimationEnd(): void;
  calculatePerformanceScore(): number;
}

/**
 * Type-safe cast for accessing testable methods
 */
export function asTestablePerformanceMonitor(
  monitor: PerformanceMonitor
): PerformanceMonitorTestable {
  return monitor as unknown as PerformanceMonitorTestable;
}

/**
 * Mock filter interface for PIXI testing
 */
export interface MockFilter {
  scale: { x: number; y: number };
  enabled: boolean;
  destroy: () => void;
  padding: number;
  antialias: string;
  _state: { data: number };
  blendMode: string;
  resolution: number;
  multisample: string;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

/**
 * Create a properly typed mock filter
 */
export function createMockFilter(): MockFilter {
  return {
    scale: { x: 0, y: 0 },
    enabled: true,
    destroy: vi.fn(),
    padding: 0,
    antialias: 'inherit',
    _state: { data: 0 },
    blendMode: 'normal',
    resolution: 1,
    multisample: 'inherit',
    blur: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    hue: 0,
  };
}

/**
 * Testing interface for SliderCore internal methods
 */
export interface SliderCoreTestable {
  autoPlayManager: AutoPlayManager;
  navigationManager: NavigationManager;
  loopManager: LoopManager;
  configureManagers: (config: SliderConfig) => void;
}

/**
 * Testing interface for manager configurations
 */
export interface ManagerConfigTestable {
  enabled: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  pauseOnInteraction?: boolean;
  enableKeyboard?: boolean;
  enableMouse?: boolean;
  enableTouch?: boolean;
}

/**
 * Type-safe cast for accessing testable SliderCore methods
 */
export function asTestableSliderCore(core: SliderCore): SliderCoreTestable {
  return core as unknown as SliderCoreTestable;
}

/**
 * Type-safe cast for accessing manager config
 */
export function getManagerConfig(
  manager: AutoPlayManager | NavigationManager | LoopManager
): ManagerConfigTestable {
  return (manager as unknown as { config: ManagerConfigTestable }).config;
}
