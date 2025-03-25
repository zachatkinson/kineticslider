import { AtlasData } from '../types/atlas';

export const mockSlidesAtlas: AtlasData = {
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

export const mockEffectsAtlas: AtlasData = {
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
