# Contributing to svgforge

```bash
npm ci
npm test
npm run examples
```

- All user strings go through `escapeXml`.
- Gradient / filter ids must be unique (`svgId`).
- `render` must refuse `..` and absolute `out` paths — add a test if you touch path logic.
- Every card type needs a section in `ALL-SVG-FORMS.md`, an entry in `examples/demo.json`, and a checked-in `examples/*.svg`; `npm test` verifies this.
- Keep the Apache-2.0 license notice intact.
