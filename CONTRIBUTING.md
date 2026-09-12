# Contributing to xAnsi

Thanks for your interest in contributing.
Bug reports, fixes, features, and documentation improvements are all welcome.
This guide explains how to set up the project and get a change merged.

## Code of conduct

By participating you agree to follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be respectful and constructive in issues, pull requests, and reviews.

## Ways to contribute

- **Report a bug**: open a [bug report](https://github.com/remotex-labs/xAnsi/issues/new?template=bug_report.md) with a minimal reproduction.
- **Request a feature**: open a [feature request](https://github.com/remotex-labs/xAnsi/issues/new?template=feature_request.md) describing the use case.
- **Send a pull request**: fix a bug, add a feature, or improve the docs.

Search [existing issues](https://github.com/remotex-labs/xAnsi/issues) first to avoid duplicates.

## Development setup

xAnsi uses [pnpm](https://pnpm.io) and requires Node.js 20 or later.

```bash
git clone https://github.com/remotex-labs/xAnsi.git
cd xAnsi
pnpm install
```

### Scripts

| Command              | Description                                              |
|----------------------|----------------------------------------------------------|
| `pnpm build`         | Build the project to `dist/`.                            |
| `pnpm dev`           | Build in watch mode.                                     |
| `pnpm test`          | Run the test suite (xJet).                               |
| `pnpm test:coverage` | Run tests with coverage.                                 |
| `pnpm lint`          | Run markdownlint, ESLint, and the TypeScript type check. |
| `pnpm build:clean`   | Remove `dist/` and rebuild from scratch.                 |
| `pnpm docs:dev`      | Serve the VitePress docs locally.                        |
| `pnpm docs:build`    | Build the docs.                                          |

Run `pnpm lint`, `pnpm test`, and `pnpm build` before opening a pull request. CI runs these as separate jobs.

## Workflow

1. Fork the repository and create a branch from `master`.

   ```bash
   git checkout -b feature/short-description
   ```

2. Make your change, with tests and documentation.
3. Verify everything passes:

   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

4. Push your branch and open a pull request against `master`. Fill in the pull request template.

Keep pull requests small and focused; they are easier to review and merge.

## Commit messages

Follow the existing history: a lowercase area prefix, a colon, then an imperative summary.

```text
xterm.component: Add bright background colors
shadow.service: Fix trailing cells after a shorter line
ansi.component: Add CURSOR_LINE_START
docs: Rewrite the ShadowRenderer guide
```

- The prefix is a place, not a category. Use the file, module, or folder the change lives in - not a Conventional
  Commits type such as `feat:` or `fix:`.
- Use the imperative mood ("Add", not "Added" or "Adds").
- Keep the first line at or under 72 characters.
- Reference related issues in the body (for example, `Closes #123`).

## Coding standards

- Write **TypeScript** with explicit types; avoid `any`.
- Document every exported symbol with **TSDoc**, including an `@since` tag. Keep the tag order consistent with the
  rest of the codebase: description, `@param`, `@returns`, `@throws`, `@remarks`, `@example`, `@see`, `@since`.
- Keep functions small, pure, and testable.
- Match the surrounding style; `pnpm lint` enforces formatting, imports, and the type check.

## Keeping the package tree-shakeable

xAnsi ships an ESM build that a bundler is expected to prune. Keep it that way:

- Named exports only - no default export, and no barrel that re-exports a namespace object.
- No top-level side effects. A value built by calling a function at module scope needs a `/*#__PURE__*/`
  annotation, as `xterm` has, so a bundler may drop it.
- New public API belongs in the component or service it lives with, and is re-exported from `src/index.ts`. Each
  entry point in `exports` is its own subpath, so a consumer can import one component without the rest.

## Tests

Tests use **xJet**. Place a `*.spec.ts` file next to the code it covers, and assert the observable behavior of the unit.

```ts
import { stripAnsi } from './ansi.component';

describe('stripAnsi', () => {
    test('removes style sequences and keeps the text', () => {
        expect(stripAnsi('\x1b[31mError!\x1b[39m')).toBe('Error!');
    });
});
```

Cover edge cases: empty input, invalid arguments that should throw, and the boundaries of each option - a write
past the viewport edge, a scroll past the end of the content, a hex string of the wrong length.

## Documentation

- Update the TSDoc for any public API you change.
- Update the VitePress docs under `docs/src/` when behavior or the API changes, and add a bullet to
  `docs/src/release.md`.
- Run `pnpm lint:md` to keep Markdown clean, and `pnpm docs:build` to check for broken links.

## Versioning

xAnsi follows [Semantic Versioning](https://semver.org/): MAJOR for incompatible API changes, MINOR for backward-compatible features, and PATCH for backward-compatible fixes.

## License

By contributing, you agree that your contributions are licensed under the project's [Mozilla Public License 2.0](LICENSE).
