import { describe, it, expect, vi } from "vitest";
import React from "react";
import {
  render,
  setupUserEvent,
  waitForAnimationComplete,
  generateMockSlides,
  customMatchers,
  MockIntersectionObserver,
  mockMatchMedia,
  mockRequestAnimationFrame,
  getMockSlides,
} from "./test-utils";

describe("test-utils", () => {
  describe("render", () => {
    it("renders a React component", () => {
      const TestComponent: React.FC = () =>
        React.createElement("div", null, "Test");
      const { getByText } = render(React.createElement(TestComponent));
      expect(getByText("Test")).toBeInTheDocument();
    });
  });

  describe("setupUserEvent", () => {
    it("returns a userEvent setup", () => {
      const user = setupUserEvent();
      expect(user).toBeDefined();
    });
  });

  describe("waitForAnimationComplete", () => {
    it("resolves when animation is complete", async () => {
      await expect(waitForAnimationComplete()).resolves.not.toThrow();
    });
  });

  describe("generateMockSlides", () => {
    it("generates the correct number of slides", () => {
      const slides = generateMockSlides(3);
      expect(slides).toHaveLength(3);
      expect(slides[0].title).toBe("Slide 1");
      expect(slides[1].title).toBe("Slide 2");
      expect(slides[2].title).toBe("Slide 3");
    });
  });

  describe("customMatchers", () => {
    it("toHaveBeenCalledWithDirection passes when direction matches", () => {
      const mockFn = vi.fn();
      mockFn.mockImplementation(() => {});
      mockFn("left");
      const result = customMatchers.toHaveBeenCalledWithDirection(
        mockFn,
        "left",
      );
      expect(result.pass).toBe(true);
    });

    it("toHaveBeenCalledWithDirection fails when direction does not match", () => {
      const mockFn = vi.fn();
      mockFn.mockImplementation(() => {});
      mockFn("right");
      const result = customMatchers.toHaveBeenCalledWithDirection(
        mockFn,
        "left",
      );
      expect(result.pass).toBe(false);
    });
  });

  describe("MockIntersectionObserver", () => {
    it("creates a mock IntersectionObserver", () => {
      const observer = new MockIntersectionObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
      expect(observer.takeRecords).toBeDefined();
    });
  });

  describe("mockMatchMedia", () => {
    it("mocks window.matchMedia", () => {
      mockMatchMedia(true);
      expect(window.matchMedia("(min-width: 768px)").matches).toBe(true);
    });
  });

  describe("mockRequestAnimationFrame", () => {
    it("calls the callback with a timestamp", async () => {
      await new Promise<void>((resolve) => {
        const callback = (timestamp: number): void => {
          expect(typeof timestamp).toBe("number");
          resolve();
        };
        mockRequestAnimationFrame(callback);
      });
    });
  });

  describe("getMockSlides", () => {
    it("returns an array of mock slides", () => {
      const slides = getMockSlides();
      expect(slides).toHaveLength(2);
      expect(slides[0].title).toBe("Test Slide 1");
      expect(slides[1].title).toBe("Test Slide 2");
    });
  });
});
