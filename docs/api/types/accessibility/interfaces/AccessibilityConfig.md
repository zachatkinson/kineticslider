[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/accessibility](../README.md) / AccessibilityConfig

# Interface: AccessibilityConfig

Defined in: [types/accessibility.ts:39](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L39)

Accessibility configuration options

## Example

```ts
Example usage
```

## Properties

### announcements?

> `optional` **announcements**: `object`

Defined in: [types/accessibility.ts:47](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L47)

Custom announcements for different actions

***

### announceSlideChanges

> **announceSlideChanges**: `boolean`

Defined in: [types/accessibility.ts:45](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L45)

Whether to announce slide changes

***

### ariaLabel?

> `optional` **ariaLabel**: `string`

Defined in: [types/accessibility.ts:43](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L43)

ARIA label for the slider region

***

### enabled

> **enabled**: `boolean`

Defined in: [types/accessibility.ts:41](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L41)

Enable accessibility features

***

### error()?

> `optional` **error**: (`message`) => `string`

Defined in: [types/accessibility.ts:49](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L49)

#### Parameters

##### message

`string`

#### Returns

`string`

***

### loading?

> `optional` **loading**: `string`

Defined in: [types/accessibility.ts:50](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L50)

***

### slideChange()?

> `optional` **slideChange**: (`current`, `total`) => `string`

Defined in: [types/accessibility.ts:48](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L48)

#### Parameters

##### current

`number`

##### total

`number`

#### Returns

`string`
