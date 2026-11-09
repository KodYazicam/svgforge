# Contributing to svgforge

```bash
npm ci
npm test
npm run examples
```

- All user strings go through `escapeXml`.
- Gradient / filter ids must be unique (`svgId`).
- `render` must refuse `..` and absolute `out` paths — add a test if you touch path logic.
- Keep the Apache-2.0 license notice intact.
