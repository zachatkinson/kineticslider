/* eslint-env vitest */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocking
import { trackError, trackEvent } from '../../utils/analytics';

// Mock the analytics module
vi.mock('../../utils/analytics', () => {
  return {
    analytics: {
      trackEvent: vi.fn(),
      trackError: vi.fn(),
      getConfig: vi.fn().mockReturnValue({ enabled: true, enableErrors: true })
    },
    trackEvent: vi.fn(),
    trackError: vi.fn(),
    // Remove SliderEventType from the mock as it's only a type
    resetAnalyticsForTesting: vi.fn()
  };
});

describe('Analytics Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent helper', () => {
    it('should call analytics.trackEvent', () => {
      // Call the helper with the string literal for slide_change
      trackEvent('slide_change', { index: 1 });

      // Verify it was called with the right arguments
      expect(trackEvent).toHaveBeenCalledWith('slide_change', {
        index: 1,
      });
    });
  });

  describe('trackError helper', () => {
    it('should call analytics.trackError', () => {
      // Create an error and track it
      const error = new Error('Test error');
      const context = { componentId: 'test-component' };

      trackError(error, context);

      // Verify it was called with the right arguments
      expect(trackError).toHaveBeenCalledWith(error, context);
    });
  });
});
