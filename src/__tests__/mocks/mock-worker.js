// Mock Web Worker implementation for testing

// Initialize the global worker registry
if (typeof window !== 'undefined') {
  window.__WORKER_REGISTRY__ = window.__WORKER_REGISTRY__ || new Set();
  window.registerWorker = (worker) => window.__WORKER_REGISTRY__.add(worker);
  window.unregisterWorker = (worker) => window.__WORKER_REGISTRY__.delete(worker);
}

class MockWorker extends EventTarget {
  constructor(url) {
    super();
    this.url = url;
    this.isInitialized = true;
    this.messageQueue = [];
    this.errorQueue = [];
    this.terminated = false;
    this.onerror = null;
    this.onmessage = null;
    this.onmessageerror = null;
    
    // Register with global registry
    if (typeof window !== 'undefined') {
      window.registerWorker(this);
    }

    // Initialize event listeners
    this.addEventListener('message', (event) => {
      if (this.onmessage) {
        this.onmessage.call(this, event);
      }
    });

    this.addEventListener('error', (event) => {
      if (this.onerror) {
        this.onerror.call(this, event);
      }
    });
  }

  // Mock implementation of postMessage
  postMessage(data) {
    if (this.terminated) {
      throw new Error('Worker has been terminated');
    }

    if (!this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    // Queue the message for processing
    this.messageQueue.push(data);

    // Process the message synchronously in test environment
    // Extract task ID and data from the message
    const taskId = data.taskId;
    const taskData = data.data;

    // Echo back the data with proper typing
    const response = {
      taskId,
      result: taskData,
      error: null
    };

    // Create and dispatch a message event
    const messageEvent = new MessageEvent('message', {
      data: response,
      origin: location ? location.origin : '',
      lastEventId: '',
      source: null,
      ports: []
    });

    this.dispatchEvent(messageEvent);
  }

  // Mock implementation of terminate
  terminate() {
    if (!this.isInitialized) {
      return;
    }

    this.terminated = true;
    this.messageQueue = [];
    this.errorQueue = [];

    // Unregister from global registry
    if (typeof window !== 'undefined') {
      window.unregisterWorker(this);
    }

    // Notify any listeners
    const event = new Event('terminate');
    this.dispatchEvent(event);
    this.isInitialized = false;
  }

  // Helper method to handle errors
  handleError(error) {
    if (this.terminated) return;

    this.errorQueue.push(error);
    const errorEvent = new ErrorEvent('error', {
      error,
      message: error.message,
      filename: this.url.toString(),
      lineno: 0,
      colno: 0,
      bubbles: true,
      cancelable: true
    });

    this.dispatchEvent(errorEvent);
  }

  // Helper method to simulate a worker error
  simulateError(error) {
    this.handleError(error);
  }

  // Helper to get string representation
  toString() {
    return `MockWorker(${this.url})`;
  }
}

export { MockWorker }; 