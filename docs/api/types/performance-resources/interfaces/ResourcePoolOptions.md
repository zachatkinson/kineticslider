[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-resources](../README.md) / ResourcePoolOptions

# Interface: ResourcePoolOptions\<T\>

Defined in: [types/performance-resources.ts:62](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L62)

Configuration options for resource pools
Defines how resources are: created, managed, and recycled

## Example

```typescript
// Configuration for a canvas context pool
const _canvasPoolOptions: ResourcePoolOptions<CanvasRenderingContext2D> = {
  factory: () => unknown document.createElement('canvas').getContext('2d'),
  reset: (ctx) => unknown {
    ctx.canvas.width = 0;
    ctx.canvas.height = 0;
    ctx.clearRect(0, 0, 0, 0);
  },
  initialSize: 5,
  maxSize: 20;
};
```

## Type Parameters

### T

`T`

The type of resources managed by the pool

## Properties

### factory()

> **factory**: () => `unknown`

Defined in: [types/performance-resources.ts:67](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L67)

Factory function to create new resources
Called when the pool needs to create a new resource instance

#### Returns

`unknown`

***

### initialSize?

> `optional` **initialSize**: `number`

Defined in: [types/performance-resources.ts:80](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L80)

Initial size of the resource pool
Number of resources to create when the pool is initialized

#### Default

```ts
0
```

***

### maxSize?

> `optional` **maxSize**: `number`

Defined in: [types/performance-resources.ts:87](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L87)

Maximum size of the resource pool (0 for unlimited)
Limits how many resources can be stored in the pool

#### Default

```ts
0
```

***

### reset()

> **reset**: (`resource`) => `unknown`

Defined in: [types/performance-resources.ts:73](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L73)

Function to reset a resource before returning it to the pool
Ensures resources are in a clean state when reused

#### Parameters

##### resource

`T`

#### Returns

`unknown`

***

### T

> **T**: `any`

Defined in: [types/performance-resources.ts:62](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L62)

***

### void

> **void**: `any`

Defined in: [types/performance-resources.ts:73](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L73)
