import { Mock, vi } from 'vitest';
import type { SliderId } from '../../types/branded';
import type { 
  MockPixiApplication,
  MockPixiContainer,
  MockPixiSprite,
  MockPixiAssets,
  MockResult
} from '../../types/test/mocks';

export function createMockPixiApplication(): MockPixiApplication {
  return {
    stage: createMockPixiContainer(),
    renderer: {
      view: document.createElement('canvas'),
      resize: vi.fn(),
    },
    destroy: vi.fn(),
  };
}

export function createMockPixiContainer(): MockPixiContainer {
  return {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
  };
}

export function createMockPixiSprite(): MockPixiSprite {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    alpha: 1,
    texture: {
      baseTexture: {
        resource: {
          source: document.createElement('img'),
        },
      },
    },
  };
}

export function createMockPixiAssets(): MockPixiAssets {
  return {
    load: vi.fn().mockResolvedValue({}),
    unload: vi.fn(),
  };
}

export function createSlideId(id: string): SliderId {
  return id as SliderId;
}

export function createMockResult<T>(data?: T, error?: Error): MockResult<T> {
  return {
    success: !error,
    data,
    error,
  };
} 