[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-resources](../README.md) / ResourcePoolKey

# Type Alias: ResourcePoolKey

> **ResourcePoolKey** = `"dom"` \| `"canvas"` \| `"image"` \| `"audio"` \| `"worker"`

Defined in: [types/performance-resources.ts:141](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L141)

Typed resource pool identifier keys
Used to identify different types of resource pools in a map

## Example

```typescript
// Creating a map of resource pools
const pools = new Map<ResourcePoolKey, ResourcePool<any>>();

// Adding a DOM element pool
pools.set('dom', new ResourcePool<HTMLDivElement>(
  () => unknown document.createElement('div'),
  (el) => unknown { el.innerHTML = ''; },
  5
));
```
