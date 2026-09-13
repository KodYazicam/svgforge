<p align="center">
  <img src="examples/banner.svg" alt="svgforge" width="100%">
</p>

<p align="center">
  <strong>Generate GitHub README SVGs on your machine.</strong><br/>
  Banners, stat cards, skill bars, terminals, badges. No third-party render service.
</p>

<p align="center">
  <a href="https://github.com/KodYazicam/svgforge/actions"><img src="https://img.shields.io/github/actions/workflow/status/KodYazicam/svgforge/ci.yml?style=flat-square" alt="CI"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/license-KYAL--1.0-7C3AED?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/author-KodYazicam-0D0D0D?style=flat-square" alt="Author">
</p>

---

capsule-render, github-readme-stats, and typing SVGs look great until the CDN is down or the theme breaks. **svgforge** writes the same kind of cards as files you commit. GitHub serves them from your repo. No camo outage, no rate limit, no query-string theme API.

```bash
git clone https://github.com/KodYazicam/svgforge.git
cd svgforge && npm ci && npm run build
node dist/cli.js banner --title ctxpack --subtitle "Pack a codebase into LLM context" -o assets/banner.svg
```

The scoped package name is `@kodyazicam/svgforge`. The binary is `svgforge`. Library import:

```ts
import { banner } from "@kodyazicam/svgforge";
```

<p align="center">
  <img src="examples/stats.svg" alt="stats">
  <img src="examples/skills.svg" alt="skills">
</p>

<p align="center">
  <img src="examples/terminal.svg" alt="terminal" width="100%">
</p>

## Table of contents

- [Requirements](#requirements)
- [Install](#install)
- [Quick start](#quick-start)
- [Card types](#card-types)
- [Themes](#themes)
- [CLI](#cli)
- [Manifest](#manifest)
- [Path confinement](#path-confinement)
- [Library](#library)
- [GitHub README usage](#github-readme-usage)
- [Escaping and limits](#escaping-and-limits)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [License](#license--kyal-10)

## Requirements

- Node.js **20+**
- No canvas, no browser, no network

## Install

Not on npm. Clone and build:

```bash
git clone https://github.com/KodYazicam/svgforge.git
cd svgforge
npm ci
npm test
npm run build
node dist/cli.js banner --title hello -o banner.svg
# optional: npm link
```

## Quick start

```bash
svgforge banner --title hookyard --subtitle "Catch webhooks" --theme tokyonight -o banner.svg
svgforge stats --item Stars=12 --item Forks=3 -o stats.svg
svgforge skills --item TypeScript=90 --item Python=80 -o skills.svg
svgforge terminal --line "$ hookyard --port 4242" --line "listening" -o term.svg
svgforge badge --label license --value KYAL-1.0 -o badge.svg
svgforge render examples/demo.json -o examples/
svgforge themes
```

Without `-o` / `--out`, SVG goes to stdout (redirect with `> file.svg`).

## Card types

| Type | Flags | Use |
| --- | --- | --- |
| `banner` | `--title` `--subtitle` | Hero header. Gradient IDs are unique per title so two banners on one README do not paint each other. |
| `stats` | `--title` `--item Label=Value` (repeat) | Label / value rows |
| `skills` | `--title` `--item Name=0-100` (repeat) | Percentage bars (clamped 0–100; invalid → 0) |
| `terminal` | `--title` `--line text` (repeat) | Fake shell; lines starting with `$` or `>` use the accent color |
| `badge` | `--label` `--value` | Tiny pill |

All commands accept `--theme`.

## Themes

`midnight` (default) · `tokyonight` · `dracula` · `nord` · `github`

```bash
svgforge themes
```

Unknown names fall back to `midnight`.

## CLI

```text
svgforge banner|stats|skills|terminal|badge [flags] [-o file.svg] [--theme name]
svgforge render manifest.json -o ./outdir
svgforge themes
svgforge --help
svgforge --version
```

`render` writes one file per card. Nested `out` paths are created (`assets/hero/banner.svg`) **inside** `-o`.

## Manifest

`examples/demo.json`:

```json
{
  "theme": "midnight",
  "cards": [
    {
      "type": "banner",
      "title": "ctxpack",
      "subtitle": "LLM context packer",
      "out": "banner.svg"
    },
    {
      "type": "stats",
      "title": "Open source",
      "items": [
        { "label": "Tools shipped", "value": "5" },
        { "label": "License", "value": "KYAL-1.0" }
      ],
      "out": "stats.svg"
    },
    {
      "type": "skills",
      "items": [{ "name": "TypeScript", "level": 90 }],
      "out": "skills.svg"
    }
  ]
}
```

Per-card `theme` overrides the manifest default. If `out` is omitted, files are `banner-1.svg`, `stats-2.svg`, …

## Path confinement

`out` values that contain `..`, that are absolute (`/etc/cron.d/pwn.svg`), or that would resolve outside `-o` are **rejected**. Do not feed an untrusted manifest to `render` and expect writes to stay in the output directory — and if you find a bypass, see [SECURITY.md](./SECURITY.md).

## Library

```ts
import { banner, skills, renderManifest, THEMES } from "@kodyazicam/svgforge";

const svg = banner({
  title: "envsentinel",
  subtitle: "Lint your .env",
  theme: "nord",
});

const files = renderManifest({
  theme: "midnight",
  cards: [{ type: "badge", label: "license", value: "KYAL-1.0", out: "badge.svg" }],
});
```

Exports: `banner`, `stats`, `skills`, `terminal`, `badge`, `renderCard`, `renderManifest`, `safeOutputPath`, `THEMES`, `escapeXml`, `svgId`.

## GitHub README usage

Commit the SVG, then:

```markdown
<p align="center">
  <img src="assets/banner.svg" alt="my-tool" width="100%">
</p>
```

Relative paths work on GitHub, npm, and clones. Do not hotlink a render API if you want the image to survive that API.

Dark GitHub UI: use `midnight`, `tokyonight`, `dracula`, or `github`. Light UI: `nord` is the least dark.

The KodYazicam profile README uses the same generator so a Vercel 402 cannot blank the header.

## Escaping and limits

All user strings go through `escapeXml` (`& < > " '`). Titles like `A&B <C>` will not break the SVG.

Skill `level` is clamped to 0–100. Non-numeric CLI values become 0.

Fonts are generic (`ui-monospace`, `ui-sans-serif`) so GitHub’s renderer does not need webfonts.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank / tiny image on GitHub | Wait for cache; hard-refresh. Path must be committed, not gitignored |
| Theme ignored | Name must be one of `svgforge themes`. Unknown names fall back to `midnight` |
| `--item` parsed wrong | Use `Label=Value` with no spaces around `=`, or quote: `--item "Stars=12"` |
| `render` missing files | Pass `-o` directory; check `out` filenames in the JSON |
| `refusing path traversal` | `out` tried to leave the output directory. Use a relative name |
| Two banners look identical | Old files used `id="g"`. Rebuild with this version (unique gradient ids) |
| XML entity in title | Already escaped. If you double-escape you will see `&amp;amp;` |

## FAQ

**Can it fetch GitHub stats live?** No. That is the point. Pass numbers you control.

**Animated banners?** Not in v1. Static SVG only.

**Can I edit the SVG in Figma?** Yes. It is plain SVG.

**Is it on npm?** No. Clone this repo. The package name in `package.json` is `@kodyazicam/svgforge` so a local `npm link` does not collide with the unrelated public `svgforge` package.

## License — KYAL-1.0

Free to use and modify. **Attribution is mandatory.**

```
Author : Batuhan (KodYazicam)
Project: svgforge
Source : https://github.com/KodYazicam/svgforge
```

See [LICENSE](./LICENSE).

<p align="center"><sub>Built by <a href="https://github.com/KodYazicam">KodYazicam</a></sub></p>
