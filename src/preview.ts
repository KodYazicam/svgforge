import { readFileSync, watch, type FSWatcher } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { basename, dirname, resolve } from "node:path";
import { escapeXml } from "./escape.js";
import { renderManifest, type Manifest } from "./render.js";

interface PreviewItem {
  file: string;
  type: string;
  svg: string;
}

interface PreviewPayload {
  manifestPath: string;
  items: PreviewItem[];
}

export interface PreviewOptions {
  vars?: Record<string, string | number>;
}

export const PREVIEW_RELOAD_DEBOUNCE_MS = 150;

const HTML_CSP = "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'";
const SVG_CSP = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";

export function isLoopbackAddress(address: string | undefined): boolean {
  return (
    address === "::1" ||
    Boolean(address?.startsWith("127.")) ||
    Boolean(address?.startsWith("::ffff:127."))
  );
}

function isLoopback(req: IncomingMessage): boolean {
  return isLoopbackAddress(req.socket.remoteAddress);
}

function loadPreview(manifestPath: string, text: string, vars: PreviewOptions["vars"] = {}): PreviewPayload {
  const manifest = JSON.parse(text) as Manifest;
  const merged: Manifest = {
    ...manifest,
    vars: { ...(manifest?.vars ?? {}), ...vars },
  };
  const rendered = renderManifest(merged);
  return {
    manifestPath,
    items: rendered.map((item, index) => ({
      file: item.file,
      type: merged.cards[index]?.type ?? "card",
      svg: item.svg,
    })),
  };
}

function galleryHtml(payload: PreviewPayload): string {
  const cards = payload.items
    .map((item) => {
      const url = `/file?name=${encodeURIComponent(item.file)}`;
      const alt = `${item.type} card: ${item.file}`;
      return `    <figure>
      <img src="${escapeXml(url)}" alt="${escapeXml(alt)}" loading="lazy">
      <figcaption><strong>${escapeXml(item.file)}</strong><span>${escapeXml(item.type)}</span></figcaption>
    </figure>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>svgforge preview</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; background: #0d1117; color: #e6edf3; font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; }
    header { max-width: 1200px; margin: 0 auto 24px; }
    h1 { margin: 0 0 4px; font-size: 24px; }
    p { margin: 0; color: #8b949e; }
    code { color: #c9d1d9; }
    main { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    figure { margin: 0; padding: 12px; border: 1px solid #30363d; border-radius: 10px; background: #161b22; }
    img { display: block; width: 100%; height: auto; border-radius: 6px; background: #0d1117; }
    figcaption { display: flex; justify-content: space-between; gap: 8px; margin-top: 10px; font-size: 13px; color: #8b949e; }
    figcaption strong { color: #e6edf3; font-weight: 600; overflow-wrap: anywhere; }
    figcaption span { color: #8b949e; white-space: nowrap; }
  </style>
</head>
<body>
  <header>
    <h1>svgforge preview</h1>
    <p>Manifest: <code>${escapeXml(payload.manifestPath)}</code> · ${payload.items.length} card${payload.items.length === 1 ? "" : "s"} · live reload on save</p>
  </header>
  <main>
${cards || '    <p>No cards in this manifest.</p>'}
  </main>
  <script>
    const events = new EventSource("/events");
    events.addEventListener("reload", () => location.reload());
  </script>
</body>
</html>
`;
}

function errorHtml(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>svgforge preview</title>
<style>body{margin:0;padding:32px;background:#0d1117;color:#e6edf3;font:15px/1.5 ui-sans-serif,system-ui,sans-serif}pre{white-space:pre-wrap;padding:16px;border:1px solid #f85149;border-radius:8px;background:#161b22;color:#ffa198}</style>
</head>
<body><h1>${escapeXml(title)}</h1><pre>${escapeXml(message)}</pre></body>
</html>
`;
}

function send(
  res: ServerResponse,
  status: number,
  contentType: string,
  body: string,
  head: boolean,
  headers: Record<string, string> = {},
): void {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...headers,
  });
  res.end(head ? undefined : body);
}

function notFound(res: ServerResponse, head: boolean): void {
  send(res, 404, "text/plain; charset=utf-8", "not found\n", head, {
    "Content-Security-Policy": HTML_CSP,
  });
}

export function createPreviewServer(manifestPath: string, options: PreviewOptions = {}): Server {
  const absolute = resolve(manifestPath);
  let cachedText: string | undefined;
  let cachedPayload: PreviewPayload | undefined;

  const load = (): PreviewPayload => {
    const text = readFileSync(absolute, "utf8");
    if (cachedText === text && cachedPayload) return cachedPayload;
    const payload = loadPreview(absolute, text, options.vars);
    cachedText = text;
    cachedPayload = payload;
    return payload;
  };

  // Fail fast on a missing or invalid manifest before the port is opened.
  load();

  const clients = new Set<ServerResponse>();
  let debounce: NodeJS.Timeout | undefined;
  let watcher: FSWatcher | undefined;
  let stopped = false;

  const cleanup = (): void => {
    if (stopped) return;
    stopped = true;
    if (debounce) clearTimeout(debounce);
    debounce = undefined;
    try {
      watcher?.close();
    } catch {
      // The watcher may already be closed by the platform.
    }
    watcher = undefined;
    for (const client of clients) {
      try {
        client.end();
      } catch {
        // The client may already be gone.
      }
    }
    clients.clear();
  };

  const broadcast = (): void => {
    for (const client of clients) {
      try {
        client.write(`event: reload\ndata: ${Date.now()}\n\n`);
      } catch {
        clients.delete(client);
      }
    }
  };

  const scheduleReload = (): void => {
    if (stopped) return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = undefined;
      broadcast();
    }, PREVIEW_RELOAD_DEBOUNCE_MS);
    debounce.unref();
  };

  try {
    watcher = watch(dirname(absolute), (_event, filename) => {
      const name = typeof filename === "string" ? filename : "";
      if (!name || name === basename(absolute)) scheduleReload();
    });
    watcher.on("error", () => {
      // Keep the gallery usable; live reload just stops.
      try {
        watcher?.close();
      } catch {
        // Ignore a watcher that is already gone.
      }
      watcher = undefined;
    });
  } catch {
    watcher = undefined;
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const head = req.method === "HEAD";
    if (req.method !== "GET" && !head) {
      res.writeHead(405, {
        Allow: "GET, HEAD",
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": 0,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/") {
      try {
        const payload = load();
        send(res, 200, "text/html; charset=utf-8", galleryHtml(payload), head, {
          "Content-Security-Policy": HTML_CSP,
        });
      } catch (error) {
        send(res, 500, "text/html; charset=utf-8", errorHtml("Manifest error", (error as Error).message), head, {
          "Content-Security-Policy": HTML_CSP,
        });
      }
      return;
    }

    if (url.pathname === "/events") {
      if (!isLoopback(req)) {
        send(res, 403, "text/plain; charset=utf-8", "forbidden\n", head, {
          "Content-Security-Policy": HTML_CSP,
        });
        return;
      }
      if (head) {
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Content-Length": 0,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "Content-Security-Policy": "default-src 'none'",
        });
        res.end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'none'",
      });
      clients.add(res);
      res.on("close", () => clients.delete(res));
      res.on("error", () => clients.delete(res));
      try {
        res.write("retry: 1000\n\n");
      } catch {
        clients.delete(res);
      }
      return;
    }

    if (url.pathname === "/file") {
      const name = url.searchParams.get("name");
      if (!name) {
        notFound(res, head);
        return;
      }
      try {
        const item = load().items.find((candidate) => candidate.file === name);
        if (!item) {
          notFound(res, head);
          return;
        }
        send(res, 200, "image/svg+xml; charset=utf-8", item.svg, head, {
          "Content-Security-Policy": SVG_CSP,
        });
      } catch (error) {
        send(res, 500, "text/plain; charset=utf-8", `preview error: ${(error as Error).message}\n`, head, {
          "Content-Security-Policy": SVG_CSP,
        });
      }
      return;
    }

    notFound(res, head);
  });

  server.on("close", cleanup);
  const close = server.close.bind(server);
  server.close = ((callback?: (error?: Error) => void) => {
    // End SSE clients first; otherwise a kept-alive event stream blocks close().
    cleanup();
    return close(callback);
  }) as Server["close"];
  return server;
}
