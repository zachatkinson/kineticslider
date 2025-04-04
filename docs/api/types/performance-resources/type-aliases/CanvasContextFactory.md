[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-resources](../README.md) / CanvasContextFactory

# Type Alias: CanvasContextFactory()

> **CanvasContextFactory** = () => `unknown`

Defined in: [types/performance-resources.ts:121](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L121)

Factory function to create a canvas context resource
Used for canvas rendering context resource pools

## Returns

`unknown`

A new 2D canvas context or null if creation fails

## Example

```typescript
const _contextFactory: CanvasContextFactory = () => unknown {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  return canvas.getContext('2d');
};
```
