// Type declarations for modules without types
declare module "@testing-library/react-hooks" {
    export function renderHook<P, R>(
        callback: (props: P) => R,
        options?: any
    ): { result: { current: R }; waitForNextUpdate: () => Promise<void>; unmount: () => void };
}

declare module "@jest/globals" {
    export const jest: any;
    export const describe: (name: string, fn: () => void) => void;
    export const beforeEach: (fn: () => void) => void;
    export const afterEach: (fn: () => void) => void;
    export const beforeAll: (fn: () => void) => void;
    export const afterAll: (fn: () => void) => void;
    export const test: (name: string, fn: () => void, timeout?: number) => void;
    export const expect: any;
}