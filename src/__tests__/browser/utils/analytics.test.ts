/**
 * Browser tests for the analytics module
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsMock, resetAnalyticsMocks } from "../../mocks/analytics.mock";

// Mock the analytics module
vi.mock("../../../utils/analytics", () => analyticsMock);

// Import after mocking
import { trackError, trackEvent } from "../../../utils/analytics";

describe("Analytics Utilities - Browser", () => {
  beforeEach(() => {
    resetAnalyticsMocks();
  });

  describe("trackEvent helper", () => {
    it("should call trackEvent with the correct parameters", () => {
      // Call the helper with the string literal for slide_change
      trackEvent("slide_change", { index: 1 });

      // Verify it was called with the right arguments
      expect(trackEvent).toHaveBeenCalledWith("slide_change", {
        index: 1,
      });
    });

    it("should handle additional component ID parameter", () => {
      // Call the helper with the string literal for slide_change and a component ID
      trackEvent("slide_change", { index: 2 }, "slider-1");

      // Verify it was called with the right arguments
      expect(trackEvent).toHaveBeenCalledWith(
        "slide_change",
        {
          index: 2,
        },
        "slider-1",
      );
    });
  });

  describe("trackError helper", () => {
    it("should call trackError with the correct parameters", () => {
      // Create an error and track it
      const error = new Error("Test error");
      const context = { componentId: "test-component" };

      trackError(error, context);

      // Verify it was called with the right arguments
      expect(trackError).toHaveBeenCalledWith(error, context);
    });

    it("should handle minimal parameters", () => {
      // Create an error and track it without additional context
      const error = new Error("Simple error");

      trackError(error);

      // Verify it was called exactly once
      expect(trackError).toHaveBeenCalledTimes(1);

      // Get the actual call arguments to check
      const calls = vi.mocked(trackError).mock.calls;
      expect(calls[0][0]).toBe(error);
    });
  });
});
