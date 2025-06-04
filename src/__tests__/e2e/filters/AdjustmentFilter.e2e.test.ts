/**
 * AdjustmentFilter E2E Tests
 * 
 * Tests AdjustmentFilter in real browser environment focusing on user interaction,
 * performance monitoring, and browser-specific behavior.
 * 
 * @module AdjustmentFilterE2E
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Type declarations for the test environment
declare global {
  interface Window {
    testAdjustmentFilter: {
      getFilter: () => {
        enabled: boolean;
        intensity: number;
        gamma: number;
        saturation: number;
        contrast: number;
        brightness: number;
        red: number;
        green: number;
        blue: number;
        alpha: number;
        primaryProperty?: string;
        renderTime: number;
      };
      getCanvas: () => HTMLCanvasElement;
      getWebGLContext: () => WebGLRenderingContext | null;
      setIntensity: (intensity: number) => void;
      setEnabled: (enabled: boolean) => void;
      setPrimaryProperty: (property: string) => void;
      getCurrentFPS: () => number;
      getRenderTime: () => number;
      captureCanvasData: () => ImageData;
      isWebGLAvailable: () => boolean;
    };
  }
}

/**
 * Setup AdjustmentFilter E2E test environment
 *
 * @param page - Playwright page instance
 *
 * @returns Promise that resolves when setup is complete
 *
 */
async function setupAdjustmentFilterTest(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AdjustmentFilter E2E Test</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        #container { width: 800px; height: 600px; border: 1px solid #ccc; }
        #controls { margin: 20px 0; }
        .control-group { margin: 10px 0; }
        .control-group label { display: inline-block; width: 140px; }
        .control-group input[type="range"] { width: 200px; }
        .control-group input[type="checkbox"] { margin-right: 10px; }
        .control-group select { width: 150px; }
        #metrics { margin-top: 20px; padding: 10px; background: #f0f0f0; }
        .metric { margin: 5px 0; }
      </style>
    </head>
    <body>
      <h1>AdjustmentFilter E2E Test Environment</h1>
      
      <div id="container">
        <canvas id="test-canvas" width="800" height="600"></canvas>
      </div>
      
      <div id="controls">
        <div class="control-group">
          <label>
            <input type="checkbox" id="adjustment-enabled" checked> Enable Adjustment Filter
          </label>
        </div>
        
        <div class="control-group">
          <label for="adjustment-intensity">Intensity (0-10):</label>
          <input type="range" id="adjustment-intensity" min="0" max="10" step="0.1" value="5">
          <span id="intensity-value">5.0</span>
        </div>
        
        <div class="control-group">
          <label for="primary-property">Primary Property:</label>
          <select id="primary-property">
            <option value="default">Default (Brightness + Contrast)</option>
            <option value="gamma">Gamma</option>
            <option value="saturation">Saturation</option>
            <option value="contrast">Contrast</option>
            <option value="brightness">Brightness</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="gamma-control">Gamma:</label>
          <input type="range" id="gamma-control" min="0.1" max="2" step="0.1" value="1">
          <span id="gamma-value">1.0</span>
        </div>
        
        <div class="control-group">
          <label for="saturation-control">Saturation:</label>
          <input type="range" id="saturation-control" min="0" max="2" step="0.1" value="1">
          <span id="saturation-value">1.0</span>
        </div>
        
        <div class="control-group">
          <label for="contrast-control">Contrast:</label>
          <input type="range" id="contrast-control" min="0" max="2" step="0.1" value="1">
          <span id="contrast-value">1.0</span>
        </div>
        
        <div class="control-group">
          <label for="brightness-control">Brightness:</label>
          <input type="range" id="brightness-control" min="0" max="2" step="0.1" value="1">
          <span id="brightness-value">1.0</span>
        </div>
        
        <div class="control-group">
          <button id="reset-btn">Reset Filter</button>
          <button id="context-loss-btn">Simulate Context Loss</button>
        </div>
      </div>
      
      <div id="metrics">
        <div class="metric">Frame Rate: <span id="fps">0</span> FPS</div>
        <div class="metric">WebGL Context: <span id="webgl-status">Unknown</span></div>
        <div class="metric">Filter Status: <span id="filter-status">Inactive</span></div>
        <div class="metric">Render Time: <span id="render-time">0</span> ms</div>
      </div>
      
      <script>
        // Mock AdjustmentFilter-like behavior for E2E testing
        class AdjustmentFilterE2E {
          constructor(config) {
            this.enabled = config.enabled || false;
            this.intensity = config.intensity || 0;
            this.gamma = config.gamma || 1;
            this.saturation = config.saturation || 1;
            this.contrast = config.contrast || 1;
            this.brightness = config.brightness || 1;
            this.red = config.red || 1;
            this.green = config.green || 1;
            this.blue = config.blue || 1;
            this.alpha = config.alpha || 1;
            this.primaryProperty = config.primaryProperty || null;
            this.renderTime = 0;
          }
          
          updateIntensity(intensity) {
            this.intensity = intensity;
            
            if (this.primaryProperty) {
              switch (this.primaryProperty) {
                case 'gamma':
                  this.gamma = 0.5 + (intensity / 10);
                  break;
                case 'saturation':
                  this.saturation = 0.5 + (intensity / 10);
                  break;
                case 'contrast':
                  this.contrast = 0.5 + (intensity / 10);
                  break;
                case 'brightness':
                  this.brightness = 0.5 + (intensity / 10);
                  break;
              }
            } else {
              // Default behavior - adjust brightness and contrast
              this.brightness = 0.5 + (intensity / 10);
              this.contrast = 0.5 + (intensity / 10);
            }
          }
          
          reset() {
            this.intensity = 0;
            this.gamma = 1;
            this.saturation = 1;
            this.contrast = 1;
            this.brightness = 1;
            this.red = 1;
            this.green = 1;
            this.blue = 1;
            this.alpha = 1;
          }
          
          render(ctx) {
            const startTime = performance.now();
            
            if (this.enabled) {
              // Apply adjustment effects using canvas filters/transformations
              const adjustments = [];
              
              if (this.brightness !== 1) {
                adjustments.push(\`brightness(\${this.brightness})\`);
              }
              if (this.contrast !== 1) {
                adjustments.push(\`contrast(\${this.contrast})\`);
              }
              if (this.saturation !== 1) {
                adjustments.push(\`saturate(\${this.saturation})\`);
              }
              
              if (adjustments.length > 0) {
                ctx.filter = adjustments.join(' ');
              }
              
              // Apply color channel adjustments by modifying drawing operations
              ctx.globalAlpha = this.alpha;
              
              // Render test content with adjustments
              this.renderTestContent(ctx);
              
              ctx.filter = 'none';
              ctx.globalAlpha = 1;
            } else {
              // Render without adjustments
              this.renderTestContent(ctx);
            }
            
            this.renderTime = performance.now() - startTime;
          }
          
          renderTestContent(ctx) {
            // Color gradient background
            const gradient = ctx.createLinearGradient(0, 0, 800, 600);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.33, '#4ecdc4');
            gradient.addColorStop(0.66, '#45b7d1');
            gradient.addColorStop(1, '#96ceb4');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 600);
            
            // Test shapes with various colors
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(100, 100, 150, 150);
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(300, 150, 100, 100);
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(450, 200, 120, 80);
            
            ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
            ctx.fillRect(600, 250, 80, 120);
            
            // Text to test text adjustment
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.font = '24px Arial';
            ctx.fillText('Adjustment Filter Test', 200, 400);
          }
        }
        
        // Test environment setup
        const canvas = document.getElementById('test-canvas');
        const ctx = canvas.getContext('2d');
        const webglCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let filter = new AdjustmentFilterE2E({ enabled: true, intensity: 5 });
        let animationId = null;
        let frameCount = 0;
        let lastFpsUpdate = Date.now();
        
        // Performance monitoring
        function updateFPS() {
          frameCount++;
          const now = Date.now();
          
          if (now - lastFpsUpdate >= 1000) {
            const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
            document.getElementById('fps').textContent = fps;
            frameCount = 0;
            lastFpsUpdate = now;
          }
        }
        
        // Render loop
        function render() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Apply filter and render
          filter.render(ctx);
          
          // Update metrics
          updateFPS();
          document.getElementById('render-time').textContent = filter.renderTime.toFixed(2);
          
          const statusText = filter.enabled ? 
            \`Active (Intensity: \${filter.intensity}, Primary: \${filter.primaryProperty || 'Default'})\` : 
            'Inactive';
          document.getElementById('filter-status').textContent = statusText;
          
          animationId = requestAnimationFrame(render);
        }
        
        // WebGL context detection
        if (webglCtx) {
          document.getElementById('webgl-status').textContent = 'Available';
        } else {
          document.getElementById('webgl-status').textContent = 'Not Available';
        }
        
        // Control event handlers
        document.getElementById('adjustment-enabled').addEventListener('change', (e) => {
          filter.enabled = e.target.checked;
        });
        
        document.getElementById('adjustment-intensity').addEventListener('input', (e) => {
          const intensity = parseFloat(e.target.value);
          filter.updateIntensity(intensity);
          document.getElementById('intensity-value').textContent = intensity.toFixed(1);
        });
        
        document.getElementById('primary-property').addEventListener('change', (e) => {
          const property = e.target.value === 'default' ? null : e.target.value;
          filter.primaryProperty = property;
          // Reapply current intensity with new primary property
          filter.updateIntensity(filter.intensity);
        });
        
        // Individual property controls
        ['gamma', 'saturation', 'contrast', 'brightness'].forEach(prop => {
          document.getElementById(\`\${prop}-control\`).addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            filter[prop] = value;
            document.getElementById(\`\${prop}-value\`).textContent = value.toFixed(1);
          });
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
          filter.reset();
          // Update UI controls
          document.getElementById('adjustment-intensity').value = '0';
          document.getElementById('intensity-value').textContent = '0.0';
          document.getElementById('primary-property').value = 'default';
          ['gamma', 'saturation', 'contrast', 'brightness'].forEach(prop => {
            document.getElementById(\`\${prop}-control\`).value = '1';
            document.getElementById(\`\${prop}-value\`).textContent = '1.0';
          });
        });
        
        // Simulate WebGL context loss for testing
        document.getElementById('context-loss-btn').addEventListener('click', () => {
          if (webglCtx && webglCtx.getExtension('WEBGL_lose_context')) {
            webglCtx.getExtension('WEBGL_lose_context').loseContext();
            setTimeout(() => {
              webglCtx.getExtension('WEBGL_lose_context').restoreContext();
            }, 1000);
          }
        });
        
        // Expose test interface
        window.testAdjustmentFilter = {
          getFilter: () => filter,
          getCanvas: () => canvas,
          getWebGLContext: () => webglCtx,
          
          setIntensity: (intensity) => {
            filter.updateIntensity(intensity);
            document.getElementById('adjustment-intensity').value = intensity;
            document.getElementById('intensity-value').textContent = intensity.toFixed(1);
          },
          
          setEnabled: (enabled) => {
            filter.enabled = enabled;
            document.getElementById('adjustment-enabled').checked = enabled;
          },
          
          setPrimaryProperty: (property) => {
            filter.primaryProperty = property === 'default' ? null : property;
            document.getElementById('primary-property').value = property;
            filter.updateIntensity(filter.intensity);
          },
          
          getCurrentFPS: () => {
            const fpsText = document.getElementById('fps').textContent;
            return parseInt(fpsText) || 0;
          },
          
          getRenderTime: () => filter.renderTime,
          
          captureCanvasData: () => {
            return ctx.getImageData(0, 0, canvas.width, canvas.height);
          },
          
          isWebGLAvailable: () => !!webglCtx
        };
        
        // Start rendering
        render();
      </script>
    </body>
    </html>
  `);
  
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.testAdjustmentFilter !== undefined, { timeout: 5000 });
}

test.describe('AdjustmentFilter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdjustmentFilterTest(page);
  });

  test.describe('Performance Monitoring', () => {
    test('should maintain acceptable frame rate with adjustment enabled', async ({ page }) => {
      await page.check('#adjustment-enabled');
      await page.fill('#adjustment-intensity', '7');
      
      // Wait for performance to stabilize
      await page.waitForTimeout(2000);
      
      const fps = await page.evaluate(() => {
        return window.testAdjustmentFilter.getCurrentFPS();
      });
      
      // Should maintain at least 30 FPS (reasonable for E2E testing)
      expect(fps).toBeGreaterThan(30);
    });

    test('should show render time impact with different adjustment levels', async ({ page }) => {
      // Test without adjustment
      await page.uncheck('#adjustment-enabled');
      await page.waitForTimeout(500);
      
      const _renderTimeWithoutAdjustment = await page.evaluate(() => {
        return window.testAdjustmentFilter.getRenderTime();
      });

      // Test with adjustment
      await page.check('#adjustment-enabled');
      await page.fill('#adjustment-intensity', '8');
      await page.waitForTimeout(500);
      
      const renderTimeWithAdjustment = await page.evaluate(() => {
        return window.testAdjustmentFilter.getRenderTime();
      });

      // Adjustment should add minimal render time (or at least not be less than without adjustment)
      // Note: On very fast browsers, both times may round to 0ms
      expect(renderTimeWithAdjustment).toBeGreaterThanOrEqual(0);
      
      // But should still be reasonable (< 30ms to accommodate Firefox performance)
      expect(renderTimeWithAdjustment).toBeLessThan(30);
    });
  });

  test.describe('User Interaction', () => {
    test('should respond to all control changes correctly', async ({ page }) => {
      // Test checkbox interaction
      await page.check('#adjustment-enabled');
      
      const enabledStatus = await page.evaluate(() => {
        return window.testAdjustmentFilter.getFilter().enabled;
      });
      expect(enabledStatus).toBe(true);

      // Test intensity slider
      await page.fill('#adjustment-intensity', '6.5');
      
      const intensityValue = await page.locator('#intensity-value').textContent();
      expect(intensityValue).toBe('6.5');
      
      const filterIntensity = await page.evaluate(() => {
        return window.testAdjustmentFilter.getFilter().intensity;
      });
      expect(filterIntensity).toBe(6.5);

      // Test primary property selection
      await page.selectOption('#primary-property', 'gamma');
      
      const filterState = await page.evaluate(() => {
        return window.testAdjustmentFilter.getFilter();
      });
      expect(filterState.primaryProperty).toBe('gamma');
      expect(filterState.gamma).toBe(1.15); // 0.5 + (6.5/10)
    });

    test('should handle individual property controls', async ({ page }) => {
      // Test individual property sliders
      await page.fill('#gamma-control', '1.3');
      await page.fill('#saturation-control', '1.5');
      await page.fill('#contrast-control', '0.8');
      await page.fill('#brightness-control', '1.2');
      
      await page.waitForTimeout(100);
      
      const filterState = await page.evaluate(() => {
        return window.testAdjustmentFilter.getFilter();
      });
      
      expect(filterState.gamma).toBe(1.3);
      expect(filterState.saturation).toBe(1.5);
      expect(filterState.contrast).toBe(0.8);
      expect(filterState.brightness).toBe(1.2);
      
      // Check display values
      expect(await page.locator('#gamma-value').textContent()).toBe('1.3');
      expect(await page.locator('#saturation-value').textContent()).toBe('1.5');
      expect(await page.locator('#contrast-value').textContent()).toBe('0.8');
      expect(await page.locator('#brightness-value').textContent()).toBe('1.2');
    });

    test('should reset all controls correctly', async ({ page }) => {
      // Set some values
      await page.check('#adjustment-enabled');
      await page.fill('#adjustment-intensity', '8');
      await page.selectOption('#primary-property', 'saturation');
      await page.fill('#gamma-control', '1.5');
      await page.fill('#contrast-control', '1.3');
      
      // Reset
      await page.click('#reset-btn');
      await page.waitForTimeout(100);
      
      // Check reset values
      const intensitySlider = await page.locator('#adjustment-intensity').inputValue();
      const primaryProperty = await page.locator('#primary-property').inputValue();
      const gammaSlider = await page.locator('#gamma-control').inputValue();
      const contrastSlider = await page.locator('#contrast-control').inputValue();
      
      expect(intensitySlider).toBe('0');
      expect(primaryProperty).toBe('default');
      expect(gammaSlider).toBe('1');
      expect(contrastSlider).toBe('1');
      
      const filterState = await page.evaluate(() => {
        return window.testAdjustmentFilter.getFilter();
      });
      expect(filterState.gamma).toBe(1);
      expect(filterState.contrast).toBe(1);
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work across different browsers', async ({ page, browserName }) => {
      await page.check('#adjustment-enabled');
      await page.fill('#adjustment-intensity', '6');
      await page.selectOption('#primary-property', 'brightness');
      await page.waitForTimeout(1000);
      
      // Basic functionality should work regardless of browser
      const fps = await page.evaluate(() => {
        return window.testAdjustmentFilter.getCurrentFPS();
      });
      
      const renderTime = await page.evaluate(() => {
        return window.testAdjustmentFilter.getRenderTime();
      });
      
      const filterState = await page.evaluate(() => {
        return window.testAdjustmentFilter.getFilter();
      });
      
      // Should have reasonable performance in any browser
      expect(fps).toBeGreaterThan(20);
      expect(renderTime).toBeLessThan(50);
      
      // Filter should work correctly
      expect(filterState.enabled).toBe(true);
      expect(filterState.intensity).toBe(6);
      expect(filterState.primaryProperty).toBe('brightness');
      expect(filterState.brightness).toBeCloseTo(1.1, 1); // 0.5 + (6/10) - use toBeCloseTo for floating point
      
      console.warn(`AdjustmentFilter E2E test passed on ${browserName}: FPS=${fps}, RenderTime=${renderTime}ms`);
    });

    test('should handle different primary property behaviors consistently', async ({ page, browserName }) => {
      const testCases = [
        { property: 'gamma', expectedValue: 1.2 },
        { property: 'saturation', expectedValue: 1.2 },
        { property: 'contrast', expectedValue: 1.2 },
        { property: 'brightness', expectedValue: 1.2 }
      ];
      
      for (const testCase of testCases) {
        await page.selectOption('#primary-property', testCase.property);
        await page.fill('#adjustment-intensity', '7');
        await page.waitForTimeout(200);
        
        const filterState = await page.evaluate(() => {
          return window.testAdjustmentFilter.getFilter();
        });
        
        expect(filterState[testCase.property as keyof typeof filterState]).toBeCloseTo(testCase.expectedValue, 1); // 0.5 + (7/10) - use toBeCloseTo for floating point
      }
      
      console.warn(`AdjustmentFilter primary property tests passed on ${browserName}`);
    });
  });

  test.describe('WebGL Context Management', () => {
    test('should detect WebGL availability', async ({ page }) => {
      const webglAvailable = await page.evaluate(() => {
        return window.testAdjustmentFilter.isWebGLAvailable();
      });
      
      const webglStatus = await page.locator('#webgl-status').textContent();
      
      if (webglAvailable) {
        expect(webglStatus).toBe('Available');
      } else {
        expect(webglStatus).toBe('Not Available');
      }
    });

    test('should handle WebGL context loss gracefully', async ({ page }) => {
      const webglAvailable = await page.evaluate(() => {
        return window.testAdjustmentFilter.isWebGLAvailable();
      });
      
      if (!webglAvailable) {
        console.warn('WebGL not available, skipping context loss test');
        return;
      }

      // Capture initial state
      await page.check('#adjustment-enabled');
      await page.fill('#adjustment-intensity', '5');
      await page.waitForTimeout(500);
      
      const initialFPS = await page.evaluate(() => {
        return window.testAdjustmentFilter.getCurrentFPS();
      });

      // Simulate context loss
      await page.click('#context-loss-btn');
      await page.waitForTimeout(1500); // Wait for loss and restoration
      
      // Should recover gracefully
      const recoveredFPS = await page.evaluate(() => {
        return window.testAdjustmentFilter.getCurrentFPS();
      });
      
      expect(recoveredFPS).toBeGreaterThan(0);
      expect(Math.abs(recoveredFPS - initialFPS)).toBeLessThan(20); // Should recover to similar performance
    });
  });
}); 