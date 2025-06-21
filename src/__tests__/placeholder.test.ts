import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true);
  });

  it('should have PIXI mock available', () => {
    expect(global.PIXI).toBeDefined();
    expect(global.PIXI.Application).toBeDefined();
  });

  it('should have GSAP mock available', () => {
    expect(global.gsap).toBeDefined();
    expect(global.gsap.to).toBeDefined();
  });

  it('should have ResizeObserver mock available', () => {
    expect(global.ResizeObserver).toBeDefined();
  });

  it('should have IntersectionObserver mock available', () => {
    expect(global.IntersectionObserver).toBeDefined();
  });
});
