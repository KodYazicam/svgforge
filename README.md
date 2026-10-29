<p align="center">
  <img src="examples/banner.svg" alt="svgforge" width="100%">
</p>

<p align="center">
  <strong>Generate GitHub README SVGs on your machine.</strong><br/>
  Banners, stats, skills, terminals, badges, dividers, progress, donuts, charts, links, quotes, code, projects, waves, timelines, contribution graphs,   counters, sparklines, gauges, radars, columns, ratings, figures, marks, profiles, steps, pills, callouts, comparisons, social rows, checklists, and covers. No third-party render service.
</p>

<p align="center">
  <a href="https://github.com/KodYazicam/svgforge/actions"><img src="https://img.shields.io/github/actions/workflow/status/KodYazicam/svgforge/ci.yml?style=flat-square" alt="CI"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D22-339933?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/license-KYAL--1.0-7C3AED?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/author-KodYazicam-0D0D0D?style=flat-square" alt="Author">
</p>

---

capsule-render, github-readme-stats, and typing SVGs look great until the CDN is down or the theme breaks. **svgforge** writes the same kind of cards as files you commit. GitHub serves them from your repo. No camo outage, no rate limit, no query-string theme API.

```bash
npm install -g @kodyazicam/svgforge
svgforge banner --title mytool --subtitle "Pack a codebase into LLM context" -o assets/banner.svg
```

You can also run it without a global install:

```bash
npx @kodyazicam/svgforge banner --title mytool -o assets/banner.svg
```

From another project, install the library:

```bash
npm install @kodyazicam/svgforge
```

```ts
import { banner } from "@kodyazicam/svgforge";
```

<p align="center">
  <img src="examples/stats.svg" alt="stats">
  <img src="examples/skills.svg" alt="skills">
</p>

<p align="center">
  <img src="examples/wave.svg" alt="wave" width="100%">
</p>

<p align="center">
  <img src="examples/donut.svg" alt="donut">
  <img src="examples/progress.svg" alt="progress">
</p>

<p align="center">
  <img src="examples/terminal.svg" alt="terminal" width="100%">
</p>

> **[ALL-SVG-FORMS.md](./ALL-SVG-FORMS.md)** — every card type as a rendered image, with the exact command and flags that produce it.

## Table of contents

- [Requirements](#requirements)
- [Install](#install)
- [Quick start](#quick-start)
- [Card types](#card-types)
- [Themes](#themes)
- [Custom colors and layout](#custom-colors-and-layout)
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

- Node.js **22+**
- No canvas, no browser, no network

## Install

Global CLI:

```bash
npm install -g @kodyazicam/svgforge
svgforge banner --title hello -o banner.svg
```

One-off use:

```bash
npx @kodyazicam/svgforge banner --title hello -o banner.svg
```

Library:

```bash
npm install @kodyazicam/svgforge
```

From source:

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
svgforge banner --title myapp --subtitle "Catch webhooks" --theme tokyonight -o banner.svg
svgforge stats --item Stars=12 --item Forks=3 -o stats.svg
svgforge skills --item TypeScript=90 --item Python=80 --show-value -o skills.svg
svgforge terminal --line "$ myapp --port 4242" --line "listening" --caret -o term.svg
svgforge badge --label license --value KYAL-1.0 --style plastic -o badge.svg
svgforge divider --label "more below" -o divider.svg
svgforge progress --value 68 --caption "roadmap" -o progress.svg
svgforge donut --item Code=55 --item Docs=30 --item Tests=15 --center 100% -o donut.svg
svgforge chart --item Mon=12 --item Tue=34 --item Thu=51 -o chart.svg
svgforge links --item GitHub=https://github.com/KodYazicam -o links.svg
svgforge quote --text "Ship files, not fetches." --author "you" -o quote.svg
svgforge code --lang ts --line 'const x = 1;' --line-numbers -o code.svg
svgforge project --name mytool --description "Pack a codebase" --item Stars=12 --tag TypeScript -o project.svg
svgforge wave --title "hello" --subtitle "v2" -o wave.svg
svgforge timeline --item 2026-09-01=v1.0 --item 2026-09-28=v2.0 -o timeline.svg
svgforge contributions --seed 42 --total 1337 -o contrib.svg
svgforge counter --value 1337 --suffix /mo -o counter.svg
svgforge sparkline --values 4,9,6,12,8,15 --unit k --smooth -o sparkline.svg
svgforge gauge --value 96 --unit % -o gauge.svg
svgforge radar --item Frontend=90 --item Backend=85 --item DevOps=70 -o radar.svg
svgforge columns --item Mon=3 --item Tue=7 --item Fri=12 -o columns.svg
svgforge rating --value 4.5 -o rating.svg
svgforge figure --url https://example.com/shot.svg --caption "any https image" -o figure.svg
svgforge mark --letter K -o mark.svg
svgforge profile --name KodYazicam --handle @kodyazicam --bio "local tools" --item Repos=12 -o profile.svg
svgforge steps --item Clone --item Build --item Commit -o steps.svg
svgforge pills --tag TypeScript --tag Node --tag SVG -o pills.svg
svgforge callout --title "No network" --text "Commit the SVG." --tone tip -o callout.svg
svgforge compare --left CDN --right local --item "Offline|no|yes" -o compare.svg
svgforge social --item "GitHub=@KodYazicam" -o social.svg
svgforge checklist --item "done:tests" --item tag -o checklist.svg
svgforge cover --kicker "local svg" --title svgforge --subtitle "zero network" --shadow -o cover.svg
svgforge render examples/demo.json -o examples/
svgforge demo -o ./svgforge-demo
svgforge themes
```

Without `-o` / `--out`, SVG goes to stdout (redirect with `> file.svg`).

## Card types

| Type | Flags | Use |
| --- | --- | --- |
| `banner` | `--title` `--subtitle` `--tag` `--logo` `--gradient a,b` | Hero header. Gradient IDs are unique per title so two banners on one README do not paint each other. |
| `stats` | `--title` `--item Label=Value` (repeat) | Label / value rows |
| `skills` | `--title` `--item Name=0-100` (repeat) `--show-value` | Percentage bars (clamped 0–100; invalid → 0) |
| `terminal` | `--title` `--line text` (repeat) `--prompt` `--caret` | Fake shell; lines starting with `$` (or your prompt) use the accent color. `--caret` blinks |
| `badge` | `--label` `--value` `--style flat\|outline\|plastic` `--label-color` | Tiny pill |
| `divider` | `--label` | Section separator, optionally with a centered pill |
| `progress` | `--title` `--value 0-100` `--caption` | One milestone bar with the percent printed |
| `donut` | `--title` `--item Label=Value` (repeat) `--center` `--unit` | Ring chart with legend; colors rotate through the theme |
| `chart` | `--title` `--item Label=Value` (repeat) `--unit` | Horizontal bars scaled to your largest value (raw values, not 0–100) |
| `links` | `--item Text=URL` (repeat) `--link` | Row of pill buttons. Anchors are off by default; `--link` enables them. Only `http(s)` urls are accepted |
| `quote` | `--text` `--author` | Pull-quote card; long text wraps |
| `code` | `--title` `--lang ts\|py\|sh` `--line` (repeat) `--line-numbers` | Snippet card with comment/string/keyword/number coloring |
| `project` | `--name` `--description` `--host` `--item Label=Value` `--tag text` (repeat) | Repo card: name, blurb, stat columns, tag pills |
| `wave` | `--title` `--subtitle` `--animate` | Layered sine-wave header, capsule-render style |
| `timeline` | `--title` `--item Date=Label` (repeat) | Vertical milestone rail with dots |
| `contributions` | `--title` `--seed n --density 0.4` or `--file weeks.json` `--total` | 52-week heatmap; `randomWeeks`/`levelColors` are exported for real data |
| `counter` | `--title` `--value` `--prefix` `--suffix` | One big number |
| `sparkline` | `--title` `--values 3,5,2,8` `--unit` `--smooth` `--no-area` | Line chart from a comma list |
| `gauge` | `--title` `--value` `--min` `--hi` `--unit` | Semicircle meter; values outside the range pin to the ends |
| `radar` | `--title` `--item Axis=0-100` (min 3) `--levels` | Polygon skill chart |
| `columns` | `--title` `--item Label=Value` `--unit` | Vertical bars scaled to the largest value |
| `rating` | `--title` `--value` `--count` | Star row, half stars included |
| `figure` | `--url https://...` `--caption` `--alt` `--fit cover\|contain` | Framed https image |
| `mark` | `--letter` `--shape circle\|square\|squircle` `--gradient` | Monogram logo |
| `profile` | `--name` `--handle` `--bio` `--avatar` `--item` | Avatar, bio, stat row |
| `steps` | `--title` `--item` | Numbered steps |
| `pills` | `--title` `--tag` | Wrapping chip cloud |
| `callout` | `--title` `--text` `--tone info\|tip\|warn` | Accent note |
| `compare` | `--left` `--right` `--item Label\|a\|b` | Two-column comparison |
| `social` | `--item Name=handle` | Handle list |
| `checklist` | `--item` or `--item done:text` | Checkbox list |
| `cover` | `--title` `--subtitle` `--kicker` | Large hero, bigger than banner |

All commands accept `--theme` and the [common flags](#custom-colors-and-layout). Rendered examples with copy-paste commands per card: [ALL-SVG-FORMS.md](./ALL-SVG-FORMS.md).

## Themes

`midnight` (default) · `tokyonight` · `dracula` · `nord` · `github` · `github-light` · `gruvbox` · `catppuccin` · `catppuccin-latte` · `onedark` · `monokai` · `solarized` · `solarized-light` · `synthwave` · `rose-pine` · `tokyo-night-storm` · `kanagawa` · `everforest` · `ayu` · `horizon` · `material` · `paper`

```bash
svgforge themes
```

Rendered sample of every theme: [ALL-SVG-FORMS.md](./ALL-SVG-FORMS.md#theme-gallery).

Unknown names fall back to `midnight`. For light GitHub UIs try `paper`, `github-light`, `catppuccin-latte`, or `solarized-light`.

## Custom colors and layout

Every card accepts these. Defaults reproduce the theme exactly — pass nothing and output is identical to v1.

| Flag | Effect |
| --- | --- |
| `--bg`, `--bg2`, `--fg`, `--muted`, `--accent`, `--accent2`, `--line-color <#rrggbb>` | Override one theme color at a time |
| `--width <px>`, `--height <px>` | Card size |
| `--radius <px>` | Corner radius |
| `--font <family>` | Replace the font stack everywhere on the card |
| `--flat` | Solid background instead of a gradient (`banner`, `wave`) |
| `--border-width <px>` | Outline thickness, `0` hides it |
| `--shadow` | Soft drop shadow |
| `--opacity <0-1 or 0-100>` | Fade the whole card |
| `--scale <0.1-4>` | Shrink or grow the rendered size; the viewBox stays the same |
| `--gradient #aabbcc,#111111` | Custom two-stop gradient (`banner`) |

```bash
svgforge banner --title mytool --bg "#0b1220" --accent "#38bdf8" --flat -o banner.svg
svgforge stats --item Stars=12 --theme paper --radius 4 -o stats.svg
```

Bad colors (`red`) and bad sizes (`--width abc`) exit 1 with the flag named in the message.

## CLI

```text
svgforge <card-type> [flags] [-o file.svg]
svgforge render manifest.json -o ./outdir [--set key=value]
svgforge demo [-o ./svgforge-demo]
svgforge themes | types
svgforge --help | --version
```

`demo` writes one sample of each of the 32 card types — the fastest way to see everything a theme can do. `render` writes one file per card. Nested `out` paths are created (`assets/hero/banner.svg`) **inside** `-o`.

## Manifest

`examples/demo.json`:

```json
{
  "theme": "midnight",
  "vars": { "tool": "mytool", "license": "KYAL-1.0" },
  "cards": [
    {
      "type": "banner",
      "title": "{{tool}}",
      "subtitle": "LLM context packer",
      "out": "banner.svg"
    },
    {
      "type": "stats",
      "title": "Free to use",
      "items": [
        { "label": "License", "value": "{{license}}" }
      ],
      "out": "stats.svg"
    }
  ]
}
```

`{{var}}` placeholders are replaced in every card field (including `out` filenames). `--set key=value` (repeat) overrides vars from the command line — handy for regenerating a profile README with a different username:

```bash
svgforge render profile.json -o ./assets --set tool=myapp
```

Per-card `theme` overrides the manifest default. If `out` is omitted, files are `banner-1.svg`, `stats-2.svg`, …

## Path confinement

`{{var}}` substitution runs first. The path check then runs on the substituted `out` value. Values that contain `..`, that are absolute (`/etc/cron.d/pwn.svg`), or that would resolve outside `-o` are **rejected**. `links` only accepts `http(s)` urls. If you find a bypass, see [SECURITY.md](./SECURITY.md).

## Library

After `npm install @kodyazicam/svgforge`:

```ts
import { banner, donut, renderManifest, THEMES } from "@kodyazicam/svgforge";

const svg = banner({
  title: "mylib",
  subtitle: "Lint your .env",
  theme: "nord",
});

const files = renderManifest({
  theme: "midnight",
  vars: { tool: "mytool" },
  cards: [{ type: "badge", label: "license", value: "KYAL-1.0", out: "badge.svg" }],
});
```

Exports: `banner`, `stats`, `skills`, `terminal`, `badge`, `divider`, `progress`, `donut`, `chart`, `links`, `quote`, `code`, `project`, `wave`, `timeline`, `contributions`, `randomWeeks`, `levelColors`, `counter`, `sparkline`, `gauge`, `radar`, `columns`, `rating`, `figure`, `mark`, `profile`, `steps`, `pills`, `callout`, `compare`, `social`, `checklist`, `cover`, `renderCard`, `renderManifest`, `safeOutputPath`, `substituteVars`, `CARD_TYPES`, `THEMES`, `FONT_MONO`, `FONT_SANS`.

Every card options object takes the same optional fields as the CLI flags (`theme`, `bg`, `fg`, `accent`, `width`, `radius`, `font`, …).

## GitHub README usage

Commit the SVG, then:

```markdown
<p align="center">
  <img src="assets/banner.svg" alt="my-tool" width="100%">
</p>
```

Relative paths work on GitHub, npm, and clones. Do not hotlink a render API if you want the image to survive that API.

Dark GitHub UI: use `midnight`, `tokyonight`, `dracula`, `github`, `gruvbox`, `catppuccin`, `onedark`, `monokai`, `solarized`, or `synthwave`. Light UI: `paper`, `catppuccin-latte`, `solarized-light`; `nord` is the least dark of the rest.

## Escaping and limits

All user strings go through `escapeXml` (`& < > " '`). Titles like `A&B <C>` will not break the SVG, including inside `code` and `quote` cards.

Skill `level` is clamped to 0–100. Non-numeric CLI values become 0. `progress` accepts `68` or `68%`. `chart` bars scale to your largest value.

Fonts are generic (`ui-monospace`, `ui-sans-serif`) so GitHub’s renderer does not need webfonts.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank / tiny image on GitHub | Wait for cache; hard-refresh. Path must be committed, not gitignored |
| Theme ignored | Name must be one of `svgforge themes`. Unknown names fall back to `midnight` |
| `--item` parsed wrong | Use `Label=Value` with no spaces around `=`, or quote: `--item "Stars=12"` |
| `invalid color for --bg` | Colors must be `#rrggbb`-style hex, one flag per color |
| `invalid --line` / `--text` | You passed a color where text belongs, or vice versa: theme border color is `--line-color` |
| `render` missing files | Pass `-o` directory; check `out` filenames in the JSON |
| `refusing path traversal` | `out` tried to leave the output directory. Use a relative name |
| Two banners look identical | Old files used `id="g"`. Rebuild with this version (unique gradient ids) |
| XML entity in title | Already escaped. If you double-escape you will see `&amp;amp;` |
| Animated wave/terminal is static on GitHub | GitHub serves SVGs through its sanitizer; animation works in browsers and some embeds. Treat `--animate`/`--caret` as best-effort |
| Links card does nothing on GitHub | GitHub renders repo images via `<img>`; anchors are ignored there. They work on your own site |

## FAQ

**Can it fetch GitHub stats live?** No. That is the point. Pass numbers you control.

**Animated banners?** Opt-in and best-effort: `wave --animate` (translating wave layers) and `terminal --caret` (blinking caret) use SMIL. Static everywhere else.

**Can I edit the SVG in Figma?** Yes. It is plain SVG.

**Is it on npm?** Yes: `npm install -g @kodyazicam/svgforge` or `npx @kodyazicam/svgforge`. The scoped name avoids colliding with the unrelated public `svgforge` package.

## License — KYAL-1.0

Free to use and modify. **Attribution is mandatory.**

```
Author : Batuhan (KodYazicam)
Project: svgforge
Source : https://github.com/KodYazicam/svgforge
```

See [LICENSE](./LICENSE).

<p align="center"><sub>Built by <a href="https://github.com/KodYazicam">KodYazicam</a></sub></p>
