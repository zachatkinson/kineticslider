/**
 * GSAP-related test type definitions
 *
 * @module
 * @version 1.0.0
 * @description This module contains mock GSAP types used only for testing purposes
 */

import type { Mock } from "vitest";

/**
 * Mock GSAP interface for testing
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const mockGsap: MockGsap = {
 *   to: vi.fn().mockReturnValue({ pause: vi.fn(), resume: vi.fn() }),
 *   from: vi.fn(),
 *   fromTo: vi.fn(),
 *   timeline: vi.fn().mockReturnValue({ add: vi.fn(), play: vi.fn() }),
 *   set: vi.fn(),
 *   getProperty: vi.fn().mockReturnValue(100),
 *   getTweensOf: vi.fn().mockReturnValue([]),
 *   killTweensOf: vi.fn()
 * };
 * ```
 */
export interface MockGsap {
  to: Mock;
  from: Mock;
  fromTo: Mock;
  timeline: Mock;
  set: Mock;
  getProperty: Mock;
  getTweensOf: Mock;
  killTweensOf: Mock;
}

/**
 * Mock GSAP Timeline interface
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const mockTimeline: MockGsapTimeline = {
 *   to: vi.fn(),
 *   from: vi.fn(),
 *   fromTo: vi.fn(),
 *   set: vi.fn(),
 *   add: vi.fn(),
 *   pause: vi.fn(),
 *   resume: vi.fn(),
 *   progress: vi.fn().mockReturnValue(0.5),
 *   kill: vi.fn()
 * };
 * ```
 */
export interface MockGsapTimeline {
  to: Mock;
  from: Mock;
  fromTo: Mock;
  set: Mock;
  add: Mock;
  pause: Mock;
  resume: Mock;
  progress: Mock;
  kill: Mock;
}

/**
 * Mock GSAP Tween interface
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const mockTween: MockGsapTween = {
 *   pause: vi.fn(),
 *   resume: vi.fn(),
 *   progress: vi.fn().mockReturnValue(0.25),
 *   kill: vi.fn(),
 *   vars: { duration: 1, ease: 'power2.out' }
 * };
 * ```
 */
export interface MockGsapTween {
  pause: Mock;
  resume: Mock;
  progress: Mock;
  kill: Mock;
  vars: Record<string, unknown>;
}
