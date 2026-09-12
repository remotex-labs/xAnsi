# Release Notes

::: warning 🗄️ Archived version
These are the notes for an archived version. See the [current release notes](/release) for the supported line.
:::

What shipped in the `v1.2.x` line of `@remotex-labs/xansi`.

## v1.2.0

- **Added**: [`writeBlock`](guide/shadow#writing-blocks-of-text) on the Shadow renderer - writes multi-line text
  in one call, taking either a string split at `\n` or an array of lines, and allocating rows in the content
  buffer as it goes. `writeText` still stops at the first newline.
- **Added**: [`flushToTerminal`](guide/shadow#flushing-to-terminal) - writes the whole content buffer to stdout
  and empties it, bypassing the diff. Use it when the output is meant to scroll away rather than stay on screen.
- **Added**: [`ANSI.CURSOR_HOME`](guide/ansi#terminal-control-constants) (`ESC[H`), and `clearScreen()` now sends
  the cursor home after clearing.
- **Fixed**: The bright ANSI colors (codes 90-97 and 100-107) are recognized when a styled string is split into
  cells, so a bright run keeps its color across the Shadow renderer.
- **Fixed**: 256-color (`ESC[38;5;n`) and true-color (`ESC[38;2;r;g;b`) sequences are read as one code rather than
  as their separate numeric parameters, which is what the extended [xTerm](guide/xterm#rgb-and-hex-colors) colors
  emit.

## See also

- [Guide](guide)
- [xTerm](guide/xterm)
