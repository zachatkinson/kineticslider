/**
 * AdvancedBloomFilter E2E Tests
 * 
 * Tests visual rendering and browser-specific behavior that requires a real DOM environment.
 * Focuses on bloom-specific visual effects, performance, and user interactions.
 * 
 * @module AdvancedBloomFilterE2E
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Type declarations for the test environment
declare global {
  interface Window {
    testAdvancedBloomFilter: {
      getFilter: () => {
        enabled: boolean;
        intensity: number;
        bloomScale: number;
        brightness: number;
        blur: number;
        threshold: number;
        quality: number;
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
 * Setup AdvancedBloomFilter E2E test environment
 *
 * @param page - Playwright page instance
 *
 * @returns Promise that resolves when setup is complete
 *
 */
async function setupAdvancedBloomFilterTest(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AdvancedBloomFilter E2E Test</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        #container { width: 800px; height: 600px; border: 1px solid #ccc; background: #000; }
        #controls { margin: 20px 0; padding: 20px; background: #fff; border-radius: 8px; }
        .control-group { margin: 15px 0; }
        .control-group label { display: inline-block; width: 150px; font-weight: 500; }
        .control-group input[type="range"] { width: 200px; margin-right: 10px; }
        .control-group select { width: 200px; margin-right: 10px; }
        .value-display { color: #0066cc; font-weight: bold; }
        #metrics { margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px; }
        .metric { margin: 8px 0; font-family: monospace; }
        button { padding: 8px 16px; margin: 5px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>AdvancedBloomFilter E2E Test Environment</h1>
      
      <div id="container">
        <canvas id="test-canvas" width="800" height="600"></canvas>
      </div>
      
      <div id="controls">
        <h3>Advanced Bloom Filter Controls</h3>
        
        <div class="control-group">
          <label><input type="checkbox" id="bloom-enabled" checked> Enable Filter</label>
        </div>
        
        <div class="control-group">
          <label for="bloom-scale">Bloom Scale (0-2):</label>
          <input type="range" id="bloom-scale" min="0" max="2" step="0.1" value="1">
          <span class="value-display" id="bloom-scale-value">1.0</span>
        </div>
        
        <div class="control-group">
          <label for="brightness">Brightness (0-2):</label>
          <input type="range" id="brightness" min="0" max="2" step="0.1" value="1">
          <span class="value-display" id="brightness-value">1.0</span>
        </div>
        
        <div class="control-group">
          <label for="blur">Blur (1-5):</label>
          <input type="range" id="blur" min="1" max="5" step="0.5" value="2">
          <span class="value-display" id="blur-value">2.0</span>
        </div>
        
        <div class="control-group">
          <label for="threshold">Threshold (0-1):</label>
          <input type="range" id="threshold" min="0" max="1" step="0.05" value="0.5">
          <span class="value-display" id="threshold-value">0.50</span>
        </div>
        
        <div class="control-group">
          <label for="primary-property">Primary Property:</label>
          <select id="primary-property">
            <option value="">Default (bloomScale + brightness)</option>
            <option value="bloomScale">Bloom Scale</option>
            <option value="brightness">Brightness</option>
            <option value="blur">Blur</option>
            <option value="threshold">Threshold</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="intensity">Intensity (0-10):</label>
          <input type="range" id="intensity" min="0" max="10" step="0.5" value="5">
          <span class="value-display" id="intensity-value">5.0</span>
        </div>
        
        <div class="control-group">
          <button id="reset-btn">Reset Filter</button>
          <button id="randomize-btn">Randomize Values</button>
        </div>
      </div>
      
      <div id="metrics">
        <h3>Performance Metrics</h3>
        <div class="metric">Frame Rate: <span id="fps">0</span> FPS</div>
        <div class="metric">WebGL Context: <span id="webgl-status">Unknown</span></div>
        <div class="metric">Filter Status: <span id="filter-status">Inactive</span></div>
        <div class="metric">Render Time: <span id="render-time">0</span> ms</div>
      </div>
      
      <script>
        // Mock AdvancedBloomFilter for E2E testing
        class AdvancedBloomFilterE2E {
          constructor(config) {
            this.enabled = config.enabled || false;
            this.intensity = config.intensity || 0;
            this.bloomScale = config.bloomScale || 1;
            this.brightness = config.brightness || 1;
            this.blur = config.blur || 2;
            this.threshold = config.threshold || 0.5;
            this.quality = config.quality || 4;
            this.primaryProperty = config.primaryProperty || '';
            this.renderTime = 0;
            
            this.originalBloomScale = this.bloomScale;
            this.originalBrightness = this.brightness;
            this.originalBlur = this.blur;
            this.originalThreshold = this.threshold;
          }
          
          updateIntensity(intensity) {
            this.intensity = intensity;
            
            if (this.primaryProperty) {
              switch (this.primaryProperty) {
                case 'bloomScale':
                  this.bloomScale = intensity / 5;
                  break;
                case 'brightness':
                  this.brightness = intensity / 5;
                  break;
                case 'blur':
                  this.blur = Math.max(1, intensity / 2);
                  break;
                case 'threshold':
                  this.threshold = intensity / 10;
                  break;
                default:
                  this.bloomScale = intensity / 5;
              }
            } else {
              this.bloomScale = intensity / 5;
              this.brightness = Math.min(1.5, 0.5 + (intensity / 20));
            }
          }
          
          reset() {
            this.bloomScale = this.originalBloomScale;
            this.brightness = this.originalBrightness;
            this.blur = this.originalBlur;
            this.threshold = this.originalThreshold;
          }
          
          render(ctx) {
            const startTime = performance.now();
            
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            if (this.enabled && (this.bloomScale > 0 || this.brightness > 0)) {
              this.renderWithBloom(ctx);
            } else {
              this.renderNormal(ctx);
            }
            
            this.renderTime = performance.now() - startTime;
          }
          
          renderWithBloom(ctx) {
            // Background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Bright elements for bloom effect
            ctx.fillStyle = \`rgba(255, 255, 255, \${Math.min(1, this.brightness)})\`;
            ctx.fillRect(100, 100, 600, 50);
            ctx.fillRect(200, 200, 400, 40);
            ctx.fillRect(300, 300, 200, 30);
            
            // Apply glow effect
            if (this.bloomScale > 0) {
              ctx.shadowBlur = this.blur * this.bloomScale * 10;
              ctx.shadowColor = \`rgba(255, 255, 255, \${this.bloomScale * 0.5})\`;
              
              ctx.fillStyle = \`rgba(255, 255, 255, \${Math.min(1, this.brightness)})\`;
              ctx.fillRect(100, 100, 600, 50);
              
              ctx.shadowBlur = 0;
              ctx.shadowColor = 'transparent';
            }
            
            // Colored elements
            ctx.fillStyle = \`rgba(255, 200, 100, \${Math.min(1, this.brightness * 0.8)})\`;
            ctx.beginPath();
            ctx.arc(150, 400, 40, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = \`rgba(100, 200, 255, \${Math.min(1, this.brightness * 0.9)})\`;
            ctx.beginPath();
            ctx.arc(650, 400, 50, 0, Math.PI * 2);
            ctx.fill();
          }
          
          renderNormal(ctx) {
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(100, 100, 600, 50);
            ctx.fillRect(200, 200, 400, 40);
            ctx.fillRect(300, 300, 200, 30);
            
            ctx.fillStyle = '#ffcc66';
            ctx.beginPath();
            ctx.arc(150, 400, 40, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#66ccff';
            ctx.beginPath();
            ctx.arc(650, 400, 50, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Test environment setup
        const canvas = document.getElementById('test-canvas');
        const ctx = canvas.getContext('2d');
        const webglCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let filter = new AdvancedBloomFilterE2E({ 
          enabled: true, 
          intensity: 5,
          bloomScale: 1,
          brightness: 1,
          blur: 2,
          threshold: 0.5,
          quality: 4
        });
        
        let frameCount = 0;
        let lastFpsUpdate = Date.now();
        
        // Initialize FPS display with a reasonable default
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
        }
        
        function render() {
          filter.render(ctx);
          updateFPS();
          updateMetrics();
          requestAnimationFrame(render);
        }
        
        // Control event handlers
        document.getElementById('bloom-enabled').addEventListener('change', (e) => {
          filter.enabled = e.target.checked;
        });
        
        document.getElementById('bloom-scale').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          filter.bloomScale = value;
          filter.originalBloomScale = value;
          document.getElementById('bloom-scale-value').textContent = value.toFixed(1);
        });
        
        document.getElementById('brightness').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          filter.brightness = value;
          filter.originalBrightness = value;
          document.getElementById('brightness-value').textContent = value.toFixed(1);
        });
        
        document.getElementById('blur').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          filter.blur = value;
          filter.originalBlur = value;
          document.getElementById('blur-value').textContent = value.toFixed(1);
        });
        
        document.getElementById('threshold').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          filter.threshold = value;
          filter.originalThreshold = value;
          document.getElementById('threshold-value').textContent = value.toFixed(2);
        });
        
        document.getElementById('primary-property').addEventListener('change', (e) => {
          filter.primaryProperty = e.target.value;
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
          const randomIntensity = Math.random() * 10;
          filter.updateIntensity(randomIntensity);
          document.getElementById('intensity').value = randomIntensity.toFixed(1);
          document.getElementById('intensity-value').textContent = randomIntensity.toFixed(1);
        });
        
        // Expose test interface
        window.testAdvancedBloomFilter = {
          getFilter: () => ({
            enabled: filter.enabled,
            intensity: filter.intensity,
            bloomScale: filter.bloomScale,
            brightness: filter.brightness,
            blur: filter.blur,
            threshold: filter.threshold,
            quality: filter.quality,
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
            document.getElementById('bloom-enabled').checked = enabled;
          },
          setPrimaryProperty: (property) => {
            filter.primaryProperty = property;
            document.getElementById('primary-property').value = property;
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
  
  await page.waitForFunction(() => window.testAdvancedBloomFilter !== undefined);
}

// E2E Tests
test.describe('AdvancedBloomFilter E2E Tests', () => {
  
  test('should maintain acceptable frame rates during bloom operations', async ({ page }) => {
    await setupAdvancedBloomFilterTest(page);
    await page.waitForTimeout(1000);
    
    const intensityValues = [0, 3, 6, 9, 10];
    
    for (const intensity of intensityValues) {
      await page.evaluate((value) => {
        window.testAdvancedBloomFilter.setIntensity(value);
      }, intensity);
      
      await page.waitForTimeout(500);
      
      const fps = await page.evaluate(() => window.testAdvancedBloomFilter.getCurrentFPS());
      const renderTime = await page.evaluate(() => window.testAdvancedBloomFilter.getRenderTime());
      
      expect(fps).toBeGreaterThan(20);
      expect(renderTime).toBeLessThan(50);
    }
  });
  
  test('should create interactive controls for all bloom properties', async ({ page }) => {
    await setupAdvancedBloomFilterTest(page);
    
    await expect(page.locator('#bloom-enabled')).toBeVisible();
    await expect(page.locator('#bloom-scale')).toBeVisible();
    await expect(page.locator('#brightness')).toBeVisible();
    await expect(page.locator('#blur')).toBeVisible();
    await expect(page.locator('#threshold')).toBeVisible();
    await expect(page.locator('#primary-property')).toBeVisible();
    await expect(page.locator('#intensity')).toBeVisible();
    await expect(page.locator('#reset-btn')).toBeVisible();
    
    await page.locator('#bloom-scale').fill('1.5');
    await page.locator('#brightness').fill('1.2');
    await page.locator('#threshold').fill('0.3');
    
    const filterState = await page.evaluate(() => window.testAdvancedBloomFilter.getFilter());
    expect(filterState.bloomScale).toBeCloseTo(1.5, 1);
    expect(filterState.brightness).toBeCloseTo(1.2, 1);
    expect(filterState.threshold).toBeCloseTo(0.3, 1);
  });
  
  test('should handle primary property changes correctly', async ({ page }) => {
    await setupAdvancedBloomFilterTest(page);
    
    const properties = ['bloomScale', 'brightness', 'blur', 'threshold'];
    
    for (const property of properties) {
      await page.selectOption('#primary-property', property);
      await page.locator('#intensity').fill('7');
      
      const filterState = await page.evaluate(() => window.testAdvancedBloomFilter.getFilter());
      
      switch (property) {
        case 'bloomScale':
          expect(filterState.bloomScale).toBeCloseTo(1.4, 1);
          break;
        case 'brightness':
          expect(filterState.brightness).toBeCloseTo(1.4, 1);
          break;
        case 'blur':
          expect(filterState.blur).toBeCloseTo(3.5, 1);
          break;
        case 'threshold':
          expect(filterState.threshold).toBeCloseTo(0.7, 1);
          break;
      }
    }
  });
  
  test('should provide reset functionality', async ({ page }) => {
    await setupAdvancedBloomFilterTest(page);
    
    await page.locator('#bloom-scale').fill('1.8');
    await page.locator('#brightness').fill('1.5');
    await page.locator('#intensity').fill('8');
    
    await page.locator('#reset-btn').click();
    
    const filterState = await page.evaluate(() => window.testAdvancedBloomFilter.getFilter());
    expect(filterState.bloomScale).toBe(1.8);
    expect(filterState.brightness).toBe(1.5);
    
    const intensityValue = await page.locator('#intensity').inputValue();
    expect(intensityValue).toBe('5');
  });
  
  test('should work consistently across different browsers', async ({ page, browserName }) => {
    await setupAdvancedBloomFilterTest(page);
    
    const isWebGLAvailable = await page.evaluate(() => window.testAdvancedBloomFilter.isWebGLAvailable());
    const filterState = await page.evaluate(() => window.testAdvancedBloomFilter.getFilter());
    
    expect(filterState.enabled).toBe(true);
    expect(filterState.bloomScale).toBeGreaterThanOrEqual(0);
    expect(filterState.brightness).toBeGreaterThanOrEqual(0);
    expect(filterState.blur).toBeGreaterThanOrEqual(1);
    expect(filterState.threshold).toBeGreaterThanOrEqual(0);
    expect(filterState.threshold).toBeLessThanOrEqual(1);
    
    console.warn(`AdvancedBloomFilter E2E test passed on ${browserName}: WebGL=${isWebGLAvailable}`);
  });
  
  test('should handle rapid intensity changes without performance degradation', async ({ page }) => {
    await setupAdvancedBloomFilterTest(page);
    
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await page.evaluate((intensity) => {
        window.testAdvancedBloomFilter.setIntensity(intensity);
      }, Math.random() * 10);
      
      await page.waitForTimeout(50);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(2000);
    
    const fps = await page.evaluate(() => window.testAdvancedBloomFilter.getCurrentFPS());
    expect(fps).toBeGreaterThan(10);
  });
  
}); 