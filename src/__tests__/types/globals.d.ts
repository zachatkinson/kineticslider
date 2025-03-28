import gsap from 'gsap';

declare global {
  interface Window {
    analytics: {
      track: (event: string, data: Record<string, unknown>) => void;
    };
    errorTracker: {
      captureError: (
        error: Error | null,
        context: Record<string, unknown>
      ) => void;
    };
  }
  
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      gsap: typeof gsap;
    }
  }
}

export {}; 