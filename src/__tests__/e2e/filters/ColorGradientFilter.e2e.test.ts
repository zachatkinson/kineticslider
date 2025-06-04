/**
 * ColorGradientFilter E2E Tests
 * 
 * Tests visual rendering and browser-specific behavior that requires a real DOM environment.
 * Focuses on scenarios that can't be validated in unit/integration tests.
 * 
 * @module ColorGradientFilterE2E
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Type declarations for the test environment
declare global {
  interface Window {
    testColorGradientFilter: {
      getFilter: () => {
        enabled: boolean;
        intensity: number;
        alpha: number;
        angle: number;
        maxColors: number;
        replace: boolean;
        gradientType: number;
        stops: Array<{ offset: number; color: number; alpha: number }>;
        renderTime: number;
      };
      getCanvas: () => HTMLCanvasElement;
      getWebGLContext: () => WebGLRenderingContext | null;
      setIntensity: (intensity: number) => void;
      setEnabled: (enabled: boolean) => void;
      setAngle: (angle: number) => void;
      setGradientType: (type: number) => void;
      getCurrentFPS: () => number;
      getRenderTime: () => number;
      captureCanvasData: () => ImageData;
      isWebGLAvailable: () => boolean;
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
 * Setup ColorGradientFilter E2E test environment
 *
 * @param page - Playwright page instance
 *
 * @returns Promise that resolves when setup is complete
 *
 */
async function setupColorGradientFilterTest(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ColorGradientFilter E2E Test</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        #container { width: 800px; height: 600px; border: 1px solid #ccc; }
        #controls { margin: 20px 0; }
        .control-group { margin: 10px 0; }
        .control-group label { display: inline-block; width: 120px; }
        .control-group input[type="range"] { width: 200px; }
        .control-group input[type="checkbox"] { margin-right: 10px; }
        .control-group select { width: 150px; }
        #metrics { margin-top: 20px; padding: 10px; background: #f0f0f0; }
        .metric { margin: 5px 0; }
      </style>
    </head>
    <body>
      <h1>ColorGradientFilter E2E Test Environment</h1>
      
      <div id="container">
        <canvas id="test-canvas" width="800" height="600"></canvas>
      </div>
      
      <div id="controls">
        <div class="control-group">
          <label>
            <input type="checkbox" id="gradient-enabled" checked> Enable Color Gradient Filter
          </label>
        </div>
        
        <div class="control-group">
          <label for="gradient-intensity">Intensity (0-10):</label>
          <input type="range" id="gradient-intensity" min="0" max="10" step="0.1" value="5">
          <span id="intensity-value">5.0</span>
        </div>
        
        <div class="control-group">
          <label for="gradient-alpha">Alpha:</label>
          <input type="range" id="gradient-alpha" min="0" max="1" step="0.01" value="0.8">
          <span id="alpha-value">0.80</span>
        </div>
        
        <div class="control-group">
          <label for="gradient-angle">Angle:</label>
          <input type="range" id="gradient-angle" min="0" max="360" step="1" value="90">
          <span id="angle-value">90</span>
        </div>
        
        <div class="control-group">
          <label for="gradient-type">Type:</label>
          <select id="gradient-type">
            <option value="0" selected>Linear</option>
            <option value="1">Radial</option>
            <option value="2">Conic</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="max-colors">Max Colors:</label>
          <input type="range" id="max-colors" min="0" max="10" step="1" value="0">
          <span id="max-colors-value">0</span>
        </div>
        
        <div class="control-group">
          <label>
            <input type="checkbox" id="replace-mode"> Replace Mode
          </label>
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
        // Mock PIXI.js-like behavior for E2E testing
        class ColorGradientFilterE2E {
          constructor(config) {
            this.enabled = config.enabled || false;
            this.intensity = config.intensity || 0;
            this.alpha = config.alpha || 0.8;
            this.angle = config.angle || 90;
            this.maxColors = config.maxColors || 0;
            this.replace = config.replace || false;
            this.gradientType = config.gradientType || 0; // 0=Linear, 1=Radial, 2=Conic
            this.stops = config.stops || [
              { offset: 0, color: 0xff0000, alpha: 1 },
              { offset: 0.5, color: 0x00ff00, alpha: 1 },
              { offset: 1, color: 0x0000ff, alpha: 1 }
            ];
            this.renderTime = 0;
          }
          
          updateIntensity(intensity) {
            this.intensity = intensity;
            // Intensity affects alpha scaling
            const baseAlpha = this.alpha;
            const scaledAlpha = Math.min(1, baseAlpha + (intensity * (1 - baseAlpha) * 0.1));
            this.currentAlpha = scaledAlpha;
          }
          
          setAngle(angle) {
            this.angle = angle;
          }
          
          setGradientType(type) {
            this.gradientType = type;
          }
          
          reset() {
            this.intensity = 0;
            this.currentAlpha = this.alpha;
          }
          
          render(ctx) {
            const startTime = performance.now();
            
            if (this.enabled && this.intensity > 0) {
              // Create gradient based on type
              let gradient;
              const centerX = 400;
              const centerY = 300;
              
              switch (this.gradientType) {
                case 1: // Radial
                  gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 200);
                  break;
                case 2: // Conic
                  gradient = ctx.createConicGradient(this.angle * Math.PI / 180, centerX, centerY);
                  break;
                default: // Linear
                  const angleRad = this.angle * Math.PI / 180;
                  const x1 = centerX - Math.cos(angleRad) * 300;
                  const y1 = centerY - Math.sin(angleRad) * 300;
                  const x2 = centerX + Math.cos(angleRad) * 300;
                  const y2 = centerY + Math.sin(angleRad) * 300;
                  gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                  break;
              }
              
              // Add color stops
              this.stops.forEach(stop => {
                const r = (stop.color >> 16) & 255;
                const g = (stop.color >> 8) & 255;
                const b = stop.color & 255;
                gradient.addColorStop(stop.offset, \`rgba(\${r}, \${g}, \${b}, \${stop.alpha})\`);
              });
              
              // Apply gradient with current alpha
              ctx.globalAlpha = this.currentAlpha || this.alpha;
              
              if (this.replace) {
                ctx.globalCompositeOperation = 'source-over';
              } else {
                ctx.globalCompositeOperation = 'multiply';
              }
              
              // Render gradient
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 800, 600);
              
              // Add some test shapes to see gradient effect
              ctx.globalCompositeOperation = 'source-over';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillRect(200, 200, 100, 100);
              ctx.fillRect(400, 300, 150, 80);
              
              ctx.globalAlpha = 1;
              
              // Add computational work to simulate gradient processing time
              const iterations = Math.floor(this.intensity * this.stops.length * 10);
              for (let i = 0; i < iterations; i++) {
                Math.sin(i * 0.01); // Lightweight computation
              }
            } else {
              // Render without gradient (faster)
              ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
              ctx.fillRect(100, 100, 600, 400);
              
              ctx.fillStyle = 'rgba(100, 100, 100, 0.9)';
              ctx.fillRect(200, 200, 100, 100);
              ctx.fillRect(400, 300, 150, 80);
            }
            
            this.renderTime = performance.now() - startTime;
          }
        }
        
        // Test environment setup
        const canvas = document.getElementById('test-canvas');
        const ctx = canvas.getContext('2d');
        const webglCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let filter = new ColorGradientFilterE2E({ 
          enabled: true, 
          intensity: 5, 
          alpha: 0.8,
          angle: 90,
          gradientType: 0,
          maxColors: 0,
          replace: false
        });
        let animationId = null;
        let frameCount = 0;
        let lastFpsUpdate = Date.now();
        
        // Initialize FPS display
        document.getElementById('fps').textContent = '60';
        
        // Performance monitoring
        function updateFPS() {
          frameCount++;
          const now = Date.now();
          
          if (now - lastFpsUpdate >= 1000) {
            const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
            document.getElementById('fps').textContent = Math.max(1, fps).toString(); // Ensure FPS is at least 1
            frameCount = 0;
            lastFpsUpdate = now;
          }
        }
        
        // Render loop
        function render() {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Render filter effect
          filter.render(ctx);
          
          // Update metrics
          updateFPS();
          document.getElementById('render-time').textContent = filter.renderTime.toFixed(2);
          document.getElementById('filter-status').textContent = filter.enabled ? 'Active' : 'Inactive';
          document.getElementById('webgl-status').textContent = webglCtx ? 'Available' : 'Not Available';
          
          animationId = requestAnimationFrame(render);
        }
        
        // Control event handlers
        document.getElementById('gradient-enabled').addEventListener('change', (e) => {
          filter.enabled = e.target.checked;
        });
        
        document.getElementById('gradient-intensity').addEventListener('input', (e) => {
          const intensity = parseFloat(e.target.value);
          filter.updateIntensity(intensity);
          document.getElementById('intensity-value').textContent = intensity.toFixed(1);
        });
        
        document.getElementById('gradient-alpha').addEventListener('input', (e) => {
          const alpha = parseFloat(e.target.value);
          filter.alpha = alpha;
          filter.updateIntensity(filter.intensity); // Recalculate with new alpha
          document.getElementById('alpha-value').textContent = alpha.toFixed(2);
        });
        
        document.getElementById('gradient-angle').addEventListener('input', (e) => {
          const angle = parseInt(e.target.value);
          filter.setAngle(angle);
          document.getElementById('angle-value').textContent = angle.toString();
        });
        
        document.getElementById('gradient-type').addEventListener('change', (e) => {
          const type = parseInt(e.target.value);
          filter.setGradientType(type);
        });
        
        document.getElementById('max-colors').addEventListener('input', (e) => {
          const maxColors = parseInt(e.target.value);
          filter.maxColors = maxColors;
          document.getElementById('max-colors-value').textContent = maxColors.toString();
        });
        
        document.getElementById('replace-mode').addEventListener('change', (e) => {
          filter.replace = e.target.checked;
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
          filter.reset();
          document.getElementById('gradient-intensity').value = '0';
          document.getElementById('intensity-value').textContent = '0.0';
        });
        
        document.getElementById('context-loss-btn').addEventListener('click', () => {
          if (webglCtx && webglCtx.getExtension('WEBGL_lose_context')) {
            webglCtx.getExtension('WEBGL_lose_context').loseContext();
          }
        });
        
        // Global test interface
        window.testColorGradientFilter = {
          getFilter: () => ({
            enabled: filter.enabled,
            intensity: filter.intensity,
            alpha: filter.currentAlpha || filter.alpha,
            angle: filter.angle,
            maxColors: filter.maxColors,
            replace: filter.replace,
            gradientType: filter.gradientType,
            stops: filter.stops,
            renderTime: filter.renderTime
          }),
          getCanvas: () => canvas,
          getWebGLContext: () => webglCtx,
          setIntensity: (intensity) => {
            filter.updateIntensity(intensity);
            document.getElementById('gradient-intensity').value = intensity.toString();
            document.getElementById('intensity-value').textContent = intensity.toFixed(1);
          },
          setEnabled: (enabled) => {
            filter.enabled = enabled;
            document.getElementById('gradient-enabled').checked = enabled;
          },
          setAngle: (angle) => {
            filter.setAngle(angle);
            document.getElementById('gradient-angle').value = angle.toString();
            document.getElementById('angle-value').textContent = angle.toString();
          },
          setGradientType: (type) => {
            filter.setGradientType(type);
            document.getElementById('gradient-type').value = type.toString();
          },
          getCurrentFPS: () => {
            const fpsText = document.getElementById('fps').textContent;
            return parseInt(fpsText) || 0;
          },
          getRenderTime: () => filter.renderTime,
          captureCanvasData: () => ctx.getImageData(0, 0, canvas.width, canvas.height),
          isWebGLAvailable: () => !!webglCtx
        };
        
        // Start rendering
        render();
      </script>
    </body>
    </html>
  `);

  // Wait for the page to be fully loaded
  await page.waitForFunction(() => window.testColorGradientFilter);
  
  // Wait a moment for the first render
  await page.waitForTimeout(100);
}

test.describe('ColorGradientFilter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupColorGradientFilterTest(page);
  });

  test('should render canvas with color gradient filter', async ({ page }) => {
    // Verify the canvas is present
    const canvas = await page.locator('#test-canvas');
    await expect(canvas).toBeVisible();
    
    // Verify filter is active by default
    const filterData = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterData.enabled).toBe(true);
    expect(filterData.intensity).toBe(5);
    expect(filterData.gradientType).toBe(0); // Linear
  });

  test('should update filter intensity through controls', async ({ page }) => {
    // Change intensity via slider
    await page.locator('#gradient-intensity').fill('8');
    
    // Verify the filter reflects the change
    const filterData = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterData.intensity).toBe(8);
    
    // Verify the display updates
    const intensityDisplay = await page.locator('#intensity-value').textContent();
    expect(intensityDisplay).toBe('8.0');
  });

  test('should toggle filter enable state', async ({ page }) => {
    // Disable the filter
    await page.locator('#gradient-enabled').uncheck();
    
    // Verify filter is disabled
    const filterDataDisabled = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterDataDisabled.enabled).toBe(false);
    
    // Re-enable the filter
    await page.locator('#gradient-enabled').check();
    
    // Verify filter is enabled
    const filterDataEnabled = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterDataEnabled.enabled).toBe(true);
  });

  test('should maintain performance within acceptable range', async ({ page }) => {
    // Wait for performance to stabilize
    await page.waitForTimeout(2000);
    
    // Get current FPS
    const fps = await page.evaluate(() => window.testColorGradientFilter.getCurrentFPS());
    
    // FPS should be reasonable (at least 15 FPS in test environment)
    expect(fps).toBeGreaterThanOrEqual(15);
    
    // Render time should be reasonable (under 50ms per frame)
    const renderTime = await page.evaluate(() => window.testColorGradientFilter.getRenderTime());
    expect(renderTime).toBeLessThan(50);
  });

  test('should handle angle parameter changes', async ({ page }) => {
    // Change angle setting
    await page.locator('#gradient-angle').fill('45');
    
    // Verify angle is updated
    const filterData = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterData.angle).toBe(45);
    
    // Verify display updates
    const angleDisplay = await page.locator('#angle-value').textContent();
    expect(angleDisplay).toBe('45');
  });

  test('should handle gradient type changes', async ({ page }) => {
    // Change to radial gradient
    await page.locator('#gradient-type').selectOption('1');
    
    // Verify gradient type is updated
    const filterData = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterData.gradientType).toBe(1);
    
    // Change to conic gradient
    await page.locator('#gradient-type').selectOption('2');
    
    const filterDataConic = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterDataConic.gradientType).toBe(2);
  });

  test('should handle alpha parameter changes', async ({ page }) => {
    // Change alpha setting
    await page.locator('#gradient-alpha').fill('0.6');
    
    // Verify display updates
    const alphaDisplay = await page.locator('#alpha-value').textContent();
    expect(alphaDisplay).toBe('0.60');
  });

  test('should handle replace mode toggle', async ({ page }) => {
    // Enable replace mode
    await page.locator('#replace-mode').check();
    
    // Verify setting is updated
    const filterDataEnabled = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterDataEnabled.replace).toBe(true);
    
    // Disable replace mode
    await page.locator('#replace-mode').uncheck();
    
    // Verify setting is updated
    const filterDataDisabled = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterDataDisabled.replace).toBe(false);
  });

  test('should reset filter to default state', async ({ page }) => {
    // Modify some settings first
    await page.locator('#gradient-intensity').fill('8');
    await page.locator('#gradient-angle').fill('180');
    
    // Reset the filter
    await page.locator('#reset-btn').click();
    
    // Verify filter is reset
    const filterData = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterData.intensity).toBe(0);
    
    // Verify UI is reset
    const intensityDisplay = await page.locator('#intensity-value').textContent();
    expect(intensityDisplay).toBe('0.0');
  });

  test('should handle WebGL context availability', async ({ page }) => {
    // Check WebGL status
    const isWebGLAvailable = await page.evaluate(() => window.testColorGradientFilter.isWebGLAvailable());
    
    // WebGL status should be displayed
    const webglStatus = await page.locator('#webgl-status').textContent();
    expect(webglStatus).toMatch(/Available|Not Available/);
    
    // If WebGL is available, the status should match
    if (isWebGLAvailable) {
      expect(webglStatus).toBe('Available');
    } else {
      expect(webglStatus).toBe('Not Available');
    }
  });

  test('should capture and analyze canvas data', async ({ page }) => {
    // Ensure filter is active
    await page.evaluate(() => window.testColorGradientFilter.setEnabled(true));
    await page.evaluate(() => window.testColorGradientFilter.setIntensity(5));
    
    // Wait for render
    await page.waitForTimeout(500);
    
    // Capture canvas data
    const imageData = await page.evaluate(() => {
      const data = window.testColorGradientFilter.captureCanvasData();
      return {
        data: Array.from(data.data).slice(0, 100), // First 100 pixels for analysis
        width: data.width,
        height: data.height
      };
    });
    
    // Verify canvas has expected dimensions
    expect(imageData.width).toBe(800);
    expect(imageData.height).toBe(600);
    
    // Verify canvas has non-zero data (indicating rendering occurred)
    const hasNonZeroPixels = imageData.data.some(value => value > 0);
    expect(hasNonZeroPixels).toBe(true);
  });

  test('should handle maxColors parameter changes', async ({ page }) => {
    // Change maxColors setting
    await page.locator('#max-colors').fill('5');
    
    // Verify maxColors is updated
    const filterData = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    expect(filterData.maxColors).toBe(5);
    
    // Verify display updates
    const maxColorsDisplay = await page.locator('#max-colors-value').textContent();
    expect(maxColorsDisplay).toBe('5');
  });

  test('should handle intensity scaling with alpha', async ({ page }) => {
    // Set base alpha to 0.5
    await page.locator('#gradient-alpha').fill('0.5');
    
    // Set intensity to 5
    await page.evaluate(() => window.testColorGradientFilter.setIntensity(5));
    
    // Wait for update
    await page.waitForTimeout(100);
    
    const filterData = await page.evaluate(() => window.testColorGradientFilter.getFilter());
    
    // With intensity 5 and base alpha 0.5
    // Expected: 0.5 + (5 * (1 - 0.5) * 0.1) = 0.5 + (5 * 0.05) = 0.75
    expect(Math.abs(filterData.alpha - 0.75)).toBeLessThan(0.1);
  });
}); 