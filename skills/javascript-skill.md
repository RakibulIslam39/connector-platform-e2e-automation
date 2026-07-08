# JavaScript Best Practices for This Project

---

## Module System: CommonJS

```javascript
// Imports
const { foo } = require('./path/to/module');

// Exports
module.exports = { foo, bar };
// Named exports — always use { } for consistency

// Single default export
module.exports = MyClass;
```

## Async/Await Patterns

```javascript
// Always use async/await (no .then() chains)
async function doWork() {
  const result = await someAsyncCall();
  return result;
}

// Error handling
async function safeCall() {
  try {
    return await riskyOperation();
  } catch (err) {
    logger.error('Operation failed:', err.message);
    throw err; // Re-throw unless you have recovery logic
  }
}

// Parallel async operations
const [products, mappings] = await Promise.all([
  connectorApi.getProducts(),
  connectorApi.getAttributesMapping(),
]);
```

## Object Patterns

```javascript
// Destructuring with defaults
const { name = 'default', type = 'b2b', ...rest } = options;

// Spread for overrides
const config = { ...baseConfig, ...envOverrides };

// Optional chaining
const status = order?.meta?.status ?? 'unknown';
```

## Array Methods

```javascript
// Find
const mapping = mappings.find((m) => m.attribute === 'size');

// Filter
const sizeMappings = mappings.filter((m) => m.attribute === 'size');

// Map + join
const codes = attrs.map((a) => a.shortCode).join('-');

// Some / every
const hasVentilation = mappings.some((m) => m.attribute === 'ventilation');
```

## String Utilities

```javascript
// Template literals
const sku = `${prefix}${masterSku}-${codes.join('-')}`;

// Case conversion
const upper = str.toUpperCase();
const lower = str.toLowerCase();
const trimmed = str.trim();
```

## ES2022+ Features (Available in Node 18+)

```javascript
// Logical assignment
config.value ??= 'default'; // Set if null/undefined
config.debug ||= false; // Set if falsy

// Class fields (if needed)
class MyClass {
  #privateField = 'value';
}

// Array at()
const last = arr.at(-1);
```

## Constants vs Variables

```javascript
// ALWAYS prefer const
const BASE_URL = process.env.BASE_URL;
const products = await api.getProducts();

// let only when reassigning
let retries = 0;
while (retries < 3) {
  retries++;
}

// NEVER use var
```

## Coding Standards in This Project

- `'use strict'` at top of every file
- Single quotes for strings
- Semicolons required
- `prefer-const` enforced by ESLint
- No `var` — ESLint error
- No `console.log` in production code — use `logger` instead
- No `.then()` chains — use `async/await`
