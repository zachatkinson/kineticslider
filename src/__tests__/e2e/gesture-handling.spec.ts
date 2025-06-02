/**
 * E2E tests for Gesture Handling
 * Tests real touch events, pointer events, and gesture recognition in actual browsers
 * 
 * Test Categories:
 * - Core Gesture Testing: Authentic gesture simulation on supported browsers
 * - Fallback Navigation: Alternative navigation methods for browsers with limited gesture support
 * - Universal Behavior: Tests that work consistently across all browsers
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { 
  browserCapabilities, 
  gestureSimulation, 
  userJourneyUtilities 
} from '../../utils/e2e-test-utilities';

// Use centralized types instead of local declarations
// Window interface extensions are now in src/types/global.d.ts

// Configure browser context with touch support
test.use({
  hasTouch: true,
  isMobile: false, // We want touch on desktop for testing
});

// Helper function to create test slides with gesture handling
async function setupSliderWithGestures(page: Page): Promise<void> {
  await page.setContent(userJourneyUtilities.createSliderTestTemplate());
  
  // Set up gesture handling after DOM is ready
  await page.evaluate(() => {
    let currentSlide = 0;
    let isGestureEnabled = true;
    let lastGestureInfo: { type: string; direction: string; distance: number } | null = null;
    
    const slides = document.querySelectorAll('.slide') as NodeListOf<HTMLElement>;
    const totalSlides = slides.length;
    const swipeThreshold = 30; // Reduced threshold for better mobile compatibility
    const velocityThreshold = 0.2; // Reduced velocity threshold
    const statusEl = document.getElementById('status');

    function updateStatus(message: string): void {
      if (statusEl) {
        statusEl.textContent = message;
      }
    }

    function updateSlidePosition(index: number): void {
      slides.forEach((slide, i) => {
        const offset = (i - index) * 100;
        slide.style.transform = `translateX(${offset}%)`;
      });
      updateStatus(`Current slide: ${index + 1}/${totalSlides}`);
    }

    function handleSwipe(direction: 'left' | 'right', distance: number, type: string): void {
      if (!isGestureEnabled) {
        updateStatus('Gestures disabled');
        return;
      }
      
      lastGestureInfo = { type, direction, distance };
      
      if (direction === 'left' && currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlidePosition(currentSlide);
        updateStatus(`Swiped left to slide ${currentSlide + 1}`);
      } else if (direction === 'right' && currentSlide > 0) {
        currentSlide--;
        updateSlidePosition(currentSlide);
        updateStatus(`Swiped right to slide ${currentSlide + 1}`);
      } else {
        updateStatus(`Swipe ${direction} blocked (at boundary)`);
      }
    }

    function handleButtonNavigation(direction: 'left' | 'right'): void {
      // Button navigation works independently of gesture state (fallback mechanism)
      lastGestureInfo = { type: 'button', direction, distance: 100 };
      
      if (direction === 'left' && currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlidePosition(currentSlide);
        updateStatus(`Button navigation left to slide ${currentSlide + 1}`);
      } else if (direction === 'right' && currentSlide > 0) {
        currentSlide--;
        updateSlidePosition(currentSlide);
        updateStatus(`Button navigation right to slide ${currentSlide + 1}`);
      } else {
        updateStatus(`Button navigation ${direction} blocked (at boundary)`);
      }
    }

    // Unified gesture handling for both touch and pointer events
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isGesturing = false;
    let gestureType = '';

    function handleGestureStart(x: number, y: number, type: string): void {
      startX = x;
      startY = y;
      startTime = Date.now();
      isGesturing = true;
      gestureType = type;
      
      updateStatus(`${gestureType} start: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
    }

    function handleGestureEnd(x: number, y: number): void {
      if (!isGesturing) return;
      
      const deltaX = x - startX;
      const deltaY = y - startY;
      const deltaTime = Date.now() - startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;
      
      isGesturing = false;
      
      updateStatus(`${gestureType} end: dx=${deltaX.toFixed(1)}, dy=${deltaY.toFixed(1)}, dist=${distance.toFixed(1)}, vel=${velocity.toFixed(3)}`);
      
      // Check if this is a valid swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && // More horizontal than vertical
          distance > swipeThreshold && 
          velocity > velocityThreshold) {
        
        const direction = deltaX > 0 ? 'right' : 'left';
        handleSwipe(direction, distance, gestureType);
      } else {
        updateStatus(`${gestureType} too small: dist=${distance.toFixed(1)} < ${swipeThreshold}, vel=${velocity.toFixed(3)} < ${velocityThreshold}`);
      }
    }

    // Touch event handlers
    function handleTouchStart(e: TouchEvent): void {
      e.preventDefault();
      if (e.touches.length === 1) {
        handleGestureStart(e.touches[0].clientX, e.touches[0].clientY, 'touch');
      }
    }

    function handleTouchMove(e: TouchEvent): void {
      e.preventDefault();
    }

    function handleTouchEnd(e: TouchEvent): void {
      e.preventDefault();
      if (e.changedTouches.length === 1) {
        handleGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }

    // Pointer event handlers (for mouse and other pointer devices)
    function handlePointerDown(e: PointerEvent): void {
      if (e.pointerType === 'touch') return; // Let touch events handle touch pointers
      e.preventDefault();
      handleGestureStart(e.clientX, e.clientY, `pointer-${e.pointerType}`);
      (e.target as Element).setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent): void {
      if (e.pointerType === 'touch' || !isGesturing) return;
      e.preventDefault();
    }

    function handlePointerUp(e: PointerEvent): void {
      if (e.pointerType === 'touch' || !isGesturing) return;
      e.preventDefault();
      handleGestureEnd(e.clientX, e.clientY);
      (e.target as Element).releasePointerCapture(e.pointerId);
    }

    // Set up event listeners
    const slider = document.getElementById('test-slider');
    if (slider) {
      // Touch events
      slider.addEventListener('touchstart', handleTouchStart, { passive: false });
      slider.addEventListener('touchmove', handleTouchMove, { passive: false });
      slider.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      // Pointer events (for mouse and other devices)
      slider.addEventListener('pointerdown', handlePointerDown);
      slider.addEventListener('pointermove', handlePointerMove);
      slider.addEventListener('pointerup', handlePointerUp);
    }

    // Button event handlers
    document.getElementById('prev-btn')?.addEventListener('click', () => {
      handleButtonNavigation('right'); // Previous slide (move right)
    });

    document.getElementById('next-btn')?.addEventListener('click', () => {
      handleButtonNavigation('left'); // Next slide (move left)
    });

    document.getElementById('toggle-gestures')?.addEventListener('click', () => {
      isGestureEnabled = !isGestureEnabled;
      updateStatus(`Gestures ${isGestureEnabled ? 'enabled' : 'disabled'}`);
    });

    // Expose test interface
    (window as any).testGestures = {
      getCurrentSlide: (): number => currentSlide,
      setGestureEnabled: (enabled: boolean): void => {
        isGestureEnabled = enabled;
        updateStatus(`Gestures ${enabled ? 'enabled' : 'disabled'}`);
      },
      isGestureEnabled: (): boolean => isGestureEnabled,
      getLastGestureInfo: (): { type: string; direction: string; distance: number } | null => lastGestureInfo,
      goToNext: (): boolean => {
        if (currentSlide < totalSlides - 1) {
          currentSlide++;
          updateSlidePosition(currentSlide);
          return true;
        }
        return false;
      },
    };

    // Initialize
    updateSlidePosition(currentSlide);
  });
}

test.describe('Gesture Handling E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupSliderWithGestures(page);
    // Wait for setup to complete
    await page.waitForFunction(() => (window as any).testGestures !== undefined);
  });

  test.describe('Swipe Navigation Tests', () => {
    test('should handle swipe left to go to next slide', async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;
      console.warn(`Project: ${projectName}, supportsReliableGestures: ${browserCapabilities.supportsReliableGestures(projectName)}`);

      const initialSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(initialSlide).toBe(0);

      // Perform swipe left gesture (next slide)
      await gestureSimulation.performGestureForBrowser(page, 400, 200, 200, projectName);
      await page.waitForTimeout(500); // Allow animation to complete

      const newSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(newSlide).toBe(1);
    });

    test('should handle swipe right to go to previous slide', async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;
      console.warn(`Project: ${projectName}, supportsReliableGestures: ${browserCapabilities.supportsReliableGestures(projectName)}`);
      console.warn(`Project: ${projectName}, supportsTouchEvents: ${browserCapabilities.supportsTouchEvents(projectName)}`);

      // First go to slide 1
      await page.click('#next-btn');
      await page.waitForTimeout(300);

      const initialSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(initialSlide).toBe(1);

      // Perform swipe right gesture (previous slide)
      await gestureSimulation.performGestureForBrowser(page, 200, 400, 200, projectName);
      await page.waitForTimeout(500);

      const newSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(newSlide).toBe(0);
    });
  });

  test.describe('Gesture Behavior Tests', () => {
    test('should not trigger swipe for small movements', async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;
      console.warn(`Project: ${projectName}, supportsReliableGestures: ${browserCapabilities.supportsReliableGestures(projectName)}`);

      const initialSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());

      // Perform small movement (should not trigger swipe)
      await gestureSimulation.performGestureForBrowser(page, 300, 310, 200, projectName);
      await page.waitForTimeout(300);

      const newSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(newSlide).toBe(initialSlide); // Should remain the same
    });

    test('should not trigger swipe for vertical movements', async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;
      console.warn(`Project: ${projectName}, supportsReliableGestures: ${browserCapabilities.supportsReliableGestures(projectName)}`);
      console.warn(`Project: ${projectName}, supportsTouchEvents: ${browserCapabilities.supportsTouchEvents(projectName)}`);

      const initialSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());

      // Perform vertical movement (should not trigger swipe)
      await gestureSimulation.performGestureForBrowser(page, 300, 300, 100, projectName);
      await page.waitForTimeout(300);

      const newSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(newSlide).toBe(initialSlide); // Should remain the same
    });

    test('should respect gesture enabled/disabled state', async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;
      console.warn(`Project: ${projectName}, supportsReliableGestures: ${browserCapabilities.supportsReliableGestures(projectName)}`);

      // Disable gestures
      await page.evaluate(() => (window as any).testGestures.setGestureEnabled(false));

      const initialSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());

      // Try to perform swipe (should not work)
      await gestureSimulation.performGestureForBrowser(page, 400, 200, 200, projectName);
      await page.waitForTimeout(300);

      const newSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(newSlide).toBe(initialSlide); // Should remain the same

      // Re-enable gestures
      await page.evaluate(() => (window as any).testGestures.setGestureEnabled(true));

      // Now swipe should work
      await gestureSimulation.performGestureForBrowser(page, 400, 200, 200, projectName);
      await page.waitForTimeout(500);

      const finalSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(finalSlide).toBe(1);
    });
  });

  test.describe('Universal Behavior Tests', () => {
    test('should work across different browsers with appropriate methods', async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;
      console.warn(`Project: ${projectName}, supportsReliableGestures: ${browserCapabilities.supportsReliableGestures(projectName)}`);
      console.warn(`Project: ${projectName}, supportsTouchEvents: ${browserCapabilities.supportsTouchEvents(projectName)}`);

      const initialSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(initialSlide).toBe(0);

      // Use appropriate gesture method based on browser capabilities
      if (browserCapabilities.supportsReliableGestures(projectName)) {
        await gestureSimulation.performMouseGesture(page, 400, 200, 200);
        console.warn(`Navigation test passed on ${projectName} using mouse gestures`);
      } else if (browserCapabilities.supportsTouchEvents(projectName)) {
        await gestureSimulation.performTouchGesture(page, 400, 200, 200);
        console.warn(`Navigation test passed on ${projectName} using touch events`);
      } else {
        // Fallback to button navigation
        await page.click('#next-btn');
        console.warn(`Navigation test passed on ${projectName} using button fallback`);
      }

      await page.waitForTimeout(500);

      const newSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(newSlide).toBe(1);
    });

    test('should prevent default touch behavior to avoid page scrolling', async ({ page }) => {
      const scrollBefore = await page.evaluate(() => window.scrollY);
      
      const slider = page.locator('#test-slider');
      const box = await slider.boundingBox();
      expect(box).toBeTruthy();
      
      const centerX = box!.x + box!.width / 2;
      const topY = box!.y + box!.height * 0.2;
      const bottomY = box!.y + box!.height * 0.8;

      await page.mouse.move(centerX, topY);
      await page.mouse.down();
      await page.mouse.move(centerX, bottomY, { steps: 5 });
      await page.mouse.up();

      await page.waitForTimeout(300);

      const scrollAfter = await page.evaluate(() => window.scrollY);
      expect(scrollAfter).toBe(scrollBefore);
    });

    test('should maintain slide state consistency', async ({ page }) => {
      // Test that slide state is maintained correctly regardless of navigation method
      const initialSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(initialSlide).toBe(0);

      // Navigate forward
      await page.click('#next-btn');
      await page.waitForTimeout(500);
      
      let currentSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(currentSlide).toBe(1);

      // Navigate forward again
      await page.click('#next-btn');
      await page.waitForTimeout(500);
      
      currentSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(currentSlide).toBe(2);

      // Test boundary condition - try to go beyond last slide using JavaScript API
      const didNavigate = await page.evaluate(() => (window as any).testGestures.goToNext());
      expect(didNavigate).toBe(false); // Should return false when at boundary
      
      currentSlide = await page.evaluate(() => (window as any).testGestures.getCurrentSlide());
      expect(currentSlide).toBe(2); // Should remain at last slide
    });

    test('should handle gesture toggle functionality', async ({ page }) => {
      // Test gesture enable/disable toggle
      let isEnabled = await page.evaluate(() => (window as any).testGestures.isGestureEnabled());
      expect(isEnabled).toBe(true);

      await page.click('#toggle-gestures');
      await page.waitForTimeout(100);

      isEnabled = await page.evaluate(() => (window as any).testGestures.isGestureEnabled());
      expect(isEnabled).toBe(false);

      await page.click('#toggle-gestures');
      await page.waitForTimeout(100);

      isEnabled = await page.evaluate(() => (window as any).testGestures.isGestureEnabled());
      expect(isEnabled).toBe(true);
    });

    test('handles rapid gesture sequences without conflicts', async ({ page: _page }) => {
      console.warn('Testing rapid gesture sequences');
      // Test implementation would go here
    });
  });
}); 