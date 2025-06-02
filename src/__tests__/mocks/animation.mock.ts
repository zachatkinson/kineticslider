/**
 * Mock implementations for animation utilities
 */
import { vi } from "vitest";
import type { AnimationOptions } from "../../types/animation";

/**
 * Mock cleanup function for animations
 */
export const mockAnimationCleanup = vi.fn();

/**
 * Mock createBasicAnimation function
 */
export const mockCreateBasicAnimation = vi.fn().mockReturnValue(mockAnimationCleanup);

/**
 * Mock animation target element
 * 
 * @returns HTML element for testing
 *
 */
export const createMockAnimationTarget = (): HTMLElement => {
  return document.createElement("div");
};

/**
 * Mock animation options
 * 
 * @param overrides - Optional overrides for animation options
 *
 * @returns Mock animation options object
 *
 */
export const createMockAnimationOptions = (overrides: Partial<AnimationOptions> = {}): AnimationOptions => ({
  target: createMockAnimationTarget(),
  config: {
    duration: 0.5,
    ease: "power2.out",
  },
  onComplete: vi.fn(),
  ...overrides,
});

/**
 * Reset all animation mocks
 * 
 * @returns void
 *
 */
export const resetAnimationMocks = (): void => {
  mockAnimationCleanup.mockReset();
  mockCreateBasicAnimation.mockReset();
  mockCreateBasicAnimation.mockReturnValue(mockAnimationCleanup);
};

/**
 * Setup animation mocks with custom implementations
 * 
 * @param customCleanup - Optional custom cleanup function
 *
 * @returns void
 *
 */
export const setupAnimationMocks = (customCleanup?: () => void): void => {
  if (customCleanup) {
    mockCreateBasicAnimation.mockReturnValue(customCleanup);
  } else {
    mockCreateBasicAnimation.mockReturnValue(mockAnimationCleanup);
  }
};

// Export the mock module for vi.mock()
export const animationUtilsMock = {
  createBasicAnimation: mockCreateBasicAnimation,
}; 