/**
 * Performance resource pooling and worker types
 *
 * @module
 * @version 1.0.0
 */

/**
 * Represents a task in the worker pool queue
 * Contains the task function and resolve/reject callbacks for the Promise
 *
 * @template T - The return type of the task function
 * @interface
 * @example Example usage
 * ```typescript
 * // Example of creating a worker task manually
 * const _workerTask: WorkerTask<number> = {
 *   task: () => calculatePrimes(10000),
 *   resolve: (result) => console.log(`Found $){result} primes`),
 *   reject: (_error) => console._error('Calculation failed:', _error)
 * };
 * ```
 */
export interface WorkerTask<T> {
  /**
   * The task function to be executed in a worker thread
   * Should be serializable to be sent to a Web Worker
   */
  task: () => T;

  /**
   * Function to call when the task is completed successfully
   */
  resolve: (_value: T) => void;

  /**
   * Function to call when the task fails with an _error
   */
  reject: (_error: Error | unknown) => void;
}

/**
 * Configuration options for resource pools
 * Defines how resources are: created, managed, and recycled
 *
 * @template T - The type of resources managed by the pool
 * @interface
 * @example Example usage
 * ```typescript
 * // Configuration for a canvas context pool
 * const _canvasPoolOptions: ResourcePoolOptions<CanvasRenderingContext2D> = {
 *   factory: () => document.createElement('canvas').getContext('2d'),
 *   reset: (ctx) => {
 *     ctx.canvas.width = 0;
 *     ctx.canvas.height = 0;
 *     ctx.clearRect(0, 0, 0, 0);
 *   },
 *   initialSize: 5,
 *   maxSize: 20;
 * };
 * ```
 */
export interface ResourcePoolOptions<T> {
  /**
   * Factory function to create new resources
   * Called when the pool needs to create a new resource instance
   */
  factory: () => T;

  /**
   * Function to reset a resource before returning it to the pool
   * Ensures resources are in a clean state when reused
   */
  reset: (resource: T) => void;

  /**
   * Initial size of the resource pool
   * Number of resources to create when the pool is initialized
   *
   * @default 0
   */
  initialSize?: number;

  /**
   * Maximum size of the resource pool (0 for unlimited)
   * Limits how many resources can be stored in the pool
   *
   * @default 0
   */
  maxSize?: number;
}

/**
 * Factory function to create a DOM element resource
 * Used for DOM element resource pools
 *
 * @returns {HTMLElement} A new DOM element instance
 *
 * @example Example usage
 * ```typescript
 * const _divFactory: DOMElementFactory = () => {
 *   const div = document.createElement('div');
 *   div.classList.add('pooled-element');
 *   return div;
 * };
 * ```
 */
export type DOMElementFactory = () => HTMLElement;

/**
 * Factory function to create a canvas context resource
 * Used for canvas rendering context resource pools
 *
 * @returns {CanvasRenderingContext2D | null} A new 2D canvas context or null if creation fails
 *
 * @example Example usage
 * ```typescript
 * const _contextFactory: CanvasContextFactory = () => {
 *   const canvas = document.createElement('canvas');
 *   canvas.width = 200;
 *   canvas.height = 200;
 *   return canvas.getContext('2d');
 * };
 * ```
 */
export type CanvasContextFactory = () => CanvasRenderingContext2D | null;

/**
 * Typed resource pool identifier keys
 * Used to identify different types of resource pools in a map
 *
 * @type {unknown}
 * @example Example usage
 * ```typescript
 * // Creating a map of resource pools
 * const pools = new Map<ResourcePoolKey, ResourcePool<any>>();
 *
 * // Adding a DOM element pool
 * pools.set('dom', new ResourcePool<HTMLDivElement>(
 *   () => document.createElement('div'),
 *   (el) => { el.innerHTML = ''; },
 *   5
 * ));
 * ```
 */
export type ResourcePoolKey = "dom" | "canvas" | "image" | "audio" | "worker";
