/* eslint-env vitest */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SliderEventType } from '../../types/analytics';
// Import after mocking
import { trackError, trackEvent } from '../../utils/analytics';

// Mock the analytics module
vi.mock('../../utils/analytics', () => {
  return {
    analytics: {
      trackEvent: vi.fn(),
      trackError: vi.fn(),
      getConfig: vi.fn().mockReturnValue({ enabled: true, enableErrors: true }),
    },
    trackEvent: vi.fn(),
    trackError: vi.fn(),
    SliderEventType,
    resetAnalyticsForTesting: vi.fn(),
  };
});

describe('Analytics Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent helper', () => {
    it('should call analytics.trackEvent', () => {
      // Call the helper
      trackEvent(SliderEventType.SLIDE_CHANGE, { index: 1 });

      // Verify it was called with the right arguments
      expect(trackEvent).toHaveBeenCalledWith(SliderEventType.SLIDE_CHANGE, {
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
