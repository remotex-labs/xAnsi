# xTerm

`xterm` styles text with a chainable API. Every property returns a new chain, and calling one wraps its argument
in the escape sequences the chain has collected. The type of the chain tracks what it already carries, so an
impossible combination is a compile-time error rather than a garbled line.

## Import

```ts
import { xterm } from '@remotex-labs/xansi';
```

Or from the component's own subpath:

```ts
import { xterm } from '@remotex-labs/xansi/xterm.component';
```

## Basic usage

```ts
import { xterm } from '@remotex-labs/xansi';

console.log(xterm.red('This text is red'));
console.log(xterm.bold.yellow('Bold yellow text'));
console.log(xterm.green.bgBlack.inverse('Styled text'));

// Several arguments are joined with a space, as `console.log` joins them
console.log(xterm.cyan('Hello', 'world'));
```

A chain is a value: name one and reuse it.

```ts
const error = xterm.bold.red;
const muted = xterm.dim.gray;

console.log(error('Build failed'));
console.log(muted('  3 warnings suppressed'));
```

## Template literals

Every chain is also a tag function, so it can wrap an interpolated string directly.

```ts
const name = 'Alice';

console.log(xterm.magenta`Hello ${ name }, welcome!`);
console.log(xterm.bold.green`Done in ${ 412 }ms`);
```

## Modifiers

| Modifier  | Effect                                   |
|-----------|------------------------------------------|
| `bold`    | Increases intensity.                     |
| `dim`     | Reduces intensity.                       |
| `inverse` | Swaps the foreground and the background. |
| `hidden`  | Hides the text, leaving its space.       |
| `reset`   | Emits a full reset around the text.      |

Modifiers combine freely, and each one may be applied once per chain.

## Colors

The named foreground colors are the eight standard ones, their `Bright` variants, `gray`, and a set of 256-color
shades:

`black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`, `blackBright`, `redBright`,
`greenBright`, `yellowBright`, `blueBright`, `magentaBright`, `cyanBright`, `whiteBright`, `darkGray`,
`lightGray`, `lightCyan`, `lightCoral`, `oliveGreen`, `deepOrange`, `brightPink`, `lightOrange`, `burntOrange`,
`lightYellow`, `canaryYellow`, `lightGoldenrodYellow`.

The background names are `bg` plus the capitalized color, for the standard eight, their `Bright` variants, and
`bgGray`: `bgBlack`, `bgRed`, `bgGreen`, `bgYellow`, `bgBlue`, `bgMagenta`, `bgCyan`, `bgWhite`, `bgGray`,
`bgBlackBright`, `bgRedBright`, `bgGreenBright`, `bgYellowBright`, `bgBlueBright`, `bgMagentaBright`,
`bgCyanBright`, `bgWhiteBright`. The 256-color shades are foreground only.

## RGB and hex colors

Four methods take a color rather than naming one, and emit a 24-bit sequence:

| Method           | Applies to | Argument                                    |
|------------------|------------|---------------------------------------------|
| `rgb(r, g, b)`   | Foreground | Three numbers, each `0`-`255`.              |
| `bgRgb(r, g, b)` | Background | Three numbers, each `0`-`255`.              |
| `hex(color)`     | Foreground | `#rgb`, `#rrggbb`, with or without the `#`. |
| `bgHex(color)`   | Background | `#rgb`, `#rrggbb`, with or without the `#`. |

```ts
console.log(xterm.rgb(255, 100, 50)('Custom RGB colored text'));
console.log(xterm.bgRgb(30, 60, 90)('Text with an RGB background'));

console.log(xterm.hex('#ff5733')('Hex colored text'));
console.log(xterm.bgHex('#3498db')('Text with a hex background'));

console.log(xterm.bold.hex('#ff5733').bgHex('#333')('Everything at once'));
```

`hex` throws on a string that is not 3 or 6 hex digits, and `rgb` throws when a component is not a number. Both
fail at the point the chain is built, not when it is called.

::: warning 🖥️ True color is not universal
`rgb` and `hex` emit 24-bit sequences. A terminal without true-color support approximates them, or ignores them.
The named colors and their `Bright` variants are the portable set.
:::

## What the type allows

The chain type carries three facts: whether a foreground color has been applied, whether a background one has, and
which modifiers are already on it. A property that would repeat any of them is not on the type.

```ts
// Valid
xterm.red.bold.inverse('Fine');
xterm.green.bgBlue.dim('Fine');
xterm.rgb(100, 150, 200).bgHex('#333').bold('Fine');

// Rejected by TypeScript
xterm.red.green('Two foreground colors');
xterm.bgBlue.bgRed('Two background colors');
xterm.bold.bold('The same modifier twice');
```

This is a type-level constraint. It costs nothing at runtime, and it does not apply to a chain assembled through
`any`.

## Disabling color

With `globalThis.NO_COLOR` set, every chain returns its argument unchanged, following the
[NO_COLOR](https://no-color.org/) convention. The chain still builds and the call still succeeds - only the escape
sequences are left out, so nothing downstream has to know.

```ts
globalThis.NO_COLOR = true;

console.log(xterm.red('Plain text')); // 'Plain text'
```

::: tip 🧪 Comparing styled output
In a test, prefer [`stripAnsi`](/guide/ansi#stripansi) over setting `NO_COLOR` when you want to assert on the text
of a string that is styled elsewhere.
:::

## See also

- [Getting Started](/guide)
- [ANSI](/guide/ansi)
- [Shadow](/guide/shadow)
