[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/cache](../README.md) / CacheValidationOptions

# Interface: CacheValidationOptions

Defined in: [types/cache.ts:31](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/cache.ts#L31)

Type definition for cache validation

## Example

```ts
Example usage
```

## Extends

- [`CacheOptions`](CacheOptions.md)

## Properties

### cacheKeyPrefix?

> `optional` **cacheKeyPrefix**: `string`

Defined in: [types/cache.ts:35](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/cache.ts#L35)

Cache key prefix for validation results

***

### enableCache?

> `optional` **enableCache**: `boolean`

Defined in: [types/cache.ts:33](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/cache.ts#L33)

Whether to enable validation caching

***

### maxSize?

> `optional` **maxSize**: `number`

Defined in: [types/cache.ts:24](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/cache.ts#L24)

Maximum number of entries in the cache

#### Inherited from

[`CacheOptions`](CacheOptions.md).[`maxSize`](CacheOptions.md#maxsize)

***

### ttl?

> `optional` **ttl**: `number`

Defined in: [types/cache.ts:22](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/cache.ts#L22)

Time-to-live in milliseconds

#### Inherited from

[`CacheOptions`](CacheOptions.md).[`ttl`](CacheOptions.md#ttl)
