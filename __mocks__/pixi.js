class MockApplication {
  stage = {
    addChild: jest.fn(),
    removeChild: jest.fn(),
    children: []
  };
  renderer = {
    resize: jest.fn(),
    view: {
      style: {}
    },
    plugins: {
      prepare: {
        upload: jest.fn()
      }
    }
  };
  ticker = {
    add: jest.fn(),
    remove: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  };
  destroy = jest.fn();
  init = jest.fn().mockResolvedValue(this);
}

export const Application = jest.fn().mockImplementation(() => {
  return new MockApplication();
});

export const Sprite = jest.fn().mockImplementation(() => ({
  width: 1600,
  height: 500,
  anchor: { set: jest.fn() },
  position: { set: jest.fn() },
  scale: { set: jest.fn() },
  destroy: jest.fn()
}));

export const Texture = {
  from: jest.fn().mockImplementation(() => ({
    width: 1600,
    height: 500,
    baseTexture: {
      width: 1600,
      height: 500,
      valid: true,
      hasLoaded: true
    },
    destroy: jest.fn(),
    valid: true
  }))
};

export const Container = jest.fn().mockImplementation(() => ({
  addChild: jest.fn(),
  removeChild: jest.fn(),
  destroy: jest.fn(),
  children: []
}));

const mockPixi = {
  utils: {
    TextureCache: {},
    BaseTextureCache: {}
  }
};

module.exports = mockPixi;
