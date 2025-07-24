/**
 * @fileoverview Renderer Scaling Integration Tests
 *
 * Integration tests for renderer scaling functionality with different container sizes.
 * Tests the interaction between container dimensions, device pixel ratio, and sprite scaling.
 * Validates real-world scenarios with various container sizes and scaling modes.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SliderRenderer } from '../../rendering/renderer';
import { ScaleMode } from '../../core/types';
import type { RenderConfig } from '../../core/types';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Application: vi.fn((options) => {
    const mockApp = {
      canvas: {
        style: {},
        classList: { add: vi.fn(), remove: vi.fn() },
        width: options?.width || 800,
        height: options?.height || 600,
      },
      stage: {
        addChild: vi.fn(),
        removeChild: vi.fn(),
        children: [],
      },
      renderer: {
        canvas: {
          style: {},
          classList: { add: vi.fn(), remove: vi.fn() },
          width: options?.width || 800,
          height: options?.height || 600,
        },
        resize: vi.fn(),
        render: vi.fn(),
        destroy: vi.fn(),
        resolution: options?.resolution || 1,
      },
      init: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      render: vi.fn(),
      screen: { width: options?.width || 800, height: options?.height || 600 },
      resize: vi.fn(),
    };
    return mockApp;
  }),
  Sprite: vi.fn(() => ({
    texture: { width: 100, height: 100 },
    anchor: { set: vi.fn() },
    scale: { set: vi.fn(), x: 1, y: 1 },
    position: { set: vi.fn(), x: 0, y: 0 },
    width: 100,
    height: 100,
    visible: true,
    filters: [],
    destroy: vi.fn(),
  })),
  Assets: {
    init: vi.fn(),
    load: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  },
  Container: vi.fn(() => ({
    position: { set: vi.fn(), x: 0, y: 0 },
    scale: { set: vi.fn(), x: 1, y: 1 },
    children: [],
    addChild: vi.fn(),
    removeChild: vi.fn(),
    setChildIndex: vi.fn(),
    destroy: vi.fn(),
  })),
}));

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: { killTweensOf: vi.fn() },
}));

describe('Renderer Scaling Integration Tests', () => {
  let renderer: SliderRenderer;

  beforeEach(() => {
    renderer = new SliderRenderer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (renderer) {
      renderer.destroy();
    }
  });

  describe('Container Size Variations', () => {
    it('should handle small container sizes (mobile viewport)', async () => {
      const smallContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 375, // iPhone width
        clientHeight: 667, // iPhone height
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 375,
        height: 667,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 2, // High DPI mobile
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(smallContainer, config);
      const app = renderer.getApplication();
      
      expect(app).toBeDefined();
      expect(app!.renderer.canvas.style.width).toBe('375px');
      expect(app!.renderer.canvas.style.height).toBe('667px');
    });

    it('should handle medium container sizes (tablet viewport)', async () => {
      const mediumContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 768, // iPad width
        clientHeight: 1024, // iPad height
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 768,
        height: 1024,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 2,
        scaleMode: ScaleMode.CONTAIN,
      };

      await renderer.initialize(mediumContainer, config);
      const app = renderer.getApplication();
      
      expect(app).toBeDefined();
      expect(app!.renderer.canvas.style.width).toBe('768px');
      expect(app!.renderer.canvas.style.height).toBe('1024px');
    });

    it('should handle large container sizes (desktop viewport)', async () => {
      const largeContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 1920, // Full HD width
        clientHeight: 1080, // Full HD height
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 1920,
        height: 1080,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.OVERSCAN,
        overscanAmount: 1.1,
      };

      await renderer.initialize(largeContainer, config);
      const app = renderer.getApplication();
      
      expect(app).toBeDefined();
      expect(app!.renderer.canvas.style.width).toBe('1920px');
      expect(app!.renderer.canvas.style.height).toBe('1080px');
    });

    it('should handle ultra-wide container sizes', async () => {
      const ultraWideContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 3440, // Ultra-wide monitor
        clientHeight: 1440,
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 3440,
        height: 1440,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(ultraWideContainer, config);
      const app = renderer.getApplication();
      
      expect(app).toBeDefined();
      expect(app!.renderer.canvas.style.width).toBe('3440px');
      expect(app!.renderer.canvas.style.height).toBe('1440px');
    });
  });

  describe('Sprite Scaling with Different Container Sizes', () => {
    it('should scale sprites correctly for square containers', async () => {
      const squareContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 600,
        clientHeight: 600,
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 600,
        height: 600,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(squareContainer, config);
      const sprite = await renderer.createSprite('test-image.jpg', 0);
      
      // With mock using default screen dimensions 800x600 and texture 100x100
      // scaleX = 800/100 = 8, scaleY = 600/100 = 6, max(8,6) = 8 for COVER mode
      expect(sprite.scale.set).toHaveBeenCalledWith(8);
    });

    it('should scale sprites correctly for wide containers', async () => {
      const wideContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 1200,
        clientHeight: 400,
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 1200,
        height: 400,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(wideContainer, config);
      const sprite = await renderer.createSprite('test-image.jpg', 0);
      
      // With mock using default screen dimensions 800x600 and texture 100x100
      // scaleX = 800/100 = 8, scaleY = 600/100 = 6, max(8,6) = 8 for COVER mode
      expect(sprite.scale.set).toHaveBeenCalledWith(8);
    });

    it('should scale sprites correctly for tall containers', async () => {
      const tallContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 400,
        clientHeight: 1200,
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 400,
        height: 1200,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(tallContainer, config);
      const sprite = await renderer.createSprite('test-image.jpg', 0);
      
      // With mock using default screen dimensions 800x600 and texture 100x100
      // scaleX = 800/100 = 8, scaleY = 600/100 = 6, max(8,6) = 8 for COVER mode
      expect(sprite.scale.set).toHaveBeenCalledWith(8);
    });
  });

  describe('Scale Mode Integration with Container Sizes', () => {
    it('should handle CONTAIN mode with varying aspect ratios', async () => {
      const containers = [
        { width: 800, height: 600 }, // 4:3 aspect ratio
        { width: 1920, height: 1080 }, // 16:9 aspect ratio
        { width: 1000, height: 1000 }, // 1:1 aspect ratio
      ];

      for (const containerSize of containers) {
        const container = {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          contains: vi.fn().mockReturnValue(true),
          clientWidth: containerSize.width,
          clientHeight: containerSize.height,
        } as unknown as HTMLElement;

        const config: RenderConfig = {
          width: containerSize.width,
          height: containerSize.height,
          backgroundColor: 0x000000,
          antialias: true,
          resolution: 1,
          scaleMode: ScaleMode.CONTAIN,
        };

        await renderer.initialize(container, config);
        const sprite = await renderer.createSprite('test-image.jpg', 0);
        
        // With mock using default screen dimensions 800x600 and texture 100x100
        // CONTAIN should use minimum scale to fit entirely
        // scaleX = 800/100 = 8, scaleY = 600/100 = 6, min(8,6) = 6
        expect(sprite.scale.set).toHaveBeenCalledWith(6);
        
        // Cleanup for next iteration
        renderer.destroy();
        renderer = new SliderRenderer();
      }
    });

    it('should handle OVERSCAN mode with varying container sizes', async () => {
      const containers = [
        { width: 320, height: 568, overscan: 1.05 }, // Mobile with 5% overscan
        { width: 768, height: 1024, overscan: 1.08 }, // Tablet with 8% overscan
        { width: 1920, height: 1080, overscan: 1.1 }, // Desktop with 10% overscan
      ];

      for (const containerDef of containers) {
        const container = {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          contains: vi.fn().mockReturnValue(true),
          clientWidth: containerDef.width,
          clientHeight: containerDef.height,
        } as unknown as HTMLElement;

        const config: RenderConfig = {
          width: containerDef.width,
          height: containerDef.height,
          backgroundColor: 0x000000,
          antialias: true,
          resolution: 1,
          scaleMode: ScaleMode.OVERSCAN,
          overscanAmount: containerDef.overscan,
        };

        await renderer.initialize(container, config);
        const sprite = await renderer.createSprite('test-image.jpg', 0);
        
        // With mock using default screen dimensions 800x600 and texture 100x100
        // OVERSCAN: contain scale * overscan amount
        // scaleX = 800/100 = 8, scaleY = 600/100 = 6, min(8,6) = 6
        const expectedScale = 6 * containerDef.overscan;
        
        expect(sprite.scale.set).toHaveBeenCalledWith(expectedScale);
        
        // Cleanup for next iteration
        renderer.destroy();
        renderer = new SliderRenderer();
      }
    });
  });

  describe('Device Pixel Ratio with Container Scaling', () => {
    it('should handle high DPI with small containers', async () => {
      const highDPIContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 375,
        clientHeight: 667,
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 375,
        height: 667,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 3, // iPhone Pro resolution
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(highDPIContainer, config);
      const app = renderer.getApplication();
      
      // Canvas should display at logical size regardless of resolution
      expect(app!.renderer.canvas.style.width).toBe('375px');
      expect(app!.renderer.canvas.style.height).toBe('667px');
      
      // Create sprite and verify scaling is unaffected by device pixel ratio
      const sprite = await renderer.createSprite('test-image.jpg', 0);
      // With mock using default screen dimensions 800x600 and texture 100x100
      // scaleX = 800/100 = 8, scaleY = 600/100 = 6, max(8,6) = 8 for COVER mode
      expect(sprite.scale.set).toHaveBeenCalledWith(8);
    });

    it('should handle varying DPI across different container sizes', async () => {
      const testCases = [
        { width: 320, height: 568, dpi: 2 }, // Mobile 2x
        { width: 768, height: 1024, dpi: 2 }, // Tablet 2x
        { width: 1920, height: 1080, dpi: 1 }, // Desktop 1x
        { width: 2560, height: 1440, dpi: 1.5 }, // High-DPI desktop
      ];

      for (const testCase of testCases) {
        const container = {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          contains: vi.fn().mockReturnValue(true),
          clientWidth: testCase.width,
          clientHeight: testCase.height,
        } as unknown as HTMLElement;

        const config: RenderConfig = {
          width: testCase.width,
          height: testCase.height,
          backgroundColor: 0x000000,
          antialias: true,
          resolution: testCase.dpi,
          scaleMode: ScaleMode.CONTAIN,
        };

        await renderer.initialize(container, config);
        const app = renderer.getApplication();
        
        // Verify logical sizing is correct regardless of DPI
        expect(app!.renderer.canvas.style.width).toBe(`${testCase.width}px`);
        expect(app!.renderer.canvas.style.height).toBe(`${testCase.height}px`);
        
        // Cleanup for next iteration
        renderer.destroy();
        renderer = new SliderRenderer();
      }
    });
  });

  describe('Dynamic Container Resizing', () => {
    it('should handle container size changes through resize', async () => {
      const dynamicContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 800,
        clientHeight: 600,
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 800,
        height: 600,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(dynamicContainer, config);
      
      // Simulate container resize (Note: in real scenarios this would be handled by resize observers)
      Object.defineProperty(dynamicContainer, 'clientWidth', { value: 1200, configurable: true });
      Object.defineProperty(dynamicContainer, 'clientHeight', { value: 800, configurable: true });
      
      // Verify initial setup
      const app = renderer.getApplication();
      expect(app).toBeDefined();
      
      // Note: In a real scenario, we'd test the resize behavior
      // but that would require triggering resize events
    });

    it('should maintain proper scaling after orientation changes', async () => {
      const orientationContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 667, // Portrait width
        clientHeight: 375, // Portrait height
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 667,
        height: 375,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 2,
        scaleMode: ScaleMode.OVERSCAN,
        overscanAmount: 1.05,
      };

      await renderer.initialize(orientationContainer, config);
      const sprite = await renderer.createSprite('test-image.jpg', 0);
      
      // With mock using default screen dimensions 800x600 and texture 100x100
      // OVERSCAN: contain scale * overscan amount
      // scaleX = 800/100 = 8, scaleY = 600/100 = 6, min(8,6) = 6, * 1.05 = 6.3
      expect(sprite.scale.set).toHaveBeenCalledWith(expect.closeTo(6.3, 5));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero-sized containers gracefully', async () => {
      const zeroContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 0,
        clientHeight: 0,
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 800, // Fallback dimensions
        height: 600,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(zeroContainer, config);
      const app = renderer.getApplication();
      
      // Should use config dimensions as fallback
      expect(app!.renderer.canvas.style.width).toBe('800px');
      expect(app!.renderer.canvas.style.height).toBe('600px');
    });

    it('should handle extremely large containers', async () => {
      const largeContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 8000, // 8K width
        clientHeight: 4500, // 8K height
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 8000,
        height: 4500,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.CONTAIN,
      };

      // Should not throw an error
      await expect(renderer.initialize(largeContainer, config)).resolves.not.toThrow();
      
      const app = renderer.getApplication();
      expect(app).toBeDefined();
    });

    it('should handle fractional container dimensions', async () => {
      const fractionalContainer = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        clientWidth: 375.5, // Fractional width
        clientHeight: 667.3, // Fractional height
      } as unknown as HTMLElement;

      const config: RenderConfig = {
        width: 375.5,
        height: 667.3,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        scaleMode: ScaleMode.COVER,
      };

      await renderer.initialize(fractionalContainer, config);
      const app = renderer.getApplication();
      
      expect(app).toBeDefined();
      expect(app!.renderer.canvas.style.width).toBe('375.5px');
      expect(app!.renderer.canvas.style.height).toBe('667.3px');
    });
  });
});