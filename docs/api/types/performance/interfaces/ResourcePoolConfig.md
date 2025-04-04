[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / ResourcePoolConfig

# Interface: ResourcePoolConfig\<T\>

Defined in: [types/performance.ts:331](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L331)

Resource pool configuration

Configuration for a pool of reusable resources to improve performance
by reducing object creation and garbage collection. Resources are: created,
reused, and reset according to this configuration.

## Example

```ts
// Configuration for a DOM element pool />
const _domElementPoolConfig: ResourcePoolConfig<HTMLDivElement> = {
  factory: () => document.createElement('div'),
  reset: (element) () => {
    element.textContent = '';
    element.className = '';
    element.removeAttribute('style');
  },
  initialSize: 10;
};

// Configuration for a canvas context pool
const _canvasContextPoolConfig: ResourcePoolConfig<CanvasRenderingContext2D> = {
  factory: () => document.createElement('canvas').getContext('2d')!,
  reset: (ctx) () => {
    ctx.canvas.width = 0;
    ctx.canvas.height = 0;
    ctx.clearRect(0, 0, 0, 0);
  },
  initialSize: 5;
};
```

## Type Parameters

### T

`T`

The type of resource managed by the pool

## Properties

### factory()

> **factory**: () => `T`

Defined in: [types/performance.ts:333](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L333)

Factory function to create new resources

#### Returns

`T`

***

### initialSize

> **initialSize**: `number`

Defined in: [types/performance.ts:337](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L337)

Number of resources to pre-allocate

***

### reset()

> **reset**: (`resource`) => `void`

Defined in: [types/performance.ts:335](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L335)

Function to reset a resource to its initial state before reuse

#### Parameters

##### resource

`T`

#### Returns

`void`
