[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [components/Loading/Loading](../README.md) / Loading

# Function: Loading()

> **Loading**(): `any`

Defined in: [components/Loading/Loading.tsx:22](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/Loading/Loading.tsx#L22)

A simple loading indicator component for general use.
Displays a basic text-based loading message with proper ARIA attributes.

## Returns

`any`

A div element with loading text and appropriate ARIA attributes

## Description

*

## Version

1.0.0

## Example

```tsx
<Loading />
```

## Description

* - Uses progressbar role for semantic meaning
- Provides descriptive ARIA label for screen readers
- Announces loading state to assistive technologies

## See

 - LoadingIndicator - For a more visual loading indicator with spinner
 - KineticSlider - Parent component where this loading state is commonly used
