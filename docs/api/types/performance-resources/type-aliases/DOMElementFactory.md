[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-resources](../README.md) / DOMElementFactory

# Type Alias: DOMElementFactory()

> **DOMElementFactory** = () => `unknown`

Defined in: [types/performance-resources.ts:104](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L104)

Factory function to create a DOM element resource
Used for DOM element resource pools

## Returns

`unknown`

A new DOM element instance

## Example

```typescript
const _divFactory: DOMElementFactory = () => unknown {
  const div = document.createElement('div');
  div.classList.add('pooled-element');
  return div;
};
```
