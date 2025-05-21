# xAnsi

[![npm version](https://img.shields.io/npm/v/@remotex-labs/xansi.svg)](https://www.npmjs.com/package/@remotex-labs/xansi)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js CI](https://github.com/remotex-labs/xAnsi/actions/workflows/node.js.yml/badge.svg)](https://github.com/remotex-labs/xAnsi/actions/workflows/node.js.yml)

A lightweight ANSI utility library for styling terminal output. 
xAnsi provides easy-to-use components for working with ANSI escape codes to create colorful and formatted terminal interfaces.

## Features

- **ANSI Component**: Utility constants and functions for terminal control, including cursor movement, screen clearing operations, and raw terminal output through the `writeRaw` function.
- **xTerm Component**: Advanced terminal styling with support for xTerm color codes
- **Shadow Renderer**: A virtual terminal renderer that efficiently manages screen updates by maintaining separate buffers for desired content and current display state, supporting features like partial screen updates, content scrolling, variable viewport dimensions, and optimized rendering with minimal draw operations

## Installation

```bash
npm install @remotex-labs/xansi
```

## Optimizing Bundle Size
xAnsi supports subpath imports, allowing you to import only the specific components you need to minimize your application's bundle size:

```typescript
// Import specific components instead of the entire package
import { xterm } from '@remotex-labs/xansi/xterm.component'; 
import { writeRaw, ANSI } from '@remotex-labs/xansi/ansi.component';
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
```

## xTerm Component
The `xterm` component provides advanced terminal styling capabilities with a chainable API for applying colors and text styles.

### Basic Usage
```ts
import { xterm } from '@remotex-labs/xansi';
// Basic color styling console.log(xterm.red('This text is red')); console.log(xterm.blue('This text is blue'));
// Chain multiple styles console.log(xterm.bold.yellow('Bold yellow text')); console.log(xterm.green.bgBlack.inverse('Styled text'));
// Use with template literals const name = 'world'; console.log(xterm.cyan); `Hello ${name}!`

console.log(xterm.yellow('Hello %s'), name);
```

### RGB and Hex Colors
```ts
// RGB colors
console.log(xterm.rgb(255, 100, 50)('Custom RGB colored text'));
console.log(xterm.bgRgb(30, 60, 90)('Text with RGB background'));

// Hex colors
console.log(xterm.hex('#ff5733')('Hex colored text'));
console.log(xterm.bgHex('#3498db')('Text with hex background'));

// Combining RGB/Hex with other styles
console.log(xterm.hex('#ff5733').bold.bgHex('#3498db')('Custom styled text'));
```

### Style Combinations
The component uses TypeScript to enforce proper style combinations: `xterm`
- You can only apply one foreground color
- You can only apply one background color
- Text modifiers (bold, dim, inverse, etc.) can be combined

```ts
// Valid combinations
xterm.red.bold.inverse('Valid styling');
xterm.green.bgBlue.dim('Valid styling');
xterm.rgb(100, 150, 200).bgHex('#333').bold('Valid styling');

// Invalid combinations (TypeScript will show errors)
// xterm.red.green('Invalid - two foreground colors');
// xterm.bgBlue.bgRed('Invalid - two background colors');
```

### Available Styles
The component includes common ANSI text styles:
- **Text modifiers**: `bold`, `dim`, `inverse`, `hidden`, `reset`
- **Foreground colors**: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`
- **Bright foreground colors**: `blackBright`, `redBright`, `greenBright`, `yellowBright`, `blueBright`, `magentaBright`, `cyanBright`, `whiteBright`
- **Background colors**: `bgBlack`, `bgRed`, `bgGreen`, `bgYellow`, `bgBlue`, `bgMagenta`, `bgCyan`, `bgWhite`, `bgGray`
- **Bright background colors**: `bgBlackBright`, `bgRedBright`, `bgGreenBright`, `bgYellowBright`, `bgBlueBright`, `bgMagentaBright`, `bgCyanBright`, `bgWhiteBright`

## ANSI Component

The ANSI component provides essential utilities for terminal control operations through raw ANSI escape sequences, allowing for low-level manipulation of terminal output.

### Output Functions

```ts
import { writeRaw } from '@remotex-labs/xansi';

// Write text directly to the terminal
writeRaw('Hello, world!');

// Works with styled text from the xterm component
import { xterm } from '@remotex-labs/xansi';
writeRaw(xterm.bold.green('Success!'));

// Handle multiline content
writeRaw(`First line
Second line`);
```

The `writeRaw` function provides a consistent output method that automatically adapts to your JavaScript environment:
- In Node.js, it uses for more efficient output `process.stdout.write`
- In browsers or other environments, it falls back to `console.log`

### Cursor Movement
```ts
import { moveCursor, writeRaw } from '@remotex-labs/xansi';

// Move cursor to row 5, column 10
const cursorPosition = moveCursor(5, 10);
writeRaw(cursorPosition);
writeRaw('Text at specific position');

// Move to beginning of line 3
writeRaw(moveCursor(3, 1));
writeRaw('Line 3 content');
```

The `moveCursor` function generates ANSI sequences to position the cursor at specific coordinates in the terminal. Both row and column use 1-based indexing (1 is the first row/column).

### Terminal Control Constants
```ts
import { ANSI, writeRaw } from '@remotex-labs/xansi';

// Clear the current line
writeRaw(ANSI.CLEAR_LINE);

// Hide the cursor (useful for animations)
writeRaw(ANSI.HIDE_CURSOR);
// ...perform operations...
writeRaw(ANSI.SHOW_CURSOR); // Show it again when done

// Save cursor position
writeRaw(ANSI.SAVE_CURSOR);
// ...move cursor elsewhere and write content...
writeRaw(ANSI.RESTORE_CURSOR); // Return to saved position

// Clear the entire screen
writeRaw(ANSI.CLEAR_SCREEN);

// Clear screen below current cursor position
writeRaw(ANSI.CLEAR_SCREEN_DOWN);
```

The object provides common terminal control sequences as constants, making it easier to manipulate terminal state without remembering cryptic escape sequences. `ANSI`

## Shadow Renderer
The Shadow Renderer provides a powerful, optimized rendering system for terminal-based UIs. 
It maintains separate buffers for content and display state to minimize terminal operations and improve performance.

### Key Features

- **Optimized Rendering**: Only updates parts of the screen that have changed
- **Content Scrolling**: Efficiently manages content larger than the viewport
- **Viewport Management**: Supports positioning and resizing of the display area
- **Clean Diffing Algorithm**: Minimizes ANSI escape sequences for better performance

### Basic Usage
```ts
import { ShadowRenderer, writeRaw, ANSI } from '@remotex-labs/xansi';

const topLeft = new ShadowRenderer(5, 40, 0, 0);
const topRight = new ShadowRenderer(5, 40, 0, 40);
const left = new ShadowRenderer(6, 40, 5, 5);
const right = new ShadowRenderer(6, 40, 5, 45);

writeRaw(ANSI.HIDE_CURSOR);
writeRaw(ANSI.CLEAR_SCREEN);

const letters = 'abcdefghijklmnopqrstuvwxyz';
let topIndex = 0;
let index = 0;

setInterval(() => {
    for (let i = 0; i < 5; i++) {
        const letterIndex = (topIndex + i) % letters.length;
        const letter = letters[letterIndex];
        topLeft.writeText(i, i, letter); // example: row = col = i
        topRight.writeText(i, i, letter); // example: row = col = i
    }

    topLeft.render();
    topRight.render();

    topIndex = (topIndex + 1) % letters.length;
}, 1000); // 1000ms = 1 second

setInterval(() => {
    for (let i = 0; i < 5; i++) {
        // Go backward from index: index, index-1, ..., index-4
        const letterIndex = (index - i + letters.length) % letters.length;
        const letter = letters[letterIndex];
        left.writeText(i, i, letter); // Display diagonally
        right.writeText(i, i, letter); // Display diagonally
    }

    left.render();
    right.render();

    // Move backward in the alphabet
    index = (index - 1 + letters.length) % letters.length;
}, 1000);
```

### Viewport Management

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

// Create a renderer that occupies the top part of the terminal
const renderer = new ShadowRenderer(10, 80, 0, 0);

// Reposition the renderer to create space for a header
renderer.top = 3;     // Now starts at row 3 (below a header area)
renderer.left = 2;    // Indented by 2 columns

// Resize the renderer to accommodate a sidebar
renderer.width = 70;  // Reduce width to leave space for a sidebar

// Handle terminal resize events
process.stdout.on('resize', () => {
  // Adjust to new terminal dimensions
  renderer.width = process.stdout.columns - 10;  // Leave 10 columns for sidebar
  renderer.height = process.stdout.rows - 5;     // Leave 5 rows for header/footer
  
  // Force redraw after resize
  renderer.render(true);
});
```

### Content Scrolling

```ts
import { ShadowRenderer, xterm } from '@remotex-labs/xansi';

// Create a fixed-height viewport for a larger content area
const renderer = new ShadowRenderer(10, 80, 5, 0);  // 10-row viewport

// Generate more content than fits in the viewport
for (let i = 0; i < 30; i++) {
  const prefix = i === 0 ? xterm.bold('•') : ' ';
  renderer.writeText(i, 0, `${prefix} Item ${i + 1}: This is a scrollable content row`);
}

// Initial render shows first 10 rows (0-9)
renderer.render();

// Implement scrolling behavior
function scrollDown() {
  if (renderer.scroll < 20) {  // Prevent scrolling past content
    renderer.scroll = renderer.scroll + 1;  // Automatically re-renders
  }
}

function scrollUp() {
  if (renderer.scroll > 0) {
    renderer.scroll = -1;  // Negative values are relative to current position
  }
}

function jumpToPosition(position) {
  renderer.scroll = position;  // Positive values set absolute position
}
```

### Advanced Rendering Techniques

```ts
import { ShadowRenderer, writeRaw, ANSI, xterm } from '@remotex-labs/xansi';

// Create a renderer for a modal dialog
const renderer = new ShadowRenderer(10, 50, 5, 20);
writeRaw(ANSI.CLEAR_SCREEN);

// Create a modal dialog with title and content
function showModal(title, content) {
    // Hide cursor during rendering to prevent flicker
    writeRaw(ANSI.HIDE_CURSOR);

    try {
        // Clear previous content
        renderer.clear();
        const totalWidth = 40;
        const labelWithPadding = ` ${ title } `;
        const lineWidth = totalWidth - 2;

        const dashCount = lineWidth - labelWithPadding.length;
        const leftDashes = Math.floor(dashCount / 2);
        const rightDashes = dashCount - leftDashes;
        const line = '┌' + '─'.repeat(leftDashes) + xterm.hex('#bf1e1e').bold.dim(labelWithPadding) + '─'.repeat(rightDashes) + '┐';

        // Draw border and title
        renderer.writeText(0, 0, line);

        // Draw content
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            renderer.writeText(i + 2, 2, lines[i]);
        }

        // Draw bottom border
        renderer.writeText(9, 0, '└' + '─'.repeat(38) + '┘');

        // Replace content with clean flag to ensure no artifacts
        renderer.writeText(8, 2, xterm.dim('Press any key to continue...'), true);

        // Force complete redraw
        renderer.render(true);
    } finally {
        // Always restore cursor visibility
        writeRaw(ANSI.SHOW_CURSOR);
    }
}

// Usage example
showModal('Information', 'The operation completed successfully.\nAll files have been processed.');
```

### Performance Considerations

The Shadow Renderer is optimized for scenarios where:

1. You're building interactive terminal UIs with frequent updates
2. You need to manage content larger than the visible viewport
3. You want to avoid screen flicker from complete redraws

The diffing algorithm ensures minimal terminal I/O operations by tracking which cells have changed and only updating those specific positions.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## Links
- [GitHub Repository](https://github.com/remotex-labs/xAnsi)
- [Issue Tracker](https://github.com/remotex-labs/xAnsi/issues)
- [npm Package](https://www.npmjs.com/package/@remotex-labs/xansi)
