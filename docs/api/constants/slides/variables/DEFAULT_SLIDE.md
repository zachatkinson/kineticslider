[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [constants/slides](../README.md) / DEFAULT\_SLIDE

# Variable: DEFAULT\_SLIDE

> `const` **DEFAULT\_SLIDE**: `Partial`\<[`Slide`](../../../types/slider/interfaces/Slide.md)\>

Defined in: [constants/slides.ts:49](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/constants/slides.ts#L49)

Default slide properties used when creating a new slide.
Provides empty string defaults for required slide properties.

## Constant

## Example

```typescript
import { DEFAULT_SLIDE } from './slides';

function _createSlide(title: string): Slide {
  return {
    ...DEFAULT_SLIDE,
    title,
    id: generateUniqueId();
  };
}
```

## Description

* - Includes alt text field for images
- Supports descriptive titles

## Description

* - Minimal default properties
- Type-safe partial implementation
