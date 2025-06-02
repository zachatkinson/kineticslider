/**
 * E2E Test Utilities
 * 
 * Centralized utility functions for E2E testing to eliminate duplication
 * across test files and provide consistent testing patterns.
 * 
 * @module E2ETestUtilities
 * @version 1.0.0
 */

import type { Page } from '@playwright/test';

/**
 * Browser capability detection utilities
 */
export const browserCapabilities = {
  /**
   * Check if browser supports reliable gesture events
   * 
   * @param projectName - The browser project name
   *
   * @returns True if browser supports reliable gestures
   *
   */
  supportsReliableGestures(projectName: string): boolean {
    return projectName === 'chromium';
  },

  /**
   * Check if browser supports touch events
   * 
   * @param projectName - The browser project name
   *
   * @returns True if browser supports touch events
   *
   */
  supportsTouchEvents(projectName: string): boolean {
    return ['webkit', 'Mobile Chrome', 'Mobile Safari'].includes(projectName);
  },

  /**
   * Check if browser requires fallback navigation
   * 
   * @param projectName - The browser project name
   *
   * @returns True if browser requires fallback
   *
   */
  requiresFallback(projectName: string): boolean {
    return projectName === 'firefox';
  }
};

/**
 * Gesture simulation utilities
 */
export const gestureSimulation = {
  /**
   * Perform mouse gesture simulation
   * 
   * @param page - Playwright page instance
   *
   * @param startX - Starting X coordinate
   *
   * @param endX - Ending X coordinate
   *
   * @param y - Y coordinate
   *
   * @returns Promise that resolves when gesture is complete
   *
   */
  async performMouseGesture(page: Page, startX: number, endX: number, y: number): Promise<void> {
    // Use pointer events instead of mouse events to match the test setup
    await page.evaluate(({ startX, endX, y }) => {
      const slider = document.getElementById('test-slider');
      if (!slider) return;

      // Create pointer events that match what the test setup is listening for
      const createPointerEvent = (type: string, clientX: number, clientY: number, pointerId: number = 1): PointerEvent => {
        const event = new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          pointerId,
          pointerType: 'mouse',
          isPrimary: true
        });
        return event;
      };

      const pointerDownEvent = createPointerEvent('pointerdown', startX, y);
      const pointerUpEvent = createPointerEvent('pointerup', endX, y);

      slider.dispatchEvent(pointerDownEvent);
      // Add a delay to simulate real gesture timing
      setTimeout(() => slider.dispatchEvent(pointerUpEvent), 150);
    }, { startX, endX, y });
    
    // Wait for the gesture to complete
    await page.waitForTimeout(300);
  },

  /**
   * Perform touch gesture simulation
   * 
   * @param page - Playwright page instance
   *
   * @param startX - Starting X coordinate
   *
   * @param endX - Ending X coordinate
   *
   * @param y - Y coordinate
   *
   * @returns Promise that resolves when gesture is complete
   *
   */
  async performTouchGesture(page: Page, startX: number, endX: number, y: number): Promise<void> {
    // Use a more compatible approach for touch simulation
    await page.evaluate(({ startX, endX, y }) => {
      const slider = document.getElementById('test-slider');
      if (!slider) return;

      // Create a more basic touch event that works in test environments
      const createTouchEvent = (type: string, clientX: number, clientY: number): Event => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        // Add touch-like properties
        Object.defineProperty(event, 'touches', {
          value: type === 'touchend' ? [] : [{ clientX, clientY, pageX: clientX, pageY: clientY }],
          writable: false
        });
        Object.defineProperty(event, 'changedTouches', {
          value: [{ clientX, clientY, pageX: clientX, pageY: clientY }],
          writable: false
        });
        return event;
      };

      const touchStartEvent = createTouchEvent('touchstart', startX, y);
      const touchEndEvent = createTouchEvent('touchend', endX, y);

      slider.dispatchEvent(touchStartEvent);
      // Add a delay to simulate real swipe timing and ensure velocity calculation works
      setTimeout(() => slider.dispatchEvent(touchEndEvent), 150);
    }, { startX, endX, y });
    
    // Wait for the gesture to complete
    await page.waitForTimeout(300);
  },

  /**
   * Perform gesture based on browser capabilities
   * 
   * @param page - Playwright page instance
   *
   * @param startX - Starting X coordinate
   *
   * @param endX - Ending X coordinate
   *
   * @param y - Y coordinate
   *
   * @param projectName - Browser project name
   *
   * @returns Promise that resolves when gesture is complete
   *
   */
  async performGestureForBrowser(page: Page, startX: number, endX: number, y: number, projectName: string): Promise<void> {
    if (browserCapabilities.supportsReliableGestures(projectName)) {
      await this.performMouseGesture(page, startX, endX, y);
    } else if (browserCapabilities.supportsTouchEvents(projectName)) {
      await this.performTouchGesture(page, startX, endX, y);
    } else {
      // Fallback to button clicks for browsers like Firefox
      // But first check if gestures are enabled
      const gesturesEnabled = await page.evaluate(() => {
        return (window as Window & { testGestures?: { isGestureEnabled(): boolean } }).testGestures?.isGestureEnabled() ?? true;
      });
      
      if (!gesturesEnabled) {
        // If gestures are disabled, don't perform any navigation
        return;
      }
      
      // Check if movement is significant enough (minimum 50px like in the HTML template)
      const deltaX = endX - startX;
      if (Math.abs(deltaX) < 50) {
        // Movement too small, don't trigger navigation
        return;
      }
      
      // Determine direction and check if button is enabled before clicking
      if (deltaX > 0) {
        // Moving right = previous slide
        const prevEnabled = await page.evaluate(() => {
          const btn = document.getElementById('prev-btn') as HTMLButtonElement;
          return btn && !btn.disabled;
        });
        if (prevEnabled) {
          await page.click('#prev-btn');
        }
      } else if (deltaX < 0) {
        // Moving left = next slide  
        const nextEnabled = await page.evaluate(() => {
          const btn = document.getElementById('next-btn') as HTMLButtonElement;
          return btn && !btn.disabled;
        });
        if (nextEnabled) {
          await page.click('#next-btn');
        }
      }
    }
  },

  /**
   * Perform swipe gesture
   * 
   * @param page - Playwright page instance
   *
   * @param direction - Swipe direction
   *
   * @returns Promise that resolves when gesture is complete
   *
   */
  async performSwipeGesture(page: Page, direction: 'left' | 'right'): Promise<void> {
    const startX = direction === 'left' ? 600 : 200;
    const endX = direction === 'left' ? 200 : 600;
    const y = 300;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();
  },

  /**
   * Perform touch swipe gesture
   * 
   * @param page - Playwright page instance
   *
   * @param direction - Swipe direction
   *
   * @returns Promise that resolves when gesture is complete
   *
   */
  async performTouchSwipeGesture(page: Page, direction: 'left' | 'right'): Promise<void> {
    const startX = direction === 'left' ? 600 : 200;
    const endX = direction === 'left' ? 200 : 600;
    const y = 300;

    await page.touchscreen.tap(startX, y);
    await page.waitForTimeout(50);
    await page.touchscreen.tap(endX, y);
  }
};

/**
 * Canvas utilities for responsive testing
 */
export const canvasUtilities = {
  /**
   * Get responsive breakpoint for given width
   * 
   * @param width - Canvas width
   *
   * @returns Breakpoint name
   *
   */
  getBreakpoint(width: number): string {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  },

  /**
   * Create canvas test HTML template
   * 
   * @returns HTML template string
   *
   */
  createCanvasTestTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Canvas Test</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            #canvas-container { width: 100%; height: 400px; padding: 20px; }
            #test-canvas { display: block; width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="canvas-container">
            <canvas id="test-canvas"></canvas>
          </div>
        </body>
      </html>
    `;
  }
};

/**
 * Worker pool test utilities
 */
export const workerUtilities = {
  /**
   * Create worker script template
   * 
   * @returns Worker script string
   *
   */
  createWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { task } = e.data;
        try {
          if (typeof task === 'string' && (task.startsWith('function') || task.startsWith('(') || task.startsWith('=>'))) {
            const func = new Function('return ' + task)();
            const result = typeof func === 'function' ? func() : task;
            self.postMessage({ success: true, result });
          } else if (typeof task === 'function') {
            const result = task();
            self.postMessage({ success: true, result });
          } else {
            self.postMessage({ success: true, result: task });
          }
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;
  },

  /**
   * Setup worker pool test environment
   * 
   * @param page - Playwright page instance
   *
   * @returns Promise that resolves when setup is complete
   *
   */
  async setupWorkerPoolTest(page: Page): Promise<void> {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Worker Pool Test</title>
        </head>
        <body>
          <div id="worker-test-container">
            <h2>Worker Pool E2E Test</h2>
            <div id="test-output"></div>
          </div>
        </body>
      </html>
    `);

    await page.waitForLoadState('domcontentloaded');
  }
};

/**
 * User journey test utilities
 */
export const userJourneyUtilities = {
  /**
   * Create slider test HTML template
   * 
   * @returns HTML template string
   *
   */
  createSliderTestTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Slider Gesture Test</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
            #test-slider { 
              width: 600px; 
              height: 400px; 
              position: relative; 
              overflow: hidden; 
              background: #fff; 
              border: 2px solid #ddd;
              margin: 0 auto;
              touch-action: none;
            }
            .slide { 
              width: 100%; 
              height: 100%; 
              position: absolute;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 24px;
              font-weight: bold;
              color: white;
              transition: transform 0.3s ease;
            }
            .slide:nth-child(1) { background: #ff6b6b; }
            .slide:nth-child(2) { background: #4ecdc4; }
            .slide:nth-child(3) { background: #45b7d1; }
            .slide.active { transform: translateX(0); }
            .slide.prev { transform: translateX(-100%); }
            .slide.next { transform: translateX(100%); }
            .controls { 
              text-align: center; 
              margin: 20px 0; 
            }
            button { 
              margin: 0 10px; 
              padding: 10px 20px; 
              font-size: 16px;
              border: none;
              background: #007bff;
              color: white;
              border-radius: 4px;
              cursor: pointer;
            }
            button:hover { background: #0056b3; }
            button:disabled { background: #6c757d; cursor: not-allowed; }
            #status { 
              text-align: center; 
              margin: 10px 0; 
              padding: 10px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="controls">
            <button id="prev-btn">Previous</button>
            <button id="next-btn">Next</button>
            <button id="toggle-gestures">Toggle Gestures</button>
          </div>
          
          <div id="test-slider">
            <div class="slide active">Slide 1</div>
            <div class="slide next">Slide 2</div>
            <div class="slide next">Slide 3</div>
          </div>
          
          <div id="status">Ready for testing</div>

          <script>
            // Slider state management
            let currentSlide = 0;
            let gesturesEnabled = true;
            const slides = document.querySelectorAll('.slide');
            const totalSlides = slides.length;

            // Update slide positions
            function updateSlides() {
              slides.forEach((slide, index) => {
                slide.classList.remove('active', 'prev', 'next');
                if (index === currentSlide) {
                  slide.classList.add('active');
                } else if (index < currentSlide) {
                  slide.classList.add('prev');
                } else {
                  slide.classList.add('next');
                }
              });
              
              // Update button states
              document.getElementById('prev-btn').disabled = currentSlide === 0;
              document.getElementById('next-btn').disabled = currentSlide === totalSlides - 1;
              
              // Update status
              document.getElementById('status').textContent = 
                \`Slide \${currentSlide + 1} of \${totalSlides} - Gestures: \${gesturesEnabled ? 'Enabled' : 'Disabled'}\`;
            }

            // Navigation functions
            function goToNext() {
              if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateSlides();
                return true;
              }
              return false;
            }

            function goToPrev() {
              if (currentSlide > 0) {
                currentSlide--;
                updateSlides();
                return true;
              }
              return false;
            }

            function toggleGestures() {
              gesturesEnabled = !gesturesEnabled;
              updateSlides();
            }

            // Button event listeners
            document.getElementById('prev-btn').addEventListener('click', goToPrev);
            document.getElementById('next-btn').addEventListener('click', goToNext);
            document.getElementById('toggle-gestures').addEventListener('click', toggleGestures);

            // Gesture handling
            let startX = 0;
            let startY = 0;
            let startTime = 0;

            function handleGestureStart(x, y) {
              if (!gesturesEnabled) return;
              startX = x;
              startY = y;
              startTime = Date.now();
            }

            function handleGestureEnd(x, y) {
              if (!gesturesEnabled) return;
              
              const deltaX = x - startX;
              const deltaY = y - startY;
              const deltaTime = Date.now() - startTime;
              
              // Check if it's a valid swipe (horizontal movement > vertical, minimum distance and speed)
              if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 1000) {
                if (deltaX > 0) {
                  // Swipe right (previous)
                  goToPrev();
                } else {
                  // Swipe left (next)
                  goToNext();
                }
              }
            }

            // Mouse events
            document.getElementById('test-slider').addEventListener('mousedown', (e) => {
              handleGestureStart(e.clientX, e.clientY);
            });

            document.getElementById('test-slider').addEventListener('mouseup', (e) => {
              handleGestureEnd(e.clientX, e.clientY);
            });

            // Touch events
            document.getElementById('test-slider').addEventListener('touchstart', (e) => {
              const touch = e.touches[0];
              handleGestureStart(touch.clientX, touch.clientY);
            });

            document.getElementById('test-slider').addEventListener('touchend', (e) => {
              const touch = e.changedTouches[0];
              handleGestureEnd(touch.clientX, touch.clientY);
            });

            // Expose test utilities to window
            window.testGestures = {
              isGestureEnabled: () => gesturesEnabled,
              getCurrentSlide: () => currentSlide,
              getTotalSlides: () => totalSlides,
              goToNext: () => {
                if (currentSlide < totalSlides - 1) {
                  currentSlide++;
                  updateSlides();
                  return true;
                }
                return false;
              },
              goToPrev: () => {
                if (currentSlide > 0) {
                  currentSlide--;
                  updateSlides();
                  return true;
                }
                return false;
              },
              toggleGestures,
              setGesturesEnabled: (enabled) => {
                gesturesEnabled = enabled;
                updateSlides();
              }
            };

            // Initialize
            updateSlides();
          </script>
        </body>
      </html>
    `;
  },

  /**
   * Setup user journey test environment
   * 
   * @param page - Playwright page instance
   *
   * @returns Promise that resolves when setup is complete
   *
   */
  async setupUserJourneyTest(page: Page): Promise<void> {
    await page.setContent(this.createSliderTestTemplate());
    await page.waitForLoadState('domcontentloaded');
  }
};

/**
 * Common test setup utilities
 */
export const testSetup = {
  /**
   * Wait for test utilities to be available
   * 
   * @param page - Playwright page instance
   *
   * @param utilityName - Name of the utility to wait for
   *
   * @returns Promise that resolves when utility is available
   *
   */
  async waitForTestUtilities(page: Page, utilityName: string): Promise<void> {
    await page.waitForFunction(
      (name) => (window as unknown as Record<string, unknown>)[name] !== undefined,
      utilityName
    );
  },

  /**
   * Setup basic test environment
   * 
   * @param page - Playwright page instance
   *
   * @param title - Page title
   *
   * @returns Promise that resolves when setup is complete
   *
   */
  async setupBasicTestEnvironment(page: Page, title: string): Promise<void> {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${title}</title>
        </head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `);

    await page.waitForLoadState('domcontentloaded');
  }
};

/**
 * Resource management test utilities
 */
export const resourceUtilities = {
  /**
   * Setup resource management test environment
   * 
   * @param page - Playwright page instance
   *
   * @returns Promise that resolves when setup is complete
   *
   */
  async setupResourceManagementTest(page: Page): Promise<void> {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resource Management Test</title>
        </head>
        <body>
          <div id="resource-test-container">
            <h2>Resource Management E2E Test</h2>
            <div id="test-output"></div>
          </div>
        </body>
      </html>
    `);

    await page.waitForLoadState('domcontentloaded');
  }
}; 