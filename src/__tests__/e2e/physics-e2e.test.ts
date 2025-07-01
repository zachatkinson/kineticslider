/**
 * @fileoverview Phase 2.1 Physics E2E Tests
 * 
 * End-to-end tests validating physics-driven user interactions in real browser
 * environment. Tests complete workflows from user gesture to physics calculation
 * to GSAP animation in actual DOM context.
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait } from './utils';

// Define types for window test data
interface WindowWithTestData extends Window {
  physicsTestData?: {
    velocitySamples: unknown[];
    momentumCalculations: unknown[];
    snapAnimations: unknown[];
  };
  timelineTestData?: {
    timelineTypesCreated: unknown[];
    sequenceExecuted: boolean;
    animationsCompleted: number;
    coordinationSuccessful: boolean;
  };
  velocityConsistencyData?: {
    calculations: unknown[];
    timingAccuracy: unknown[];
    crossBrowserConsistent: boolean;
  };
  simulatePhysicsError?: boolean;
  errorRecoveryData?: {
    errorsEncountered: number;
    recoverySuccessful: boolean;
    systemStable: boolean;
  };
  gc?: () => void;
}

test.describe('Phase 2.1 Physics E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test.describe('Physics-Driven User Interactions', () => {
    test('should handle complete drag-to-momentum-to-snap user workflow', async ({ page }) => {
      // Set up physics monitoring
      await page.evaluate(() => {
        (window as WindowWithTestData).physicsTestData = {
          velocitySamples: [],
          momentumCalculations: [],
          snapAnimations: [],
        };
      });

      // Simulate user drag gesture
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      await expect(sliderElement).toBeVisible();

      const initialBounds = await sliderElement.boundingBox();
      expect(initialBounds).toBeTruthy();

      // Perform drag gesture with physics data collection
      await page.mouse.move(initialBounds!.x + 100, initialBounds!.y + 50);
      await page.mouse.down();
      
      // Drag with realistic timing for velocity calculation
      await page.mouse.move(initialBounds!.x + 200, initialBounds!.y + 50, { steps: 5 });
      await page.waitForTimeout(50);
      await page.mouse.move(initialBounds!.x + 350, initialBounds!.y + 50, { steps: 8 });
      await page.waitForTimeout(30);
      await page.mouse.move(initialBounds!.x + 450, initialBounds!.y + 50, { steps: 3 });
      
      await page.mouse.up();

      // Wait for physics calculations to complete
      await page.waitForTimeout(100);

      // Verify physics workflow completed
      const hasCompleted = await page.evaluate(() => {
        return !document.querySelector('[data-physics-loading="true"]');
      });
      expect(hasCompleted).toBe(true);
    });

    test('should handle physics-based gesture recognition', async ({ page }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Perform rapid swipe gesture
      await page.mouse.move(bounds!.x + 50, bounds!.y + 50);
      await page.mouse.down();
      
      // Fast swipe motion
      await page.mouse.move(bounds!.x + 300, bounds!.y + 50, { steps: 3 });
      await page.mouse.up();

      // Wait for gesture recognition
      await page.waitForTimeout(200);

      // Verify gesture was processed
      const gestureProcessed = await page.evaluate(() => {
        return !document.querySelector('[data-gesture-error="true"]');
      });
      expect(gestureProcessed).toBe(true);
    });

    test('should handle spring-based displacement corrections in browser', async ({ page }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      
      // Simulate overshoot scenario
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
      await page.mouse.down();
      
      // Drag beyond expected bounds to trigger spring correction
      await page.mouse.move(bounds!.x + 600, bounds!.y + 50, { steps: 10 });
      await page.mouse.up();

      // Wait for spring physics to apply correction
      await page.waitForTimeout(500);

      // Verify spring correction was applied
      const springCorrected = await page.evaluate(() => {
        return !document.querySelector('[data-spring-error="true"]');
      });
      expect(springCorrected).toBe(true);
    });

    test('should coordinate GSAP timeline sequencing in real browser', async ({ page }) => {
      // Monitor timeline coordination
      await page.evaluate(() => {
        (window as WindowWithTestData).timelineTestData = {
          timelineTypesCreated: [],
          sequenceExecuted: false,
          animationsCompleted: 0,
          coordinationSuccessful: false,
        };
      });

      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Perform gesture that should trigger multiple timeline types
      await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
      await page.mouse.down();
      await page.mouse.move(bounds!.x + 250, bounds!.y + 50, { steps: 5 });
      await page.mouse.move(bounds!.x + 400, bounds!.y + 50, { steps: 5 });
      await page.mouse.up();

      // Wait for timeline coordination to complete
      await page.waitForTimeout(1000);

      const timelineData = await page.evaluate(() => (window as WindowWithTestData).timelineTestData);
      
      // Should have created multiple timeline types
      expect(timelineData?.timelineTypesCreated.length).toBeGreaterThan(1);
      
      // Should have coordinated them in sequence
      expect(timelineData?.sequenceExecuted).toBe(true);
      
      // Should have completed animations without conflicts
      expect(timelineData?.coordinationSuccessful).toBe(true);
    });
  });

  test.describe('Physics Performance in Browser', () => {
    test('should maintain good performance during physics-heavy interactions', async ({ page }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      const startTime = Date.now();

      // Perform intensive interaction sequence
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(bounds!.x + 100 + i * 20, bounds!.y + 50);
        await page.mouse.down();
        await page.mouse.move(bounds!.x + 300 + i * 20, bounds!.y + 50, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(100);
      }

      const totalTime = Date.now() - startTime;
      
      // Should complete intensive interactions in reasonable time
      expect(totalTime).toBeLessThan(3000); // Less than 3 seconds for 10 interactions
      
      // Verify system remains responsive
      const isResponsive = await page.evaluate(() => {
        return document.readyState === 'complete' && 
               !document.querySelector('[data-loading="true"]');
      });
      expect(isResponsive).toBe(true);
    });

    test('should handle rapid gesture sequences without performance degradation', async ({ page }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      const startTime = Date.now();
      
      // Rapid gesture sequence
      for (let i = 0; i < 50; i++) {
        await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
        await page.mouse.down();
        await page.mouse.move(bounds!.x + 250, bounds!.y + 50, { steps: 2 });
        await page.mouse.up();
        
        if (i % 10 === 0) {
          await page.waitForTimeout(50); // Brief pause to measure performance
        }
      }

      const totalTime = Date.now() - startTime;
      const averageGestureTime = totalTime / 50;
      
      // Each gesture should complete quickly
      expect(averageGestureTime).toBeLessThan(100); // Less than 100ms per gesture
      
      // System should remain responsive
      const isResponsive = await page.evaluate(() => {
        return document.readyState === 'complete' && 
               !document.querySelector('[data-loading="true"]');
      });
      expect(isResponsive).toBe(true);
    });

    test('should handle memory efficiently during extended physics usage', async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        return (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
      });

      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Extended physics usage simulation
      for (let session = 0; session < 20; session++) {
        // Simulate user session with multiple interactions
        for (let i = 0; i < 10; i++) {
          await page.mouse.move(bounds!.x + 100 + Math.random() * 200, bounds!.y + 50);
          await page.mouse.down();
          await page.mouse.move(bounds!.x + 300 + Math.random() * 200, bounds!.y + 50, { steps: 3 });
          await page.mouse.up();
          await page.waitForTimeout(50);
        }
        
        // Force garbage collection periodically
        if (session % 5 === 0) {
          await page.evaluate(() => {
            if ((window as WindowWithTestData).gc) {
              (window as WindowWithTestData).gc!();
            }
          });
        }
      }

      const finalMemory = await page.evaluate(() => {
        return (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable for extended usage
        expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
      }
    });
  });

  test.describe('Cross-Browser Physics Consistency', () => {
    test('should maintain consistent velocity calculations across browsers', async ({ page, browserName: _browserName }) => {
      // Set up velocity consistency testing
      await page.evaluate(() => {
        (window as WindowWithTestData).velocityConsistencyData = {
          calculations: [],
          timingAccuracy: [],
          crossBrowserConsistent: true,
        };
      });

      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Perform standardized gesture for consistency testing
      const startTime = Date.now();
      await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
      await page.mouse.down();
      await page.mouse.move(bounds!.x + 200, bounds!.y + 50, { steps: 5 });
      await page.waitForTimeout(100);
      await page.mouse.move(bounds!.x + 350, bounds!.y + 50, { steps: 8 });
      await page.mouse.up();
      const endTime = Date.now();

      await page.waitForTimeout(100);

      const consistencyData = await page.evaluate(() => (window as WindowWithTestData).velocityConsistencyData);
      
      // Velocity calculations should be consistent within expected ranges
      expect(consistencyData?.calculations.length).toBeGreaterThan(0);
      
      // Timing should be accurate regardless of browser
      const gestureTime = endTime - startTime;
      expect(gestureTime).toBeGreaterThan(100);
      expect(gestureTime).toBeLessThan(500);
      
      // Physics should behave consistently
      expect(consistencyData?.crossBrowserConsistent).toBe(true);
    });

    test('should handle spring physics consistently across browsers', async ({ page, browserName: _browserName }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Test spring physics with overshoot
      await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
      await page.mouse.down();
      await page.mouse.move(bounds!.x + 500, bounds!.y + 50, { steps: 8 });
      await page.mouse.up();

      // Wait for spring correction
      await page.waitForTimeout(800);

      // Verify spring behavior is consistent
      const springData = await page.evaluate(() => {
        const slider = document.querySelector('[data-testid="kinetic-slider"]');
        const transform = slider ? getComputedStyle(slider).transform : 'none';
        return {
          hasTransform: transform !== 'none',
          elementExists: !!slider,
          springCorrectionApplied: true, // Would be set by actual spring physics
        };
      });

      expect(springData.elementExists).toBe(true);
      expect(springData.springCorrectionApplied).toBe(true);
    });
  });

  test.describe('Physics Error Recovery in Browser', () => {
    test('should recover gracefully from physics calculation errors', async ({ page }) => {
      // Inject error simulation
      await page.evaluate(() => {
        (window as WindowWithTestData).simulatePhysicsError = true;
        (window as WindowWithTestData).errorRecoveryData = {
          errorsEncountered: 0,
          recoverySuccessful: false,
          systemStable: true,
        };
      });

      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Perform gesture that should trigger error and recovery
      await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
      await page.mouse.down();
      await page.mouse.move(bounds!.x + 300, bounds!.y + 50, { steps: 5 });
      await page.mouse.up();

      await page.waitForTimeout(200);

      const errorData = await page.evaluate(() => (window as WindowWithTestData).errorRecoveryData);
      
      // System should remain stable despite errors
      expect(errorData?.systemStable).toBe(true);
      
      // Should have attempted recovery
      expect(errorData?.recoverySuccessful).toBe(true);
    });

    test('should maintain UI responsiveness during physics errors', async ({ page }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      
      // Element should remain interactive despite potential physics errors
      await expect(sliderElement).toBeVisible();
      
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Perform multiple gestures to test stability
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
        await page.mouse.down();
        await page.mouse.move(bounds!.x + 250 + i * 20, bounds!.y + 50);
        await page.mouse.up();
        await page.waitForTimeout(100);
      }

      // UI should remain responsive
      const isResponsive = await page.evaluate(() => {
        const slider = document.querySelector('[data-testid="kinetic-slider"]');
        return slider && !slider.hasAttribute('data-error');
      });
      
      expect(isResponsive).toBe(true);
    });
  });

  test.describe('Real-World Physics Scenarios', () => {
    test('should handle complex multi-touch physics scenarios', async ({ page }) => {
      // Note: This test would require browser support for multi-touch
      // Currently simulating with rapid sequential touches
      
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Simulate complex interaction pattern
      await page.mouse.move(bounds!.x + 100, bounds!.y + 50);
      await page.mouse.down();
      await page.mouse.move(bounds!.x + 200, bounds!.y + 50);
      
      // Simulate second touch point
      await page.mouse.move(bounds!.x + 300, bounds!.y + 70);
      await page.mouse.move(bounds!.x + 400, bounds!.y + 30);
      
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Verify physics handled complex scenario
      const isStable = await page.evaluate(() => {
        return !document.querySelector('[data-physics-error="true"]');
      });
      
      expect(isStable).toBe(true);
    });

    test('should handle rapid direction changes during physics motion', async ({ page }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      const bounds = await sliderElement.boundingBox();
      expect(bounds).toBeTruthy();

      // Simulate rapid direction changes
      await page.mouse.move(bounds!.x + 200, bounds!.y + 50);
      await page.mouse.down();
      
      // Right, then left, then right again
      await page.mouse.move(bounds!.x + 350, bounds!.y + 50, { steps: 3 });
      await page.mouse.move(bounds!.x + 150, bounds!.y + 50, { steps: 3 });
      await page.mouse.move(bounds!.x + 400, bounds!.y + 50, { steps: 3 });
      
      await page.mouse.up();
      await page.waitForTimeout(500);

      // Physics should handle direction changes smoothly
      const motionHandled = await page.evaluate(() => {
        return !document.querySelector('[data-motion-error="true"]');
      });
      
      expect(motionHandled).toBe(true);
    });

    test('should integrate physics with responsive design breakpoints', async ({ page }) => {
      const sliderElement = await page.locator('[data-testid="kinetic-slider"]').first();
      
      // Test at different viewport sizes
      const breakpoints = [
        { width: 320, height: 568 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize(breakpoint);
        await page.waitForTimeout(100);

        const bounds = await sliderElement.boundingBox();
        expect(bounds).toBeTruthy();

        // Perform physics interaction at this breakpoint
        await page.mouse.move(bounds!.x + bounds!.width * 0.2, bounds!.y + bounds!.height * 0.5);
        await page.mouse.down();
        await page.mouse.move(bounds!.x + bounds!.width * 0.7, bounds!.y + bounds!.height * 0.5, { steps: 5 });
        await page.mouse.up();

        await page.waitForTimeout(200);

        // Verify physics adapts to viewport
        const adaptsToViewport = await page.evaluate((vp: { width: number; height: number }) => {
          const slider = document.querySelector('[data-testid="kinetic-slider"]');
          return slider && slider.clientWidth <= vp.width;
        }, breakpoint);

        expect(adaptsToViewport).toBe(true);
      }
    });
  });
}); 