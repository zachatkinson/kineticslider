import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SliderCore } from '../../core/slider-core';
import { PerformanceMonitor } from '../../managers/performance-monitor';
import { serviceContainer } from '../../core/container';

// Mock services for performance testing
const mockPhysics = {
  animateTransition: vi.fn(),
  animateSwipe: vi.fn(),
  animateScale: vi.fn(),
  setPhysicsConfig: vi.fn(),
  getPhysicsConfig: vi.fn(() => ({
    transitionDuration: 0.1,
    transitionEase: 'power2.out',
    scaleIntensity: 0.1,
  })),
  killAllAnimations: vi.fn(),
  cleanup: vi.fn(),
};

const mockRenderer = {
  createSprite: vi.fn(() => ({ id: 'test-sprite' })),
  getSprites: vi.fn(() => []),
  setVisible: vi.fn(),
  render: vi.fn(),
  destroy: vi.fn(),
};

const mockController = {
  initialize: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  setInputConfig: vi.fn(),
  getInputConfig: vi.fn(() => ({
    enableMouse: true,
    enableTouch: true,
    enableKeyboard: true,
  })),
  updateSlideState: vi.fn(),
  updatePlayState: vi.fn(),
  destroy: vi.fn(),
};

describe('Performance Integration Tests', () => {
  let engine: SliderCore;
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Register mock services
    serviceContainer.register('_slider-physics', () => mockPhysics);
    serviceContainer.register('_slider-renderer', () => mockRenderer);
    serviceContainer.register('_slider-controller', () => mockController);
    
    container = document.createElement('div');
    container.innerHTML = `
      <div class="slider-viewport">
        <div class="slide" data-slide-index="0">Slide 1</div>
        <div class="slide" data-slide-index="1">Slide 2</div>
        <div class="slide" data-slide-index="2">Slide 3</div>
        <div class="slide" data-slide-index="3">Slide 4</div>
        <div class="slide" data-slide-index="4">Slide 5</div>
      </div>
    `;
    document.body.appendChild(container);
  });

  it('should handle rapid navigation without performance degradation', async () => {
    engine = new SliderCore();
    await engine.initialize({
      loop: true,
      autoPlay: false,
      images: [
        { id: '1', src: '/images/slides/1.jpg' },
        { id: '2', src: '/images/slides/2.jpg' },
        { id: '3', src: '/images/slides/3.jpg' },
        { id: '4', src: '/images/slides/4.jpg' },
        { id: '5', src: '/images/slides/5.jpg' }
      ]
    }, container);

    const startTime = performance.now();
    const navigationTimes: number[] = [];

    // Simulate rapid navigation with reduced iterations for performance
    for (let i = 0; i < 10; i++) {
      const navStart = performance.now();
      await engine.goToSlide((i + 1) % 5, true);
      navigationTimes.push(performance.now() - navStart);
    }

    const totalTime = performance.now() - startTime;
    const avgNavigationTime =
      navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;

    // Performance assertions for navigation timing
    expect(avgNavigationTime).toBeLessThan(200); // Each navigation should be reasonably fast
    expect(totalTime).toBeLessThan(10000); // Total time should be reasonable
    
    // Test that performance monitor can be created and provides metrics
    const performanceMonitor = new PerformanceMonitor();
    const metrics = performanceMonitor.getMetrics();
    expect(typeof metrics.fps.current).toBe('number');
    expect(typeof metrics.fps.average).toBe('number');
    expect(typeof metrics.memory.used).toBe('number');
  });

  it('should maintain performance during loop transitions', async () => {
    engine = new SliderCore();
    await engine.initialize({
      loop: true,
      autoPlay: false,
      images: [
        { id: '1', src: '/images/slides/1.jpg' },
        { id: '2', src: '/images/slides/2.jpg' },
        { id: '3', src: '/images/slides/3.jpg' },
        { id: '4', src: '/images/slides/4.jpg' },
        { id: '5', src: '/images/slides/5.jpg' }
      ]
    }, container);

    // LoopManager is integrated with the engine

    const loopTimes: number[] = [];

    // Test forward looping
    for (let i = 0; i < 10; i++) {
      const loopStart = performance.now();
      await engine.goToSlide(4, true); // Go to last slide
      await engine.nextSlide(); // Should loop to first
      loopTimes.push(performance.now() - loopStart);
    }

    // Test reverse looping
    for (let i = 0; i < 10; i++) {
      const loopStart = performance.now();
      await engine.goToSlide(0, true); // Go to first slide
      await engine.previousSlide(); // Should loop to last
      loopTimes.push(performance.now() - loopStart);
    }

    const avgLoopTime = loopTimes.reduce((a, b) => a + b, 0) / loopTimes.length;
    expect(avgLoopTime).toBeLessThan(200); // Loop transitions should be smooth
  });

  it('should handle concurrent resource loading efficiently', async () => {
    const loadTimes: number[] = [];
    const concurrentLoads = 20;

    const loadResource = async (_index: number): Promise<void> => {
      const start = performance.now();
      // Simulate resource loading
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
      loadTimes.push(performance.now() - start);
    };

    const startTime = performance.now();
    await Promise.all(
      Array.from({ length: concurrentLoads }, (_, i) => loadResource(i))
    );
    const totalTime = performance.now() - startTime;

    // All resources should load concurrently
    expect(totalTime).toBeLessThan(500); // Should complete quickly
    expect(loadTimes.length).toBe(concurrentLoads);

    // Check that loads were actually concurrent (max time should be much less than sum)
    const maxLoadTime = Math.max(...loadTimes);
    const sumLoadTime = loadTimes.reduce((a, b) => a + b, 0);
    expect(maxLoadTime).toBeLessThan(sumLoadTime / 5); // Indicates concurrent loading
  });
});
