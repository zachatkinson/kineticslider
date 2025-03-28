class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

interface MockTimelineVars {
  duration?: number;
  ease?: string;
  onComplete?: () => void;
}

interface MockTimeline {
  to: jest.Mock<MockTimeline, [any, MockTimelineVars]>;
  from: jest.Mock<MockTimeline>;
  fromTo: jest.Mock<MockTimeline>;
  set: jest.Mock<MockTimeline>;
  play: jest.Mock<MockTimeline>;
  pause: jest.Mock<MockTimeline>;
  progress: jest.Mock<MockTimeline>;
  kill: jest.Mock<MockTimeline>;
}

// Mock GSAP
const mockTimeline: MockTimeline = {
  to: jest.fn((_target, vars) => {
    if (vars.onComplete) {
      setTimeout(vars.onComplete, 0);
    }
    return mockTimeline;
  }),
  from: jest.fn().mockReturnThis(),
  fromTo: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  play: jest.fn().mockReturnThis(),
  pause: jest.fn().mockReturnThis(),
  progress: jest.fn().mockReturnThis(),
  kill: jest.fn().mockReturnThis(),
};

interface MockGsap {
  timeline: jest.Mock<MockTimeline, [{ defaults?: MockTimelineVars; onComplete?: () => void }]>;
  to: jest.Mock<MockTimeline>;
  from: jest.Mock<MockTimeline>;
  set: jest.Mock<MockTimeline>;
  registerPlugin: jest.Mock;
  killTweensOf: jest.Mock;
  getProperty: jest.Mock;
  quickSetter: jest.Mock;
}

const mockGsap: MockGsap = {
  timeline: jest.fn(({ defaults, onComplete }) => {
    mockTimeline.to = jest.fn((_target, vars) => {
      if (onComplete) {
        setTimeout(onComplete, 0);
      }
      return mockTimeline;
    });
    return mockTimeline;
  }),
  to: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  registerPlugin: jest.fn(),
  killTweensOf: jest.fn(),
  getProperty: jest.fn().mockReturnValue(0),
  quickSetter: jest.fn().mockReturnValue(jest.fn()),
};

// Add mocks to global scope
(global as any).gsapMock = mockGsap;
(global as any).timelineMock = mockTimeline;

// Mock the actual GSAP module
jest.mock('gsap', () => mockGsap);

describe('Test Environment Setup', () => {
  it('should have proper test environment configuration', () => {
    expect(true).toBe(true);
    expect((global as any).gsapMock).toBeDefined();
    expect((global as any).timelineMock).toBeDefined();
  });
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 