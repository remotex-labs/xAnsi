---
outline: deep
---

# Guide
A lightweight ANSI utility library for styling terminal output.
xAnsi provides easy-to-use components for working with ANSI escape codes to create colorful and formatted terminal interfaces.

## Features

- **ANSI Component**  
  Utility constants and functions for terminal control, including cursor movement, screen clearing,
- hiding/showing the cursor, and raw terminal output through the `writeRaw` function.

- **xTerm Component**  
  Advanced terminal styling with chainable API for colors, backgrounds, text modifiers, RGB,
- and hexadecimal color codes. Supports template literals and type-safe style combinations.

- **Shadow Renderer**  
  A virtual terminal renderer that efficiently manages screen updates by maintaining separate buffers for desired content and current display state.
- Supports partial screen updates, content scrolling, variable viewport dimensions, and optimized rendering with minimal draw operations.

## Installation

```bash
npm install @remotex-labs/xansi
```

## Optimizing Bundle Size
xAnsi supports subpath imports, allowing you to import only the specific components you need:

```typescript
// Import only what you need
import { xterm } from '@remotex-labs/xansi/xterm.component';
import { writeRaw, ANSI } from '@remotex-labs/xansi/ansi.component';
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
```

## Usage Examples

### ANSI Component
```ts
import { writeRaw, ANSI } from '@remotex-labs/xansi';

// Clear the line and write text
writeRaw(ANSI.CLEAR_LINE);
writeRaw('Hello, world!');

// Move cursor to row 5, column 10
writeRaw(ANSI.SAVE_CURSOR);
writeRaw('\x1b[5;10HHello there');
writeRaw(ANSI.RESTORE_CURSOR);
```

### xTerm Component
```ts
import { xterm } from '@remotex-labs/xansi';

// Simple colors
console.log(xterm.red('Red text'));
console.log(xterm.bold.yellow('Bold yellow'));

// RGB and Hex colors
console.log(xterm.rgb(255, 100, 50)('RGB Text'));
console.log(xterm.bgHex('#3498db')('Background Hex'));

// Chaining multiple styles
console.log(xterm.bold.underline.hex('#ff5733').bgHex('#333')('Styled text'));

// Template literals
const name = 'Alice';
console.log(xterm.cyan`Hello ${name}!`);
```

### Shadow Renderer
```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

const renderer = new ShadowRenderer(10, 40, 0, 0);
renderer.writeText(0, 0, 'Hello Shadow Renderer');
renderer.render();
```

