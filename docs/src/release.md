# Release Notes

What changed in the notable releases of `@remotex-labs/xansi`.

## v1.3.7

- **Changed**: The [`xterm`](/guide/xterm) chain is marked pure and the style table it looks names up in was moved
  inside the builder. A bundler that sees the root import but no use of the chain now drops it, and the styles
  provider with it, rather than keeping the module for a top-level call it cannot prove is side-effect free.

## v1.3.6

- **Changed**: Packaging only - the spec `tsconfig` narrowed what it includes, and `prepublishOnly` runs its
  steps in the same order the CI does.

## v1.3.5

- **Changed**: Tooling only - the workflows, the issue templates, and the contributing guide.

## v1.3.4

- **Changed**: The test suite runs on [xJet](https://remotex-labs.github.io/xJet/), and the repository is
  installed with pnpm. Nothing in the published package changed.

## v1.3.3

- **Fixed**: [`writeText`](/guide/shadow#writing-text) no longer truncates a line at the viewport width when it
  writes it. The whole string reaches the content buffer and the trim happens at render, so a line that starts
  off-screen scrolls into view intact rather than arriving already cut.

## v1.3.2

- **Added**: [`ANSI.CLEAR_SCREEN_UP`](/guide/ansi#terminal-control-constants) (`ESC[1J`), which clears from the
  cursor back to the top of the screen, and `ANSI.CLEAR_SCREEN_FULL` (`ESC[3JESC[H`), which clears the screen and
  the scrollback with it.
- **Fixed**: `ANSI.CLEAR_SCREEN_DOWN` is `ESC[0J` rather than the bare `ESC[J`. Both mean the same thing to a
  conforming terminal, but the explicit parameter is what the emulators that guess disagree about.

## v1.3.1

- **Fixed**: A `dim` run is closed with its own reset when a styled string is split across cells, so a dim
  segment written into the [Shadow renderer](/guide/shadow) no longer bleeds its style into the cells after it.

## v1.3.0

- **Added**: [`ANSI.CURSOR_LINE_START`](/guide/ansi#terminal-control-constants) (`ESC[1G`), which moves the cursor
  to column 1 without touching the row. Unlike `\r` it is an explicit position rather than a carriage return.
- **Changed**: [`clear()`](/guide/shadow#clearing) empties the buffers and stops there. It cleared the screen as
  well, which made resetting the renderer's state and wiping the terminal the same call and left no way to ask for
  one without the other. Call `clearScreen()` when the screen is what you meant.
- **Changed**: [`flushToTerminal()`](/guide/shadow#flushing-to-terminal) clears each line before writing it and
  emits rows as text rather than as absolute cursor moves, so flushed output scrolls with the terminal instead of
  landing at fixed coordinates.

## Earlier releases

- [v1.2.x](v1.2.x/release) - `writeBlock`, `flushToTerminal`, and 256-color parsing (archived docs).
- [v1.1.x](v1.1.x/release) - `NO_COLOR` support and the exported chain types (archived docs).

## See also

- [Getting Started](/guide)
- [xTerm](/guide/xterm)
