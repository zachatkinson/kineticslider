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

  namespace NodeJS {
    interface Global {
      gsap: typeof gsap;
    }
  }
}

export {};
