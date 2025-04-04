[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [components/Loading/Loading](../README.md) / LoadingIndicator

# Function: LoadingIndicator()

> **LoadingIndicator**(): `any`

Defined in: [components/Loading/Loading.tsx:53](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/Loading/Loading.tsx#L53)

A centered loading indicator component with spinner animation.
Provides a more visually appealing loading state with a centered spinner animation.

## Returns

`any`

A centered div containing a spinning loading indicator with appropriate ARIA attributes

## Description

*

## Version

1.0.0

## Example

```tsx
<LoadingIndicator />
```

## Description

* - Uses progressbar role for semantic meaning
- Provides descriptive ARIA label for screen readers
- Announces loading state to assistive technologies
- Maintains visibility during slide transitions

## Description

* - Absolutely positioned in center of container
- Uses z-index: 10 to ensure visibility above other content
- Includes animated spinner for visual feedback
- Maintains consistent positioning during transitions

## See

 - Loading - For a simpler text-based loading indicator
 - KineticSlider - Parent component where this loading state is commonly used
