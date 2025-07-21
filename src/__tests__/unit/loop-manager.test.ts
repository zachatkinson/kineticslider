/**
 * @fileoverview Unit tests for LoopManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoopManager, LoopMode } from '../../managers/loop-manager';
import { SLIDER_EVENTS } from '../../core/constants';

describe('LoopManager', () => {
  let manager: LoopManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new LoopManager({
      enabled: true,
      mode: LoopMode.INFINITE,
      useVirtualSlides: false,
      maxVirtualSlides: 4,
      bounceEffects: true
    });
  });

  afterEach(() => {
    manager.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('construction', () => {
    it('should create with default configuration', () => {
      const defaultManager = new LoopManager();
      const config = defaultManager.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.mode).toBe(LoopMode.INFINITE);
      expect(config.useVirtualSlides).toBe(false);
      expect(config.maxVirtualSlides).toBe(4);
      expect(config.bounceEffects).toBe(true);
      
      defaultManager.destroy();
    });

    it('should create with custom configuration', () => {
      const customManager = new LoopManager({
        enabled: false,
        mode: LoopMode.FINITE,
        useVirtualSlides: true,
        maxVirtualSlides: 10,
        bounceEffects: false
      });
      
      const config = customManager.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.mode).toBe(LoopMode.FINITE);
      expect(config.useVirtualSlides).toBe(true);
      expect(config.maxVirtualSlides).toBe(10);
      expect(config.bounceEffects).toBe(false);
      
      customManager.destroy();
    });
  });

  describe('infinite loop mode', () => {
    beforeEach(() => {
      manager.updateConfig({ mode: LoopMode.INFINITE });
    });

    it('should loop forward from last slide to first', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_FORWARD, eventSpy);

      const result = manager.getNextIndex(4, 5, 'forward');

      expect(result.shouldNavigate).toBe(true);
      expect(result.targetIndex).toBe(0);
      expect(result.isLoop).toBe(true);
      expect(result.loopDirection).toBe('forward');
      expect(eventSpy).toHaveBeenCalledWith({ from: 4, to: 0 });
    });

    it('should loop backward from first slide to last', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_BACKWARD, eventSpy);

      const result = manager.getNextIndex(0, 5, 'backward');

      expect(result.shouldNavigate).toBe(true);
      expect(result.targetIndex).toBe(4);
      expect(result.isLoop).toBe(true);
      expect(result.loopDirection).toBe('backward');
      expect(eventSpy).toHaveBeenCalledWith({ from: 0, to: 4 });
    });

    it('should navigate normally within bounds', () => {
      const result = manager.getNextIndex(2, 5, 'forward');

      expect(result.shouldNavigate).toBe(true);
      expect(result.targetIndex).toBe(3);
      expect(result.isLoop).toBe(false);
      expect(result.loopDirection).toBe('forward');
    });
  });

  describe('finite loop mode', () => {
    beforeEach(() => {
      manager.updateConfig({ mode: LoopMode.FINITE });
    });

    it('should not loop forward from last slide', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_END_REACHED, eventSpy);

      const result = manager.getNextIndex(4, 5, 'forward');

      expect(result.shouldNavigate).toBe(false);
      expect(result.targetIndex).toBe(4);
      expect(result.isLoop).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith({ index: 4 });
    });

    it('should not loop backward from first slide', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_START_REACHED, eventSpy);

      const result = manager.getNextIndex(0, 5, 'backward');

      expect(result.shouldNavigate).toBe(false);
      expect(result.targetIndex).toBe(0);
      expect(result.isLoop).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith({ index: 0 });
    });

    it('should navigate normally within bounds', () => {
      const result = manager.getNextIndex(2, 5, 'forward');

      expect(result.shouldNavigate).toBe(true);
      expect(result.targetIndex).toBe(3);
      expect(result.isLoop).toBe(false);
    });
  });

  describe('bounce loop mode', () => {
    beforeEach(() => {
      manager.updateConfig({ mode: LoopMode.BOUNCE });
    });

    it('should bounce backward from last slide', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_BOUNCE, eventSpy);

      const result = manager.getNextIndex(4, 5, 'forward');

      expect(result.shouldNavigate).toBe(true);
      expect(result.targetIndex).toBe(3);
      expect(result.isLoop).toBe(true);
      expect(result.loopDirection).toBe('bounce');
      expect(manager.getBounceDirection()).toBe('backward');
      expect(eventSpy).toHaveBeenCalledWith({ 
        direction: 'backward',
        from: 4,
        to: 3
      });
    });

    it('should bounce forward from first slide', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_BOUNCE, eventSpy);

      const result = manager.getNextIndex(0, 5, 'backward');

      expect(result.shouldNavigate).toBe(true);
      expect(result.targetIndex).toBe(1);
      expect(result.isLoop).toBe(true);
      expect(result.loopDirection).toBe('bounce');
      expect(manager.getBounceDirection()).toBe('forward');
      expect(eventSpy).toHaveBeenCalledWith({
        direction: 'forward',
        from: 0,
        to: 1
      });
    });

    it('should handle bounce at edge of single slide', () => {
      const result = manager.getNextIndex(0, 1, 'forward');
      expect(result.shouldNavigate).toBe(true);
      expect(result.targetIndex).toBe(0);
      expect(result.isLoop).toBe(true);
    });
  });

  describe('disabled loop', () => {
    beforeEach(() => {
      manager.updateConfig({ enabled: false });
    });

    it('should not navigate when disabled', () => {
      const result = manager.getNextIndex(4, 5, 'forward');

      expect(result.shouldNavigate).toBe(false);
      expect(result.targetIndex).toBe(4);
      expect(result.isLoop).toBe(false);
    });

    it('should not navigate with single slide', () => {
      manager.updateConfig({ enabled: true });
      const result = manager.getNextIndex(0, 1, 'forward');

      expect(result.shouldNavigate).toBe(false);
      expect(result.targetIndex).toBe(0);
      expect(result.isLoop).toBe(false);
    });
  });

  describe('rapid direction changes', () => {
    it('should handle rapid direction changes', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.RAPID_DIRECTION_CHANGE, eventSpy);

      expect(manager.isRapidlyChanging()).toBe(false);

      manager.handleRapidDirectionChange();

      expect(manager.isRapidlyChanging()).toBe(true);
      expect(eventSpy).toHaveBeenCalled();

      // Should reset after timeout
      vi.advanceTimersByTime(500);
      expect(manager.isRapidlyChanging()).toBe(false);
    });

    it('should extend rapid changing period with multiple calls', () => {
      manager.handleRapidDirectionChange();
      vi.advanceTimersByTime(300);
      
      manager.handleRapidDirectionChange();
      vi.advanceTimersByTime(400);
      
      expect(manager.isRapidlyChanging()).toBe(true);
      
      vi.advanceTimersByTime(100);
      expect(manager.isRapidlyChanging()).toBe(false);
    });
  });

  describe('virtual slides', () => {
    beforeEach(() => {
      manager.updateConfig({ useVirtualSlides: true, maxVirtualSlides: 3 });
    });

    it('should create virtual slides when enabled', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.VIRTUAL_SLIDE_CREATED, eventSpy);

      const virtualSlide = manager.createVirtualSlide(2, 'before');

      expect(virtualSlide).toBeTruthy();
      expect(virtualSlide?.originalIndex).toBe(2);
      expect(virtualSlide?.position).toBe('before');
      expect(virtualSlide?.id).toContain('virtual-2-before-');
      expect(eventSpy).toHaveBeenCalledWith({ virtualSlide });
    });

    it('should not create virtual slides when disabled', () => {
      manager.updateConfig({ useVirtualSlides: false });

      const virtualSlide = manager.createVirtualSlide(2, 'before');

      expect(virtualSlide).toBeNull();
    });

    it('should respect maximum virtual slides limit', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.VIRTUAL_SLIDE_REMOVED, eventSpy);

      // Create max slides
      manager.createVirtualSlide(0, 'before');
      manager.createVirtualSlide(1, 'before');
      manager.createVirtualSlide(2, 'before');

      expect(manager.getVirtualSlides()).toHaveLength(3);

      // Creating one more should remove the oldest
      manager.createVirtualSlide(3, 'after');

      expect(manager.getVirtualSlides()).toHaveLength(3);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should remove specific virtual slides', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.VIRTUAL_SLIDE_REMOVED, eventSpy);

      const virtualSlide = manager.createVirtualSlide(1, 'after');
      expect(manager.getVirtualSlides()).toHaveLength(1);

      manager.removeVirtualSlide(virtualSlide!.id);

      expect(manager.getVirtualSlides()).toHaveLength(0);
      expect(eventSpy).toHaveBeenCalledWith({ virtualSlide });
    });

    it('should clean up all virtual slides', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.VIRTUAL_SLIDES_CLEANUP, eventSpy);

      manager.createVirtualSlide(0, 'before');
      manager.createVirtualSlide(1, 'after');
      expect(manager.getVirtualSlides()).toHaveLength(2);

      manager.cleanupAllVirtualSlides();

      expect(manager.getVirtualSlides()).toHaveLength(0);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('configuration updates', () => {
    it('should update configuration and emit events', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_CONFIG_UPDATED, eventSpy);

      const updates = {
        mode: LoopMode.BOUNCE,
        maxVirtualSlides: 10
      };

      manager.updateConfig(updates);

      const config = manager.getConfig();
      expect(config.mode).toBe(LoopMode.BOUNCE);
      expect(config.maxVirtualSlides).toBe(10);
      
      expect(eventSpy).toHaveBeenCalledWith({
        config: expect.objectContaining(updates),
        oldMode: LoopMode.INFINITE,
        newMode: LoopMode.BOUNCE
      });
    });

    it('should reset bounce direction when mode changes', () => {
      manager.updateConfig({ mode: LoopMode.BOUNCE });
      
      // Set bounce direction to backward
      manager.getNextIndex(4, 5, 'forward');
      expect(manager.getBounceDirection()).toBe('backward');

      // Change mode should reset bounce direction
      manager.updateConfig({ mode: LoopMode.INFINITE });
      expect(manager.getBounceDirection()).toBe('forward');
    });

    it('should cleanup virtual slides when disabled', () => {
      manager.updateConfig({ useVirtualSlides: true });
      manager.createVirtualSlide(0, 'before');
      expect(manager.getVirtualSlides()).toHaveLength(1);

      manager.updateConfig({ useVirtualSlides: false });
      expect(manager.getVirtualSlides()).toHaveLength(0);
    });
  });

  describe('state checks', () => {
    it('should check if loop is enabled', () => {
      expect(manager.isEnabled()).toBe(true);
      
      manager.updateConfig({ enabled: false });
      expect(manager.isEnabled()).toBe(false);
    });

    it('should check loop modes', () => {
      manager.updateConfig({ mode: LoopMode.INFINITE });
      expect(manager.isInfinite()).toBe(true);
      expect(manager.isFinite()).toBe(false);
      expect(manager.isBounce()).toBe(false);

      manager.updateConfig({ mode: LoopMode.FINITE });
      expect(manager.isInfinite()).toBe(false);
      expect(manager.isFinite()).toBe(true);
      expect(manager.isBounce()).toBe(false);

      manager.updateConfig({ mode: LoopMode.BOUNCE });
      expect(manager.isInfinite()).toBe(false);
      expect(manager.isFinite()).toBe(false);
      expect(manager.isBounce()).toBe(true);
    });

    it('should return false for mode checks when disabled', () => {
      manager.updateConfig({ enabled: false, mode: LoopMode.INFINITE });
      
      expect(manager.isInfinite()).toBe(false);
      expect(manager.isFinite()).toBe(false);
      expect(manager.isBounce()).toBe(false);
    });
  });

  describe('reset and destroy', () => {
    it('should reset manager state', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_RESET, eventSpy);

      // Set some state
      manager.updateConfig({ useVirtualSlides: true });
      manager.createVirtualSlide(0, 'before');
      manager.handleRapidDirectionChange();

      expect(manager.getVirtualSlides()).toHaveLength(1);
      expect(manager.isRapidlyChanging()).toBe(true);

      manager.reset();

      expect(manager.getBounceDirection()).toBe('forward');
      expect(manager.isRapidlyChanging()).toBe(false);
      expect(manager.getVirtualSlides()).toHaveLength(0);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should destroy and cleanup all resources', () => {
      const resetSpy = vi.fn();
      const destroySpy = vi.fn();
      manager.on(SLIDER_EVENTS.LOOP_RESET, resetSpy);
      manager.on(SLIDER_EVENTS.LOOP_DESTROYED, destroySpy);

      // Create some state to cleanup
      manager.updateConfig({ useVirtualSlides: true });
      manager.createVirtualSlide(0, 'before');

      manager.destroy();

      expect(resetSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
      expect(manager.getVirtualSlides()).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty slide set', () => {
      const result = manager.getNextIndex(0, 0, 'forward');
      
      expect(result.shouldNavigate).toBe(false);
      expect(result.targetIndex).toBe(0);
      expect(result.isLoop).toBe(false);
    });

    it('should handle single slide gracefully', () => {
      const result = manager.getNextIndex(0, 1, 'forward');
      
      expect(result.shouldNavigate).toBe(false);
      expect(result.targetIndex).toBe(0);
      expect(result.isLoop).toBe(false);
    });

    it('should handle invalid virtual slide removal', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.VIRTUAL_SLIDE_REMOVED, eventSpy);

      manager.removeVirtualSlide('non-existent-id');

      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should handle bounce with bounds checking', () => {
      manager.updateConfig({ mode: LoopMode.BOUNCE });
      
      // Test bounce at zero should not go negative
      const result = manager.getNextIndex(0, 5, 'backward');
      expect(result.targetIndex).toBeGreaterThanOrEqual(0);
      
      // Test bounce at max should not exceed bounds
      const result2 = manager.getNextIndex(4, 5, 'forward');
      expect(result2.targetIndex).toBeLessThan(5);
    });
  });
});