# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.1] - 2026-10-29

### Added

- npm package metadata: `publishConfig.access`, `prepack`, `prepublishOnly`, `sideEffects`, `bugs`, and the npm-facing files list.
- `examples/`, `ALL-SVG-FORMS.md`, and `CHANGELOG.md` now ship in the npm tarball.
- README install paths for `npm install -g`, `npx`, and the library package.

### Fixed

- `svgforge` now runs when invoked through the npm bin symlink. The entry-point check resolves real paths instead of comparing the symlink path to `dist/cli.js`.
- `contributions` accepts `seed` and `density` in manifests, matching the CLI. `examples/demo.json` now really uses its seed.
- `demo` and help output report 32 cards and 22 themes instead of the stale 24 / 16 counts.
- README Node badge and example tags now say Node 22+.

## [2.5.0] - 2026-09-29

### Added

- `--opacity` on every card (`0`–`1` or `0`–`100`).
- 32 card types and 22 themes, including `profile`, `steps`, `pills`, `callout`, `compare`, `social`, `checklist`, and `cover`.
- `--shadow`, `--scale`, and `--border-width` (`0` hides the outline).
- Theme gallery under `examples/themes/`.

### Changed

- `--shadow` is applied once in `wrap()`, not both in the card and in `wrap()`.
- `callout` uses `*` for `tip` and `i` for `info`.
- `links` card renders plain pills by default; pass `--link` to enable anchors (previously `--no-link` to disable).
- `contributions` card uses title `"Contributions (sample)"` when `--seed` is set and no `--title` is given.
- README: Node.js requirement updated to 22+.
- README: exports list updated to match current public API.
- README: path confinement section rewritten to reflect actual substitution-then-check order.

### Fixed

- `figure` places its `clipPath` inside `<defs>`.
- `rating` clips only the partial star.
- Removed "v1 call sites keep working unchanged" claim after public API was narrowed.
- Removed personal project names (ctxpack, hookyard, envsentinel) from examples.
- Removed contradictory "do not feed untrusted manifest" warning (check runs on substituted path).

### Security

- User strings go through `escapeXml` (`&`, `<`, `>`, `"`, `'`).
- `svgforge render` refuses `out` paths that contain `..` or are absolute.
- `figure` accepts only `https://` URLs without credentials.
