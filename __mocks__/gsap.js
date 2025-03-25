const mockGSAP = {
  to: jest.fn().mockReturnValue({
    kill: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    progress: jest.fn(),
    restart: jest.fn(),
    reverse: jest.fn(),
    seek: jest.fn(),
    timeScale: jest.fn(),
  }),
  from: jest.fn(),
  fromTo: jest.fn(),
  set: jest.fn(),
  timeline: jest.fn().mockReturnValue({
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    add: jest.fn(),
    addLabel: jest.fn(),
    addPause: jest.fn(),
    call: jest.fn(),
    kill: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    progress: jest.fn(),
    restart: jest.fn(),
    resume: jest.fn(),
    reverse: jest.fn(),
    seek: jest.fn(),
    timeScale: jest.fn(),
  }),
  registerPlugin: jest.fn(),
  plugins: {
    PixiPlugin: {
      version: "3.12.2",
      name: "PixiPlugin",
      registerPIXI: jest.fn(),
      init: jest.fn().mockReturnValue(true),
      render: jest.fn(),
      kill: jest.fn(),
      _props: ["alpha", "scale", "x", "y", "rotation"]
    }
  },
  core: {
    Plugin: class Plugin {},
    _plugins: {},
    _config: {},
  },
  utils: {
    toArray: jest.fn(),
    selector: jest.fn(),
  },
};

// Add PixiPlugin directly to GSAP
mockGSAP.PixiPlugin = mockGSAP.plugins.PixiPlugin;

module.exports = {
  __esModule: true,
  default: mockGSAP,
  gsap: mockGSAP,
  PixiPlugin: mockGSAP.plugins.PixiPlugin
};
