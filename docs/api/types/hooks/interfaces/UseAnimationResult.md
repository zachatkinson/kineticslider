[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/hooks](../README.md) / UseAnimationResult

# Interface: UseAnimationResult

Defined in: [types/hooks.ts:77](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hooks.ts#L77)

Return type for the enhanced animation hook with GSAP integration

## Example

```ts
Example usage
```

## Extends

- [`UseAnimationReturn`](UseAnimationReturn.md)

## Properties

### animateToSlide()

> **animateToSlide**: (`_targetIndex`, `_speed`) => `any`

Defined in: [types/hooks.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hooks.ts#L38)

Animate to a specific slide _index with optional _speed? multiplier

#### Parameters

##### \_targetIndex

`number`

##### \_speed

`any`

#### Returns

`any`

#### Inherited from

[`UseAnimationReturn`](UseAnimationReturn.md).[`animateToSlide`](UseAnimationReturn.md#animatetoslide)

***

### animation

> **animation**: [`BasicAnimationReturn`](BasicAnimationReturn.md)

Defined in: [types/hooks.ts:78](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hooks.ts#L78)

***

### isAnimating

> **isAnimating**: `boolean`

Defined in: [types/hooks.ts:36](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hooks.ts#L36)

Whether an animation is currently in _progress

#### Inherited from

[`UseAnimationReturn`](UseAnimationReturn.md).[`isAnimating`](UseAnimationReturn.md#isanimating)
