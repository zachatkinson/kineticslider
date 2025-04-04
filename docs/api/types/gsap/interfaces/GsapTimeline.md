[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/gsap](../README.md) / GsapTimeline

# Interface: GsapTimeline

Defined in: [types/gsap.ts:30](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L30)

GSAP animation types and interfaces

## Extends

- [`GsapTween`](GsapTween.md)

## Properties

### add()

> **add**: (`child`) => `GsapTimeline`

Defined in: [types/gsap.ts:39](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L39)

#### Parameters

##### child

[`GsapTween`](GsapTween.md) | `GsapTimeline`

#### Returns

`GsapTimeline`

***

### defaults

> **defaults**: `object`

Defined in: [types/gsap.ts:40](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L40)

***

### duration

> **duration**: `number`

Defined in: [types/gsap.ts:41](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L41)

***

### ease

> **ease**: `string`

Defined in: [types/gsap.ts:42](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L42)

***

### from()

> **from**: (`target`, `vars`) => `GsapTimeline`

Defined in: [types/gsap.ts:32](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L32)

#### Parameters

##### target

`string` | `object` | `Element`

##### vars

[`GsapVars`](GsapVars.md)

#### Returns

`GsapTimeline`

***

### fromTo

> **fromTo**: `any`

Defined in: [types/gsap.ts:33](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L33)

***

### fromVars

> **fromVars**: [`GsapVars`](GsapVars.md)

Defined in: [types/gsap.ts:35](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L35)

***

### GsapTimeline

> **GsapTimeline**: `any`

Defined in: [types/gsap.ts:37](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L37)

***

### kill()

> **kill**: () => [`GsapTween`](GsapTween.md)

Defined in: [types/gsap.ts:6](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L6)

#### Returns

[`GsapTween`](GsapTween.md)

#### Inherited from

[`GsapTween`](GsapTween.md).[`kill`](GsapTween.md#kill)

***

### pause()

> **pause**: () => [`GsapTween`](GsapTween.md)

Defined in: [types/gsap.ts:7](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L7)

#### Returns

[`GsapTween`](GsapTween.md)

#### Inherited from

[`GsapTween`](GsapTween.md).[`pause`](GsapTween.md#pause)

***

### play()

> **play**: () => [`GsapTween`](GsapTween.md)

Defined in: [types/gsap.ts:8](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L8)

#### Returns

[`GsapTween`](GsapTween.md)

#### Inherited from

[`GsapTween`](GsapTween.md).[`play`](GsapTween.md#play)

***

### progress()

> **progress**: (`value`?) => `number` \| [`GsapTween`](GsapTween.md)

Defined in: [types/gsap.ts:9](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L9)

#### Parameters

##### value?

`number`

#### Returns

`number` \| [`GsapTween`](GsapTween.md)

#### Inherited from

[`GsapTween`](GsapTween.md).[`progress`](GsapTween.md#progress)

***

### restart()

> **restart**: () => [`GsapTween`](GsapTween.md)

Defined in: [types/gsap.ts:10](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L10)

#### Returns

[`GsapTween`](GsapTween.md)

#### Inherited from

[`GsapTween`](GsapTween.md).[`restart`](GsapTween.md#restart)

***

### reverse()

> **reverse**: () => [`GsapTween`](GsapTween.md)

Defined in: [types/gsap.ts:11](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L11)

#### Returns

[`GsapTween`](GsapTween.md)

#### Inherited from

[`GsapTween`](GsapTween.md).[`reverse`](GsapTween.md#reverse)

***

### set()

> **set**: (`target`, `vars`) => `GsapTimeline`

Defined in: [types/gsap.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L38)

#### Parameters

##### target

`string` | `object` | `Element`

##### vars

[`GsapVars`](GsapVars.md)

#### Returns

`GsapTimeline`

***

### target

> **target**: `string` \| `object` \| `Element`

Defined in: [types/gsap.ts:34](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L34)

***

### timeScale()

> **timeScale**: (`value`?) => `number` \| [`GsapTween`](GsapTween.md)

Defined in: [types/gsap.ts:12](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L12)

#### Parameters

##### value?

`number`

#### Returns

`number` \| [`GsapTween`](GsapTween.md)

#### Inherited from

[`GsapTween`](GsapTween.md).[`timeScale`](GsapTween.md#timescale)

***

### to()

> **to**: (`target`, `vars`) => `GsapTimeline`

Defined in: [types/gsap.ts:31](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L31)

#### Parameters

##### target

`string` | `object` | `Element`

##### vars

[`GsapVars`](GsapVars.md)

#### Returns

`GsapTimeline`

***

### toVars

> **toVars**: [`GsapVars`](GsapVars.md)

Defined in: [types/gsap.ts:36](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/gsap.ts#L36)
