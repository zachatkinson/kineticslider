[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/components](../README.md) / PixiErrorBoundaryProps

# Interface: PixiErrorBoundaryProps

Defined in: [types/components.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L60)

Props for Pixi-specific error boundary

## Example

```ts
Example usage
```

## Properties

### children

> **children**: `ReactNode`

Defined in: [types/components.ts:62](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L62)

Child components to render

***

### fallback?

> `optional` **fallback**: `ReactNode`

Defined in: [types/components.ts:64](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L64)

Optional fallback UI to render when an error occurs

***

### onError()?

> `optional` **onError**: (`error`, `errorInfo`) => `void`

Defined in: [types/components.ts:66](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L66)

Callback fired when an error occurs

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`
