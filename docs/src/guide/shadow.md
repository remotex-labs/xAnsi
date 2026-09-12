# Shadow

`ShadowRenderer` is a virtual terminal viewport. Write into it at whatever row and column you like, call `render()`,
and it compares what you wrote against what is already on screen and emits only the cells that differ. Content
taller than the viewport stays in the buffer and is reached by scrolling rather than by redrawing.

## Import

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';
```

Or from the service's own subpath:

```ts
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
```

## Creating a renderer

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

// A 24 x 80 viewport, offset 2 rows down and 3 columns in from the terminal's corner
const renderer = new ShadowRenderer(24, 80, 2, 3);
```

| Parameter        | Meaning                                           |
|------------------|---------------------------------------------------|
| `terminalHeight` | Rows the viewport shows at once.                  |
| `terminalWidth`  | Columns the viewport shows at once.               |
| `topPosition`    | Rows between the terminal's top and the view.     |
| `leftPosition`   | Columns between the terminal's left and the view. |

Several renderers can share a terminal: give each one its own offsets and they draw side by side without knowing
about each other.

## The two buffers

The content buffer holds everything written, however tall, as cells that each carry a character and a dirty flag.
The view buffer holds what the terminal is currently showing. `render()` walks the visible slice of the first,
compares it against the second, and writes a cursor move plus the changed characters - nothing else.

That is what makes a redraw cheap: an update that changes one cell writes one cell.

## Writing text

```ts
renderer.writeText(0, 0, 'Hello World');
renderer.writeText(5, 10, 'Menu Options', true); // clear the row first
renderer.render();
```

| Parameter | Meaning                                                        |
|-----------|----------------------------------------------------------------|
| `row`     | 0-based row in the content buffer.                             |
| `column`  | 0-based column.                                                |
| `text`    | The string to write, styling included.                         |
| `clean`   | Optional. Empties the row before writing, rather than over it. |

Styled text is fine: the string is split so that each cell keeps the escape sequences it needs, and a style never
bleeds into the cells after it. Rows past the bottom of the viewport are kept, not dropped - they scroll into view.

::: warning ↩️ One line per call
`writeText` stops at the first `\n` and writes only what came before it. Use `writeBlock` for multi-line content.
:::

## Writing blocks

`writeBlock` writes several rows in one call, taking either a string split on `\n` or an array of lines.

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

const renderer = new ShadowRenderer(10, 80, 0, 0);

// From a string
renderer.writeBlock(3, 5, '1. File Operations\n2. Edit Options\n3. View Settings\n4. Exit');

// From an array of lines
renderer.writeBlock(8, 5, [ 'WARNING:', 'Unsaved changes will be lost!' ]);

renderer.render();
```

Each line lands on a successive row starting at `row`, and rows are allocated as needed, so a block may be taller
than the viewport. The `clean` flag applies to every row the block touches.

## Rendering

```ts
renderer.render();      // write only what changed
renderer.render(true);  // write every visible cell
```

Force a full redraw after something outside the renderer has written to the same area - another process, a resize,
or a `writeRaw` of your own. Otherwise the diff is the point, and the plain call is the one to make.

## Clearing

```ts
renderer.clearScreen(); // erase the rows the renderer occupies on screen
renderer.clear();       // empty both buffers
```

The two are separate on purpose. `clearScreen()` wipes what the terminal is showing and homes the cursor, leaving
the content in the buffer to be rendered again. `clear()` throws away the content and the record of what is on
screen, but writes nothing - call `clearScreen()` first if the terminal should be blank too.

## Scrolling

`scroll` is the index of the content row shown at the top of the viewport. Assigning to it re-renders.

```ts
renderer.scroll = 0;    // back to the top
renderer.scroll = 20;   // show content row 20 at the top
renderer.scroll += 1;   // one row down
renderer.scroll = -5;   // five rows back up
```

A value of 0 or more is an absolute row. A negative value is a movement instead, applied to the row currently at
the top. Either way the result is clamped to the content, so scrolling past either end is a no-op rather than a
blank screen.

::: warning ↕️ Prefer `= -n` for scrolling up
`renderer.scroll -= 5` reads the current row and assigns the difference, which is absolute while that difference
stays at 0 or above and becomes a relative move once it drops below - so near the top it moves by less than five.
`renderer.scroll = -5` is relative in every case.
:::

```ts
import * as readline from 'readline';
import { ANSI, ShadowRenderer, writeRaw } from '@remotex-labs/xansi';

const renderer = new ShadowRenderer(10, 50, 3, 0);

for (let i = 0; i < 100; i++) {
    renderer.writeText(i, 0, `Item ${ i + 1 }: Scrollable content example`);
}

renderer.render();

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (_str, key) => {
    if (key.ctrl && key.name === 'c') {
        writeRaw(ANSI.CLEAR_SCREEN);
        writeRaw(ANSI.SHOW_CURSOR);
        process.exit(0);
    }

    switch (key.name) {
        case 'up':       renderer.scroll = -1; break;
        case 'down':     renderer.scroll += 1; break;
        case 'pageup':   renderer.scroll = -5; break;
        case 'pagedown': renderer.scroll += 5; break;
    }
});
```

## Moving and resizing the viewport

`top`, `left`, `width`, and `height` are all readable and writable after construction. They change where the next
render draws; they do not redraw on their own.

```ts
const renderer = new ShadowRenderer(10, 80, 0, 0);

renderer.top = 3;    // leave room for a header
renderer.left = 2;
renderer.width = 70; // leave room for a sidebar

process.stdout.on('resize', () => {
    renderer.width = process.stdout.columns - 10;
    renderer.height = process.stdout.rows - 5;
    renderer.render(true); // the terminal cleared itself, so force a full redraw
});
```

## Flushing to terminal

`flushToTerminal()` writes the whole content buffer to stdout as ordinary lines, clearing each one as it goes, and
then empties both buffers.

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

const renderer = new ShadowRenderer(10, 80, 0, 0);

renderer.writeText(0, 0, 'Hello World');
renderer.writeBlock(2, 0, 'Line 1\nLine 2\nLine 3');
renderer.flushToTerminal();
```

Use it for output that should scroll away with the rest of the session - a finished progress display, a log the
user keeps. Unlike `render()` it does no diffing, positions nothing absolutely, and leaves the renderer empty, so
anything written before the flush is gone.

## A worked example

A modal dialog drawn into its own renderer, cleared and redrawn each time it is shown:

```ts
import { ANSI, ShadowRenderer, writeRaw, xterm } from '@remotex-labs/xansi';

const renderer = new ShadowRenderer(10, 50, 5, 20);
writeRaw(ANSI.CLEAR_SCREEN);

function showModal(title: string, content: string): void {
    writeRaw(ANSI.HIDE_CURSOR);

    try {
        renderer.clearScreen();
        renderer.clear();

        const width = 40;
        const label = ` ${ title } `;
        const dashes = width - 2 - label.length;
        const left = Math.floor(dashes / 2);

        renderer.writeText(0, 0, `┌${ '─'.repeat(left) }${ xterm.hex('#bf1e1e').bold(label) }${ '─'.repeat(dashes - left) }┐`);
        renderer.writeBlock(2, 2, content);
        renderer.writeText(8, 2, xterm.dim('Press any key to continue...'), true);
        renderer.writeText(9, 0, `└${ '─'.repeat(width - 2) }┘`);

        renderer.render(true);
    } finally {
        writeRaw(ANSI.SHOW_CURSOR);
    }
}

showModal('Information', 'The operation completed successfully.\nAll files have been processed.');
```

::: tip 🎨 Styling the cells
Any [xTerm](/guide/xterm) chain can be written into a cell. The renderer keeps the sequences per cell, so a styled
run survives being scrolled, partially overwritten, or split by the viewport edge.
:::

## See also

- [Getting Started](/guide)
- [ANSI](/guide/ansi)
- [xTerm](/guide/xterm)
