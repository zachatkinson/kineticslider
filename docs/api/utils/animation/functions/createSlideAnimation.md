[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/animation](../README.md) / \_createSlideAnimation

# Function: \_createSlideAnimation()

> **\_createSlideAnimation**(`target`, `direction`, `duration`, `distance`): `any`

Defined in: [utils/animation.ts:332](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/animation.ts#L332)

Create a slide animation

## Parameters

### target

`TweenTarget`

Element to animate

### direction

Direction to slide ('left' | 'right' | 'up' | 'down')

`"left"` | `"right"` | `"up"` | `"down"`

### duration

`number` = `0.3`

Animation duration in seconds

### distance

`number` = `100`

Distance to slide in pixels

## Returns

`any`

Cleanup function to kill the animation
