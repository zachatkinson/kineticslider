/**
 * GSAP-related test type definitions
 * @module
 * @version 1.0.0
 */

import type { Mock } from 'vitest';

/**
 * Mock GSAP interface for testing
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
 */
export interface MockGsapTween {
  pause: Mock;
  resume: Mock;
  progress: Mock;
  kill: Mock;
  vars: Record<string, unknown>;
} 