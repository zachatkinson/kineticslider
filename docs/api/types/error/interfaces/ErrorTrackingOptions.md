[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / ErrorTrackingOptions

# Interface: ErrorTrackingOptions

Defined in: [types/error.ts:160](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L160)

Error tracking configuration options

## Example

```ts
Example usage
```

## Properties

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [types/error.ts:162](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L162)

Whether to enable error tracking

***

### handlers?

> `optional` **handlers**: `object`

Defined in: [types/error.ts:170](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L170)

Custom error handlers

***

### includeStack?

> `optional` **includeStack**: `boolean`

Defined in: [types/error.ts:168](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L168)

Whether to include stack traces

***

### maxErrors?

> `optional` **maxErrors**: `number`

Defined in: [types/error.ts:166](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L166)

Maximum number of errors to track

***

### onError()?

> `optional` **onError**: (`error`) => `any`

Defined in: [types/error.ts:172](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L172)

Handler for error events

#### Parameters

##### error

[`ComponentError`](ComponentError.md)

#### Returns

`any`

***

### sampleRate?

> `optional` **sampleRate**: `number`

Defined in: [types/error.ts:164](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L164)

Sampling rate for error tracking (0-1)
