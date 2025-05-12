// Minimal pool-worker for WorkerPool integration
// This file is intended to be built to JS for use in integration tests and production
// Modern ESM, no legacy features

self.onmessage = (event) => {
  // Echo the message back for now; extend as needed
  self.postMessage({ type: "result", data: event.data });
};
