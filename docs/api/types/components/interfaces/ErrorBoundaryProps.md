[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/components](../README.md) / ErrorBoundaryProps

# Interface: ErrorBoundaryProps

Defined in: [types/components.ts:26](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L26)

Props for error boundary components

## Example

```ts
Example usage
```

## Properties

### children

> **children**: `ReactNode`

Defined in: [types/components.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L28)

Child components to render

***

### fallback?

> `optional` **fallback**: `ReactNode` \| (`error`, `resetErrorBoundary`) => `ReactNode`

Defined in: [types/components.ts:30](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L30)

Optional fallback UI to render when an error occurs

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [types/components.ts:34](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L34)

Maximum number of retry attempts

***

### nestLevel?

> `optional` **nestLevel**: `string`

Defined in: [types/components.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L38)

Used in testing to avoid duplicate data-testid in nested error boundaries

***

### onError()?

> `optional` **onError**: (`error`, `errorInfo`) => `void`

Defined in: [types/components.ts:32](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L32)

Callback fired when an error occurs

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`

***

### skipRecoveryUi?

> `optional` **skipRecoveryUi**: `boolean`

Defined in: [types/components.ts:36](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/components.ts#L36)

Skip showing the recovery UI in test environment for tests that need to see the error UI immediately
