import "../types/window";

// Mock Worker globally
class MockWorker implements Partial<Worker> {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null = null;
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }
  postMessage(): void {}
  terminate(): void {}
}

global.Worker = MockWorker as any;

// Create a global worker registry for testing
if (typeof window !== "undefined") {
  window.__WORKER_REGISTRY__ = new Set();
}

export {};
