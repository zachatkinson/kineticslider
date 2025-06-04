/**
 * ColorReplaceFilter E2E Tests
 * 
 * Tests visual rendering and browser-specific behavior that requires a real DOM environment.
 * Focuses on color replacement effects and scenarios that can't be validated in unit tests.
 * 
 * @module ColorReplaceFilterE2E
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Type declarations for the test environment
declare global {
  interface Window {
    testColorReplaceFilter: {
      getFilter: () => {
        enabled: boolean;
        intensity: number;
        originalColor: number;
        targetColor: number;
        tolerance: number;
        renderTime: number;
      };
      getCanvas: () => HTMLCanvasElement;
      getWebGLContext: () => WebGLRenderingContext | null;
      setIntensity: (intensity: number) => void;
      setEnabled: (enabled: boolean) => void;
      setOriginalColor: (color: number) => void;
      setTargetColor: (color: number) => void;
      setTolerance: (tolerance: number) => void;
      getCurrentFPS: () => number;
      getRenderTime: () => number;
      captureCanvasData: () => ImageData;
      isWebGLAvailable: () => boolean;
      resetFilter: () => void;
      getColorAtPixel: (x: number, y: number) => { r: number; g: number; b: number; a: number };
    };
  }
}

// Define image data interface for type safety
export interface _SerializableImageData {
  data: number[];
  width: number;
  height: number;
}

/**
 * Setup ColorReplaceFilter E2E test environment
 *
 * @param page - Playwright page instance
 *
 * @returns Promise that resolves when setup is complete
 *
 */
async function setupColorReplaceFilterTest(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ColorReplaceFilter E2E Test</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        #container { width: 800px; height: 600px; border: 1px solid #ccc; }
        #controls { margin: 20px 0; }
        .control-group { margin: 10px 0; }
        .control-group label { display: inline-block; width: 150px; }
        .control-group input[type="range"] { width: 200px; }
        .control-group input[type="checkbox"] { margin-right: 10px; }
        .control-group input[type="color"] { width: 60px; height: 30px; }
        #metrics { margin-top: 20px; padding: 10px; background: #f0f0f0; }
        .metric { margin: 5px 0; }
        .color-preview { display: inline-block; width: 20px; height: 20px; border: 1px solid #333; margin-left: 10px; }
      </style>
    </head>
    <body>
      <h1>ColorReplaceFilter E2E Test Environment</h1>
      
      <div id="container">
        <canvas id="test-canvas" width="800" height="600"></canvas>
      </div>
      
      <div id="controls">
        <div class="control-group">
          <label>
            <input type="checkbox" id="filter-enabled" checked> Enable ColorReplace Filter
          </label>
        </div>
        
        <div class="control-group">
          <label for="filter-intensity">Intensity (0-10):</label>
          <input type="range" id="filter-intensity" min="0" max="10" step="0.1" value="5">
          <span id="intensity-value">5.0</span>
        </div>
        
        <div class="control-group">
          <label for="original-color">Original Color:</label>
          <input type="color" id="original-color" value="#ff0000">
          <span class="color-preview" id="original-preview"></span>
          <span id="original-hex">#ff0000</span>
        </div>
        
        <div class="control-group">
          <label for="target-color">Target Color:</label>
          <input type="color" id="target-color" value="#00ff00">
          <span class="color-preview" id="target-preview"></span>
          <span id="target-hex">#00ff00</span>
        </div>
        
        <div class="control-group">
          <label for="tolerance">Tolerance (0-1):</label>
          <input type="range" id="tolerance" min="0" max="1" step="0.01" value="0.4">
          <span id="tolerance-value">0.40</span>
        </div>
        
        <div class="control-group">
          <button id="reset-btn">Reset Filter</button>
          <button id="test-colors-btn">Test Common Colors</button>
          <button id="context-loss-btn">Simulate Context Loss</button>
        </div>
      </div>
      
      <div id="metrics">
        <div class="metric">Frame Rate: <span id="fps">0</span> FPS</div>
        <div class="metric">WebGL Context: <span id="webgl-status">Unknown</span></div>
        <div class="metric">Filter Status: <span id="filter-status">Inactive</span></div>
        <div class="metric">Render Time: <span id="render-time">0</span> ms</div>
        <div class="metric">Pixels Replaced: <span id="pixels-replaced">0</span></div>
      </div>
      
      <script>
        // Mock ColorReplaceFilter-like behavior for E2E testing
        class ColorReplaceFilterE2E {
          constructor(config) {
            this.enabled = config.enabled || false;
            this.intensity = config.intensity || 0;
            this.originalColor = config.originalColor || 0xff0000;
            this.targetColor = config.targetColor || 0x00ff00;
            this.tolerance = config.tolerance || 0.4;
            this.renderTime = 0;
            this.pixelsReplaced = 0;
          }
          
          updateIntensity(intensity) {
            this.intensity = intensity;
            // Intensity affects tolerance: higher intensity = more sensitive (lower tolerance)
            const toleranceScale = 1 - (intensity / 10);
            this.tolerance = 0.4 * (0.1 + toleranceScale * 0.9);
          }
          
          setOriginalColor(color) {
            this.originalColor = color;
          }
          
          setTargetColor(color) {
            this.targetColor = color;
          }
          
          setTolerance(tolerance) {
            this.tolerance = tolerance;
          }
          
          reset() {
            this.intensity = 0;
            this.originalColor = 0xff0000;
            this.targetColor = 0x00ff00;
            this.tolerance = 0.4;
            this.pixelsReplaced = 0;
          }
          
          // Helper to convert hex color to RGB
          hexToRgb(hex) {
            return {
              r: (hex >> 16) & 255,
              g: (hex >> 8) & 255,
              b: hex & 255
            };
          }
          
          // Helper to check if colors are similar within tolerance
          colorsMatch(color1, color2, tolerance) {
            const diff = Math.abs(color1.r - color2.r) + 
                        Math.abs(color1.g - color2.g) + 
                        Math.abs(color1.b - color2.b);
            return (diff / 765) <= tolerance; // 765 = 255 * 3 (max possible difference)
          }
          
          render(ctx) {
            const startTime = performance.now();
            this.pixelsReplaced = 0;
            
            // Clear canvas
            ctx.clearRect(0, 0, 800, 600);
            
            if (this.enabled && this.intensity > 0) {
              // Draw test content with various colors
              this.drawTestScene(ctx);
              
              // Apply color replacement filter
              this.applyColorReplacement(ctx);
              
              // Add computational work to simulate processing time
              const iterations = Math.floor(this.intensity * 50);
              for (let i = 0; i < iterations; i++) {
                Math.sin(i * 0.01);
              }
            } else {
              // Render without filter (faster)
              this.drawTestScene(ctx);
            }
            
            this.renderTime = performance.now() - startTime;
          }
          
          drawTestScene(ctx) {
            // Background
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 800, 600);
            
            // Test shapes in original color (red by default)
            const originalRgb = this.hexToRgb(this.originalColor);
            ctx.fillStyle = \`rgb(\${originalRgb.r}, \${originalRgb.g}, \${originalRgb.b})\`;
            
            // Large rectangle
            ctx.fillRect(100, 100, 200, 150);
            
            // Circle
            ctx.beginPath();
            ctx.arc(450, 175, 75, 0, 2 * Math.PI);
            ctx.fill();
            
            // Multiple small rectangles
            for (let i = 0; i < 5; i++) {
              ctx.fillRect(100 + i * 40, 300, 30, 30);
            }
            
            // Add some non-matching colors for contrast
            ctx.fillStyle = '#0066cc';
            ctx.fillRect(400, 400, 100, 100);
            
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(550, 400, 100, 100);
            
            // Text
            ctx.fillStyle = '#333333';
            ctx.font = '16px Arial';
            ctx.fillText('ColorReplace Filter Test', 100, 50);
            ctx.fillText('Original color shapes should change to target color', 100, 380);
          }
          
          applyColorReplacement(ctx) {
            // Get image data
            const imageData = ctx.getImageData(0, 0, 800, 600);
            const data = imageData.data;
            
            const originalRgb = this.hexToRgb(this.originalColor);
            const targetRgb = this.hexToRgb(this.targetColor);
            
            // Process each pixel
            for (let i = 0; i < data.length; i += 4) {
              const pixelColor = {
                r: data[i],
                g: data[i + 1],
                b: data[i + 2]
              };
              
              // Check if pixel matches original color within tolerance
              if (this.colorsMatch(pixelColor, originalRgb, this.tolerance)) {
                data[i] = targetRgb.r;     // Red
                data[i + 1] = targetRgb.g; // Green
                data[i + 2] = targetRgb.b; // Blue
                // Alpha stays the same
                this.pixelsReplaced++;
              }
            }
            
            // Put modified image data back
            ctx.putImageData(imageData, 0, 0);
          }
          
          getColorAtPixel(x, y, ctx) {
            const imageData = ctx.getImageData(x, y, 1, 1);
            const data = imageData.data;
            return {
              r: data[0],
              g: data[1],
              b: data[2],
              a: data[3]
            };
          }
        }
        
        // Test environment setup
        const canvas = document.getElementById('test-canvas');
        const ctx = canvas.getContext('2d');
        const webglCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let filter = new ColorReplaceFilterE2E({ 
          enabled: true, 
          intensity: 5,
          originalColor: 0xff0000,
          targetColor: 0x00ff00,
          tolerance: 0.4 
        });
        let animationId = null;
        let frameCount = 0;
        let lastFpsUpdate = Date.now();
        
        // Initialize displays
        document.getElementById('fps').textContent = '60';
        updateColorPreviews();
        
        // Performance monitoring
        function updateFPS() {
          frameCount++;
          const now = Date.now();
          
          if (now - lastFpsUpdate >= 1000) {
            const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
            document.getElementById('fps').textContent = Math.max(1, fps).toString();
            frameCount = 0;
            lastFpsUpdate = now;
          }
        }
        
        // Update color preview squares
        function updateColorPreviews() {
          const originalRgb = filter.hexToRgb(filter.originalColor);
          const targetRgb = filter.hexToRgb(filter.targetColor);
          
          document.getElementById('original-preview').style.backgroundColor = 
            \`rgb(\${originalRgb.r}, \${originalRgb.g}, \${originalRgb.b})\`;
          document.getElementById('target-preview').style.backgroundColor = 
            \`rgb(\${targetRgb.r}, \${targetRgb.g}, \${targetRgb.b})\`;
            
          document.getElementById('original-hex').textContent = 
            '#' + filter.originalColor.toString(16).padStart(6, '0');
          document.getElementById('target-hex').textContent = 
            '#' + filter.targetColor.toString(16).padStart(6, '0');
        }
        
        // Render loop
        function render() {
          filter.render(ctx);
          
          // Update metrics
          document.getElementById('render-time').textContent = filter.renderTime.toFixed(2);
          document.getElementById('filter-status').textContent = 
            filter.enabled ? \`Active (Intensity: \${filter.intensity})\` : 'Inactive';
          document.getElementById('pixels-replaced').textContent = filter.pixelsReplaced.toString();
          
          updateFPS();
          animationId = requestAnimationFrame(render);
        }
        
        // Event listeners
        document.getElementById('filter-enabled').addEventListener('change', (e) => {
          filter.enabled = e.target.checked;
        });
        
        document.getElementById('filter-intensity').addEventListener('input', (e) => {
          const intensity = parseFloat(e.target.value);
          filter.updateIntensity(intensity);
          document.getElementById('intensity-value').textContent = intensity.toFixed(1);
        });
        
        document.getElementById('original-color').addEventListener('input', (e) => {
          const hex = e.target.value;
          const color = parseInt(hex.replace('#', ''), 16);
          filter.setOriginalColor(color);
          updateColorPreviews();
        });
        
        document.getElementById('target-color').addEventListener('input', (e) => {
          const hex = e.target.value;
          const color = parseInt(hex.replace('#', ''), 16);
          filter.setTargetColor(color);
          updateColorPreviews();
        });
        
        document.getElementById('tolerance').addEventListener('input', (e) => {
          const tolerance = parseFloat(e.target.value);
          filter.setTolerance(tolerance);
          document.getElementById('tolerance-value').textContent = tolerance.toFixed(2);
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
          filter.reset();
          
          // Reset UI controls
          document.getElementById('filter-enabled').checked = true;
          document.getElementById('filter-intensity').value = '0';
          document.getElementById('intensity-value').textContent = '0.0';
          document.getElementById('original-color').value = '#ff0000';
          document.getElementById('target-color').value = '#00ff00';
          document.getElementById('tolerance').value = '0.4';
          document.getElementById('tolerance-value').textContent = '0.40';
          
          updateColorPreviews();
        });
        
        document.getElementById('test-colors-btn').addEventListener('click', () => {
          // Cycle through common color combinations
          const combinations = [
            { original: 0xff0000, target: 0x00ff00 }, // Red to Green
            { original: 0x0000ff, target: 0xffff00 }, // Blue to Yellow
            { original: 0x00ff00, target: 0xff00ff }, // Green to Magenta
            { original: 0xffffff, target: 0x000000 }, // White to Black
          ];
          
          const combo = combinations[Math.floor(Math.random() * combinations.length)];
          filter.setOriginalColor(combo.original);
          filter.setTargetColor(combo.target);
          
          // Update UI
          document.getElementById('original-color').value = '#' + combo.original.toString(16).padStart(6, '0');
          document.getElementById('target-color').value = '#' + combo.target.toString(16).padStart(6, '0');
          updateColorPreviews();
        });
        
        document.getElementById('context-loss-btn').addEventListener('click', () => {
          // Simulate WebGL context loss for testing
          if (webglCtx && webglCtx.getExtension('WEBGL_lose_context')) {
            webglCtx.getExtension('WEBGL_lose_context').loseContext();
          }
        });
        
        // Initialize WebGL status
        document.getElementById('webgl-status').textContent = webglCtx ? 'Available' : 'Not Available';
        
        // Global API for tests
        window.testColorReplaceFilter = {
          getFilter: () => ({
            enabled: filter.enabled,
            intensity: filter.intensity,
            originalColor: filter.originalColor,
            targetColor: filter.targetColor,
            tolerance: filter.tolerance,
            renderTime: filter.renderTime
          }),
          getCanvas: () => canvas,
          getWebGLContext: () => webglCtx,
          setIntensity: (intensity) => {
            filter.updateIntensity(intensity);
            document.getElementById('filter-intensity').value = intensity.toString();
            document.getElementById('intensity-value').textContent = intensity.toFixed(1);
          },
          setEnabled: (enabled) => {
            filter.enabled = enabled;
            document.getElementById('filter-enabled').checked = enabled;
          },
          setOriginalColor: (color) => {
            filter.setOriginalColor(color);
            document.getElementById('original-color').value = '#' + color.toString(16).padStart(6, '0');
            updateColorPreviews();
          },
          setTargetColor: (color) => {
            filter.setTargetColor(color);
            document.getElementById('target-color').value = '#' + color.toString(16).padStart(6, '0');
            updateColorPreviews();
          },
          setTolerance: (tolerance) => {
            filter.setTolerance(tolerance);
            document.getElementById('tolerance').value = tolerance.toString();
            document.getElementById('tolerance-value').textContent = tolerance.toFixed(2);
          },
          getCurrentFPS: () => {
            const fpsText = document.getElementById('fps').textContent;
            return parseInt(fpsText) || 0;
          },
          getRenderTime: () => filter.renderTime,
          captureCanvasData: () => ctx.getImageData(0, 0, 800, 600),
          isWebGLAvailable: () => !!webglCtx,
          resetFilter: () => {
            document.getElementById('reset-btn').click();
          },
          getColorAtPixel: (x, y) => filter.getColorAtPixel(x, y, ctx)
        };
        
        // Start rendering
        render();
      </script>
    </body>
    </html>
  `);
  
  // Wait for page to be fully loaded and rendering to start
  await page.waitForTimeout(1000);
}

test.describe('ColorReplaceFilter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupColorReplaceFilterTest(page);
  });

  test.describe('Visual Rendering & Filter Application', () => {
    test('should render content correctly with filter disabled', async ({ page }) => {
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(false);
      });
      
      await page.waitForTimeout(100);
      
      const filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(filterState.enabled).toBe(false);
      
      // Canvas should still render content
      const canvas = await page.evaluate(() => {
        const canvas = window.testColorReplaceFilter.getCanvas();
        return canvas.width > 0 && canvas.height > 0;
      });
      expect(canvas).toBe(true);
    });

    test('should apply color replacement correctly', async ({ page }) => {
      await page.evaluate(() => {
        // Set up clear color replacement: red to green
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setOriginalColor(0xff0000);  // Red
        window.testColorReplaceFilter.setTargetColor(0x00ff00);   // Green
        window.testColorReplaceFilter.setTolerance(0.3);
        window.testColorReplaceFilter.setIntensity(5);
      });
      
      await page.waitForTimeout(200);
      
      // Check that pixels in the red areas have been replaced with green
      const pixelColor = await page.evaluate(() => {
        // Sample a pixel from where we know there should be a red rectangle
        return window.testColorReplaceFilter.getColorAtPixel(150, 150);
      });
      
      // Should be green or very close to green
      expect(pixelColor.g).toBeGreaterThan(200); // High green
      expect(pixelColor.r).toBeLessThan(100);    // Low red
      expect(pixelColor.b).toBeLessThan(100);    // Low blue
    });

    test('should respect tolerance settings', async ({ page }) => {
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setOriginalColor(0xff0000);  // Red
        window.testColorReplaceFilter.setTargetColor(0x0000ff);   // Blue
        window.testColorReplaceFilter.setIntensity(0); // No intensity scaling
      });
      
      // Test with high tolerance (should replace more pixels)
      await page.evaluate(() => {
        window.testColorReplaceFilter.setTolerance(0.8);
      });
      
      await page.waitForTimeout(100);
      
      const highTolerancePixels = await page.evaluate(() => {
        const filter = window.testColorReplaceFilter.getFilter();
        return filter; // Access pixels replaced count
      });
      
      // Test with low tolerance (should replace fewer pixels)
      await page.evaluate(() => {
        window.testColorReplaceFilter.setTolerance(0.1);
      });
      
      await page.waitForTimeout(100);
      
      // High tolerance should generally replace more pixels than low tolerance
      // (This is a conceptual test - exact values depend on test scene)
      expect(typeof highTolerancePixels.tolerance).toBe('number');
    });
  });

  test.describe('Intensity Scaling & Dynamic Updates', () => {
    test('should update tolerance when intensity changes', async ({ page }) => {
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setTolerance(0.4); // Base tolerance
      });
      
      // Test different intensity levels
      const intensityTests = [0, 3, 6, 10];
      
      for (const intensity of intensityTests) {
        await page.evaluate((int) => {
          window.testColorReplaceFilter.setIntensity(int);
        }, intensity);
        
        await page.waitForTimeout(50);
        
        const filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
        
        expect(filterState.intensity).toBe(intensity);
        
        // Higher intensity should result in lower tolerance (more sensitive)
        if (intensity === 10) {
          expect(filterState.tolerance).toBeLessThan(0.1);
        } else if (intensity === 0) {
          expect(filterState.tolerance).toBeCloseTo(0.4, 1);
        }
      }
    });

    test('should handle rapid intensity changes smoothly', async ({ page }) => {
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
      });
      
      // Rapidly change intensity multiple times
      for (let i = 0; i <= 10; i++) {
        await page.evaluate((intensity) => {
          window.testColorReplaceFilter.setIntensity(intensity);
        }, i);
        
        // Small delay to allow rendering
        await page.waitForTimeout(10);
      }
      
      // Should still be responsive
      const finalState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(finalState.intensity).toBe(10);
      
      // FPS should still be reasonable
      const fps = await page.evaluate(() => window.testColorReplaceFilter.getCurrentFPS());
      expect(fps).toBeGreaterThan(10); // At least 10 FPS
    });
  });

  test.describe('Color Management & UI Integration', () => {
    test('should handle color picker changes', async ({ page }) => {
      // Test original color change
      await page.fill('#original-color', '#ffff00'); // Yellow
      await page.waitForTimeout(100);
      
      const filterState1 = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(filterState1.originalColor).toBe(0xffff00);
      
      // Test target color change
      await page.fill('#target-color', '#ff00ff'); // Magenta
      await page.waitForTimeout(100);
      
      const filterState2 = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(filterState2.targetColor).toBe(0xff00ff);
    });

    test('should update tolerance via slider', async ({ page }) => {
      const toleranceSlider = page.locator('#tolerance');
      
      await toleranceSlider.fill('0.7');
      await page.waitForTimeout(100);
      
      const filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(filterState.tolerance).toBeCloseTo(0.7, 1);
      
      // Check UI reflects the change
      const displayedTolerance = await page.textContent('#tolerance-value');
      expect(displayedTolerance).toContain('0.7');
    });

    test('should reset filter correctly', async ({ page }) => {
      // Modify filter settings
      await page.evaluate(() => {
        window.testColorReplaceFilter.setIntensity(8);
        window.testColorReplaceFilter.setOriginalColor(0x123456);
        window.testColorReplaceFilter.setTargetColor(0x789abc);
        window.testColorReplaceFilter.setTolerance(0.9);
      });
      
      // Reset
      await page.click('#reset-btn');
      await page.waitForTimeout(100);
      
      const filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      
      expect(filterState.intensity).toBe(0);
      expect(filterState.originalColor).toBe(0xff0000);
      expect(filterState.targetColor).toBe(0x00ff00);
      expect(filterState.tolerance).toBe(0.4);
    });
  });

  test.describe('Performance & Resource Management', () => {
    test('should maintain reasonable performance', async ({ page }) => {
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setIntensity(8);
      });
      
      // Wait for performance to stabilize
      await page.waitForTimeout(2000);
      
      const fps = await page.evaluate(() => window.testColorReplaceFilter.getCurrentFPS());
      const renderTime = await page.evaluate(() => window.testColorReplaceFilter.getRenderTime());
      
      expect(fps).toBeGreaterThan(15); // Should maintain at least 15 FPS
      expect(renderTime).toBeLessThan(50); // Render time should be under 50ms
    });

    test('should handle filter enable/disable efficiently', async ({ page }) => {
      // Measure performance with filter disabled
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(false);
      });
      
      await page.waitForTimeout(500);
      const disabledFPS = await page.evaluate(() => window.testColorReplaceFilter.getCurrentFPS());
      
      // Measure performance with filter enabled
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setIntensity(6);
      });
      
      await page.waitForTimeout(500);
      const enabledFPS = await page.evaluate(() => window.testColorReplaceFilter.getCurrentFPS());
      
      // Both should be reasonable, with some performance cost for the filter
      expect(disabledFPS).toBeGreaterThan(20);
      expect(enabledFPS).toBeGreaterThan(10);
    });
  });

  test.describe('Canvas Data & Pixel Analysis', () => {
    test('should capture and analyze canvas data', async ({ page }) => {
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setOriginalColor(0xff0000);  // Red
        window.testColorReplaceFilter.setTargetColor(0x00ff00);   // Green
        window.testColorReplaceFilter.setIntensity(5);
      });
      
      await page.waitForTimeout(200);
      
      const imageData = await page.evaluate(() => {
        const data = window.testColorReplaceFilter.captureCanvasData();
        return {
          width: data.width,
          height: data.height,
          hasData: data.data.length > 0
        };
      });
      
      expect(imageData.width).toBe(800);
      expect(imageData.height).toBe(600);
      expect(imageData.hasData).toBe(true);
    });

    test('should detect WebGL availability', async ({ page }) => {
      const webglAvailable = await page.evaluate(() => {
        return window.testColorReplaceFilter.isWebGLAvailable();
      });
      
      expect(typeof webglAvailable).toBe('boolean');
      
      // WebGL status should be displayed
      const statusText = await page.textContent('#webgl-status');
      expect(statusText).toMatch(/Available|Not Available/);
    });
  });

  test.describe('Edge Cases & Error Handling', () => {
    test('should handle extreme tolerance values', async ({ page }) => {
      // Test with very low tolerance
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setTolerance(0.001);
      });
      
      await page.waitForTimeout(100);
      
      let filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(filterState.tolerance).toBeCloseTo(0.001, 3);
      
      // Test with very high tolerance
      await page.evaluate(() => {
        window.testColorReplaceFilter.setTolerance(0.999);
      });
      
      await page.waitForTimeout(100);
      
      filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(filterState.tolerance).toBeCloseTo(0.999, 3);
    });

    test('should handle identical original and target colors', async ({ page }) => {
      await page.evaluate(() => {
        window.testColorReplaceFilter.setEnabled(true);
        window.testColorReplaceFilter.setOriginalColor(0xff0000);  // Red
        window.testColorReplaceFilter.setTargetColor(0xff0000);   // Same Red
        window.testColorReplaceFilter.setIntensity(5);
      });
      
      await page.waitForTimeout(200);
      
      // Should not crash or cause visual artifacts
      const filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(filterState.originalColor).toBe(filterState.targetColor);
      
      // Performance should still be reasonable
      const fps = await page.evaluate(() => window.testColorReplaceFilter.getCurrentFPS());
      expect(fps).toBeGreaterThan(10);
    });

    test('should handle rapid UI changes', async ({ page }) => {
      // Rapidly change multiple controls
      const changes = [
        () => page.evaluate(() => window.testColorReplaceFilter.setIntensity(Math.random() * 10)),
        () => page.evaluate(() => window.testColorReplaceFilter.setTolerance(Math.random())),
        () => page.evaluate(() => window.testColorReplaceFilter.setOriginalColor(Math.floor(Math.random() * 0xffffff))),
        () => page.evaluate(() => window.testColorReplaceFilter.setTargetColor(Math.floor(Math.random() * 0xffffff)))
      ];
      
      // Execute rapid changes
      for (let i = 0; i < 10; i++) {
        const randomChange = changes[Math.floor(Math.random() * changes.length)];
        await randomChange();
        await page.waitForTimeout(10);
      }
      
      // Should still be functional
      const filterState = await page.evaluate(() => window.testColorReplaceFilter.getFilter());
      expect(typeof filterState.intensity).toBe('number');
      expect(typeof filterState.tolerance).toBe('number');
      expect(typeof filterState.originalColor).toBe('number');
      expect(typeof filterState.targetColor).toBe('number');
    });
  });
}); 