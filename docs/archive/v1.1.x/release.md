# Release Notes

::: warning 🗄️ Archived version
These are the notes for an archived version. See the [current release notes](/release) for the supported line.
:::

What shipped in the `v1.1.x` line of `@remotex-labs/xansi`.

## v1.1.1

- **Added**: The [xTerm](guide/xterm) chain types are re-exported from the component and from the package root,
  so `AnsiChainableBuilderType` can be named without reaching into the interface file.

## v1.1.0

- **Added**: `NO_COLOR` support. With `globalThis.NO_COLOR` set, every chain returns its text unstyled, following
  the [NO_COLOR](https://no-color.org/) convention. The `ANSI` constants are unaffected.
- **Added**: `lightCyan` to the [foreground colors](guide/xterm#basic-usage).
- **Fixed**: The Shadow renderer's [scroll position](guide/shadow#content-scrolling) is clamped to the content, so
  scrolling past the last row no longer leaves the viewport blank.

## See also

- [Guide](guide)
- [xTerm](guide/xterm)
