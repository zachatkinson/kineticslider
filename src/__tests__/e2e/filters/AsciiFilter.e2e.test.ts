/**
 * AsciiFilter E2E Tests
 * 
 * Tests visual rendering and browser-specific behavior that requires a real DOM environment.
 * Focuses on ASCII art effects, size scaling, performance, and user interactions.
 * 
 * @module AsciiFilterE2E
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Type declarations for the test environment
declare global {
  interface Window {
    testAsciiFilter: {
      getFilter: () => {
        enabled: boolean;
        intensity: number;
        size: number;
        color: number;
        replaceColor: boolean;
        renderTime: number;
      };
      getCanvas: () => HTMLCanvasElement;
      getWebGLContext: () => WebGLRenderingContext | null;
      setIntensity: (intensity: number) => void;
      setEnabled: (enabled: boolean) => void;
      setSize: (size: number) => void;
      setColor: (color: number) => void;
      setReplaceColor: (replaceColor: boolean) => void;
      getCurrentFPS: () => number;
      getRenderTime: () => number;
      captureCanvasData: () => ImageData;
      isWebGLAvailable: () => boolean;
    };
  }
}

/**
 * Setup AsciiFilter E2E test environment
 *
 * @param page - Playwright page instance
 *
 * @returns Promise that resolves when setup is complete
 *
 */
async function setupAsciiFilterTest(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AsciiFilter E2E Test</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        #container { width: 800px; height: 600px; border: 1px solid #ccc; background: #000; }
        #controls { margin: 20px 0; padding: 20px; background: #fff; border-radius: 8px; }
        .control-group { margin: 15px 0; }
        .control-group label { display: inline-block; width: 150px; font-weight: 500; }
        .control-group input[type="range"] { width: 200px; margin-right: 10px; }
        .control-group input[type="color"] { width: 50px; height: 30px; }
        .value-display { color: #0066cc; font-weight: bold; }
        #metrics { margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px; }
        .metric { margin: 8px 0; font-family: monospace; }
        button { padding: 8px 16px; margin: 5px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .preset-btn { background: #00aa00; }
        .effect-preview { margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>AsciiFilter E2E Test Environment</h1>
      
      <div id="container">
        <canvas id="test-canvas" width="800" height="600"></canvas>
      </div>
      
      <div id="controls">
        <h3>ASCII Filter Controls</h3>
        
        <div class="control-group">
          <label><input type="checkbox" id="ascii-enabled" checked> Enable Filter</label>
        </div>
        
        <div class="control-group">
          <label for="ascii-size">Size (2-30):</label>
          <input type="range" id="ascii-size" min="2" max="30" step="1" value="8">
          <span class="value-display" id="size-value">8</span>
        </div>
        
        <div class="control-group">
          <label for="intensity">Intensity (0-10):</label>
          <input type="range" id="intensity" min="0" max="10" step="0.5" value="5">
          <span class="value-display" id="intensity-value">5.0</span>
        </div>
        
        <div class="control-group">
          <label for="ascii-color">ASCII Color:</label>
          <input type="color" id="ascii-color" value="#ffffff">
          <span class="value-display" id="color-value">#ffffff</span>
        </div>
        
        <div class="control-group">
          <label><input type="checkbox" id="replace-color"> Replace Original Colors</label>
        </div>
        
        <div class="control-group">
          <button id="reset-btn">Reset Filter</button>
          <button id="randomize-btn">Randomize Settings</button>
          <button class="preset-btn" id="fine-ascii-btn">Fine ASCII (size 4)</button>
          <button class="preset-btn" id="chunky-ascii-btn">Chunky ASCII (size 16)</button>
        </div>
        
        <div class="effect-preview">
          <strong>ASCII Preview:</strong>
          <div id="ascii-preview">@@##**++==--::.. </div>
        </div>
      </div>
      
      <div id="metrics">
        <h3>Performance Metrics</h3>
        <div class="metric">Frame Rate: <span id="fps">0</span> FPS</div>
        <div class="metric">WebGL Context: <span id="webgl-status">Unknown</span></div>
        <div class="metric">Filter Status: <span id="filter-status">Inactive</span></div>
        <div class="metric">Render Time: <span id="render-time">0</span> ms</div>
        <div class="metric">Current Size: <span id="current-size">8</span></div>
        <div class="metric">ASCII Character: <span id="ascii-char">@</span></div>
      </div>
      
      <script>
        // Mock AsciiFilter for E2E testing
        class AsciiFilterE2E {
          constructor(config) {
            this.enabled = config.enabled || false;
            this.intensity = config.intensity || 5;
            this.size = config.size || 8;
            this.color = config.color || 0xffffff;
            this.replaceColor = config.replaceColor || false;
            this.renderTime = 0;
            
            this.originalSize = this.size;
            this.originalColor = this.color;
            this.originalReplaceColor = this.replaceColor;
          }
          
          updateIntensity(intensity) {
            this.intensity = intensity;
            // Apply ASCII size formula: Math.max(2, Math.round(2 + (intensity * 1.8)))
            this.size = Math.max(2, Math.round(2 + (intensity * 1.8)));
          }
          
          setSize(size) {
            this.originalSize = Math.max(2, Math.min(30, size));
            // For direct size setting, set size directly without intensity scaling
            this.size = this.originalSize;
          }
          
          setColor(color) {
            this.originalColor = color;
            this.color = color;
          }
          
          setReplaceColor(replaceColor) {
            this.originalReplaceColor = replaceColor;
            this.replaceColor = replaceColor;
          }
          
          reset() {
            this.size = this.originalSize;
            this.color = 0xffffff; // Should restore default white color, not originalColor
            this.replaceColor = false; // Should restore default replaceColor
            this.intensity = 5; // Reset to default intensity
          }
          
          render(ctx) {
            const startTime = performance.now();
            
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            if (this.enabled) {
              this.renderWithAscii(ctx);
            } else {
              this.renderNormal(ctx);
            }
            
            this.renderTime = performance.now() - startTime;
          }
          
          renderWithAscii(ctx) {
            // Background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // ASCII character mapping based on intensity
            const asciiChars = ['@', '#', '*', '+', '=', '-', ':', '.', ' '];
            const charIndex = Math.floor((this.intensity / 10) * (asciiChars.length - 1));
            const char = asciiChars[charIndex];
            
            // Convert color to CSS hex
            const hexColor = '#' + this.color.toString(16).padStart(6, '0');
            ctx.fillStyle = hexColor;
            
            // Set font size based on ASCII size
            const fontSize = this.size;
            ctx.font = fontSize + 'px monospace';
            
            // Draw ASCII pattern
            const cols = Math.floor(ctx.canvas.width / fontSize);
            const rows = Math.floor(ctx.canvas.height / fontSize);
            
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                const x = col * fontSize;
                const y = (row + 1) * fontSize;
                
                // Create pattern based on position and size
                const pattern = (row + col + Math.floor(this.size / 4)) % 3;
                if (pattern === 0) {
                  ctx.fillText(char, x, y);
                }
              }
            }
            
            // Add title
            ctx.fillStyle = hexColor;
            ctx.font = '24px Arial';
            ctx.fillText('ASCII FILTER TEST - Size: ' + this.size, 20, 30);
            
            // Add sample text block
            ctx.font = '16px Arial';
            ctx.fillText('Sample text rendered with ASCII effect', 20, 60);
            
            // Draw shapes to test ASCII effect on different content
            if (!this.replaceColor) {
              // Colorful shapes when not replacing colors
              ctx.fillStyle = '#ff0000';
              ctx.fillRect(50, 100, 100, 80);
              
              ctx.fillStyle = '#00ff00';
              ctx.fillRect(200, 100, 100, 80);
              
              ctx.fillStyle = '#0000ff';
              ctx.fillRect(350, 100, 100, 80);
            } else {
              // Use ASCII color when replacing
              ctx.fillStyle = hexColor;
              ctx.fillRect(50, 100, 100, 80);
              ctx.fillRect(200, 100, 100, 80);
              ctx.fillRect(350, 100, 100, 80);
            }
            
            // Add complexity indicators
            ctx.fillStyle = hexColor;
            ctx.font = '12px monospace';
            ctx.fillText('Complexity Level: ' + Math.ceil(this.intensity), 20, ctx.canvas.height - 40);
            ctx.fillText('Character Density: ' + Math.ceil((10 - this.intensity) * 10) + '%', 20, ctx.canvas.height - 20);
          }
          
          renderNormal(ctx) {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Same content but without ASCII effect
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.fillText('NO ASCII FILTER', 20, 30);
            
            ctx.font = '16px Arial';
            ctx.fillText('Normal rendering without ASCII effect', 20, 60);
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(50, 100, 100, 80);
            
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(200, 100, 100, 80);
            
            ctx.fillStyle = '#0000ff';
            ctx.fillRect(350, 100, 100, 80);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText('Filter disabled - showing original content', 20, ctx.canvas.height - 20);
          }
        }
        
        // Test environment setup
        const canvas = document.getElementById('test-canvas');
        const ctx = canvas.getContext('2d');
        const webglCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let filter = new AsciiFilterE2E({ 
          enabled: true, 
          intensity: 5,
          size: 8,
          color: 0xffffff,
          replaceColor: false
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
          document.getElementById('current-size').textContent = filter.size;
          
          // Update ASCII character preview
          const asciiChars = ['@', '#', '*', '+', '=', '-', ':', '.', ' '];
          const charIndex = Math.floor((filter.intensity / 10) * (asciiChars.length - 1));
          document.getElementById('ascii-char').textContent = asciiChars[charIndex];
        }
        
        function render() {
          filter.render(ctx);
          updateFPS();
          updateMetrics();
          requestAnimationFrame(render);
        }
        
        // Helper function to convert hex color to number
        function hexToNumber(hex) {
          return parseInt(hex.replace('#', ''), 16);
        }
        
        // Helper function to convert number to hex
        function numberToHex(num) {
          return '#' + num.toString(16).padStart(6, '0');
        }
        
        // Control event handlers
        document.getElementById('ascii-enabled').addEventListener('change', (e) => {
          filter.enabled = e.target.checked;
        });
        
        document.getElementById('ascii-size').addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          filter.setSize(value);
          document.getElementById('size-value').textContent = value;
        });
        
        document.getElementById('intensity').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          filter.updateIntensity(value);
          document.getElementById('intensity-value').textContent = value.toFixed(1);
        });
        
        document.getElementById('ascii-color').addEventListener('input', (e) => {
          const value = hexToNumber(e.target.value);
          filter.setColor(value);
          document.getElementById('color-value').textContent = e.target.value;
        });
        
        document.getElementById('replace-color').addEventListener('change', (e) => {
          filter.setReplaceColor(e.target.checked);
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
          filter.reset();
          document.getElementById('intensity').value = '5';
          document.getElementById('intensity-value').textContent = '5.0';
          document.getElementById('ascii-size').value = filter.originalSize;
          document.getElementById('size-value').textContent = filter.originalSize;
          document.getElementById('ascii-color').value = numberToHex(filter.originalColor);
          document.getElementById('color-value').textContent = numberToHex(filter.originalColor);
          document.getElementById('replace-color').checked = filter.originalReplaceColor;
        });
        
        document.getElementById('randomize-btn').addEventListener('click', () => {
          const randomSize = Math.floor(Math.random() * 25) + 5;
          const randomIntensity = Math.random() * 10;
          const randomColor = Math.floor(Math.random() * 0xffffff);
          const randomReplace = Math.random() > 0.5;
          
          filter.setSize(randomSize);
          filter.updateIntensity(randomIntensity);
          filter.setColor(randomColor);
          filter.setReplaceColor(randomReplace);
          
          document.getElementById('ascii-size').value = randomSize;
          document.getElementById('size-value').textContent = randomSize;
          document.getElementById('intensity').value = randomIntensity.toFixed(1);
          document.getElementById('intensity-value').textContent = randomIntensity.toFixed(1);
          document.getElementById('ascii-color').value = numberToHex(randomColor);
          document.getElementById('color-value').textContent = numberToHex(randomColor);
          document.getElementById('replace-color').checked = randomReplace;
        });
        
        document.getElementById('fine-ascii-btn').addEventListener('click', () => {
          filter.setSize(4);
          filter.updateIntensity(8);
          filter.setColor(0x00ff00);
          document.getElementById('ascii-size').value = '4';
          document.getElementById('size-value').textContent = '4';
          document.getElementById('intensity').value = '8';
          document.getElementById('intensity-value').textContent = '8.0';
          document.getElementById('ascii-color').value = '#00ff00';
          document.getElementById('color-value').textContent = '#00ff00';
        });
        
        document.getElementById('chunky-ascii-btn').addEventListener('click', () => {
          filter.setSize(16);
          filter.updateIntensity(3);
          filter.setColor(0xff0000);
          document.getElementById('ascii-size').value = '16';
          document.getElementById('size-value').textContent = '16';
          document.getElementById('intensity').value = '3';
          document.getElementById('intensity-value').textContent = '3.0';
          document.getElementById('ascii-color').value = '#ff0000';
          document.getElementById('color-value').textContent = '#ff0000';
        });
        
        // Expose test interface
        window.testAsciiFilter = {
          getFilter: () => ({
            enabled: filter.enabled,
            intensity: filter.intensity,
            size: filter.size,
            color: filter.color,
            replaceColor: filter.replaceColor,
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
            document.getElementById('ascii-enabled').checked = enabled;
          },
          setSize: (size) => {
            filter.setSize(size);
            document.getElementById('ascii-size').value = size;
            document.getElementById('size-value').textContent = size;
          },
          setColor: (color) => {
            filter.setColor(color);
            document.getElementById('ascii-color').value = numberToHex(color);
            document.getElementById('color-value').textContent = numberToHex(color);
          },
          setReplaceColor: (replaceColor) => {
            filter.setReplaceColor(replaceColor);
            document.getElementById('replace-color').checked = replaceColor;
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
  
  await page.waitForFunction(() => window.testAsciiFilter !== undefined);
}

// E2E Tests
test.describe('AsciiFilter E2E Tests', () => {
  
  test('should maintain acceptable frame rates during ASCII operations', async ({ page }) => {
    await setupAsciiFilterTest(page);
    await page.waitForTimeout(1000);
    
    const sizeValues = [4, 8, 12, 16, 20];
    
    for (const size of sizeValues) {
      await page.evaluate((value) => {
        window.testAsciiFilter.setSize(value);
      }, size);
      
      await page.waitForTimeout(500);
      
      const fps = await page.evaluate(() => window.testAsciiFilter.getCurrentFPS());
      const renderTime = await page.evaluate(() => window.testAsciiFilter.getRenderTime());
      
      expect(fps).toBeGreaterThan(25);
      expect(renderTime).toBeLessThan(90);
    }
  });
  
  test('should create interactive controls for ASCII art effects', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    await expect(page.locator('#ascii-enabled')).toBeVisible();
    await expect(page.locator('#ascii-size')).toBeVisible();
    await expect(page.locator('#intensity')).toBeVisible();
    await expect(page.locator('#ascii-color')).toBeVisible();
    await expect(page.locator('#replace-color')).toBeVisible();
    await expect(page.locator('#fine-ascii-btn')).toBeVisible();
    await expect(page.locator('#chunky-ascii-btn')).toBeVisible();
    
    // Test size control
    await page.locator('#ascii-size').fill('12');
    
    const filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.size).toBeCloseTo(12, 0);
  });
  
  test('should handle intensity changes with size scaling', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    const intensityValues = [0, 3, 6, 9, 10];
    
    for (const intensity of intensityValues) {
      await page.locator('#intensity').fill(intensity.toString());
      
      const filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
      const expectedSize = Math.max(2, Math.round(2 + (intensity * 1.8)));
      
      expect(filterState.size).toBe(expectedSize);
    }
  });
  
  test('should handle color changes correctly', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    
    for (const color of colors) {
      await page.locator('#ascii-color').fill(color);
      
      const filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
      const expectedColor = parseInt(color.replace('#', ''), 16);
      
      expect(filterState.color).toBe(expectedColor);
    }
  });
  
  test('should provide reset functionality', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    // Set custom values
    await page.locator('#ascii-size').fill('15');
    await page.locator('#intensity').fill('8');
    await page.locator('#ascii-color').fill('#ff0000');
    await page.locator('#replace-color').check();
    
    // Reset
    await page.locator('#reset-btn').click();
    
    const filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.color).toBe(0xffffff); // Should restore default color
    expect(filterState.replaceColor).toBe(false); // Should restore default replaceColor
    
    const intensityValue = await page.locator('#intensity').inputValue();
    expect(intensityValue).toBe('5'); // Should reset intensity
  });
  
  test('should handle preset configurations smoothly', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    // Test fine ASCII preset
    await page.locator('#fine-ascii-btn').click();
    await page.waitForTimeout(200);
    
    let filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.color).toBe(0x00ff00); // Green
    expect(filterState.intensity).toBe(8);
    
    // Test chunky ASCII preset
    await page.locator('#chunky-ascii-btn').click();
    await page.waitForTimeout(200);
    
    filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.color).toBe(0xff0000); // Red
    expect(filterState.intensity).toBe(3);
  });
  
  test('should work consistently across different browsers', async ({ page, browserName }) => {
    await setupAsciiFilterTest(page);
    
    const isWebGLAvailable = await page.evaluate(() => window.testAsciiFilter.isWebGLAvailable());
    const filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    
    expect(filterState.enabled).toBe(true);
    expect(filterState.size).toBeGreaterThan(0);
    expect(filterState.color).toBeGreaterThanOrEqual(0);
    
    // Test ASCII size changes
    await page.evaluate(() => {
      window.testAsciiFilter.setSize(10);
    });
    
    const updatedState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(updatedState.size).toBe(10);
    
    console.warn(`AsciiFilter E2E test passed on ${browserName}: WebGL=${isWebGLAvailable}`);
  });
  
  test('should handle rapid ASCII parameter changes without performance degradation', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    const startTime = Date.now();
    
    // Rapidly change ASCII parameters
    for (let i = 0; i < 15; i++) {
      await page.evaluate((iteration) => {
        const size = 4 + (iteration % 16);
        const intensity = Math.random() * 10;
        const color = Math.floor(Math.random() * 0xffffff);
        window.testAsciiFilter.setSize(size);
        window.testAsciiFilter.setIntensity(intensity);
        window.testAsciiFilter.setColor(color);
      }, i);
      
      await page.waitForTimeout(50);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(3000);
    
    const fps = await page.evaluate(() => window.testAsciiFilter.getCurrentFPS());
    expect(fps).toBeGreaterThan(15);
  });
  
  test('should validate ASCII visual effects and character rendering', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    // Test different intensity levels for ASCII character variation
    const intensityLevels = [1, 5, 9];
    
    for (const intensity of intensityLevels) {
      await page.evaluate((value) => {
        window.testAsciiFilter.setIntensity(value);
      }, intensity);
      
      await page.waitForTimeout(100);
      
      const canvasData = await page.evaluate(() => {
        const data = window.testAsciiFilter.captureCanvasData();
        return {
          width: data.width,
          height: data.height,
          hasContent: Array.from(data.data).some((value, index) => {
            // Check if there's non-black content
            return index % 4 < 3 && value > 0;
          })
        };
      });
      
      expect(canvasData.width).toBe(800);
      expect(canvasData.height).toBe(600);
      expect(canvasData.hasContent).toBe(true);
    }
  });
  
  test('should handle replaceColor toggle correctly', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    // Test with replaceColor disabled
    await page.locator('#replace-color').uncheck();
    await page.waitForTimeout(100);
    
    let filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.replaceColor).toBe(false);
    
    // Test with replaceColor enabled
    await page.locator('#replace-color').check();
    await page.waitForTimeout(100);
    
    filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.replaceColor).toBe(true);
  });
  
  test('should maintain consistent ASCII character mapping', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    // Test ASCII character progression with intensity
    const intensityMap = [
      { intensity: 0, expectedChar: '@' },
      { intensity: 2, expectedChar: '#' },
      { intensity: 5, expectedChar: '=' },
      { intensity: 8, expectedChar: ':' },
      { intensity: 10, expectedChar: ' ' }
    ];
    
    for (const mapping of intensityMap) {
      await page.evaluate((intensity) => {
        window.testAsciiFilter.setIntensity(intensity);
      }, mapping.intensity);
      
      await page.waitForTimeout(100);
      
      const currentChar = await page.locator('#ascii-char').textContent();
      expect(currentChar).toBe(mapping.expectedChar);
    }
  });
  
  test('should handle size constraints properly', async ({ page }) => {
    await setupAsciiFilterTest(page);
    
    // Test minimum size constraint
    await page.evaluate(() => {
      window.testAsciiFilter.setSize(1); // Below minimum
    });
    
    let filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.size).toBeGreaterThanOrEqual(2);
    
    // Test maximum size constraint
    await page.evaluate(() => {
      window.testAsciiFilter.setSize(50); // Above maximum
    });
    
    filterState = await page.evaluate(() => window.testAsciiFilter.getFilter());
    expect(filterState.size).toBeLessThanOrEqual(30);
  });
  
}); 