[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/slider](../README.md) / KineticSliderProps

# Interface: KineticSliderProps

Defined in: [types/slider.ts:130](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L130)

Props for the KineticSlider component

## Properties

### className?

> `optional` **className**: `string`

Defined in: [types/slider.ts:142](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L142)

Additional class name

***

### duration?

> `optional` **duration**: `number`

Defined in: [types/slider.ts:150](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L150)

Animation duration in seconds

***

### ease?

> `optional` **ease**: `string`

Defined in: [types/slider.ts:152](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L152)

Animation easing function

***

### enableGestures?

> `optional` **enableGestures**: `boolean`

Defined in: [types/slider.ts:148](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L148)

Enable gesture support

***

### enableKeyboard?

> `optional` **enableKeyboard**: `boolean`

Defined in: [types/slider.ts:146](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L146)

Enable keyboard navigation

***

### infiniteLoop?

> `optional` **infiniteLoop**: `boolean`

Defined in: [types/slider.ts:154](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L154)

Enable infinite loop

***

### initialSlide?

> `optional` **initialSlide**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/slider.ts:134](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L134)

Initial slide _index

***

### lazyLoad?

> `optional` **lazyLoad**: `boolean`

Defined in: [types/slider.ts:156](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L156)

Enable lazy loading of slides

***

### onAnimationComplete()?

> `optional` **onAnimationComplete**: () => `unknown`

Defined in: [types/slider.ts:138](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L138)

Callback when animation completes

#### Returns

`unknown`

***

### onError()?

> `optional` **onError**: (`_error`) => `unknown`

Defined in: [types/slider.ts:140](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L140)

Callback when _error occurs

#### Parameters

##### \_error

`Error`

#### Returns

`unknown`

***

### onSlideChange()?

> `optional` **onSlideChange**: (`_index`) => `unknown`

Defined in: [types/slider.ts:136](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L136)

Callback when slide changes

#### Parameters

##### \_index

[`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

#### Returns

`unknown`

***

### slides

> **slides**: `any`

Defined in: [types/slider.ts:132](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L132)

Array of slides to render

***

### style?

> `optional` **style**: `CSSProperties`

Defined in: [types/slider.ts:144](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L144)

Additional inline styles

***

### void

> **void**: `any`

Defined in: [types/slider.ts:136](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/slider.ts#L136)
