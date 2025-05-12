/**
 * Mock implementations for analytics
 */
import { vi } from "vitest";

// Mock analytics functions
export const trackEventMock = vi.fn();
export const trackErrorMock = vi.fn();
export const getConfigMock = vi
  .fn()
  .mockReturnValue({ enabled: true, enableErrors: true });
export const resetAnalyticsMock = vi.fn();

// Mock analytics manager
export const AnalyticsManagerMock = {
  getInstance: vi.fn().mockReturnValue({
    trackEvent: trackEventMock,
    trackError: trackErrorMock,
    getConfig: getConfigMock,
    reset: resetAnalyticsMock,
  }),
};

// Mock analytics module
export const analyticsMock = {
  trackEvent: trackEventMock,
  trackError: trackErrorMock,
  getConfig: getConfigMock,
  _resetAnalyticsForTesting: resetAnalyticsMock,
};

// Reset all analytics mocks
export const resetAnalyticsMocks = (): void => {
  trackEventMock.mockReset();
  trackErrorMock.mockReset();
  getConfigMock.mockReset();
  resetAnalyticsMock.mockReset();
};

const _setupAnalyticsMock = (): void => {
  // Implementation of setupAnalyticsMock function
};
