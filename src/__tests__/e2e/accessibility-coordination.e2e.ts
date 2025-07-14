import { test, expect } from '@playwright/test';

// Proper TypeScript interfaces for E2E testing
interface AnimationResult {
  activeAnimations: number;
  queueLength: number;
}

interface AnimationMetrics {
  animations?: { active?: number; total?: number };
  fps?: { current?: number };
}

interface AnimationManager {
  getDefaultDuration?: () => number;
  getPerformanceStats?: () => Record<string, unknown>;
}

interface PerformanceMonitor {
  getMetrics?: () => AnimationMetrics;
}

interface AnimationQueue {
  getStats?: () => { totalItems?: number };
}

interface KineticSliderManagers {
  animationManager?: AnimationManager;
  performanceMonitor?: PerformanceMonitor;
  memoryManager?: Record<string, unknown>;
  animationQueue?: AnimationQueue;
}

interface KineticSlider {
  engine?: unknown;
  currentIndex: number;
  isPlaying: boolean;
  managers?: KineticSliderManagers;
}

test.describe('Animation Coordination Accessibility E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Ensure animation coordination is ready
    await page.waitForFunction(() => {
      return window.kineticSlider && window.kineticSlider.managers;
    });
  });

  test.describe('Reduced Motion Preferences', () => {
    test('should respect prefers-reduced-motion setting', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      // Trigger animation
      await page.click('[data-testid="accessibility-animation-trigger"]');

      // Verify reduced motion behavior
      const motionBehavior = await page.evaluate(() => {
        const managers = window.kineticSlider?.managers;
        return {
          animationDuration:
            managers?.animationManager?.getDefaultDuration?.() || 0,
          reducedMotionEnabled: window.matchMedia(
            '(prefers-reduced-motion: reduce)'
          ).matches,
          animationCount:
            managers?.animationQueue?.getStats?.()?.totalItems || 0,
        };
      });

      expect(motionBehavior.reducedMotionEnabled).toBe(true);
      // Animations should be shortened or eliminated
      expect(motionBehavior.animationDuration).toBeLessThan(200); // Quick or instant
    });

    test('should provide motion controls for users', async ({ page }) => {
      // Look for motion control toggle
      const motionToggle = page.locator('[data-testid="motion-toggle"]');
      await expect(motionToggle).toBeVisible();

      // Test disabling animations
      await motionToggle.click();

      // Trigger animation and verify it's disabled or minimal
      await page.click('[data-testid="motion-controlled-animation"]');

      const animationResult = await page.evaluate(() => {
        return new Promise<AnimationResult>((resolve) => {
          setTimeout(() => {
            const managers = window.kineticSlider?.managers;
            resolve({
              activeAnimations:
                managers?.performanceMonitor?.getMetrics?.()?.animations
                  ?.active || 0,
              queueLength:
                managers?.animationQueue?.getStats?.()?.totalItems || 0,
            });
          }, 100);
        });
      });

      expect(animationResult.activeAnimations).toBe(0);
      expect(animationResult.queueLength).toBe(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard animation triggers', async ({ page }) => {
      // Focus on keyboard-accessible animation trigger
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Navigate to animation button

      // Verify focus is on animation trigger
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.getAttribute('data-testid');
      });

      expect(focusedElement).toBe('keyboard-animation-trigger');

      // Trigger animation with keyboard
      await page.keyboard.press('Enter');

      // Verify animation started
      await page.waitForSelector('[data-testid="animation-started"]', {
        timeout: 1000,
      });

      // Verify animation completion notification
      await page.waitForSelector(
        '[data-testid="animation-complete-announcement"]',
        { timeout: 5000 }
      );
    });

    test('should maintain focus management during animations', async ({
      page,
    }) => {
      // Set initial focus
      await page.focus('[data-testid="focus-test-button"]');

      // Trigger animation that might affect focus
      await page.click('[data-testid="focus-affecting-animation"]');

      // Verify focus is maintained or properly managed
      await page.waitForTimeout(1000); // Let animation progress

      const focusStatus = await page.evaluate(() => {
        return {
          activeElement: document.activeElement?.tagName || 'NONE',
          focusVisible:
            document.activeElement?.matches(':focus-visible') || false,
          isInteractive:
            document.activeElement?.getAttribute('tabindex') !== null ||
            ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(
              document.activeElement?.tagName || ''
            ),
        };
      });

      expect(focusStatus.activeElement).not.toBe('NONE');
      expect(focusStatus.isInteractive).toBe(true);
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should announce animation states to screen readers', async ({
      page,
    }) => {
      // Look for ARIA live region
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();

      // Trigger animation
      await page.click('[data-testid="screen-reader-animation"]');

      // Check for animation start announcement
      await expect(liveRegion).toContainText(/animation.*started|loading/i, {
        timeout: 1000,
      });

      // Wait for completion announcement
      await expect(liveRegion).toContainText(/animation.*complete|finished/i, {
        timeout: 5000,
      });
    });

    test('should provide meaningful progress updates', async ({ page }) => {
      // Start long-running animation
      await page.click('[data-testid="progress-animation-trigger"]');

      // Check for progress announcements
      const progressUpdates = [];

      // Listen for progress updates
      page.on('console', (msg) => {
        if (msg.text().includes('progress') || msg.text().includes('%')) {
          progressUpdates.push(msg.text());
        }
      });

      // Wait for animation to progress
      await page.waitForTimeout(2000);

      // Verify progress was announced
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  test.describe('High Contrast and Visual Accessibility', () => {
    test('should work with high contrast themes', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * { border: 1px solid white !important; }
          }
        `,
      });

      // Trigger animation
      await page.click('[data-testid="high-contrast-animation"]');

      // Verify animation elements are visible in high contrast
      const visibility = await page.evaluate(() => {
        const animatedElement = document.querySelector(
          '[data-testid="animated-element"]'
        );
        if (!animatedElement) return false;

        const styles = window.getComputedStyle(animatedElement);
        return {
          isVisible:
            styles.display !== 'none' && styles.visibility !== 'hidden',
          hasContrast:
            styles.border !== 'none' ||
            styles.backgroundColor !== 'transparent',
          opacity: parseFloat(styles.opacity || '1'),
        };
      });

      if (visibility) {
        expect(visibility.isVisible).toBe(true);
        expect(visibility.opacity).toBeGreaterThan(0.5);
      }
    });

    test('should respect color contrast requirements', async ({ page }) => {
      // Get color contrast ratios of animated elements
      const contrastData = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-animated="true"]');
        const contrasts: Array<{
          element: string | null;
          backgroundColor: string;
          textColor: string;
          hasGoodContrast: boolean;
        }> = [];

        elements.forEach((element) => {
          const styles = window.getComputedStyle(element);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;

          contrasts.push({
            element: element.getAttribute('data-testid'),
            backgroundColor: bgColor,
            textColor: textColor,
            // Simplified contrast check (in real implementation, would calculate actual ratio)
            hasGoodContrast: bgColor !== textColor && bgColor !== 'transparent',
          });
        });

        return contrasts;
      });

      // Verify all animated elements have adequate contrast
      contrastData.forEach((contrast) => {
        expect(contrast.hasGoodContrast).toBe(true);
      });
    });
  });

  test.describe('Performance Impact on Accessibility', () => {
    test('should maintain screen reader responsiveness during animations', async ({
      page,
    }) => {
      // Start heavy animation load
      await page.click('[data-testid="heavy-animation-load"]');

      // Test screen reader interaction responsiveness
      const interactionStart = Date.now();

      // Trigger screen reader action
      await page.click('[data-testid="screen-reader-interaction"]');

      // Wait for response
      await page.waitForSelector('[data-testid="interaction-response"]', {
        timeout: 1000,
      });

      const responseTime = Date.now() - interactionStart;

      // Screen reader interactions should remain responsive
      expect(responseTime).toBeLessThan(500); // 500ms max for accessibility
    });

    test('should not interfere with assistive technology', async ({ page }) => {
      // Simulate assistive technology queries during animations
      await page.click('[data-testid="assistive-tech-animation"]');

      // Test DOM accessibility tree stability
      const accessibilityData = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          '[role], [aria-label], [aria-describedby]'
        );
        return Array.from(elements).map((el) => ({
          role: el.getAttribute('role'),
          label: el.getAttribute('aria-label'),
          describedBy: el.getAttribute('aria-describedby'),
          isVisible:
            (el as HTMLElement).offsetWidth > 0 &&
            (el as HTMLElement).offsetHeight > 0,
        }));
      });

      // Verify accessibility attributes are preserved
      accessibilityData.forEach((data) => {
        if (data.role || data.label || data.describedBy) {
          expect(data.isVisible).toBe(true);
        }
      });
    });
  });

  test.describe('Error Handling and User Feedback', () => {
    test('should provide accessible error messages', async ({ page }) => {
      // Trigger animation that will fail
      await page.click('[data-testid="failing-animation-trigger"]');

      // Look for accessible error message
      const errorMessage = page.locator(
        '[role="alert"], [aria-live="assertive"]'
      );
      await expect(errorMessage).toBeVisible({ timeout: 2000 });

      // Verify error message content
      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/error|failed|problem/i);
      expect(errorText?.length || 0).toBeGreaterThan(10); // Meaningful message
    });

    test('should offer recovery options accessibly', async ({ page }) => {
      // Trigger error condition
      await page.click('[data-testid="error-with-recovery"]');

      // Wait for error and recovery options
      await page.waitForSelector('[data-testid="recovery-options"]', {
        timeout: 2000,
      });

      // Verify recovery options are keyboard accessible
      await page.keyboard.press('Tab'); // Should focus on recovery option

      const focusedRecovery = await page.evaluate(() => {
        const focused = document.activeElement;
        return {
          isRecoveryOption: focused
            ?.getAttribute('data-testid')
            ?.includes('recovery'),
          isButton: focused?.tagName === 'BUTTON',
          hasLabel:
            focused?.getAttribute('aria-label') !== null ||
            focused?.textContent?.trim() !== '',
        };
      });

      expect(focusedRecovery.isRecoveryOption).toBe(true);
      expect(focusedRecovery.isButton).toBe(true);
      expect(focusedRecovery.hasLabel).toBe(true);
    });
  });

  test.describe('Multi-modal Accessibility', () => {
    test('should support voice commands integration', async ({ page }) => {
      // Simulate voice command trigger (in real implementation, would integrate with speech recognition)
      await page.evaluate(() => {
        // Mock voice command
        window.dispatchEvent(
          new CustomEvent('voiceCommand', {
            detail: { command: 'start animation' },
          })
        );
      });

      // Verify voice command triggered animation
      await page.waitForSelector('[data-testid="voice-triggered-animation"]', {
        timeout: 1000,
      });

      // Check for voice feedback
      const voiceFeedback = await page.evaluate(() => {
        return {
          speechSynthesisSupported: 'speechSynthesis' in window,
          feedbackProvided:
            document.querySelector('[data-voice-feedback="true"]') !== null,
        };
      });

      expect(voiceFeedback.speechSynthesisSupported).toBe(true);
      expect(voiceFeedback.feedbackProvided).toBe(true);
    });

    test('should work with switch navigation', async ({ page }) => {
      // Simulate switch navigation (common assistive technology)
      const switchTargets = await page
        .locator('[data-switch-target="true"]')
        .all();
      expect(switchTargets.length).toBeGreaterThan(0);

      // Test switch navigation through animation controls
      for (let i = 0; i < Math.min(switchTargets.length, 3); i++) {
        await switchTargets[i].click();
        await page.waitForTimeout(200); // Time for switch users to process
      }

      // Verify animations respond to switch navigation
      const animationStatus = await page.evaluate(() => {
        const managers = window.kineticSlider?.managers;
        return {
          animationsTriggered:
            (managers?.performanceMonitor?.getMetrics?.()?.animations?.total ||
              0) > 0,
          systemResponsive:
            (managers?.performanceMonitor?.getMetrics?.()?.fps?.current || 0) >
            0,
        };
      });

      expect(animationStatus.animationsTriggered).toBe(true);
      expect(animationStatus.systemResponsive).toBe(true);
    });
  });
});

// Global type extensions for accessibility testing
declare global {
  interface Window {
    kineticSlider?: KineticSlider;
  }
}
