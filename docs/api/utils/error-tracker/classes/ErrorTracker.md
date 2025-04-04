[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/error-tracker](../README.md) / ErrorTracker

# Class: ErrorTracker

Defined in: [utils/error-tracker.ts:10](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracker.ts#L10)

Error tracking utility that provides comprehensive error monitoring
and reporting capabilities.

## Example

```ts
Example usage
```

## Constructors

### Constructor

> **new ErrorTracker**(`maxReports`): `ErrorTracker`

Defined in: [utils/error-tracker.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracker.ts#L29)

#### Parameters

##### maxReports

`number` = `100`

#### Returns

`ErrorTracker`

## Properties

### instance

> `private` `static` **instance**: `ErrorTracker`

Defined in: [utils/error-tracker.ts:11](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracker.ts#L11)

***

### errorListeners

> `private` **errorListeners**: `Set`\<(`report`) => `void`\>

Defined in: [utils/error-tracker.ts:14](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracker.ts#L14)

***

### maxReports

> `private` `readonly` **maxReports**: `number`

Defined in: [utils/error-tracker.ts:13](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracker.ts#L13)

***

### reports

> `private` `readonly` **reports**: `any` = `[]`

Defined in: [utils/error-tracker.ts:12](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracker.ts#L12)

## Methods

### getInstance()

> `static` **getInstance**(): `ErrorTracker`

Defined in: [utils/error-tracker.ts:19](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracker.ts#L19)

Get singleton instance

#### Returns

`ErrorTracker`
