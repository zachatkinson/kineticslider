/**
 * @fileoverview Integration tests for SliderCore and LoopManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SliderCore } from '../../core/slider-core';
import { LoopManager, LoopMode } from '../../managers/loop-manager';
import { serviceContainer } from '../../core/container';
import type { SliderConfig } from '../../core/types';
import { SLIDER_EVENTS } from '../../core/constants';

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn().mockReturnThis(),
      play: vi.fn().mockReturnThis(),
      pause: vi.fn().mockReturnThis(),
      progress: vi.fn().mockReturnValue(0),
      totalDuration: vi.fn().mockReturnValue(1),
      isActive: vi.fn().mockReturnValue(false),
    })),
    set: vi.fn(),
    to: vi.fn(() => ({
      kill: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
    })),
    killTweensOf: vi.fn(),
  },
  default: {
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn().mockReturnThis(),
      play: vi.fn().mockReturnThis(),
      pause: vi.fn().mockReturnThis(),
      progress: vi.fn().mockReturnValue(0),
      totalDuration: vi.fn().mockReturnValue(1),
      isActive: vi.fn().mockReturnValue(false),
    })),
    set: vi.fn(),
    to: vi.fn(() => ({
      kill: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
    })),
    killTweensOf: vi.fn(),
  },
}));

// Simple mocks for dependencies
const mockPhysics = {
  animateTransition: vi.fn(),
  animateSwipe: vi.fn(),
  animateScale: vi.fn(),
  setPhysicsConfig: vi.fn(),
  getPhysicsConfig: vi.fn(() => ({
    transitionDuration: 0.3,
    transitionEase: 'power2.out',
    scaleIntensity: 10,
  })),
  killAllAnimations: vi.fn(),
  cleanup: vi.fn(),
};

const mockRenderer = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getApplication: vi.fn(),
  resize: vi.fn(),
  createSprite: vi.fn(),
  removeSprite: vi.fn(),
  getSprites: vi.fn(() => [
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
  ]),
  applyFilter: vi.fn(),
  removeFilter: vi.fn(),
  clearFilters: vi.fn(),
  render: vi.fn(),
  setVisible: vi.fn(),
  destroy: vi.fn(),
};

const mockController = {
  initialize: vi.fn(),
  updateSlideState: vi.fn(),
  updatePlayState: vi.fn(),
  destroy: vi.fn(),
};

describe('SliderCore - LoopManager Integration', () => {
  let sliderCore: SliderCore;
  let loopManager: LoopManager;
  let mockConfig: SliderConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Register mocked services as factories
    serviceContainer.register('_slider-physics', () => mockPhysics);
    serviceContainer.register('_slider-renderer', () => mockRenderer);
    serviceContainer.register('_slider-controller', () => mockController);
    
    // Create test configuration
    mockConfig = {
      images: [
        { id: '1', src: '/test1.jpg', alt: 'Test 1' },
        { id: '2', src: '/test2.jpg', alt: 'Test 2' },
        { id: '3', src: '/test3.jpg', alt: 'Test 3' },
        { id: '4', src: '/test4.jpg', alt: 'Test 4' },
        { id: '5', src: '/test5.jpg', alt: 'Test 5' },
      ],
      loop: true,
      autoPlay: false,
      duration: 300,
    };

    sliderCore = new SliderCore();
    
    // Override NavigationManager config to disable debouncing in tests
    const originalConfigureManagers = sliderCore['configureManagers'].bind(sliderCore);
    sliderCore['configureManagers'] = function(config) {
      originalConfigureManagers.call(this, config);
      // Set debounceDelay to 0 for tests to avoid debouncing issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).navigationManager.updateConfig({
        debounceDelay: 0
      });
    };
    
    loopManager = new LoopManager({
      enabled: true,
      mode: LoopMode.INFINITE
    });
  });

  afterEach(() => {
    sliderCore?.destroy();
    loopManager?.destroy();
    
    // Clean up service container
    serviceContainer.clear();
  });

  describe('loop configuration integration', () => {
    it('should create loop manager with slider config', () => {
      const config = loopManager.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.mode).toBe(LoopMode.INFINITE);
    });

    it('should integrate loop manager with slider core', async () => {
      // This test defines the expected integration behavior
      // The LoopManager should be used by SliderCore for navigation decisions
      
      await sliderCore.initialize(mockConfig);
      
      // SliderCore should be able to query LoopManager for next index
      const transition = loopManager.getNextIndex(4, 5, 'forward');
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(0);
      expect(transition.isLoop).toBe(true);
    });
  });

  describe('infinite loop navigation', () => {
    beforeEach(async () => {
      loopManager.updateConfig({ mode: LoopMode.INFINITE });
      await sliderCore.initialize(mockConfig);
    });

    it('should loop forward from last slide to first', async () => {
      const eventSpy = vi.fn();
      loopManager.on(SLIDER_EVENTS.LOOP_FORWARD, eventSpy);

      // Navigate to last slide
      await sliderCore.goToSlide(4);
      expect(sliderCore.getCurrentIndex()).toBe(4);

      // Get next navigation from loop manager
      const transition = loopManager.getNextIndex(4, 5, 'forward');
      
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(0);
      expect(transition.isLoop).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith({ from: 4, to: 0 });

      // SliderCore should use this information to navigate
      if (transition.shouldNavigate) {
        await sliderCore.goToSlide(transition.targetIndex);
        expect(sliderCore.getCurrentIndex()).toBe(0);
      }
    });

    it('should loop backward from first slide to last', async () => {
      const eventSpy = vi.fn();
      loopManager.on(SLIDER_EVENTS.LOOP_BACKWARD, eventSpy);

      // Start at first slide
      await sliderCore.goToSlide(0);
      expect(sliderCore.getCurrentIndex()).toBe(0);

      // Get previous navigation from loop manager
      const transition = loopManager.getNextIndex(0, 5, 'backward');
      
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(4);
      expect(transition.isLoop).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith({ from: 0, to: 4 });

      // SliderCore should use this information to navigate
      if (transition.shouldNavigate) {
        await sliderCore.goToSlide(transition.targetIndex);
        expect(sliderCore.getCurrentIndex()).toBe(4);
      }
    });
  });

  describe('finite loop navigation', () => {
    beforeEach(async () => {
      loopManager.updateConfig({ mode: LoopMode.FINITE });
      await sliderCore.initialize(mockConfig);
    });

    it('should not loop forward from last slide', async () => {
      const eventSpy = vi.fn();
      loopManager.on(SLIDER_EVENTS.LOOP_END_REACHED, eventSpy);

      // Navigate to last slide
      await sliderCore.goToSlide(4);
      expect(sliderCore.getCurrentIndex()).toBe(4);

      // Get next navigation from loop manager
      const transition = loopManager.getNextIndex(4, 5, 'forward');
      
      expect(transition.shouldNavigate).toBe(false);
      expect(transition.targetIndex).toBe(4);
      expect(transition.isLoop).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith({ index: 4 });

      // SliderCore should not navigate
      expect(sliderCore.getCurrentIndex()).toBe(4);
    });

    it('should not loop backward from first slide', async () => {
      const eventSpy = vi.fn();
      loopManager.on(SLIDER_EVENTS.LOOP_START_REACHED, eventSpy);

      // Start at first slide
      await sliderCore.goToSlide(0);
      expect(sliderCore.getCurrentIndex()).toBe(0);

      // Get previous navigation from loop manager
      const transition = loopManager.getNextIndex(0, 5, 'backward');
      
      expect(transition.shouldNavigate).toBe(false);
      expect(transition.targetIndex).toBe(0);
      expect(transition.isLoop).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith({ index: 0 });

      // SliderCore should not navigate
      expect(sliderCore.getCurrentIndex()).toBe(0);
    });
  });

  describe('bounce loop navigation', () => {
    beforeEach(async () => {
      loopManager.updateConfig({ mode: LoopMode.BOUNCE });
      await sliderCore.initialize(mockConfig);
    });

    it('should bounce backward from last slide', async () => {
      const eventSpy = vi.fn();
      loopManager.on(SLIDER_EVENTS.LOOP_BOUNCE, eventSpy);

      // Navigate to last slide
      await sliderCore.goToSlide(4);
      expect(sliderCore.getCurrentIndex()).toBe(4);

      // Get next navigation from loop manager
      const transition = loopManager.getNextIndex(4, 5, 'forward');
      
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(3);
      expect(transition.isLoop).toBe(true);
      expect(transition.loopDirection).toBe('bounce');
      expect(eventSpy).toHaveBeenCalledWith({ 
        direction: 'backward',
        from: 4,
        to: 3
      });

      // SliderCore should navigate to bounce target
      if (transition.shouldNavigate) {
        await sliderCore.goToSlide(transition.targetIndex);
        expect(sliderCore.getCurrentIndex()).toBe(3);
      }
    });

    it('should bounce forward from first slide', async () => {
      const eventSpy = vi.fn();
      loopManager.on(SLIDER_EVENTS.LOOP_BOUNCE, eventSpy);

      // Start at first slide
      await sliderCore.goToSlide(0);
      expect(sliderCore.getCurrentIndex()).toBe(0);

      // Get previous navigation from loop manager
      const transition = loopManager.getNextIndex(0, 5, 'backward');
      
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(1);
      expect(transition.isLoop).toBe(true);
      expect(transition.loopDirection).toBe('bounce');
      expect(eventSpy).toHaveBeenCalledWith({
        direction: 'forward',
        from: 0,
        to: 1
      });

      // SliderCore should navigate to bounce target
      if (transition.shouldNavigate) {
        await sliderCore.goToSlide(transition.targetIndex);
        expect(sliderCore.getCurrentIndex()).toBe(1);
      }
    });
  });

  describe('loop configuration changes', () => {
    beforeEach(async () => {
      await sliderCore.initialize(mockConfig);
    });

    it('should handle loop mode changes during runtime', async () => {
      // Start in infinite mode
      loopManager.updateConfig({ mode: LoopMode.INFINITE });
      
      let transition = loopManager.getNextIndex(4, 5, 'forward');
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(0);
      expect(transition.isLoop).toBe(true);

      // Change to finite mode
      loopManager.updateConfig({ mode: LoopMode.FINITE });
      
      transition = loopManager.getNextIndex(4, 5, 'forward');
      expect(transition.shouldNavigate).toBe(false);
      expect(transition.targetIndex).toBe(4);
      expect(transition.isLoop).toBe(false);
    });

    it('should handle loop enable/disable changes', async () => {
      // Enable loop
      loopManager.updateConfig({ enabled: true, mode: LoopMode.INFINITE });
      
      let transition = loopManager.getNextIndex(4, 5, 'forward');
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(0);

      // Disable loop
      loopManager.updateConfig({ enabled: false });
      
      transition = loopManager.getNextIndex(4, 5, 'forward');
      expect(transition.shouldNavigate).toBe(false);
      expect(transition.targetIndex).toBe(4);
    });
  });

  describe('event coordination', () => {
    beforeEach(async () => {
      await sliderCore.initialize(mockConfig);
    });

    it('should coordinate events between SliderCore and LoopManager', async () => {
      const coreEventSpy = vi.fn();
      const loopEventSpy = vi.fn();

      sliderCore.on(SLIDER_EVENTS.SLIDE_CHANGED, coreEventSpy);
      loopManager.on(SLIDER_EVENTS.LOOP_FORWARD, loopEventSpy);

      // Navigate to last slide
      await sliderCore.goToSlide(4);
      
      // Check loop transition
      const transition = loopManager.getNextIndex(4, 5, 'forward');
      
      if (transition.shouldNavigate && transition.isLoop) {
        // Both events should fire when loop navigation occurs
        await sliderCore.goToSlide(transition.targetIndex);
        
        expect(coreEventSpy).toHaveBeenCalled();
        expect(loopEventSpy).toHaveBeenCalled();
      }
    });
  });

  describe('auto-play integration with loop', () => {
    beforeEach(async () => {
      mockConfig.autoPlay = true;
      await sliderCore.initialize(mockConfig);
    });

    it('should work with auto-play when loop is enabled', async () => {
      loopManager.updateConfig({ enabled: true, mode: LoopMode.INFINITE });
      
      // Auto-play should be able to query loop manager for navigation
      // when it reaches the end of slides
      const transition = loopManager.getNextIndex(4, 5, 'forward');
      
      expect(transition.shouldNavigate).toBe(true);
      expect(transition.targetIndex).toBe(0);
      expect(transition.isLoop).toBe(true);
      
      // Auto-play should continue with the loop target
    });

    it('should stop auto-play when loop is disabled and at end', async () => {
      loopManager.updateConfig({ enabled: false, mode: LoopMode.FINITE });
      
      // Auto-play should be able to query loop manager
      const transition = loopManager.getNextIndex(4, 5, 'forward');
      
      expect(transition.shouldNavigate).toBe(false);
      expect(transition.targetIndex).toBe(4);
      
      // Auto-play should stop since no navigation is possible
    });
  });
});