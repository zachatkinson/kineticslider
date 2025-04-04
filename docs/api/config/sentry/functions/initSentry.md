[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [config/sentry](../README.md) / initSentry

# Function: initSentry()

> **initSentry**(): `any`

Defined in: [config/sentry.ts:51](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/config/sentry.ts#L51)

Initializes Sentry error tracking for the application.
Only activates in production environment to prevent development noise.

## Returns

`any`

## Description

* - Traces sample rate: 100% for comprehensive monitoring
- Session replay rate: 10% for normal sessions
- Error replay rate: 100% for error sessions

## Description

* - Uses environment variables for sensitive configuration
- Validates environment before initialization
- Implements secure defaults
