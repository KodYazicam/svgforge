<p align="center">
  <img src="examples/banner.svg" alt="svgforge" width="100%">
</p>

<p align="center">
  <strong>Generate GitHub README SVGs on your machine.</strong><br/>
  Banners, stat cards, skill bars, terminals, badges. No third-party render service.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/license-KYAL--1.0-7C3AED?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/author-KodYazicam-0D0D0D?style=flat-square" alt="Author">
</p>

---

capsule-render, github-readme-stats, and typing SVGs look great until the CDN is down or the theme breaks. **svgforge** writes the same kind of cards as files you commit.

```bash
npx svgforge banner --title ctxpack --subtitle "Pack a codebase into LLM context" -o assets/banner.svg
```

<p align="center">
  <img src="examples/stats.svg" alt="stats">
  <img src="examples/skills.svg" alt="skills">
</p>

<p align="center">
  <img src="examples/terminal.svg" alt="terminal" width="100%">
</p>

## Cards

| Type | Use |
| --- | --- |
| `banner` | Hero header for a repo README |
| `stats` | Label / value rows |
| `skills` | Percentage bars |
| `terminal` | Fake shell screenshot |
| `badge` | Tiny label + value pill |

Themes: `midnight` · `tokyonight` · `dracula` · `nord` · `github`

## CLI

```bash
svgforge banner --title hookyard --subtitle "Catch webhooks" --theme tokyonight -o banner.svg
svgforge stats --item Stars=12 --item Forks=3 -o stats.svg
svgforge skills --item TypeScript=90 --item Python=80 -o skills.svg
svgforge terminal --line "$ hookyard --port 4242" --line "listening" -o term.svg
svgforge badge --label license --value KYAL-1.0 -o badge.svg
svgforge render examples/demo.json -o examples/
svgforge themes
```

## Manifest

```json
{
  "theme": "midnight",
  "cards": [
    { "type": "banner", "title": "ctxpack", "subtitle": "LLM context packer", "out": "banner.svg" },
    { "type": "skills", "items": [{ "name": "TypeScript", "level": 90 }], "out": "skills.svg" }
  ]
}
```

## Library

```ts
import { banner, skills, renderManifest } from "svgforge";

const svg = banner({ title: "envsentinel", subtitle: "Lint your .env", theme: "nord" });
```

## Why local SVG

- GitHub caches your committed assets. No `camo` outage, no rate limit.
- XML is escaped. Titles like `A&B <C>` will not break the file.
- You can restyle cards in git instead of chasing query-string APIs.

## License — KYAL-1.0

Free to use and modify. **Attribution is mandatory.**

```
Author : Batuhan (KodYazicam)
Project: svgforge
Source : https://github.com/KodYazicam/svgforge
```

See [LICENSE](./LICENSE).

<p align="center"><sub>Built by <a href="https://github.com/KodYazicam">KodYazicam</a></sub></p>
