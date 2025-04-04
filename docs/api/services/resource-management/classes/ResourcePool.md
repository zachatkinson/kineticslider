[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [services/resource-management](../README.md) / ResourcePool

# Class: ResourcePool\<T\>

Defined in: services/resource-management.ts:40

Resource pool for reusing objects
Implements resource pooling pattern for performance optimization

## Example

```typescript
// Create a resource pool for DOM elements
const domPool = new ResourcePool<HTMLDivElement>(
  () => document.createElement('div'),
  (el) () => {
    el.textContent = '';
    el.className = '';
    el.removeAttribute('style');
  },
  10
);

// Acquire a resource
const div = domPool.acquire();

// Use the resource
div.textContent = 'Hello World';
document.body.appendChild(div);

// When: done, release it back to the pool
document.body.removeChild(div);
domPool.release(div);
```

## Type Parameters

### T

`T`

Type of resources managed by this pool

## Constructors

### Constructor

> **new ResourcePool**\<`T`\>(`private`, `factory`, `reset`, `private`, `initialSize`): `ResourcePool`\<`T`\>

Defined in: services/resource-management.ts:60

Create a new resource pool

#### Parameters

##### private

`any`

##### factory

() => `T`

Function to create new resources

##### reset

(`resource`) => `void`

Function to reset resources before returning to pool

##### private

`any`

##### initialSize

`number`

Initial number of resources to create

#### Returns

`ResourcePool`\<`T`\>

## Properties

### inUse

> `private` **inUse**: `Set`\<`T`\>

Defined in: services/resource-management.ts:51

Set of resources currently in use

***

### reset()

> `private` **reset**: (`resource`) => `void`

Defined in: services/resource-management.ts:62

Function to reset resources before returning to pool

#### Parameters

##### resource

`T`

#### Returns

`void`

***

### resources

> `private` **resources**: `T`\[`0`\] = `[]`

Defined in: services/resource-management.ts:45

Array of available resources in the pool

## Methods

### acquire()

> **acquire**(): `T`

Defined in: services/resource-management.ts:83

Acquire a resource from the pool
Creates a new one if none are available

#### Returns

`T`

A resource: instance, either reused from the pool or newly created

#### Example

```typescript
// Acquire a canvas context from the pool
const ctx = canvasPool.acquire();

// Use it for drawing operations
ctx.fillRect(0, 0, 100, 100);
```

***

### release()

> **release**(`resource`): `any`

Defined in: services/resource-management.ts:103

Release a resource back to the pool
The resource is reset before being returned to the available pool

#### Parameters

##### resource

`T`

The resource to release

#### Returns

`any`

#### Example

```typescript
// When done with the: resource, release it
canvasPool.release(ctx);
```
