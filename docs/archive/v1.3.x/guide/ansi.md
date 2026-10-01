# ANSI

The ANSI component is the low-level half of xAnsi: a function that writes to the terminal without buffering, the
escape sequences that move and clear the cursor, and the inverse of both - a function that strips styling back out
of a string.

## Import

```ts
import { ANSI, moveCursor, stripAnsi, writeRaw } from '@remotex-labs/xansi';
```

Or from the component's own subpath, so a bundler need not reach the rest of the package:

```ts
import { ANSI, moveCursor, stripAnsi, writeRaw } from '@remotex-labs/xansi/ansi.component';
```

## `writeRaw`

Writes a string or a `Buffer` straight to the terminal, with no newline and no formatting of its own.

```ts
import { writeRaw, xterm } from '@remotex-labs/xansi';

writeRaw('Hello, world!');
writeRaw(xterm.bold.green('Success!'));
writeRaw(`First line
Second line`);
```

It uses `process.stdout.write` where that exists and falls back to `console.log` elsewhere, which is what makes it
usable from a browser bundle as well as from Node.js.

::: info 📤 Why not `console.log`
`console.log` appends a newline and formats its arguments. An escape sequence that positions the cursor has to
arrive exactly as written and without a newline after it, which is what `writeRaw` guarantees.
:::

## `moveCursor`

Returns the escape sequence that moves the cursor to a row and column. It writes nothing itself - pass the result
to `writeRaw`.

```ts
import { moveCursor, writeRaw } from '@remotex-labs/xansi';

writeRaw(moveCursor(5, 10));
writeRaw('Text at row 5, column 10');

writeRaw(moveCursor(3, 1));
writeRaw('Line 3 content');
```

Both arguments are 1-based: row 1, column 1 is the top-left corner. The column defaults to `0`, which most
terminals treat as column 1.

## `stripAnsi`

Removes the styling sequences from a string and returns the plain text.

```ts
import { stripAnsi, xterm } from '@remotex-labs/xansi';

const styled = xterm.red('Error!');

console.log(styled.length);            // 16 - the escape sequences count
console.log(stripAnsi(styled));        // 'Error!'
console.log(stripAnsi(styled).length); // 6
```

Use it to measure a string for layout, to write styled output to a log file, or to compare two strings that differ
only in how they are colored. It removes the `ESC[…m` style sequences; cursor and screen sequences are left alone.

## Terminal control constants

`ANSI` holds the sequences that have no arguments, so they can be written as they are.

| Constant            | Sequence      | Effect                                                          |
|---------------------|---------------|-----------------------------------------------------------------|
| `CLEAR_LINE`        | `ESC[K`       | Clears from the cursor to the end of the line.                  |
| `CURSOR_HOME`       | `ESC[H`       | Moves the cursor to row 1, column 1.                            |
| `CURSOR_LINE_START` | `ESC[1G`      | Moves the cursor to column 1, leaving the row alone.            |
| `HIDE_CURSOR`       | `ESC[?25l`    | Hides the cursor.                                               |
| `SHOW_CURSOR`       | `ESC[?25h`    | Shows the cursor.                                               |
| `SAVE_CURSOR`       | `ESC[s`       | Saves the current cursor position.                              |
| `RESTORE_CURSOR`    | `ESC[u`       | Restores the saved cursor position.                             |
| `CLEAR_SCREEN_DOWN` | `ESC[0J`      | Clears from the cursor to the bottom of the screen.             |
| `CLEAR_SCREEN_UP`   | `ESC[1J`      | Clears from the cursor to the top of the screen.                |
| `CLEAR_SCREEN`      | `ESC[2JESC[H` | Clears the screen and homes the cursor, keeping the scrollback. |
| `CLEAR_SCREEN_FULL` | `ESC[3JESC[H` | Clears the screen and the scrollback with it.                   |
| `RESET_TERMINAL`    | `ESCc`        | Hard reset - screen, scrollback, and most settings.             |

```ts
import { ANSI, moveCursor, writeRaw } from '@remotex-labs/xansi';

writeRaw(ANSI.HIDE_CURSOR);
writeRaw(ANSI.CLEAR_SCREEN);

writeRaw(ANSI.SAVE_CURSOR);
writeRaw(moveCursor(5, 10));
writeRaw('Hello there');
writeRaw(ANSI.RESTORE_CURSOR);

writeRaw(ANSI.SHOW_CURSOR);
```

::: tip 👻 Hide the cursor while you draw
An animation that repositions the cursor on every frame draws it flickering across the screen. Write
`ANSI.HIDE_CURSOR` before the loop and `ANSI.SHOW_CURSOR` from a `finally` block, so an early exit still leaves the
terminal usable.
:::

::: warning 🔁 `CURSOR_LINE_START` is not `\r`
`\r` is a carriage return the terminal interprets by its own rules; `ESC[1G` is an explicit column. Prefer the
constant when the position has to hold across terminals.
:::

## See also

- [Getting Started](/guide)
- [xTerm](/guide/xterm)
- [Shadow](/guide/shadow)
