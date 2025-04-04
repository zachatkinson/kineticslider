[**KineticSlider Documentation v0.1.0**](../../README.md)

***

[KineticSlider Documentation](../../modules.md) / config/sentry

# config/sentry

Sentry error tracking configuration and initialization module.
Configures and initializes Sentry for production error monitoring.

## Version

1.0.0

## Example

```typescript
// Initialize Sentry in your app's entry point
import { initSentry } from '@/config/sentry';
initSentry();
```

## Description

* - Lazy initialization only in production
- Optimized sampling rates for traces and replays
- Minimal impact on application startup time
- Efficient error batching and throttling

## Description

* - Automatic error capture and reporting
- Stack trace collection and source mapping
- Environment-based configuration
- Replay session recording for error reproduction
- Browser performance monitoring

## Description

* - Environment-specific DSN configuration
- Sanitized error messages in production
- Controlled sampling rates
- Secure data transmission
- PII protection measures

## See

[Sentry React: Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)

## Variables

- [](variables.md)

## Functions

- [initSentry](functions/initSentry.md)
