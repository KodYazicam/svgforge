# Security Policy

svgforge generates SVG files on disk. It does not fetch GitHub stats and does not run a server.

## Path confinement

`svgforge render manifest.json -o DIR` will **refuse** `out` values that contain `..` or are absolute. Do not feed an untrusted manifest to `render` on a machine where writing outside `DIR` would matter — and if you find a bypass, report it.

User strings (titles, labels, terminal lines) are XML-escaped (`& < > " '`).

## Reporting

Open a private advisory on [KodYazicam/svgforge](https://github.com/KodYazicam/svgforge/security/advisories/new).
