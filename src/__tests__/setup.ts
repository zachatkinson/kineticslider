// Types for test environment
interface GlobalWithMocks {
  gsapMock: MockGsap;
  timelineMock: MockTimeline;
}

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
  to: jest.Mock<MockTimeline>;
  from: jest.Mock<MockTimeline>;
  fromTo: jest.Mock<MockTimeline>;
  set: jest.Mock<MockTimeline>;
  play: jest.Mock<MockTimeline>;
  pause: jest.Mock<MockTimeline>;
  progress: jest.Mock<MockTimeline>;
  kill: jest.Mock<MockTimeline>;
  eventCallback: jest.Mock<MockTimeline>;
  defaults?: MockTimelineVars;
}

interface MockGsap {
  timeline: jest.Mock<MockTimeline>;
  to: jest.Mock<MockTimeline>;
  from: jest.Mock<MockTimeline>;
  set: jest.Mock<MockTimeline>;
  registerPlugin: jest.Mock;
  killTweensOf: jest.Mock;
  getProperty: jest.Mock;
  quickSetter: jest.Mock;
}

// Create GSAP mock
const mockTimeline: MockTimeline = {
  to: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  fromTo: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  play: jest.fn().mockReturnThis(),
  pause: jest.fn().mockReturnThis(),
  progress: jest.fn().mockReturnThis(),
  kill: jest.fn().mockReturnThis(),
  eventCallback: jest.fn().mockReturnThis(),
};

const mockGSAP: MockGsap = {
  timeline: jest.fn().mockReturnValue(mockTimeline),
  to: jest.fn().mockReturnValue(mockTimeline),
  from: jest.fn().mockReturnValue(mockTimeline),
  set: jest.fn().mockReturnValue(mockTimeline),
  registerPlugin: jest.fn(),
  killTweensOf: jest.fn(),
  getProperty: jest.fn(),
  quickSetter: jest.fn().mockReturnValue((x: number) => x),
};

// Mock the GSAP module
jest.mock('gsap', () => mockGSAP);

// Add mocks to global scope
Object.assign(global, {
  gsapMock: mockGSAP,
  timelineMock: mockTimeline,
} as GlobalWithMocks);

describe('Test Environment Setup', () => {
  it('should have proper test environment configuration', () => {
    expect(true).toBe(true);
    expect((global as unknown as GlobalWithMocks).gsapMock).toBeDefined();
    expect((global as unknown as GlobalWithMocks).timelineMock).toBeDefined();
  });
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
