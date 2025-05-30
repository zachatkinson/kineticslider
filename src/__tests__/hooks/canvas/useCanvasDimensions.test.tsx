/**
 * Tests for useCanvasDimensions Hook
 * 
 * Minimal tests focused on core functionality without infinite loops
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasDimensions } from "../../../hooks/canvas/useCanvasDimensions";
import { createPixiCanvasConfig } from "../../../utils/pixi-canvas";

// Simple mocks to avoid complex interactions
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("useCanvasDimensions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Initialization", () => {
    it("should initialize with config dimensions", () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 1200, height: 800 },
      });

      const { result } = renderHook(() =>
        useCanvasDimensions({ config })
      );

      expect(result.current.dimensions.width).toBe(1200);
      expect(result.current.dimensions.height).toBe(800);
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.currentBreakpoint).toBeNull();
    });

    it("should provide required functions", () => {
      const config = createPixiCanvasConfig();

      const { result } = renderHook(() =>
        useCanvasDimensions({ config })
      );

      expect(typeof result.current.recalculate).toBe("function");
      expect(typeof result.current.updateConfig).toBe("function");
    });
  });

  describe("Configuration Updates", () => {
    it("should update dimensions via updateConfig", async () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 800, height: 600 },
      });

      const { result } = renderHook(() =>
        useCanvasDimensions({ config })
      );

      await act(async () => {
        result.current.updateConfig(createPixiCanvasConfig({
          dimensions: { width: 1200, height: 900 },
        }));
        
        // Wait for the setTimeout to complete
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.dimensions.width).toBe(1200);
      expect(result.current.dimensions.height).toBe(900);
    });

    it("should handle mode changes", () => {
      const config = createPixiCanvasConfig({
        mode: "fixed",
        dimensions: { width: 800, height: 600 },
      });

      const { result } = renderHook(() =>
        useCanvasDimensions({ config })
      );

      act(() => {
        result.current.updateConfig(createPixiCanvasConfig({ 
          mode: "fullscreen",
          dimensions: { width: 800, height: 600 },
        }));
      });

      // Should not crash
      expect(result.current.dimensions).toBeDefined();
    });
  });

  describe("Callback Integration", () => {
    it("should call onDimensionsChange when dimensions change", async () => {
      const config = createPixiCanvasConfig();
      const onDimensionsChange = vi.fn();

      const { result } = renderHook(() =>
        useCanvasDimensions({ config, onDimensionsChange })
      );

      await act(async () => {
        result.current.updateConfig(createPixiCanvasConfig({
          dimensions: { width: 1000, height: 700 },
        }));
        
        // Wait for the setTimeout to complete
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(onDimensionsChange).toHaveBeenCalled();
    });

    it("should call onPerformanceUpdate when provided", () => {
      const config = createPixiCanvasConfig();
      const onPerformanceUpdate = vi.fn();

      const { result } = renderHook(() =>
        useCanvasDimensions({ config, onPerformanceUpdate })
      );

      act(() => {
        result.current.recalculate();
      });

      expect(onPerformanceUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          renderTimeMS: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid dimensions gracefully", () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 0, height: 0 },
      });

      const { result } = renderHook(() =>
        useCanvasDimensions({ config })
      );

      expect(result.current.dimensions).toBeDefined();
      expect(typeof result.current.recalculate).toBe("function");
    });

    it("should not crash when recalculate is called multiple times", () => {
      const config = createPixiCanvasConfig();

      const { result } = renderHook(() =>
        useCanvasDimensions({ config })
      );

      expect(() => {
        act(() => {
          result.current.recalculate();
          result.current.recalculate();
          result.current.recalculate();
        });
      }).not.toThrow();
    });
  });

  describe("Function Stability", () => {
    it("should provide stable function references", () => {
      const config = createPixiCanvasConfig();

      const { result, rerender } = renderHook(() =>
        useCanvasDimensions({ config })
      );

      const firstRecalculate = result.current.recalculate;
      const firstUpdateConfig = result.current.updateConfig;

      rerender();

      expect(result.current.recalculate).toBe(firstRecalculate);
      expect(result.current.updateConfig).toBe(firstUpdateConfig);
    });
  });
}); 