import { register } from 'node:module';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
import * as tsNode from 'ts-node';

// Only register ts-node if we're in a Node.js environment and it's not already registered
if (typeof process !== 'undefined' && !process.execArgv.some((arg) => arg.includes('ts-node'))) {
  tsNode.register({
    project: './tsconfig.testing.json',
    transpileOnly: true,
    compilerOptions: {
      module: 'ESNext',
      target: 'ES2020',
    },
  });
}

// Set up global worker environment
if (typeof window !== 'undefined') {
  // Modern implementation of URL.createObjectURL for Blob
  const createObjectURL = (blob: Blob): string => {
    return `mock-url-${Math.random().toString(36).slice(2)}`;
  };

  const revokeObjectURL = (url: string): void => {
    // Mock implementation
  };

  Object.defineProperty(window.URL, 'createObjectURL', {
    value: createObjectURL,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: revokeObjectURL,
    writable: true,
    configurable: true,
  });
}

// Mock Blob for worker content
class MockBlob implements Blob {
  size: number = 0;
  type: string = '';
  
  constructor(private blobParts?: BlobPart[], options?: BlobPropertyBag) {
    if (blobParts?.length) {
      this.size = blobParts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + new TextEncoder().encode(part).length;
        }
        if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
          return acc + part.byteLength;
        }
        return acc;
      }, 0);
    }
    if (options?.type) {
      this.type = options.type;
    }
  }

  async bytes(): Promise<Uint8Array> {
    const buffer = await this.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (!this.blobParts?.length) return new ArrayBuffer(0);
    
    const totalLength = this.size;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const part of this.blobParts) {
      if (typeof part === 'string') {
        const encoded = new TextEncoder().encode(part);
        result.set(encoded, offset);
        offset += encoded.length;
      } else if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
        const view = new Uint8Array(ArrayBuffer.isView(part) ? part.buffer : part);
        result.set(view, offset);
        offset += view.length;
      }
    }
    
    return result.buffer;
  }

  async text(): Promise<string> {
    const buffer = await this.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new MockBlob([], { type: contentType || this.type });
  }

  stream(): ReadableStream {
    return new ReadableStream({
      start: async (controller) => {
        const buffer = await this.arrayBuffer();
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      }
    });
  }

  get [Symbol.toStringTag](): string {
    return 'Blob';
  }
}

// Ensure MockBlob properly implements the Blob interface
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'Blob', {
    value: MockBlob,
    writable: true,
    configurable: true,
  });
}

// Mock Worker environment
class MockWorkerGlobalScope {
  postMessage(data: any) {
    // Mock implementation
  }
  
  onmessage: ((ev: MessageEvent) => any) | null = null;
  onerror: ((ev: ErrorEvent) => any) | null = null;
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'WorkerGlobalScope', {
    value: MockWorkerGlobalScope,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'self', {
    value: new MockWorkerGlobalScope(),
    writable: true,
    configurable: true,
  });
}

export {}; 