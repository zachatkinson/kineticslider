/**
 * @fileoverview Unit tests for AutoPlayManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoPlayManager, PauseReason } from '../../managers/auto-play-manager';
import { SLIDER_EVENTS } from '../../core/constants';

describe('AutoPlayManager', () => {
  let manager: AutoPlayManager;
  let onNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onNext = vi.fn().mockResolvedValue(undefined);
    manager = new AutoPlayManager({
      enabled: true,
      interval: 1000,
      pauseOnHover: true,
      pauseOnFocus: true,
      pauseOnInteraction: true,
      resumeAfterInteraction: true,
      resumeDelay: 3000,
    });
  });

  afterEach(() => {
    manager.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('start()', () => {
    it('should start auto-play when enabled', () => {
      const startedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_STARTED, startedSpy);

      manager.start(onNext);

      expect(startedSpy).toHaveBeenCalled();
      expect(manager.getState().isPlaying).toBe(true);
    });

    it('should not start if already playing', () => {
      const startedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_STARTED, startedSpy);

      manager.start(onNext);
      manager.start(onNext);

      expect(startedSpy).toHaveBeenCalledTimes(1);
    });

    it('should not start if disabled', () => {
      manager.updateConfig({ enabled: false });
      const startedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_STARTED, startedSpy);

      manager.start(onNext);

      expect(startedSpy).not.toHaveBeenCalled();
      expect(manager.getState().isPlaying).toBe(false);
    });

    it('should schedule next slide after interval', async () => {
      manager.start(onNext);

      expect(onNext).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1000);

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should continue scheduling after successful onNext', async () => {
      manager.start(onNext);

      await vi.advanceTimersByTimeAsync(1000);
      expect(onNext).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(onNext).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1000);
      expect(onNext).toHaveBeenCalledTimes(3);
    });
  });

  describe('pause()', () => {
    it('should pause auto-play with manual reason', () => {
      const pausedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_PAUSED, pausedSpy);

      manager.start(onNext);
      manager.pause();

      expect(pausedSpy).toHaveBeenCalledWith({ reason: PauseReason.MANUAL });
      expect(manager.getState().isPaused).toBe(true);
    });

    it('should not schedule next slide when paused', async () => {
      manager.start(onNext);
      manager.pause();

      await vi.advanceTimersByTimeAsync(2000);

      expect(onNext).not.toHaveBeenCalled();
    });

    it('should track multiple pause reasons', () => {
      const pausedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_PAUSED, pausedSpy);

      manager.start(onNext);
      manager.pause(PauseReason.HOVER);
      manager.pause(PauseReason.FOCUS);

      // Should only emit once for first pause
      expect(pausedSpy).toHaveBeenCalledTimes(1);
      expect(manager.getState().pauseReasons).toContain(PauseReason.HOVER);
      expect(manager.getState().pauseReasons).toContain(PauseReason.FOCUS);
    });
  });

  describe('resume()', () => {
    it('should resume when all pause reasons are cleared', async () => {
      const resumedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_RESUMED, resumedSpy);

      manager.start(onNext);
      manager.pause(PauseReason.HOVER);
      manager.resume(PauseReason.HOVER, onNext);

      expect(resumedSpy).toHaveBeenCalledWith({ reason: PauseReason.HOVER });
      expect(manager.getState().isPaused).toBe(false);

      await vi.advanceTimersByTimeAsync(1000);
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should not resume if other pause reasons exist', () => {
      const resumedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_RESUMED, resumedSpy);

      manager.start(onNext);
      manager.pause(PauseReason.HOVER);
      manager.pause(PauseReason.FOCUS);
      manager.resume(PauseReason.HOVER, onNext);

      expect(resumedSpy).not.toHaveBeenCalled();
      expect(manager.getState().isPaused).toBe(true);
      expect(manager.getState().pauseReasons).toContain(PauseReason.FOCUS);
    });
  });

  describe('stop()', () => {
    it('should stop auto-play completely', async () => {
      const stoppedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_STOPPED, stoppedSpy);

      manager.start(onNext);
      manager.stop();

      expect(stoppedSpy).toHaveBeenCalled();
      expect(manager.getState().isPlaying).toBe(false);
      expect(manager.getState().pauseReasons).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(2000);
      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe('toggle()', () => {
    it('should start when stopped', () => {
      manager.toggle(onNext);

      expect(manager.getState().isPlaying).toBe(true);
    });

    it('should pause when playing', () => {
      manager.start(onNext);
      manager.toggle(onNext);

      expect(manager.getState().isPaused).toBe(true);
      expect(manager.getState().pauseReasons).toContain(PauseReason.MANUAL);
    });

    it('should resume when manually paused', () => {
      manager.start(onNext);
      manager.pause(PauseReason.MANUAL);
      manager.toggle(onNext);

      expect(manager.getState().isPaused).toBe(false);
    });
  });

  describe('handleHover()', () => {
    it('should pause on hover when enabled', () => {
      manager.start(onNext);
      manager.handleHover(true, onNext);

      expect(manager.getState().pauseReasons).toContain(PauseReason.HOVER);
    });

    it('should resume on hover leave', () => {
      manager.start(onNext);
      manager.handleHover(true, onNext);
      manager.handleHover(false, onNext);

      expect(manager.getState().pauseReasons).not.toContain(PauseReason.HOVER);
    });

    it('should not pause on hover when disabled', () => {
      manager.updateConfig({ pauseOnHover: false });
      manager.start(onNext);
      manager.handleHover(true, onNext);

      expect(manager.getState().isPaused).toBe(false);
    });
  });

  describe('handleFocus()', () => {
    it('should pause on focus when enabled', () => {
      manager.start(onNext);
      manager.handleFocus(true, onNext);

      expect(manager.getState().pauseReasons).toContain(PauseReason.FOCUS);
    });

    it('should resume on blur', () => {
      manager.start(onNext);
      manager.handleFocus(true, onNext);
      manager.handleFocus(false, onNext);

      expect(manager.getState().pauseReasons).not.toContain(PauseReason.FOCUS);
    });
  });

  describe('handleInteraction()', () => {
    it('should pause on interaction', () => {
      manager.start(onNext);
      manager.handleInteraction(onNext);

      expect(manager.getState().pauseReasons).toContain(
        PauseReason.INTERACTION
      );
    });

    it('should auto-resume after delay', async () => {
      const resumedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.PLAY_RESUMED, resumedSpy);

      manager.start(onNext);
      manager.handleInteraction(onNext);

      await vi.advanceTimersByTimeAsync(3000);

      expect(resumedSpy).toHaveBeenCalledWith({
        reason: PauseReason.INTERACTION,
      });
      expect(manager.getState().pauseReasons).not.toContain(
        PauseReason.INTERACTION
      );
    });

    it('should not auto-resume when disabled', async () => {
      manager.updateConfig({ resumeAfterInteraction: false });
      manager.start(onNext);
      manager.handleInteraction(onNext);

      await vi.advanceTimersByTimeAsync(5000);

      expect(manager.getState().pauseReasons).toContain(
        PauseReason.INTERACTION
      );
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration', () => {
      manager.updateConfig({ interval: 2000 });

      expect(manager.getState().config.interval).toBe(2000);
    });

    it('should stop when disabled', () => {
      manager.start(onNext);
      manager.updateConfig({ enabled: false });

      expect(manager.getState().isPlaying).toBe(false);
    });

    it('should emit config update event', () => {
      const updateSpy = vi.fn();
      manager.on(SLIDER_EVENTS.CONFIG_UPDATED, updateSpy);

      manager.start(onNext);
      manager.updateConfig({ interval: 2000 });

      expect(updateSpy).toHaveBeenCalledWith({ intervalChanged: true });
    });
  });

  describe('error handling', () => {
    it('should stop on error and emit error event', async () => {
      const errorSpy = vi.fn();
      const stoppedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.ERROR, errorSpy);
      manager.on(SLIDER_EVENTS.PLAY_STOPPED, stoppedSpy);

      const failingNext = vi.fn().mockRejectedValue(new Error('Test error'));

      manager.start(failingNext);
      await vi.advanceTimersByTimeAsync(1000);

      expect(errorSpy).toHaveBeenCalledWith({
        error: expect.any(Error),
        context: 'AutoPlayManager.scheduleNext',
      });
      expect(stoppedSpy).toHaveBeenCalled();
      expect(manager.getState().isPlaying).toBe(false);
    });
  });

  describe('visibility handling', () => {
    it('should pause when page becomes hidden', () => {
      manager.start(onNext);

      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(manager.getState().pauseReasons).toContain(PauseReason.VISIBILITY);
    });

    it('should emit resume event when page becomes visible', () => {
      const resumeSpy = vi.fn();
      manager.on(SLIDER_EVENTS.VISIBILITY_RESUMED, resumeSpy);

      manager.start(onNext);

      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('window blur handling', () => {
    it('should pause on window blur', () => {
      manager.start(onNext);

      window.dispatchEvent(new Event('blur'));

      expect(manager.getState().pauseReasons).toContain(PauseReason.BLUR);
    });

    it('should emit resume event on window focus', () => {
      const resumeSpy = vi.fn();
      manager.on(SLIDER_EVENTS.WINDOW_FOCUS_RESUMED, resumeSpy);

      manager.start(onNext);

      window.dispatchEvent(new Event('blur'));
      window.dispatchEvent(new Event('focus'));

      expect(resumeSpy).toHaveBeenCalled();
    });
  });
});
