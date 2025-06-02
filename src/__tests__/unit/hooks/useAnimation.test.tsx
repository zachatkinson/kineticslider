import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAnimation } from "@/hooks/useAnimation";
import * as animationUtils from "@/utils/animation";

// Mock animation utilities - must be at top level
vi.mock("@/utils/animation", () => ({
  createBasicAnimation: vi.fn(),
}));

// Import mocks after vi.mock
import {
  createMockAnimationOptions,
  resetAnimationMocks,
} from "../../mocks/animation.mock";

describe("useAnimation Hook", () => {
  const mockOptions = createMockAnimationOptions();

  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    resetAnimationMocks();
  });

  it("should return an animate function", () => {
    const { result } = renderHook(() => useAnimation());

    expect(result.current.animate).toBeInstanceOf(Function);
  });

  it("should call createBasicAnimation with the provided options", () => {
    const { result } = renderHook(() => useAnimation());

    // Call the animate function
    result.current.animate(mockOptions);

    // Verify createBasicAnimation was called with the right options
    expect(animationUtils.createBasicAnimation).toHaveBeenCalledWith(
      mockOptions,
    );
  });

  it("should return a cleanup function", () => {
    const mockCleanup = vi.fn();
    vi.mocked(animationUtils.createBasicAnimation).mockReturnValue(mockCleanup);

    const { result } = renderHook(() => useAnimation());

    // Call animate and get the cleanup function
    const cleanup = result.current.animate(mockOptions);

    // Verify we got back the same cleanup function
    expect(cleanup).toBe(mockCleanup);
  });
});
