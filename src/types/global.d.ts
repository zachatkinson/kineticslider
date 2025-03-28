interface TimelineMock {
  to: jest.Mock;
  from: jest.Mock;
  fromTo: jest.Mock;
  set: jest.Mock;
  play: jest.Mock;
  pause: jest.Mock;
  progress: jest.Mock;
  kill: jest.Mock;
}

interface GsapMock {
  timeline: jest.Mock;
  to: jest.Mock;
  from: jest.Mock;
  set: jest.Mock;
  registerPlugin: jest.Mock;
}

declare global {
  var gsapMock: GsapMock;
  var timelineMock: TimelineMock;
}

export {}; 