# xAnsi

[![Documentation](https://img.shields.io/badge/Documentation-orange?logo=typescript&logoColor=f5f5f5)](https://remotex-labs.github.io/xAnsi/)
[![npm version](https://img.shields.io/npm/v/@remotex-labs/xansi.svg)](https://www.npmjs.com/package/@remotex-labs/xansi)
[![downloads](https://img.shields.io/npm/dm/@remotex-labs/xansi?label=npm%20downloads)](https://www.npmjs.com/package/@remotex-labs/xansi)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![CI](https://github.com/remotex-labs/xAnsi/actions/workflows/ci.yml/badge.svg)](https://github.com/remotex-labs/xAnsi/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/discord/1364348850696884234?logo=Discord&label=Discord)](https://discord.gg/psV9grS9th)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/remotex-labs/xAnsi)

`@remotex-labs/xansi` is a dependency-free ANSI toolkit for the terminal. It styles text through a chainable,
type-checked API, carries the escape sequences that move and clear the cursor, and renders a scrollable viewport
that redraws only the cells that changed.

## Key Features

- **Chainable styling**: `xterm.bold.red`, `rgb()`, and `hex()` compose into one chain, and each property returns a
  fresh one.
- **Type-checked combinations**: the chain type tracks what it carries, so a second foreground or background color
  is a compile-time error.
- **Terminal control**: `ANSI` constants and `moveCursor` for clearing, hiding, saving, and positioning, plus
  `stripAnsi` to take the styling back out.
- **Shadow renderer**: a virtual viewport that diffs a content buffer against the screen and writes only the cells
  that differ.
- **Scrolling and resizing**: hold content taller than the terminal, scroll it by row, and move or resize the
  viewport at runtime.
- **Small and tree-shakeable**: no dependencies, ESM and CommonJS, and a subpath per component.

## Installation

```bash
npm install @remotex-labs/xansi
```

Requires Node.js 20 or newer. The browser build works through any bundler.

## Usage

### Styling text

```ts
import { xterm } from '@remotex-labs/xansi';

// Named colors and modifiers
console.log(xterm.red('Red text'));
console.log(xterm.bold.yellow('Bold yellow'));

// RGB and hex
console.log(xterm.rgb(255, 100, 50)('RGB text'));
console.log(xterm.bgHex('#3498db')('Hex background'));

// Chained
console.log(xterm.bold.hex('#ff5733').bgHex('#333')('Styled text'));

// Tagged templates
const name = 'Alice';
console.log(xterm.cyan`Hello ${ name }!`);
```

The chain type rejects an impossible combination before it runs:

```ts
xterm.red.green('Two foreground colors');   // TypeScript error
xterm.bgBlue.bgRed('Two background colors'); // TypeScript error
```

Set `globalThis.NO_COLOR` and every chain returns its text unstyled, following the
[NO_COLOR](https://no-color.org/) convention.

### Controlling the terminal

```ts
import { ANSI, moveCursor, stripAnsi, writeRaw, xterm } from '@remotex-labs/xansi';

writeRaw(ANSI.HIDE_CURSOR);
writeRaw(ANSI.CLEAR_SCREEN);

writeRaw(moveCursor(5, 10));
writeRaw('Text at row 5, column 10');

writeRaw(ANSI.SHOW_CURSOR);

stripAnsi(xterm.red('Error!')); // 'Error!'
```

### Rendering a viewport

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

const renderer = new ShadowRenderer(10, 40, 0, 0);

renderer.writeText(0, 0, 'Hello Shadow Renderer');
renderer.writeBlock(2, 0, 'Line 1\nLine 2\nLine 3');
renderer.render();
```

`ShadowRenderer` keeps a content buffer and a view buffer, diffs them on every `render()`, and writes only the
cells that differ. Content taller than the viewport is reached with the `scroll` accessor.

### Optimizing bundle size

Every component has its own subpath, so a bundler can drop the ones a project never imports:

```ts
import { xterm } from '@remotex-labs/xansi/xterm.component';
import { ANSI, writeRaw } from '@remotex-labs/xansi/ansi.component';
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
```

## Documentation

Full guides and the complete API reference live at
**[remotex-labs.github.io/xAnsi](https://remotex-labs.github.io/xAnsi/)**.

## Contributing

Contributions are welcome!\
Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Links

[Documentation](https://remotex-labs.github.io/xAnsi/), [GitHub Repository](https://github.com/remotex-labs/xAnsi), [Issue Tracker](https://github.com/remotex-labs/xAnsi/issues), [npm Package](https://www.npmjs.com/package/@remotex-labs/xansi)

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.
