/**
 * Test fixture types
 */
import type { Slide } from '../slider';
import type { GsapVars } from '../gsap';

/**
 * Test Data Fixtures
 */
export interface TestSlide extends Slide {
  testId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Test Event Fixtures
 */
export interface TestEvent {
  type: string;
  target: Element;
  preventDefault: () => void;
  stopPropagation: () => void;
  clientX?: number;
  clientY?: number;
  touches?: { clientX: number; clientY: number }[];
}

// Import touch types from mocks
export { type TouchOptions as TouchInit } from './mocks'; 