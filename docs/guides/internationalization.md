# Internationalization Guide

## Related Rules
- Base Documentation (`documentation/base-documentation.mdc`): Core documentation patterns
- Component Documentation (`documentation/component-driven/index.mdc`): i18n standards
- TypeScript (`development/typescript.mdc`): i18n patterns
- Virtual DOM (`development/virtual-dom.mdc`): i18n lifecycle docs

## Version History
- 1.0.0: Initial standardized version
  - Added i18n standards
  - Implemented i18n templates
  - Added i18n testing documentation
  - Established i18n patterns

## Configuration
```json
{
  "i18n-docs": {
    "format": {
      "markdown": true,
      "jsdoc": true,
      "typescript": true
    },
    "requirements": {
      "description": true,
      "translations": true,
      "examples": true,
      "testing": true
    },
    "validation": {
      "links": true,
      "examples": true,
      "translations": true,
      "testing": true
    },
    "generation": {
      "docs": true,
      "examples": true,
      "tests": true,
      "translations": true
    }
  }
}
```

## Overview
This guide outlines the standards and best practices for internationalization in the KineticSlider project.

## Core Requirements
- Clear and consistent i18n structure
- Comprehensive i18n documentation
- Interactive examples for all i18n cases
- i18n testing documentation
- i18n validation documentation
- Security documentation
- Testing documentation
- Integration documentation
- Maintenance documentation
- Version compatibility documentation

## i18n Structure

### 1. Translation Management
```typescript
interface TranslationConfig {
  /** Default locale */
  defaultLocale: string;
  
  /** Supported locales */
  supportedLocales: string[];
  
  /** Fallback locale */
  fallbackLocale: string;
  
  /** Translation namespace */
  namespace: string;
}

interface TranslationOptions {
  /** Target locale */
  locale?: string;
  
  /** Translation namespace */
  namespace?: string;
  
  /** Translation parameters */
  params?: Record<string, string>;
}

function translate(key: string, options?: TranslationOptions): string {
  const locale = options?.locale || config.defaultLocale;
  const namespace = options?.namespace || config.namespace;
  const params = options?.params || {};
  
  return getTranslation(key, locale, namespace, params);
}
```

### 2. Locale Management
```typescript
interface LocaleConfig {
  /** Locale code */
  code: string;
  
  /** Locale name */
  name: string;
  
  /** Locale direction */
  direction: 'ltr' | 'rtl';
  
  /** Locale format */
  format: {
    date: string;
    time: string;
    number: string;
    currency: string;
  };
}

function setLocale(locale: string): void {
  if (!config.supportedLocales.includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  
  document.documentElement.lang = locale;
  document.documentElement.dir = getLocaleConfig(locale).direction;
}
```

### 3. Format Management
```typescript
interface FormatConfig {
  /** Date format */
  date: Intl.DateTimeFormatOptions;
  
  /** Time format */
  time: Intl.DateTimeFormatOptions;
  
  /** Number format */
  number: Intl.NumberFormatOptions;
  
  /** Currency format */
  currency: Intl.NumberFormatOptions;
}

function formatValue(
  value: Date | number,
  type: 'date' | 'time' | 'number' | 'currency',
  locale: string
): string {
  const config = getFormatConfig(locale);
  const options = config[type];
  
  switch (type) {
    case 'date':
    case 'time':
      return new Intl.DateTimeFormat(locale, options).format(value as Date);
    case 'number':
    case 'currency':
      return new Intl.NumberFormat(locale, options).format(value as number);
  }
}
```

### 4. i18n Testing
```typescript
interface TranslationTest {
  /** Test identifier */
  id: string;
  
  /** Test key */
  key: string;
  
  /** Test locale */
  locale: string;
  
  /** Test parameters */
  params?: Record<string, string>;
  
  /** Expected translation */
  expected: string;
}

interface FormatTest {
  /** Test identifier */
  id: string;
  
  /** Test value */
  value: Date | number;
  
  /** Test type */
  type: 'date' | 'time' | 'number' | 'currency';
  
  /** Test locale */
  locale: string;
  
  /** Expected format */
  expected: string;
}

async function testTranslation(test: TranslationTest): Promise<TestResult> {
  const result = translate(test.key, {
    locale: test.locale,
    params: test.params
  });
  
  return {
    passed: result === test.expected,
    result,
    expected: test.expected
  };
}

async function testFormat(test: FormatTest): Promise<TestResult> {
  const result = formatValue(test.value, test.type, test.locale);
  
  return {
    passed: result === test.expected,
    result,
    expected: test.expected
  };
}
```

### 5. Examples
```typescript
// Basic Translation
const message = translate('welcome', {
  locale: 'en',
  params: {
    name: 'John'
  }
});

// With Locale
setLocale('ar');
const date = formatValue(new Date(), 'date', 'ar');

// With Testing
const translationTest = {
  id: 'welcome-test',
  key: 'welcome',
  locale: 'en',
  params: {
    name: 'John'
  },
  expected: 'Welcome, John!'
};

const testResult = await testTranslation(translationTest);
```

### 6. Testing Guidelines
```markdown
## Testing

### Translation Tests
- Key existence
- Parameter substitution
- Pluralization
- Context

### Format Tests
- Date formatting
- Time formatting
- Number formatting
- Currency formatting

### Integration Tests
- Locale switching
- Format switching
- Direction switching
- Fallback handling
```

### 7. Known Issues and Limitations
```markdown
## Known Issues

### Translation
- Missing translations
- Parameter validation
- Pluralization rules
- Context handling

### Format
- Format compatibility
- Locale support
- Direction support
- Fallback handling

### Testing
- Test coverage
- Test accuracy
- Test performance
- Test maintenance
```

## Integration Standards
1. IDE Integration
   - i18n preview
   - Code snippets
   - i18n hints
   - i18n explorer

2. Build Integration
   - i18n documentation
   - API reference
   - Example playground
   - i18n showcase

3. Testing Integration
   - Documentation links
   - Code examples
   - i18n docs
   - Testing docs

4. Monitoring Integration
   - i18n tracking
   - i18n analytics
   - Format metrics
   - Locale metrics

## Security Considerations
1. Translation Security
   - Translation validation
   - Parameter sanitization
   - Context validation
   - Access control

2. Format Security
   - Format validation
   - Value validation
   - Locale validation
   - Access control

3. Testing Security
   - Test data security
   - Test environment security
   - Test access security
   - Test result security

4. Integration Security
   - API security
   - Data security
   - Access security
   - Resource security

## Maintenance Requirements
1. Regular Updates
   - Documentation review
   - Translation updates
   - Example updates
   - Security updates

2. Version Management
   - Version tracking
   - Changelog
   - Migration guides
   - Deprecation notices

3. Security Updates
   - Security patches
   - Vulnerability fixes
   - Security reviews
   - Security testing

4. Translation Updates
   - Translation improvements
   - Format improvements
   - Locale improvements
   - Testing improvements

5. Testing Updates
   - Test coverage
   - Test cases
   - Test performance
   - Test security

6. Integration Updates
   - Framework updates
   - Library updates
   - Tool updates
   - Platform updates

7. Documentation Updates
   - Content updates
   - Format updates
   - Example updates
   - Reference updates

## Compatibility Matrix
| Feature | Node.js | Browser | Deno |
|---|---|----|-----|
| Translation | ✅ | ✅ | ✅ |
| Format | ✅ | ✅ | ✅ |
| Locale | ✅ | ✅ | ✅ |
| Direction | ✅ | ✅ | ✅ |
| Testing | ✅ | ✅ | ✅ |
| Security | ✅ | ✅ | ✅ |
| Integration | ✅ | ✅ | ✅ |
| Documentation | ✅ | ✅ | ✅ |

## Version Compatibility
| Version | Node.js | TypeScript | Testing |
|---|---|---|-----|
| 1.0.0   | ≥16.0.0 | ≥5.0.0 | ≥0.34.0 |

## See Also
- [Testing Guide](./testing.md)
- [Component Guide](./component-documentation.md)
- [Hook Guide](./hook-documentation.md)
- [Utility Guide](./utility-documentation.md)
- [Type Guide](./type-documentation.md)
- [Error Guide](./error-handling.md)
- [Performance Guide](./performance.md)
- [Security Guide](./security.md) 