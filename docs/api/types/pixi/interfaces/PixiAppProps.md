[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/pixi](../README.md) / PixiAppProps

# Interface: PixiAppProps

Defined in: [types/pixi.ts:24](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L24)

Props for the PixiApp component

## Example

```ts
Example usage
```

## Properties

### backgroundColor?

> `optional` **backgroundColor**: `number`

Defined in: [types/pixi.ts:30](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L30)

Background color in hexadecimal format

***

### children?

> `optional` **children**: `ReactNode`

Defined in: [types/pixi.ts:32](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L32)

Child components

***

### height

> **height**: `number`

Defined in: [types/pixi.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L28)

Height of the Pixi application

***

### onError()?

> `optional` **onError**: (`_error`) => `unknown`

Defined in: [types/pixi.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L38)

Callback when an _error occurs

#### Parameters

##### \_error

`Error`

#### Returns

`unknown`

***

### onSlideChange()?

> `optional` **onSlideChange**: (`_index`) => `unknown`

Defined in: [types/pixi.ts:36](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L36)

Callback when the current slide changes

#### Parameters

##### \_index

`number`

#### Returns

`unknown`

***

### slides

> **slides**: [`SlideData`](SlideData.md)[]

Defined in: [types/pixi.ts:34](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L34)

Array of slides to display

***

### void

> **void**: `any`

Defined in: [types/pixi.ts:36](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L36)

***

### width

> **width**: `number`

Defined in: [types/pixi.ts:26](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/pixi.ts#L26)

Width of the Pixi application
