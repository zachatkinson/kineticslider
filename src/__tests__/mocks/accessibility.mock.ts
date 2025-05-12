/**
 * Mock implementations for accessibility utilities
 */
import { vi } from "vitest";

// Mock the useSliderAccessibility hook
export const useSliderAccessibilityMock = vi.fn().mockReturnValue({
  announceSlide: vi.fn(),
  announceError: vi.fn(),
  announceLoading: vi.fn(),
  announceLoaded: vi.fn(),
  announceNavigation: vi.fn(),
  announceInteraction: vi.fn(),
  getAriaLabel: vi.fn().mockReturnValue("Slide"),
  getAriaDescription: vi.fn().mockReturnValue("Use arrow keys to navigate"),
  getAriaLiveRegion: vi.fn().mockReturnValue("polite"),
});

// Mock the accessibility manager
export const AccessibilityManagerMock = {
  getInstance: vi.fn().mockReturnValue({
    announce: vi.fn(),
    announceError: vi.fn(),
    announceLoading: vi.fn(),
    announceLoaded: vi.fn(),
    announceNavigation: vi.fn(),
    announceInteraction: vi.fn(),
    getAriaLabel: vi.fn().mockReturnValue("Slide"),
    getAriaDescription: vi.fn().mockReturnValue("Use arrow keys to navigate"),
    getAriaLiveRegion: vi.fn().mockReturnValue("polite"),
  }),
};

// Reset all accessibility mocks
export const resetAccessibilityMocks = (): void => {
  useSliderAccessibilityMock.mockReset();
  useSliderAccessibilityMock.mockReturnValue({
    announceSlide: vi.fn(),
    announceError: vi.fn(),
    announceLoading: vi.fn(),
    announceLoaded: vi.fn(),
    announceNavigation: vi.fn(),
    announceInteraction: vi.fn(),
    getAriaLabel: vi.fn().mockReturnValue("Slide"),
    getAriaDescription: vi.fn().mockReturnValue("Use arrow keys to navigate"),
    getAriaLiveRegion: vi.fn().mockReturnValue("polite"),
  });
};
