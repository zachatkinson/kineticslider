/**
 * Filter User Experience E2E Tests
 * 
 * Tests complete user workflows with the filter system including:
 * - Filter application and removal
 * - Intensity control interactions
 * - Visual feedback and performance
 * - Cross-browser compatibility
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { testSetup } from '../../utils/e2e-test-utilities';

// Extend Window interface for test utilities
declare global {
  interface Window {
    testFilters: {
      currentSlide: number;
      totalSlides: number;
      activeFilters: Set<string>;
      filterIntensities: Record<string, number>;
      init(): void;
      enableFilter(filterType: string): void;
      disableFilter(filterType: string): void;
      updateFilterIntensity(filterType: string, intensity: number): void;
      resetAllFilters(): void;
      previousSlide(): void;
      nextSlide(): void;
      getCurrentSlide(): number;
      getActiveFilters(): string[];
      getFilterIntensity(filterType: string): number;
    };
  }
}

/**
 * Setup filter test environment
 *
 * @param page - Playwright page object
 *
 * @returns Promise that resolves when setup is complete
 *
 */
async function setupFilterTest(page: Page): Promise<void> {
  await testSetup.setupBasicTestEnvironment(page, 'Filter User Experience Test');
  
  // Inject filter test environment
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Filter User Experience Test</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #f0f0f0;
          }
          
          .filter-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .slider-container {
            width: 100%;
            height: 400px;
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            margin-bottom: 20px;
          }
          
          .slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2em;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            transition: transform 0.3s ease;
          }
          
          .slide.active {
            transform: translateX(0);
          }
          
          .slide.next {
            transform: translateX(100%);
          }
          
          .slide.prev {
            transform: translateX(-100%);
          }
          
          .filter-controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .filter-control {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
          }
          
          .filter-control h3 {
            margin: 0 0 10px 0;
            color: #495057;
            font-size: 1.1em;
          }
          
          .filter-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          
          .filter-toggle input[type="checkbox"] {
            width: 18px;
            height: 18px;
          }
          
          .intensity-control {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .intensity-slider {
            flex: 1;
            height: 6px;
            border-radius: 3px;
            background: #dee2e6;
            outline: none;
            -webkit-appearance: none;
          }
          
          .intensity-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #007bff;
            cursor: pointer;
          }
          
          .intensity-value {
            min-width: 30px;
            text-align: center;
            font-weight: bold;
            color: #495057;
          }
          
          .performance-metrics {
            background: #e9ecef;
            padding: 15px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 0.9em;
          }
          
          .navigation-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
          }
          
          .nav-button {
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
          }
          
          .nav-button:hover {
            background: #0056b3;
          }
          
          .nav-button:disabled {
            background: #6c757d;
            cursor: not-allowed;
          }
        </style>
      </head>
      <body>
        <div class="filter-container">
          <h1>Filter User Experience Test</h1>
          
          <div class="slider-container" id="slider">
            <div class="slide active" data-slide="0">
              <div>Slide 1 - Test Content</div>
            </div>
            <div class="slide next" data-slide="1">
              <div>Slide 2 - More Content</div>
            </div>
            <div class="slide next" data-slide="2">
              <div>Slide 3 - Final Content</div>
            </div>
          </div>
          
          <div class="filter-controls">
            <div class="filter-control">
              <h3>Displacement Filter</h3>
              <div class="filter-toggle">
                <input type="checkbox" id="displacement-enabled" data-filter="displacement">
                <label for="displacement-enabled">Enable</label>
              </div>
              <div class="intensity-control">
                <label>Intensity:</label>
                <input type="range" class="intensity-slider" id="displacement-intensity" 
                       min="0" max="10" value="5" step="0.1" data-filter="displacement">
                <span class="intensity-value" id="displacement-value">5.0</span>
              </div>
            </div>
            
            <div class="filter-control">
              <h3>Blur Filter</h3>
              <div class="filter-toggle">
                <input type="checkbox" id="blur-enabled" data-filter="blur">
                <label for="blur-enabled">Enable</label>
              </div>
              <div class="intensity-control">
                <label>Intensity:</label>
                <input type="range" class="intensity-slider" id="blur-intensity" 
                       min="0" max="10" value="5" step="0.1" data-filter="blur">
                <span class="intensity-value" id="blur-value">5.0</span>
              </div>
            </div>
            
            <div class="filter-control">
              <h3>Glow Filter</h3>
              <div class="filter-toggle">
                <input type="checkbox" id="glow-enabled" data-filter="glow">
                <label for="glow-enabled">Enable</label>
              </div>
              <div class="intensity-control">
                <label>Intensity:</label>
                <input type="range" class="intensity-slider" id="glow-intensity" 
                       min="0" max="10" value="5" step="0.1" data-filter="glow">
                <span class="intensity-value" id="glow-value">5.0</span>
              </div>
            </div>
          </div>
          
          <div class="performance-metrics" id="performance">
            <div>Performance Metrics:</div>
            <div id="metrics-content">
              Active Filters: 0<br>
              Average Update Time: 0ms<br>
              Memory Usage: 0MB<br>
              Cache Hit Rate: 0%
            </div>
          </div>
          
          <div class="navigation-controls">
            <button class="nav-button" id="prev-btn">Previous</button>
            <button class="nav-button" id="next-btn">Next</button>
            <button class="nav-button" id="reset-btn">Reset Filters</button>
          </div>
        </div>
        
        <script>
          // Mock filter system for E2E testing
          window.testFilters = {
            currentSlide: 0,
            totalSlides: 3,
            activeFilters: new Set(),
            filterIntensities: {
              displacement: 5.0,
              blur: 5.0,
              glow: 5.0
            },
            
            // Initialize the test environment
            init() {
              this.setupEventListeners();
              this.updateSlideDisplay(); // Initialize navigation button states
              this.updateMetrics();
            },
            
            setupEventListeners() {
              // Filter toggle listeners
              document.querySelectorAll('input[type="checkbox"][data-filter]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                  const filterType = e.target.dataset.filter;
                  if (e.target.checked) {
                    this.enableFilter(filterType);
                  } else {
                    this.disableFilter(filterType);
                  }
                });
              });
              
              // Intensity slider listeners
              document.querySelectorAll('.intensity-slider[data-filter]').forEach(slider => {
                slider.addEventListener('input', (e) => {
                  const filterType = e.target.dataset.filter;
                  const intensity = parseFloat(e.target.value);
                  this.updateFilterIntensity(filterType, intensity);
                });
              });
              
              // Navigation listeners
              document.getElementById('prev-btn').addEventListener('click', () => {
                this.previousSlide();
              });
              
              document.getElementById('next-btn').addEventListener('click', () => {
                this.nextSlide();
              });
              
              document.getElementById('reset-btn').addEventListener('click', () => {
                this.resetAllFilters();
              });
            },
            
            enableFilter(filterType) {
              this.activeFilters.add(filterType);
              console.log(\`Enabled \${filterType} filter\`);
              this.updateMetrics();
              this.applyVisualEffect(filterType, true);
            },
            
            disableFilter(filterType) {
              this.activeFilters.delete(filterType);
              console.log(\`Disabled \${filterType} filter\`);
              this.updateMetrics();
              this.applyVisualEffect(filterType, false);
            },
            
            updateFilterIntensity(filterType, intensity) {
              this.filterIntensities[filterType] = intensity;
              document.getElementById(\`\${filterType}-value\`).textContent = intensity.toFixed(1);
              console.log(\`Updated \${filterType} intensity to \${intensity}\`);
              this.updateMetrics();
              
              if (this.activeFilters.has(filterType)) {
                this.applyVisualEffect(filterType, true);
              }
            },
            
            applyVisualEffect(filterType, enabled) {
              const slider = document.getElementById('slider');
              const intensity = this.filterIntensities[filterType];
              
              if (enabled) {
                switch (filterType) {
                  case 'displacement':
                    slider.style.transform = \`skew(\${intensity * 0.5}deg)\`;
                    break;
                  case 'blur':
                    slider.style.filter = \`blur(\${intensity * 0.5}px)\`;
                    break;
                  case 'glow':
                    slider.style.boxShadow = \`0 0 \${intensity * 5}px rgba(255,255,255,0.8)\`;
                    break;
                }
              } else {
                // Reset the specific effect
                switch (filterType) {
                  case 'displacement':
                    slider.style.transform = '';
                    break;
                  case 'blur':
                    slider.style.filter = '';
                    break;
                  case 'glow':
                    slider.style.boxShadow = '';
                    break;
                }
              }
            },
            
            resetAllFilters() {
              // Disable all filters
              this.activeFilters.clear();
              
              // Reset checkboxes
              document.querySelectorAll('input[type="checkbox"][data-filter]').forEach(checkbox => {
                checkbox.checked = false;
              });
              
              // Reset sliders
              document.querySelectorAll('.intensity-slider[data-filter]').forEach(slider => {
                slider.value = 5;
                const filterType = slider.dataset.filter;
                this.filterIntensities[filterType] = 5.0;
                document.getElementById(\`\${filterType}-value\`).textContent = '5.0';
              });
              
              // Reset visual effects
              const slider = document.getElementById('slider');
              slider.style.transform = '';
              slider.style.filter = '';
              slider.style.boxShadow = '';
              
              this.updateMetrics();
              console.log('Reset all filters');
            },
            
            previousSlide() {
              if (this.currentSlide > 0) {
                this.currentSlide--;
                this.updateSlideDisplay();
              }
            },
            
            nextSlide() {
              if (this.currentSlide < this.totalSlides - 1) {
                this.currentSlide++;
                this.updateSlideDisplay();
              }
            },
            
            updateSlideDisplay() {
              const slides = document.querySelectorAll('.slide');
              slides.forEach((slide, index) => {
                slide.className = 'slide';
                if (index === this.currentSlide) {
                  slide.classList.add('active');
                } else if (index > this.currentSlide) {
                  slide.classList.add('next');
                } else {
                  slide.classList.add('prev');
                }
              });
              
              // Update navigation buttons
              document.getElementById('prev-btn').disabled = this.currentSlide === 0;
              document.getElementById('next-btn').disabled = this.currentSlide === this.totalSlides - 1;
            },
            
            updateMetrics() {
              const metrics = {
                activeFilters: this.activeFilters.size,
                averageUpdateTime: Math.random() * 2, // Simulate update time
                memoryUsage: this.activeFilters.size * 0.5, // Simulate memory usage
                cacheHitRate: Math.random() * 100 // Simulate cache hit rate
              };
              
              document.getElementById('metrics-content').innerHTML = \`
                Active Filters: \${metrics.activeFilters}<br>
                Average Update Time: \${metrics.averageUpdateTime.toFixed(2)}ms<br>
                Memory Usage: \${metrics.memoryUsage.toFixed(1)}MB<br>
                Cache Hit Rate: \${metrics.cacheHitRate.toFixed(1)}%
              \`;
            },
            
            getCurrentSlide() {
              return this.currentSlide;
            },
            
            getActiveFilters() {
              return Array.from(this.activeFilters);
            },
            
            getFilterIntensity(filterType) {
              return this.filterIntensities[filterType];
            }
          };
          
          // Initialize when DOM is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              window.testFilters.init();
            });
          } else {
            window.testFilters.init();
          }
        </script>
      </body>
    </html>
  `);
  
  await page.waitForLoadState('domcontentloaded');
  await testSetup.waitForTestUtilities(page, 'testFilters');
}

test.describe('Filter User Experience E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupFilterTest(page);
  });

  test.describe('Filter Application', () => {
    test('should enable and disable filters correctly', async ({ page }) => {
      // Initially no filters should be active
      const initialActiveFilters = await page.evaluate(() => window.testFilters.getActiveFilters());
      expect(initialActiveFilters).toHaveLength(0);
      
      // Enable displacement filter
      await page.check('#displacement-enabled');
      await page.waitForTimeout(100);
      
      const activeFiltersAfterEnable = await page.evaluate(() => window.testFilters.getActiveFilters());
      expect(activeFiltersAfterEnable).toContain('displacement');
      
      // Disable displacement filter
      await page.uncheck('#displacement-enabled');
      await page.waitForTimeout(100);
      
      const activeFiltersAfterDisable = await page.evaluate(() => window.testFilters.getActiveFilters());
      expect(activeFiltersAfterDisable).not.toContain('displacement');
    });

    test('should apply multiple filters simultaneously', async ({ page }) => {
      // Enable multiple filters
      await page.check('#displacement-enabled');
      await page.check('#blur-enabled');
      await page.check('#glow-enabled');
      await page.waitForTimeout(200);
      
      const activeFilters = await page.evaluate(() => window.testFilters.getActiveFilters());
      expect(activeFilters).toHaveLength(3);
      expect(activeFilters).toContain('displacement');
      expect(activeFilters).toContain('blur');
      expect(activeFilters).toContain('glow');
    });

    test('should update performance metrics when filters are applied', async ({ page }) => {
      // Check initial metrics
      const initialMetrics = await page.textContent('#metrics-content');
      expect(initialMetrics).toContain('Active Filters: 0');
      
      // Enable a filter
      await page.check('#displacement-enabled');
      await page.waitForTimeout(100);
      
      // Check updated metrics
      const updatedMetrics = await page.textContent('#metrics-content');
      expect(updatedMetrics).toContain('Active Filters: 1');
    });
  });

  test.describe('Intensity Control', () => {
    test('should update filter intensity with slider', async ({ page }) => {
      // Enable displacement filter
      await page.check('#displacement-enabled');
      
      // Change intensity
      await page.fill('#displacement-intensity', '8');
      await page.waitForTimeout(100);
      
      const intensity = await page.evaluate(() => window.testFilters.getFilterIntensity('displacement'));
      expect(intensity).toBe(8);
      
      // Check that the display value updated
      const displayValue = await page.textContent('#displacement-value');
      expect(displayValue).toBe('8.0');
    });

    test('should handle intensity changes for multiple filters', async ({ page }) => {
      // Enable multiple filters
      await page.check('#displacement-enabled');
      await page.check('#blur-enabled');
      
      // Change intensities
      await page.fill('#displacement-intensity', '7');
      await page.fill('#blur-intensity', '3');
      await page.waitForTimeout(200);
      
      const displacementIntensity = await page.evaluate(() => window.testFilters.getFilterIntensity('displacement'));
      const blurIntensity = await page.evaluate(() => window.testFilters.getFilterIntensity('blur'));
      
      expect(displacementIntensity).toBe(7);
      expect(blurIntensity).toBe(3);
    });

    test('should respect intensity bounds', async ({ page }) => {
      await page.check('#displacement-enabled');
      
      // Test minimum value
      await page.fill('#displacement-intensity', '0');
      await page.waitForTimeout(100);
      
      let intensity = await page.evaluate(() => window.testFilters.getFilterIntensity('displacement'));
      expect(intensity).toBe(0);
      
      // Test maximum value
      await page.fill('#displacement-intensity', '10');
      await page.waitForTimeout(100);
      
      intensity = await page.evaluate(() => window.testFilters.getFilterIntensity('displacement'));
      expect(intensity).toBe(10);
    });
  });

  test.describe('Visual Feedback', () => {
    test('should apply visual effects when filters are enabled', async ({ page }) => {
      const slider = page.locator('#slider');
      
      // Check initial state (no effects)
      const initialTransform = await slider.evaluate(el => el.style.transform);
      expect(initialTransform).toBe('');
      
      // Enable displacement filter
      await page.check('#displacement-enabled');
      await page.waitForTimeout(100);
      
      // Check that visual effect was applied
      const transformAfterEnable = await slider.evaluate(el => el.style.transform);
      expect(transformAfterEnable).toContain('skew');
    });

    test('should remove visual effects when filters are disabled', async ({ page }) => {
      const slider = page.locator('#slider');
      
      // Enable and then disable blur filter
      await page.check('#blur-enabled');
      await page.waitForTimeout(100);
      
      let filterStyle = await slider.evaluate(el => el.style.filter);
      expect(filterStyle).toContain('blur');
      
      await page.uncheck('#blur-enabled');
      await page.waitForTimeout(100);
      
      filterStyle = await slider.evaluate(el => el.style.filter);
      expect(filterStyle).toBe('');
    });

    test('should update visual effects when intensity changes', async ({ page }) => {
      const slider = page.locator('#slider');
      
      await page.check('#glow-enabled');
      await page.fill('#glow-intensity', '2');
      await page.waitForTimeout(100);
      
      const lowIntensityGlow = await slider.evaluate(el => el.style.boxShadow);
      
      await page.fill('#glow-intensity', '8');
      await page.waitForTimeout(100);
      
      const highIntensityGlow = await slider.evaluate(el => el.style.boxShadow);
      
      // High intensity should create a more pronounced effect
      expect(lowIntensityGlow).not.toBe(highIntensityGlow);
    });
  });

  test.describe('Navigation Integration', () => {
    test('should maintain filters during slide navigation', async ({ page }) => {
      // Enable filters
      await page.check('#displacement-enabled');
      await page.check('#blur-enabled');
      
      // Navigate to next slide
      await page.click('#next-btn');
      await page.waitForTimeout(200);
      
      // Check that filters are still active
      const activeFilters = await page.evaluate(() => window.testFilters.getActiveFilters());
      expect(activeFilters).toHaveLength(2);
      
      // Check current slide
      const currentSlide = await page.evaluate(() => window.testFilters.getCurrentSlide());
      expect(currentSlide).toBe(1);
    });

    test('should handle navigation button states', async ({ page }) => {
      // Initially should be on first slide
      const prevBtn = page.locator('#prev-btn');
      const nextBtn = page.locator('#next-btn');
      
      expect(await prevBtn.isDisabled()).toBe(true);
      expect(await nextBtn.isDisabled()).toBe(false);
      
      // Navigate to last slide
      await page.click('#next-btn');
      await page.click('#next-btn');
      await page.waitForTimeout(200);
      
      expect(await prevBtn.isDisabled()).toBe(false);
      expect(await nextBtn.isDisabled()).toBe(true);
    });
  });

  test.describe('Reset Functionality', () => {
    test('should reset all filters when reset button is clicked', async ({ page }) => {
      // Enable multiple filters and change intensities
      await page.check('#displacement-enabled');
      await page.check('#blur-enabled');
      await page.fill('#displacement-intensity', '8');
      await page.fill('#blur-intensity', '3');
      await page.waitForTimeout(200);
      
      // Reset all filters
      await page.click('#reset-btn');
      await page.waitForTimeout(200);
      
      // Check that all filters are disabled
      const activeFilters = await page.evaluate(() => window.testFilters.getActiveFilters());
      expect(activeFilters).toHaveLength(0);
      
      // Check that intensities are reset to default
      const displacementIntensity = await page.evaluate(() => window.testFilters.getFilterIntensity('displacement'));
      const blurIntensity = await page.evaluate(() => window.testFilters.getFilterIntensity('blur'));
      
      expect(displacementIntensity).toBe(5);
      expect(blurIntensity).toBe(5);
      
      // Check that checkboxes are unchecked
      expect(await page.isChecked('#displacement-enabled')).toBe(false);
      expect(await page.isChecked('#blur-enabled')).toBe(false);
    });

    test('should remove all visual effects when reset', async ({ page }) => {
      const slider = page.locator('#slider');
      
      // Apply multiple effects
      await page.check('#displacement-enabled');
      await page.check('#blur-enabled');
      await page.check('#glow-enabled');
      await page.waitForTimeout(200);
      
      // Reset
      await page.click('#reset-btn');
      await page.waitForTimeout(200);
      
      // Check that all visual effects are removed
      const transform = await slider.evaluate(el => el.style.transform);
      const filter = await slider.evaluate(el => el.style.filter);
      const boxShadow = await slider.evaluate(el => el.style.boxShadow);
      
      expect(transform).toBe('');
      expect(filter).toBe('');
      expect(boxShadow).toBe('');
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should handle rapid filter changes smoothly', async ({ page }) => {
      // Rapidly toggle filters
      for (let i = 0; i < 5; i++) {
        await page.check('#displacement-enabled');
        await page.waitForTimeout(50);
        await page.uncheck('#displacement-enabled');
        await page.waitForTimeout(50);
      }
      
      // Should end in a consistent state
      const activeFilters = await page.evaluate(() => window.testFilters.getActiveFilters());
      expect(activeFilters).not.toContain('displacement');
    });

    test('should handle rapid intensity changes', async ({ page }) => {
      await page.check('#blur-enabled');
      
      // Rapidly change intensity
      const intensities = ['1', '5', '9', '3', '7'];
      for (const intensity of intensities) {
        await page.fill('#blur-intensity', intensity);
        await page.waitForTimeout(50);
      }
      
      // Should end with the last value
      const finalIntensity = await page.evaluate(() => window.testFilters.getFilterIntensity('blur'));
      expect(finalIntensity).toBe(7);
    });

    test('should maintain performance with multiple active filters', async ({ page }) => {
      // Enable all filters
      await page.check('#displacement-enabled');
      await page.check('#blur-enabled');
      await page.check('#glow-enabled');
      await page.waitForTimeout(200);
      
      // Check that metrics show reasonable performance
      const metricsText = await page.textContent('#metrics-content');
      expect(metricsText).toContain('Active Filters: 3');
      
      // Memory usage should be reasonable
      expect(metricsText).toMatch(/Memory Usage: [0-9.]+MB/);
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page, browserName }) => {
      // Test basic functionality
      await page.check('#displacement-enabled');
      await page.fill('#displacement-intensity', '6');
      await page.waitForTimeout(100);
      
      const activeFilters = await page.evaluate(() => window.testFilters.getActiveFilters());
      const intensity = await page.evaluate(() => window.testFilters.getFilterIntensity('displacement'));
      
      expect(activeFilters).toContain('displacement');
      expect(intensity).toBe(6);
      
      console.warn(`Filter test passed on ${browserName}`);
    });
  });
}); 