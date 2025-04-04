[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / ErrorTrackerReport

# Interface: ErrorTrackerReport

Defined in: [types/error.ts:327](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L327)

Error report structure for error tracking

## Example

```ts
Example usage
```

## Properties

### context

> **context**: [`ErrorTrackerContext`](ErrorTrackerContext.md)

Defined in: [types/error.ts:331](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L331)

Context about the error

***

### error

> **error**: `Error`

Defined in: [types/error.ts:329](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L329)

The error that occurred

***

### stackTrace?

> `optional` **stackTrace**: `string`

Defined in: [types/error.ts:333](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L333)

Stack trace if available

***

### url

> **url**: `string`

Defined in: [types/error.ts:337](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L337)

URL where error occurred

***

### userAgent

> **userAgent**: `string`

Defined in: [types/error.ts:335](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L335)

User agent string
