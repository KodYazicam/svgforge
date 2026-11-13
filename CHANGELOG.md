# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Published `schema/svgforge.schema.json` (JSON Schema 2020-12) for manifests:
  top-level shape, the 32 card types, common style options, and safe `out`
  paths. Shipped in the npm package and accepted through the optional
  `$schema` key on the `Manifest` type.
- `svgforge init [dir]` scaffolds `svgforge.json` (banner + stats) and
  `assets/README.md` with the render command and a README snippet. Existing
  files are preserved unless `--force` is passed, and the generated manifest
  renders with `svgforge render svgforge.json -o assets`.
- Exported `contrastRatio` and `relativeLuminance` for auditing theme and
  custom colors.
- `svgforge preview [manifest] [--port 4321]` serves a loopback gallery of
  every rendered card. It re-reads the manifest on each request, serves only
  declared outputs, and reports manifest errors in the page.
- `svgforge preview` now accepts repeatable `--set key=value` overrides,
  matching `render`.
- `svgforge validate manifest.json` checks a manifest without writing files:
  the published JSON schema, path confinement and duplicate `out` checks
  (shared with `renderManifest`), unknown card types, and unknown themes.
  Success prints the card count, types, and output paths; any problem exits 1
  with a specific message.

### Changed

- Built-in themes now meet WCAG AA contrast: `text` and `muted` reach 4.5:1
  against both background stops, and `accent` reaches 3:1. Eight themes had
  their muted color adjusted, and `solarized-light` also had its text color
  darkened. `midnight` output is unchanged.
- Documented static-by-default motion, `role="img"` labels, and color-override
  caveats in the README.
- Expanded CLI tests to cover all 32 card commands, common style/output flags,
  `contributions --file`, and required-flag/enum validation. `src/cli.ts` line
  coverage is now 96%.
- Contributions heatmap cells are grouped by level color, shrinking the default
  example from ~26 KB to ~20 KB with identical layout.
- Wave cards sample sine paths every 15 px instead of 10 px, shrinking the
  example from ~9.0 KB to ~6.4 KB with the same shape.
- Added a documentation coverage test that verifies every card type has a section, a demo entry, and a rendered example.

### Fixed

- `renderManifest` (and therefore `svgforge render` and `svgforge preview`)
  now rejects two cards that resolve to the same output path instead of
  silently overwriting the first file. The error names the path and both
  card positions. Paths are compared after POSIX normalization, so `a.svg`
  and `./a.svg` collide.

### Security

- Upgraded `vitest` and `@vitest/coverage-v8` to 5.1.0, clearing the dev-only
  dependency advisories. Added tests for mark shapes, syntax comments, shadow
  helpers, and CLI scale/border flags.

## [2.5.3] - 2026-10-29

### Changed

- Releases are now published to npm from GitHub Actions using trusted publishing (OIDC), with provenance and no long-lived npm tokens.

## [2.5.2] - 2026-10-29

### Fixed

- Re-released as 2.5.2 because npm's registry left 2.5.1 in an unusable staged state (`409 Cannot publish over previously staged version`). No code changes from 2.5.1.

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
