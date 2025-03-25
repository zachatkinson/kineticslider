import { jest } from '@jest/globals';
import type { Texture } from '../__tests__/types/pixi';
import ResourceManager from '../managers/ResourceManager';
import { isDevelopment } from '../utils/environment';
import type { AtlasManager as RealAtlasManager } from '../managers/AtlasManager';

// Mock the LoadStatus enum
export enum LoadStatus {
  NotLoaded = 'not_loaded',
  Loading = 'loading',
  Loaded = 'loaded',
  Failed = 'failed'
}

// Basic types for our mock
interface AtlasFrame {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  sourceSize: {
    w: number;
    h: number;
  };
}

interface Atlas {
  frames: Record<string, AtlasFrame>;
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
  };
}

// Mock atlas data
export const mockSlidesAtlas: Atlas = {
  frames: {
    "images/slides/1.jpg": {
      frame: { x: 0, y: 0, w: 1600, h: 500 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 1600, h: 500 },
      sourceSize: { w: 1600, h: 500 }
    },
    "images/slides/2.jpg": {
      frame: { x: 1600, y: 0, w: 1600, h: 500 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 1600, h: 500 },
      sourceSize: { w: 1600, h: 500 }
    },
    "images/slides/3.jpg": {
      frame: { x: 3200, y: 0, w: 1600, h: 500 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 1600, h: 500 },
      sourceSize: { w: 1600, h: 500 }
    },
    "images/slides/4.jpg": {
      frame: { x: 4800, y: 0, w: 1600, h: 500 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 1600, h: 500 },
      sourceSize: { w: 1600, h: 500 }
    },
    "images/slides/5.jpg": {
      frame: { x: 6400, y: 0, w: 1600, h: 500 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 1600, h: 500 },
      sourceSize: { w: 1600, h: 500 }
    }
  },
  meta: {
    app: "Test Atlas Generator",
    version: "1.0",
    image: "slides-atlas.png",
    format: "RGBA8888",
    size: { w: 8000, h: 500 },
    scale: "1"
  }
};

export const mockEffectsAtlas: Atlas = {
  frames: {
    "images/effects/background-displace.jpg": {
      frame: { x: 0, y: 0, w: 512, h: 512 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 512, h: 512 },
      sourceSize: { w: 512, h: 512 }
    },
    "images/effects/cursor-displace.png": {
      frame: { x: 512, y: 0, w: 256, h: 256 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 256, h: 256 },
      sourceSize: { w: 256, h: 256 }
    }
  },
  meta: {
    app: "Test Atlas Generator",
    version: "1.0",
    image: "effects-atlas.png",
    format: "RGBA8888",
    size: { w: 768, h: 512 },
    scale: "1"
  }
};

// Mock texture type
interface MockTexture {
  width: number;
  height: number;
  valid: boolean;
  destroy: jest.Mock;
  update: jest.Mock;
  source: {
    width: number;
    height: number;
    resource: Record<string, unknown>;
  };
}

// Mock class - just implement the methods we need for testing
export class AtlasManager {
  private atlases = new Map<string, Atlas>([
    ['slides', mockSlidesAtlas],
    ['effects', mockEffectsAtlas]
  ]);
  private atlasTextures = new Map<string, MockTexture>();
  private frameTextures = new Map<string, MockTexture>();
  private imageTextures = new Map<string, MockTexture>();
  private atlasStatus = new Map<string, LoadStatus>([
    ['slides', LoadStatus.Loaded],
    ['effects', LoadStatus.Loaded]
  ]);
  private imageStatus = new Map<string, LoadStatus>();
  private options = {
    debug: true,
    preferAtlas: true,
    cacheFrameTextures: true,
    basePath: ''
  };

  constructor() {
    // Initialize with empty maps
  }

  getFilenameFromPath = jest.fn().mockImplementation((imagePath: string): string => {
    if (!imagePath) return '';
    return imagePath.split('/').pop() || imagePath;
  });

  loadAtlas = jest.fn().mockImplementation(() => Promise.resolve(true));

  hasFrame = jest.fn().mockImplementation((frameName: string) => {
    if (mockSlidesAtlas.frames[frameName]) return 'slides';
    if (mockEffectsAtlas.frames[frameName]) return 'effects';
    return null;
  });

  getFrameTexture = jest.fn().mockImplementation((frameName: string, atlasId?: string) => {
    const atlas = atlasId ? this.atlases.get(atlasId) :
      (mockSlidesAtlas.frames[frameName] ? mockSlidesAtlas : mockEffectsAtlas);

    if (!atlas?.frames[frameName]) return null;

    const frame = atlas.frames[frameName];
    const texture: MockTexture = {
      width: frame.sourceSize.w,
      height: frame.sourceSize.h,
      valid: true,
      destroy: jest.fn(),
      update: jest.fn(),
      source: {
        width: frame.sourceSize.w,
        height: frame.sourceSize.h,
        resource: {}
      }
    };

    this.frameTextures.set(frameName, texture);
    return texture;
  });

  getFrameNames = jest.fn().mockImplementation((atlasId?: string) => {
    const atlas = atlasId ? this.atlases.get(atlasId) : mockSlidesAtlas;
    return atlas ? Object.keys(atlas.frames) : [];
  });

  getTexture = jest.fn().mockImplementation((imagePath: string, atlasId?: string) => {
    return Promise.resolve(this.getFrameTexture(imagePath, atlasId));
  });

  preloadImages = jest.fn().mockImplementation(() => Promise.resolve());
  unloadAtlas = jest.fn();
  unloadTexture = jest.fn();
  dispose = jest.fn();
  log = jest.fn();
}
