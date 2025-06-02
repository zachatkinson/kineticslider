/**
 * E2E Test Helper Functions
 * 
 * Centralized helper functions for E2E testing to eliminate duplication
 * and provide consistent testing patterns across E2E test files.
 * 
 * @module E2ETestHelpers
 * @version 1.0.0
 */

import type { Page } from '@playwright/test';
import type {
  E2ETestSetupFunction
} from '../types/e2e-testing';

/**
 * Setup gesture handling test environment
 * 
 * @param page - Playwright page instance
 * 
 * @returns Promise that resolves when setup is complete
 *
 */
export const setupGestureHandlingTest: E2ETestSetupFunction = async (page: Page): Promise<void> => {
  await page.goto('/');
  
  await page.setContent(`
    <div id="gesture-test-container" style="width: 800px; height: 600px; background: #f0f0f0;">
      <h2>Gesture Handling E2E Test</h2>
      <div id="test-slider" style="width: 100%; height: 400px; background: #ddd; position: relative;">
        <div class="slide active" data-slide="0">Slide 1</div>
        <div class="slide" data-slide="1">Slide 2</div>
        <div class="slide" data-slide="2">Slide 3</div>
      </div>
      <div id="gesture-controls">
        <button id="prev-btn">Previous</button>
        <button id="next-btn">Next</button>
      </div>
      <div id="gesture-status"></div>
    </div>
  `);

  await page.waitForLoadState('domcontentloaded');
};

/**
 * Setup user journey test environment
 * 
 * @param page - Playwright page instance
 * 
 * @returns Promise that resolves when setup is complete
 *
 */
export const setupUserJourneyTest: E2ETestSetupFunction = async (page: Page): Promise<void> => {
  await page.goto('/');
  
  await page.setContent(`
    <div id="user-journey-container" style="width: 800px; height: 600px;">
      <h2>User Journey E2E Test</h2>
      <div id="journey-content">
        <div class="journey-step" data-step="1">Step 1: Welcome</div>
        <div class="journey-step" data-step="2">Step 2: Configuration</div>
        <div class="journey-step" data-step="3">Step 3: Completion</div>
      </div>
      <div id="journey-status"></div>
    </div>
  `);

  await page.waitForLoadState('domcontentloaded');
};

/**
 * Setup canvas responsiveness test environment
 * 
 * @param page - Playwright page instance
 * 
 * @returns Promise that resolves when setup is complete
 *
 */
export const setupCanvasResponsivenessTest: E2ETestSetupFunction = async (page: Page): Promise<void> => {
  await page.goto('/');
  
  await page.setContent(`
    <div id="canvas-container" style="width: 600px; height: 400px; padding: 20px; border: 1px solid #ccc;">
      <h2>Canvas Responsiveness E2E Test</h2>
      <canvas id="test-canvas" style="width: 100%; height: 300px; background: #f9f9f9;"></canvas>
      <div id="canvas-info"></div>
    </div>
  `);

  // Add canvas responsiveness logic
  await page.evaluate(() => {
    function getBreakpoint(width: number): string {
      if (width >= 1200) return 'xl';
      if (width >= 992) return 'lg';
      if (width >= 768) return 'md';
      if (width >= 576) return 'sm';
      return 'xs';
    }

    function updateCanvasDimensions(): void {
      const container = document.getElementById('canvas-container');
      const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
      const info = document.getElementById('canvas-info');
      
      if (container && canvas && info) {
        const containerRect = container.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        info.innerHTML = `
          Container: ${containerRect.width}x${containerRect.height}<br>
          Canvas: ${canvasRect.width}x${canvasRect.height}<br>
          Breakpoint: ${getBreakpoint(containerRect.width)}
        `;
      }
    }

    let currentMode = 'responsive';

    // Expose test utilities to window
    (window as unknown as Record<string, unknown>).testCanvas = {
      getBreakpoint(): string {
        const container = document.getElementById('canvas-container');
        if (!container) return 'unknown';
        return getBreakpoint(container.getBoundingClientRect().width);
      },

      getCanvasDimensions(): { width: number; height: number } {
        const canvas = document.getElementById('test-canvas');
        if (!canvas) return { width: 0, height: 0 };
        const rect = canvas.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      },

      getCanvasMode(): string {
        return currentMode;
      },

      setCanvasMode(mode: string): void {
        currentMode = mode;
        updateCanvasDimensions();
      },

      triggerResize(): void {
        updateCanvasDimensions();
        window.dispatchEvent(new Event('resize'));
      }
    };

    // Initial update
    updateCanvasDimensions();
    
    // Setup window resize listener
    window.addEventListener('resize', updateCanvasDimensions);
  });

  await page.waitForLoadState('domcontentloaded');
};

/**
 * Common gesture simulation utilities for E2E tests
 */
export const gestureSimulationHelpers = {
  /**
   * Perform swipe gesture simulation
   * 
   * @param page - Playwright page instance
   *
   * @param direction - Swipe direction
   *
   * @param startX - Starting X coordinate (optional)
   *
   * @param startY - Starting Y coordinate (optional)
   * 
   * @returns Promise that resolves when gesture is complete
   *
   */
  async performSwipeGesture(
    page: Page, 
    direction: 'left' | 'right', 
    startX: number = 400, 
    startY: number = 300
  ): Promise<void> {
    const endX = direction === 'left' ? startX - 200 : startX + 200;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, startY, { steps: 10 });
    await page.mouse.up();
    
    // Wait for gesture to complete
    await page.waitForTimeout(300);
  },

  /**
   * Perform touch gesture simulation
   * 
   * @param page - Playwright page instance
   *
   * @param direction - Swipe direction
   *
   * @param startX - Starting X coordinate (optional)
   *
   * @param startY - Starting Y coordinate (optional)
   * 
   * @returns Promise that resolves when gesture is complete
   *
   */
  async performTouchGesture(
    page: Page, 
    direction: 'left' | 'right', 
    startX: number = 400, 
    startY: number = 300
  ): Promise<void> {
    const endX = direction === 'left' ? startX - 200 : startX + 200;
    
    await page.touchscreen.tap(startX, startY);
    await page.waitForTimeout(50);
    await page.touchscreen.tap(endX, startY);
    
    // Wait for gesture to complete
    await page.waitForTimeout(300);
  }
};

/**
 * Common test data factories for E2E tests
 */
export const e2eTestDataFactories = {
  /**
   * Create mock worker script for testing
   * 
   * @returns Worker script as string
   *
   */
  createMockWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { task, taskId } = e.data;
        try {
          // Execute the task function
          const func = new Function('return ' + task)();
          const result = func();
          self.postMessage({ result, taskId });
        } catch (error) {
          self.postMessage({ error: error.message, taskId });
        }
      };
    `;
  },

  /**
   * Create test slide data
   * 
   * @param count - Number of slides to create
   * 
   * @returns Array of slide objects
   *
   */
  createTestSlides(count: number = 3): Array<{ id: string; title: string; content: string }> {
    return Array.from({ length: count }, (_, index) => ({
      id: `slide-${index}`,
      title: `Slide ${index + 1}`,
      content: `Content for slide ${index + 1}`
    }));
  },

  /**
   * Create test gesture event data
   * 
   * @param type - Gesture type
   *
   * @param direction - Gesture direction
   *
   * @param distance - Gesture distance
   * 
   * @returns Gesture event object
   *
   */
  createTestGestureEvent(
    type: string = 'touch', 
    direction: string = 'left', 
    distance: number = 100
  ): { type: string; direction: string; distance: number } {
    return { type, direction, distance };
  }
};

/**
 * Wait for test utilities to be available on window
 * 
 * @param page - Playwright page instance
 *
 * @param utilityName - Name of the utility to wait for
 *
 * @param timeout - Timeout in milliseconds
 * 
 * @returns Promise that resolves when utility is available
 *
 */
export async function waitForTestUtilities(
  page: Page, 
  utilityName: string, 
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    (name) => (window as unknown as Record<string, unknown>)[name] !== undefined,
    utilityName,
    { timeout }
  );
}

/**
 * Common cleanup function for E2E tests
 * 
 * @param page - Playwright page instance
 * 
 * @returns Promise that resolves when cleanup is complete
 *
 */
export async function cleanupE2ETest(page: Page): Promise<void> {
  // Clear any test utilities from window
  await page.evaluate(() => {
    delete (window as unknown as Record<string, unknown>).testGestures;
    delete (window as unknown as Record<string, unknown>).testUserJourney;
    delete (window as unknown as Record<string, unknown>).testResourceManagement;
    delete (window as unknown as Record<string, unknown>).testCanvas;
    delete (window as unknown as Record<string, unknown>).testUtils;
    delete (window as unknown as Record<string, unknown>).createTestWorkerScript;
    delete (window as unknown as Record<string, unknown>).TestWorkerPool;
  });
  
  // Clear any remaining timers or intervals
  await page.evaluate(() => {
    // Clear any remaining timeouts/intervals
    for (let i = 1; i < 1000; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  });
} 