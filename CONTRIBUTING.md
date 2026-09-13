# Contributing to svgforge

```bash
npm ci
npm test
npm run examples
```

- All user strings go through `escapeXml`.
- Gradient / filter ids must be unique (`svgId`).
- `render` must refuse `..` and absolute `out` paths — add a test if you touch path logic.
- Keep KYAL-1.0 attribution.
