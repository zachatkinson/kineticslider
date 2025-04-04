[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / ComponentError

# Interface: ComponentError

Defined in: [types/error.ts:117](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L117)

Extended Error interface with additional context

## Example

```ts
Example usage
```

## Extends

- `Error`

## Properties

### code?

> `optional` **code**: `string`

Defined in: [types/error.ts:119](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L119)

Error classification code

***

### componentInfo?

> `optional` **componentInfo**: `object`

Defined in: [types/error.ts:125](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L125)

Component information where the error occurred

***

### name?

> `optional` **name**: `string`

Defined in: [types/error.ts:127](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L127)

Name of the component

#### Overrides

`Error.name`

***

### props?

> `optional` **props**: `Record`\<`string`, `unknown`\>

Defined in: [types/error.ts:129](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L129)

Component props at time of error

***

### severity?

> `optional` **severity**: [`ErrorSeverity`](../enumerations/ErrorSeverity.md)

Defined in: [types/error.ts:123](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L123)

Severity level of the error

***

### state?

> `optional` **state**: `Record`\<`string`, `unknown`\>

Defined in: [types/error.ts:131](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L131)

Component state at time of error

***

### type?

> `optional` **type**: [`ErrorType`](../enumerations/ErrorType.md)

Defined in: [types/error.ts:121](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L121)

Type of error that occurred
