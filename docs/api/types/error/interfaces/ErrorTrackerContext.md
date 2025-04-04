[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / ErrorTrackerContext

# Interface: ErrorTrackerContext

Defined in: [types/error.ts:310](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L310)

Error tracker context for error reporting

## Example

```ts
Example usage
```

## Properties

### action?

> `optional` **action**: `string`

Defined in: [types/error.ts:314](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L314)

Action being performed when error occurred

***

### component?

> `optional` **component**: `string`

Defined in: [types/error.ts:312](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L312)

Component where the error occurred

***

### data?

> `optional` **data**: `Record`\<`string`, `unknown`\>

Defined in: [types/error.ts:320](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L320)

Additional error data

***

### severity

> **severity**: `"error"` \| `"warning"` \| `"info"`

Defined in: [types/error.ts:316](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L316)

Error severity level

***

### timestamp

> **timestamp**: `number`

Defined in: [types/error.ts:318](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L318)

Timestamp when error occurred
