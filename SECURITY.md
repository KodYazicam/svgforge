# Security Policy

svgforge generates SVG files on disk. It does not fetch GitHub stats and does not run a server.

## Path confinement

`svgforge render manifest.json -o DIR` will **refuse** `out` values that contain `..` or are absolute. Do not feed an untrusted manifest to `render` on a machine where writing outside `DIR` would matter — and if you find a bypass, report it.

User strings (titles, labels, terminal lines) are XML-escaped (`& < > " '`).

## Preview server

`svgforge preview` binds `127.0.0.1` only. It serves an HTML gallery plus an exact allowlist of the SVG outputs declared by the manifest; every other path and file name returns 404. It does not serve directories or arbitrary filesystem paths. The manifest is re-read per request, invalid manifests return 500, HTML is escaped, and responses set `nosniff`, `no-store`, `Referrer-Policy: no-referrer`, and a restrictive CSP.

## Reporting

Open a private advisory on [KodYazicam/svgforge](https://github.com/KodYazicam/svgforge/security/advisories/new).

## External images

`figure` embeds an `https` URL in `<image href>`. The URL must not contain userinfo (`user:pass@host`). GitHub README images are served through Camo, so the embedded image often does not appear. Opening the SVG file directly still fetches that host.

## Animation

`wave --animate` and `terminal --caret` emit SMIL (`<animate>`, `<animateTransform>`). The default examples are static. SMIL is not script. Renderers that strip SMIL keep the unanimated frame.
