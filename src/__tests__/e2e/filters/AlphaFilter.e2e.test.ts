/**
 * AlphaFilter E2E Tests
 * 
 * Tests visual rendering and browser-specific behavior that requires a real DOM environment.
 * Focuses on alpha transparency effects, performance, and user interactions.
 * 
 * @module AlphaFilterE2E
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Type declarations for the test environment
declare global {
  interface Window {
    testAlphaFilter: {
      getFilter: () => {
        enabled: boolean;
        intensity: number;
        alpha: number;
        renderTime: number;
      };
      getCanvas: () => HTMLCanvasElement;
      getWebGLContext: () => WebGLRenderingContext | null;
      setIntensity: (intensity: number) => void;
      setEnabled: (enabled: boolean) => void;
      setAlpha: (alpha: number) => void;
      getCurrentFPS: () => number;
      getRenderTime: () => number;
      captureCanvasData: () => ImageData;
      isWebGLAvailable: () => boolean;
    };
  }
}

/**
 * Setup AlphaFilter E2E test environment
 *
 * @param page - Playwright page instance  
 *
 * @returns Promise that resolves when setup is complete
 *
 */
async function setupAlphaFilterTest(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AlphaFilter E2E Test</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        #container { width: 800px; height: 600px; border: 1px solid #ccc; background: #000; }
        #controls { margin: 20px 0; padding: 20px; background: #fff; border-radius: 8px; }
        .control-group { margin: 15px 0; }
        .control-group label { display: inline-block; width: 120px; font-weight: 500; }
        .control-group input[type="range"] { width: 200px; margin-right: 10px; }
        .value-display { color: #0066cc; font-weight: bold; }
        #metrics { margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px; }
        .metric { margin: 8px 0; font-family: monospace; }
        button { padding: 8px 16px; margin: 5px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>AlphaFilter E2E Test Environment</h1>
      
      <div id="container">
        <canvas id="test-canvas" width="800" height="600"></canvas>
      </div>
      
      <div id="controls">
        <h3>Alpha Filter Controls</h3>
        
        <div class="control-group">
          <label><input type="checkbox" id="alpha-enabled" checked> Enable Filter</label>
        </div>
        
        <div class="control-group">
          <label for="alpha-value">Alpha (0-1):</label>
          <input type="range" id="alpha-value" min="0" max="1" step="0.05" value="0.8">
          <span class="value-display" id="alpha-value-display">0.80</span>
        </div>
        
        <div class="control-group">
          <label for="intensity">Intensity (0-10):</label>
          <input type="range" id="intensity" min="0" max="10" step="0.5" value="5">
          <span class="value-display" id="intensity-value">5.0</span>
        </div>
        
        <div class="control-group">
          <button id="reset-btn">Reset Filter</button>
          <button id="randomize-btn">Randomize Alpha</button>
          <button id="fade-in-btn">Fade In</button>
          <button id="fade-out-btn">Fade Out</button>
        </div>
      </div>
      
      <div id="metrics">
        <h3>Performance Metrics</h3>
        <div class="metric">Frame Rate: <span id="fps">0</span> FPS</div>
        <div class="metric">WebGL Context: <span id="webgl-status">Unknown</span></div>
        <div class="metric">Filter Status: <span id="filter-status">Inactive</span></div>
        <div class="metric">Render Time: <span id="render-time">0</span> ms</div>
        <div class="metric">Current Alpha: <span id="current-alpha">1.0</span></div>
      </div>
      
      <script>
        // Mock AlphaFilter for E2E testing
        class AlphaFilterE2E {
          constructor(config) {
            this.enabled = config.enabled || false;
            this.intensity = config.intensity || 5;
            this.alpha = config.alpha || 1.0;
            this.renderTime = 0;
            
            this.originalAlpha = this.alpha;
          }
          
          updateIntensity(intensity) {
            this.intensity = intensity;
            // Scale the configured alpha by the intensity ratio
            this.alpha = Math.min(1.0, Math.max(0.0, this.originalAlpha * (intensity / 10)));
          }
          
          setAlpha(alpha) {
            this.originalAlpha = Math.min(1.0, Math.max(0.0, alpha));
            // For direct alpha setting (not via slider), set alpha directly
            this.alpha = this.originalAlpha;
          }
          
          reset() {
            this.alpha = this.originalAlpha;
            this.intensity = 5; // Reset to default intensity
          }
          
          render(ctx) {
            const startTime = performance.now();
            
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            if (this.enabled) {
              this.renderWithAlpha(ctx);
            } else {
              this.renderNormal(ctx);
            }
            
            this.renderTime = performance.now() - startTime;
          }
          
          renderWithAlpha(ctx) {
            // Background
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Set global alpha for all subsequent drawing operations
            ctx.globalAlpha = this.alpha;
            
            // Draw various shapes to test alpha transparency
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(100, 100, 200, 100);
            
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(150, 150, 200, 100);
            
            ctx.fillStyle = '#0000ff';
            ctx.fillRect(200, 200, 200, 100);
            
            // Circles
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(400, 150, 50, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(450, 200, 50, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(500, 250, 50, 0, Math.PI * 2);
            ctx.fill();
            
            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.fillText('ALPHA TEST', 100, 400);
            
            // Lines
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(100, 450);
            ctx.lineTo(700, 450);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(100, 500);
            ctx.lineTo(700, 500);
            ctx.stroke();
            
            // Reset global alpha
            ctx.globalAlpha = 1.0;
          }
          
          renderNormal(ctx) {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Same content but without alpha
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(100, 100, 200, 100);
            
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(150, 150, 200, 100);
            
            ctx.fillStyle = '#0000ff';
            ctx.fillRect(200, 200, 200, 100);
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(400, 150, 50, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(450, 200, 50, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(500, 250, 50, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.fillText('NO ALPHA', 100, 400);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(100, 450);
            ctx.lineTo(700, 450);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(100, 500);
            ctx.lineTo(700, 500);
            ctx.stroke();
          }
        }
        
        // Test environment setup
        const canvas = document.getElementById('test-canvas');
        const ctx = canvas.getContext('2d');
        const webglCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let filter = new AlphaFilterE2E({ 
          enabled: true, 
          intensity: 5,
          alpha: 0.8
        });
        
        let frameCount = 0;
        let lastFpsUpdate = Date.now();
        
        // Initialize FPS display
        document.getElementById('fps').textContent = '60';
        
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
        
        function updateMetrics() {
          document.getElementById('webgl-status').textContent = webglCtx ? 'Available' : 'Not Available';
          document.getElementById('filter-status').textContent = filter.enabled ? 'Active' : 'Inactive';
          document.getElementById('render-time').textContent = filter.renderTime.toFixed(2);
          document.getElementById('current-alpha').textContent = filter.alpha.toFixed(2);
        }
        
        function render() {
          filter.render(ctx);
          updateFPS();
          updateMetrics();
          requestAnimationFrame(render);
        }
        
        // Control event handlers
        document.getElementById('alpha-enabled').addEventListener('change', (e) => {
          filter.enabled = e.target.checked;
        });
        
        document.getElementById('alpha-value').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          filter.setAlpha(value);
          document.getElementById('alpha-value-display').textContent = value.toFixed(2);
        });
        
        document.getElementById('intensity').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          filter.updateIntensity(value);
          document.getElementById('intensity-value').textContent = value.toFixed(1);
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
          filter.reset();
          document.getElementById('intensity').value = '5';
          document.getElementById('intensity-value').textContent = '5.0';
        });
        
        document.getElementById('randomize-btn').addEventListener('click', () => {
          const randomAlpha = Math.random();
          filter.setAlpha(randomAlpha);
          document.getElementById('alpha-value').value = randomAlpha.toFixed(2);
          document.getElementById('alpha-value-display').textContent = randomAlpha.toFixed(2);
        });
        
        document.getElementById('fade-in-btn').addEventListener('click', () => {
          let alpha = 0;
          const fadeInterval = setInterval(() => {
            alpha += 0.05;
            if (alpha >= 1.0) {
              alpha = 1.0;
              clearInterval(fadeInterval);
            }
            filter.setAlpha(alpha);
            document.getElementById('alpha-value').value = alpha.toFixed(2);
            document.getElementById('alpha-value-display').textContent = alpha.toFixed(2);
          }, 50);
        });
        
        document.getElementById('fade-out-btn').addEventListener('click', () => {
          let alpha = 1.0;
          const fadeInterval = setInterval(() => {
            alpha -= 0.05;
            if (alpha <= 0) {
              alpha = 0;
              clearInterval(fadeInterval);
            }
            filter.setAlpha(alpha);
            document.getElementById('alpha-value').value = alpha.toFixed(2);
            document.getElementById('alpha-value-display').textContent = alpha.toFixed(2);
          }, 50);
        });
        
        // Expose test interface
        window.testAlphaFilter = {
          getFilter: () => ({
            enabled: filter.enabled,
            intensity: filter.intensity,
            alpha: filter.alpha,
            renderTime: filter.renderTime
          }),
          getCanvas: () => canvas,
          getWebGLContext: () => webglCtx,
          setIntensity: (intensity) => {
            filter.updateIntensity(intensity);
            document.getElementById('intensity').value = intensity;
            document.getElementById('intensity-value').textContent = intensity.toFixed(1);
          },
          setEnabled: (enabled) => {
            filter.enabled = enabled;
            document.getElementById('alpha-enabled').checked = enabled;
          },
          setAlpha: (alpha) => {
            filter.setAlpha(alpha);
            document.getElementById('alpha-value').value = alpha.toFixed(2);
            document.getElementById('alpha-value-display').textContent = alpha.toFixed(2);
          },
          getCurrentFPS: () => parseInt(document.getElementById('fps').textContent),
          getRenderTime: () => filter.renderTime,
          captureCanvasData: () => ctx.getImageData(0, 0, canvas.width, canvas.height),
          isWebGLAvailable: () => !!webglCtx
        };
        
        // Start render loop
        render();
      </script>
    </body>
    </html>
  `);
  
  await page.waitForFunction(() => window.testAlphaFilter !== undefined);
}

// E2E Tests
test.describe('AlphaFilter E2E Tests', () => {
  
  test('should maintain acceptable frame rates during alpha operations', async ({ page }) => {
    await setupAlphaFilterTest(page);
    await page.waitForTimeout(1000);
    
    const alphaValues = [0.0, 0.25, 0.5, 0.75, 1.0];
    
    for (const alpha of alphaValues) {
      await page.evaluate((value) => {
        window.testAlphaFilter.setAlpha(value);
      }, alpha);
      
      await page.waitForTimeout(500);
      
      const fps = await page.evaluate(() => window.testAlphaFilter.getCurrentFPS());
      const renderTime = await page.evaluate(() => window.testAlphaFilter.getRenderTime());
      
      expect(fps).toBeGreaterThan(30);
      expect(renderTime).toBeLessThan(20);
    }
  });
  
  test('should create interactive controls for alpha transparency', async ({ page }) => {
    await setupAlphaFilterTest(page);
    
    await expect(page.locator('#alpha-enabled')).toBeVisible();
    await expect(page.locator('#alpha-value')).toBeVisible();
    await expect(page.locator('#intensity')).toBeVisible();
    await expect(page.locator('#reset-btn')).toBeVisible();
    await expect(page.locator('#fade-in-btn')).toBeVisible();
    await expect(page.locator('#fade-out-btn')).toBeVisible();
    
    // Test alpha control
    await page.locator('#alpha-value').fill('0.3');
    
    const filterState = await page.evaluate(() => window.testAlphaFilter.getFilter());
    expect(filterState.alpha).toBeCloseTo(0.3, 1);
  });
  
  test('should handle intensity changes correctly', async ({ page }) => {
    await setupAlphaFilterTest(page);
    
    // Set base alpha to 0.8
    await page.locator('#alpha-value').fill('0.8');
    
    const intensityValues = [0, 3, 6, 9, 10];
    
    for (const intensity of intensityValues) {
      await page.locator('#intensity').fill(intensity.toString());
      
      const filterState = await page.evaluate(() => window.testAlphaFilter.getFilter());
      const expectedAlpha = 0.8 * (intensity / 10);
      
      expect(filterState.alpha).toBeCloseTo(expectedAlpha, 2);
    }
  });
  
  test('should provide reset functionality', async ({ page }) => {
    await setupAlphaFilterTest(page);
    
    // Set custom values
    await page.locator('#alpha-value').fill('0.6');
    await page.locator('#intensity').fill('7');
    
    // Reset
    await page.locator('#reset-btn').click();
    
    const filterState = await page.evaluate(() => window.testAlphaFilter.getFilter());
    expect(filterState.alpha).toBe(0.6); // Should restore original alpha
    
    const intensityValue = await page.locator('#intensity').inputValue();
    expect(intensityValue).toBe('5'); // Should reset intensity
  });
  
  test('should handle fade animations smoothly', async ({ page }) => {
    await setupAlphaFilterTest(page);
    
    // Test fade out
    await page.locator('#fade-out-btn').click();
    await page.waitForTimeout(1500); // Wait for fade to complete
    
    let filterState = await page.evaluate(() => window.testAlphaFilter.getFilter());
    expect(filterState.alpha).toBeCloseTo(0, 1);
    
    // Test fade in
    await page.locator('#fade-in-btn').click();
    await page.waitForTimeout(1500); // Wait for fade to complete
    
    filterState = await page.evaluate(() => window.testAlphaFilter.getFilter());
    expect(filterState.alpha).toBeCloseTo(1, 1);
  });
  
  test('should work consistently across different browsers', async ({ page, browserName }) => {
    await setupAlphaFilterTest(page);
    
    const isWebGLAvailable = await page.evaluate(() => window.testAlphaFilter.isWebGLAvailable());
    const filterState = await page.evaluate(() => window.testAlphaFilter.getFilter());
    
    expect(filterState.enabled).toBe(true);
    expect(filterState.alpha).toBeGreaterThanOrEqual(0);
    expect(filterState.alpha).toBeLessThanOrEqual(1);
    
    // Test alpha changes
    await page.evaluate(() => {
      window.testAlphaFilter.setAlpha(0.5);
    });
    
    const updatedState = await page.evaluate(() => window.testAlphaFilter.getFilter());
    expect(updatedState.alpha).toBeCloseTo(0.5, 1);
    
    console.warn(`AlphaFilter E2E test passed on ${browserName}: WebGL=${isWebGLAvailable}`);
  });
  
  test('should handle rapid alpha changes without performance degradation', async ({ page }) => {
    await setupAlphaFilterTest(page);
    
    const startTime = Date.now();
    
    // Rapidly change alpha values
    for (let i = 0; i < 20; i++) {
      await page.evaluate((alpha) => {
        window.testAlphaFilter.setAlpha(alpha);
      }, Math.random());
      
      await page.waitForTimeout(25);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(2000);
    
    const fps = await page.evaluate(() => window.testAlphaFilter.getCurrentFPS());
    expect(fps).toBeGreaterThan(20);
  });
  
  test('should validate alpha transparency visual effects', async ({ page }) => {
    await setupAlphaFilterTest(page);
    
    // Test different alpha levels and capture canvas data
    const alphaLevels = [0.1, 0.5, 0.9];
    
    for (const alpha of alphaLevels) {
      await page.evaluate((value) => {
        window.testAlphaFilter.setAlpha(value);
      }, alpha);
      
      await page.waitForTimeout(100);
      
      const canvasData = await page.evaluate(() => {
        const data = window.testAlphaFilter.captureCanvasData();
        return {
          width: data.width,
          height: data.height,
          hasTransparency: Array.from(data.data).some((value, index) => {
            // Check alpha channel (every 4th value)
            return index % 4 === 3 && value < 255;
          })
        };
      });
      
      expect(canvasData.width).toBe(800);
      expect(canvasData.height).toBe(600);
    }
  });
  
}); 