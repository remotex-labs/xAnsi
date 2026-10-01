# Getting Started

xAnsi is a dependency-free ANSI toolkit for the terminal. It styles text with a chainable, type-checked API,
carries the escape sequences that move and clear the cursor, and renders a scrollable viewport that redraws only
the cells that changed.

## Install

::: code-group

```bash [npm]
npm install @remotex-labs/xansi
```

```bash [pnpm]
pnpm add @remotex-labs/xansi
```

```bash [yarn]
yarn add @remotex-labs/xansi
```

:::

xAnsi requires Node.js 20 or newer. It ships both ESM and CommonJS, and the browser build works through any bundler.

## Style some text

```ts
import { xterm } from '@remotex-labs/xansi';

console.log(xterm.red('Something went wrong'));
console.log(xterm.bold.yellow('Careful'));
console.log(xterm.hex('#3498db').bgHex('#101010')('Custom colors'));

const name = 'Alice';
console.log(xterm.cyan`Hello ${ name }!`);
```

Each property returns a new chain, so nothing is shared between two styled strings. The type of the chain tracks
what has already been applied: a second foreground color, or a second background color, is a compile-time error.

## Control the terminal

```ts
import { ANSI, moveCursor, writeRaw } from '@remotex-labs/xansi';

writeRaw(ANSI.HIDE_CURSOR);
writeRaw(ANSI.CLEAR_SCREEN);
writeRaw(moveCursor(5, 10));
writeRaw('Text at row 5, column 10');
writeRaw(ANSI.SHOW_CURSOR);
```

## Render a viewport

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

const renderer = new ShadowRenderer(10, 40, 0, 0);
renderer.writeText(0, 0, 'Hello Shadow Renderer');
renderer.render();
```

`ShadowRenderer` keeps a content buffer and a view buffer, diffs them on every `render()`, and writes only the
cells that differ. Content taller than the viewport is reached with the `scroll` accessor rather than by redrawing.

## Import only what you need

Every component has its own subpath, so a bundler can drop the ones a project never imports:

```ts
import { xterm } from '@remotex-labs/xansi/xterm.component';
import { ANSI, writeRaw } from '@remotex-labs/xansi/ansi.component';
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
```

The package is side-effect free and the `xterm` chain is marked pure, so the root import tree-shakes as well.

## Disabling color

Set `globalThis.NO_COLOR` and every chain returns its text unstyled, following the
[NO_COLOR](https://no-color.org/) convention. The escape sequences in `ANSI` are unaffected, since they move and
clear rather than color.

## Where to go next

- [ANSI](/guide/ansi) - `writeRaw`, `moveCursor`, `stripAnsi`, and the `ANSI` constants.
- [xTerm](/guide/xterm) - the chainable styling API, its colors, and its type constraints.
- [Shadow](/guide/shadow) - the virtual renderer, its buffers, scrolling, and viewport.

## See also

- [Release Notes](/release)
- [xTerm](/guide/xterm)
