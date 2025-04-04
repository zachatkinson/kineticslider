[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/migration](../README.md) / MigrationErrorBoundaryProps

# Interface: MigrationErrorBoundaryProps

Defined in: [types/migration.ts:46](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/migration.ts#L46)

Props for the MigrationErrorBoundary component

## Example

```ts
Example usage
```

## Properties

### children

> **children**: `ReactNode`

Defined in: [types/migration.ts:50](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/migration.ts#L50)

Content to render within the error boundary

***

### fallback?

> `optional` **fallback**: `ReactNode`

Defined in: [types/migration.ts:55](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/migration.ts#L55)

Optional fallback UI to render when an error occurs

***

### feature?

> `optional` **feature**: [`FeatureFlag`](../../feature-flags/enumerations/FeatureFlag.md)

Defined in: [types/migration.ts:65](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/migration.ts#L65)

Optional feature flag associated with this error boundary

***

### onError()?

> `optional` **onError**: (`error`, `errorInfo`) => `void`

Defined in: [types/migration.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/migration.ts#L60)

Optional error handler function

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`
