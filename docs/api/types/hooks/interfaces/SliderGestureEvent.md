[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/hooks](../README.md) / SliderGestureEvent

# Interface: SliderGestureEvent

Defined in: [types/hooks.ts:180](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hooks.ts#L180)

Extended GestureEvent for slider interactions

## Example

```ts
Example usage
```

## Extends

- [`GestureEvent`](../../gesture/interfaces/GestureEvent.md)

## Properties

### clientX

> **clientX**: `number`

Defined in: [types/gesture.ts:24](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gesture.ts#L24)

#### Inherited from

[`GestureEvent`](../../gesture/interfaces/GestureEvent.md).[`clientX`](../../gesture/interfaces/GestureEvent.md#clientx)

***

### clientY

> **clientY**: `number`

Defined in: [types/gesture.ts:25](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gesture.ts#L25)

#### Inherited from

[`GestureEvent`](../../gesture/interfaces/GestureEvent.md).[`clientY`](../../gesture/interfaces/GestureEvent.md#clienty)

***

### preventDefault()?

> `optional` **preventDefault**: () => `unknown`

Defined in: [types/gesture.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gesture.ts#L29)

#### Returns

`unknown`

#### Inherited from

[`GestureEvent`](../../gesture/interfaces/GestureEvent.md).[`preventDefault`](../../gesture/interfaces/GestureEvent.md#preventdefault)

***

### startX

> **startX**: `number`

Defined in: [types/hooks.ts:181](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hooks.ts#L181)

#### Overrides

[`GestureEvent`](../../gesture/interfaces/GestureEvent.md).[`startX`](../../gesture/interfaces/GestureEvent.md#startx)

***

### startY

> **startY**: `number`

Defined in: [types/hooks.ts:182](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hooks.ts#L182)

#### Overrides

[`GestureEvent`](../../gesture/interfaces/GestureEvent.md).[`startY`](../../gesture/interfaces/GestureEvent.md#starty)

***

### type

> **type**: `"touchstart"` \| `"touchmove"` \| `"touchend"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"`

Defined in: [types/gesture.ts:26](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gesture.ts#L26)

#### Inherited from

[`GestureEvent`](../../gesture/interfaces/GestureEvent.md).[`type`](../../gesture/interfaces/GestureEvent.md#type)

***

### void

> **void**: `any`

Defined in: [types/gesture.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gesture.ts#L29)

#### Inherited from

[`GestureEvent`](../../gesture/interfaces/GestureEvent.md).[`void`](../../gesture/interfaces/GestureEvent.md#void)
