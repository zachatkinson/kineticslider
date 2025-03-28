import type { Mock } from 'vitest';

interface TimelineMock {
  to: Mock;
  from: Mock;
  fromTo: Mock;
  set: Mock;
  play: Mock;
  pause: Mock;
  progress: Mock;
  kill: Mock;
}

interface GsapMock {
  timeline: Mock;
  to: Mock;
  from: Mock;
  set: Mock;
  registerPlugin: Mock;
}

declare global {
  var gsapMock: GsapMock;
  var timelineMock: TimelineMock;
}

declare module 'gsap' {
  interface TweenVars {
    to: Mock;
    from: Mock;
    fromTo: Mock;
    set: Mock;
    play: Mock;
    pause: Mock;
    progress: Mock;
    kill: Mock;
  }

  interface GSAPStatic {
    timeline: Mock;
    to: Mock;
    from: Mock;
    set: Mock;
    registerPlugin: Mock;
  }
}

export {}; 