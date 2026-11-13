export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function svgId(seed: string, suffix = "g"): string {
  const safe = seed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "card";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return `${suffix}-${safe}-${hash.toString(16)}`;
}

export function mixHex(a: string, b: string, t: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const parse = (hex: string): [number, number, number] => {
    const raw = hex.replace("#", "");
    const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
    const value = Number.parseInt(full, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = clamp(ar + (br - ar) * t);
  const g = clamp(ag + (bg - ag) * t);
  const bl = clamp(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function wrap(
  id: string,
  inner: string,
  width: number,
  height: number,
  options: { shadow?: boolean; opacity?: number } = {},
): string {
  const filterId = svgId(id, "shadow");
  const ownShadow = options.shadow && !inner.includes("feDropShadow");
  const defs = ownShadow
    ? `<defs><filter id="${filterId}" x="-8%" y="-8%" width="120%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.28"/></filter></defs>\n`
    : "";
  const opacity = options.opacity !== undefined && options.opacity >= 0 && options.opacity < 1
    ? ` opacity="${options.opacity}"`
    : "";
  const body = ownShadow ? `<g filter="url(#${filterId})"${opacity}>\n${inner}\n</g>` : opacity ? `<g${opacity}>\n${inner}\n</g>` : inner;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(id)}">
${defs}${body}
</svg>
`;
}

export interface Theme {
  name: string;
  bg: string;
  bg2: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  line: string;
}

export const THEMES: Record<string, Theme> = {
  midnight: {
    name: "midnight",
    bg: "#0f0c29",
    bg2: "#24243e",
    text: "#ffffff",
    muted: "#c4b5fd",
    accent: "#a78bfa",
    accent2: "#7c3aed",
    line: "#302b63",
  },
  tokyonight: {
    name: "tokyonight",
    bg: "#1a1b26",
    bg2: "#24283b",
    text: "#c0caf5",
    muted: "#9aa5ce",
    accent: "#7aa2f7",
    accent2: "#bb9af7",
    line: "#3b4261",
  },
  dracula: {
    name: "dracula",
    bg: "#282a36",
    bg2: "#44475a",
    text: "#f8f8f2",
    muted: "#cdaefa",
    accent: "#ff79c6",
    accent2: "#8be9fd",
    line: "#6272a4",
  },
  nord: {
    name: "nord",
    bg: "#2e3440",
    bg2: "#3b4252",
    text: "#eceff4",
    muted: "#d8dee9",
    accent: "#88c0d0",
    accent2: "#81a1c1",
    line: "#4c566a",
  },
  github: {
    name: "github",
    bg: "#0d1117",
    bg2: "#161b22",
    text: "#e6edf3",
    muted: "#8b949e",
    accent: "#58a6ff",
    accent2: "#3fb950",
    line: "#30363d",
  },
  gruvbox: {
    name: "gruvbox",
    bg: "#282828",
    bg2: "#3c3836",
    text: "#ebdbb2",
    muted: "#bdae93",
    accent: "#fe8019",
    accent2: "#8ec07c",
    line: "#504945",
  },
  catppuccin: {
    name: "catppuccin",
    bg: "#1e1e2e",
    bg2: "#181825",
    text: "#cdd6f4",
    muted: "#a6adc8",
    accent: "#cba6f7",
    accent2: "#89b4fa",
    line: "#313244",
  },
  "catppuccin-latte": {
    name: "catppuccin-latte",
    bg: "#eff1f5",
    bg2: "#e6e9ef",
    text: "#4c4f69",
    muted: "#616377",
    accent: "#8839ef",
    accent2: "#1e66f5",
    line: "#bcc0cc",
  },
  onedark: {
    name: "onedark",
    bg: "#282c34",
    bg2: "#21252b",
    text: "#abb2bf",
    muted: "#9398a2",
    accent: "#61afef",
    accent2: "#c678dd",
    line: "#3e4451",
  },
  monokai: {
    name: "monokai",
    bg: "#272822",
    bg2: "#3e3d32",
    text: "#f8f8f2",
    muted: "#aeaca0",
    accent: "#66d9ef",
    accent2: "#fd971f",
    line: "#49483e",
  },
  solarized: {
    name: "solarized",
    bg: "#002b36",
    bg2: "#073642",
    text: "#eee8d5",
    muted: "#93a1a1",
    accent: "#268bd2",
    accent2: "#b58900",
    line: "#586e75",
  },
  "solarized-light": {
    name: "solarized-light",
    bg: "#fdf6e3",
    bg2: "#eee8d5",
    text: "#53676e",
    muted: "#5d6666",
    accent: "#268bd2",
    accent2: "#d33682",
    line: "#e4ddc8",
  },
  synthwave: {
    name: "synthwave",
    bg: "#1a1523",
    bg2: "#241b2f",
    text: "#f8f8f2",
    muted: "#b7a6d9",
    accent: "#ff71ce",
    accent2: "#01cdfe",
    line: "#3a2b4a",
  },
  "tokyo-night-storm": {
    name: "tokyo-night-storm",
    bg: "#24283b",
    bg2: "#1f2335",
    text: "#c0caf5",
    muted: "#a9b1d6",
    accent: "#7dcfff",
    accent2: "#bb9af7",
    line: "#414868",
  },
  kanagawa: {
    name: "kanagawa",
    bg: "#1f1f28",
    bg2: "#16161d",
    text: "#dcd7ba",
    muted: "#c8c093",
    accent: "#7e9cd8",
    accent2: "#957fb8",
    line: "#363646",
  },
  "everforest": {
    name: "everforest",
    bg: "#2d353b",
    bg2: "#343f44",
    text: "#d3c6aa",
    muted: "#a4b0a7",
    accent: "#a7c080",
    accent2: "#7fbbb3",
    line: "#475258",
  },
  "ayu": {
    name: "ayu",
    bg: "#0b0e14",
    bg2: "#11151c",
    text: "#bfbdb6",
    muted: "#7f8389",
    accent: "#e6b450",
    accent2: "#59c2ff",
    line: "#1c212b",
  },
  "horizon": {
    name: "horizon",
    bg: "#1c1e26",
    bg2: "#232530",
    text: "#d5d8da",
    muted: "#8c8fab",
    accent: "#e95678",
    accent2: "#fab795",
    line: "#2e303e",
  },
  "material": {
    name: "material",
    bg: "#263238",
    bg2: "#1e272c",
    text: "#eeffff",
    muted: "#b0bec5",
    accent: "#82aaff",
    accent2: "#c3e88d",
    line: "#37474f",
  },
  paper: {
    name: "paper",
    bg: "#fafafa",
    bg2: "#f0f0f0",
    text: "#212121",
    muted: "#616161",
    accent: "#0d47a1",
    accent2: "#1565c0",
    line: "#e0e0e0",
  },
  "github-light": {
    name: "github-light",
    bg: "#ffffff",
    bg2: "#f6f8fa",
    text: "#1f2328",
    muted: "#656d76",
    accent: "#0969da",
    accent2: "#1a7f37",
    line: "#d0d7de",
  },
  "rose-pine": {
    name: "rose-pine",
    bg: "#191724",
    bg2: "#1f1d2e",
    text: "#e0def4",
    muted: "#908caa",
    accent: "#ebbcba",
    accent2: "#31748f",
    line: "#26233a",
  },
};

export const THEME_OVERRIDE_CACHE_LIMIT = 64;

const overrideThemes = new Map<string, Theme>();

// Theme records are immutable: cards only read them, and overrides copy first.
// THEMES itself is the per-process registry cache keyed by theme name.
for (const theme of Object.values(THEMES)) Object.freeze(theme);

export function clearThemeCache(): void {
  overrideThemes.clear();
}

export function themeCacheSize(): number {
  return overrideThemes.size;
}

export function resolveTheme(name?: string): Theme {
  return THEMES[name ?? "midnight"] ?? THEMES.midnight;
}

export const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
export const FONT_SANS = "ui-sans-serif, system-ui, sans-serif";

export function fontStack(override: string | undefined, kind: "mono" | "sans"): string {
  return override ? escapeXml(override) : kind === "mono" ? FONT_MONO : FONT_SANS;
}

const HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isValidColor(value: string): boolean {
  return HEX.test(value);
}

function hexToRgb(hex: string): [number, number, number] {
  if (!HEX.test(hex)) throw new Error(`invalid color: ${hex} (use #rrggbb)`);
  const raw = hex.slice(1);
  const full = raw.length <= 4 ? raw.slice(0, 3).split("").map((c) => c + c).join("") : raw.slice(0, 6);
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

export interface StyleOverrides {
  bg?: string;
  bg2?: string;
  fg?: string;
  muted?: string;
  accent?: string;
  accent2?: string;
  line?: string;
}

export interface BaseCardOptions extends StyleOverrides {
  theme?: string;
  width?: number;
  height?: number;
  radius?: number;
  font?: string;
  flat?: boolean;
  borderWidth?: number;
  shadow?: boolean;
  opacity?: number;
}

const COLOR_KEYS: Array<keyof StyleOverrides> = ["bg", "bg2", "fg", "muted", "accent", "accent2", "line"];

export function applyOverrides(theme: Theme, overrides: StyleOverrides = {}): Theme {
  const merged: Theme = { ...theme };
  for (const key of COLOR_KEYS) {
    const value = overrides[key];
    if (value !== undefined) {
      if (!isValidColor(value)) {
        throw new Error(`invalid color for --${key}: ${value} (use #rrggbb)`);
      }
      merged[key === "fg" ? "text" : (key as Exclude<keyof StyleOverrides, "fg">)] = value;
    }
  }
  return merged;
}

function hasColorOverrides(options: StyleOverrides): boolean {
  for (const key of COLOR_KEYS) {
    if (options[key] !== undefined) return true;
  }
  return false;
}

export function cardTheme(options: { theme?: string } & StyleOverrides): Theme {
  const base = resolveTheme(options.theme);
  if (!hasColorOverrides(options)) return base;

  const cacheKey = JSON.stringify([base.name, ...COLOR_KEYS.map((key) => options[key] ?? null)]);
  const cached = overrideThemes.get(cacheKey);
  if (cached) return cached;

  const theme = Object.freeze(applyOverrides(base, options));
  overrideThemes.set(cacheKey, theme);
  if (overrideThemes.size > THEME_OVERRIDE_CACHE_LIMIT) {
    const oldest = overrideThemes.keys().next().value;
    if (oldest !== undefined) overrideThemes.delete(oldest);
  }
  return theme;
}

export function parsePositiveInt(value: string, flag: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error(`invalid ${flag}: ${value} (use a positive integer)`);
  }
  return n;
}

export function parseNonNegativeInt(value: string, flag: string, max = 16): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max || !Number.isInteger(n)) {
    throw new Error(`invalid ${flag}: ${value} (use an integer from 0 to ${max})`);
  }
  return n;
}

export function parseOpacity(value: string, flag: string): number {
  const n = Number(value);
  const unit = n > 1 && n <= 100 ? n / 100 : n;
  if (!Number.isFinite(unit) || unit < 0 || unit > 1) {
    throw new Error(`invalid ${flag}: ${value} (use 0–1 or 0–100)`);
  }
  return unit;
}

export function parseScale(value: string, flag: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0.1 || n > 4) {
    throw new Error(`invalid ${flag}: ${value} (use a number between 0.1 and 4)`);
  }
  return n;
}

/** ` stroke-width="N"` for the card background rect; empty when unset. */
export function borderAttr(options: { borderWidth?: number }): string {
  const width = options.borderWidth;
  if (width === undefined) return "";
  if (!Number.isFinite(width) || width < 0 || width > 16) return "";
  return ` stroke-width="${width}"`;
}

export function shadowFilter(id: string, on?: boolean): string {
  if (!on) return "";
  return `<filter id="${id}" x="-8%" y="-8%" width="120%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.28"/></filter>`;
}

export function shadowAttr(id: string, on?: boolean): string {
  return on ? ` filter="url(#${id})"` : "";
}

/** Multiply an SVG's intrinsic size (width/height attributes) keeping the viewBox. */
export function scaleSvg(svg: string, factor: number): string {
  if (!Number.isFinite(factor) || factor === 1) return svg;
  return svg.replace(
    /(<svg xmlns="[^"]+" width=")(\d+)(" height=")(\d+)(")/,
    (_whole, head: string, w: string, mid: string, h: string, tail: string) =>
      `${head}${Math.round(Number(w) * factor)}${mid}${Math.round(Number(h) * factor)}${tail}`,
  );
}

export function wrapLines(text: string, maxChars: number): string[] {
  if (maxChars < 4) maxChars = 4;
  const out: string[] = [];
  for (const paragraph of text.split(/\n/)) {
    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const chunks: string[] = [];
      let rest = word;
      while (rest.length > maxChars) {
        chunks.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      if (chunks.length) {
        if (current) out.push(current);
        for (const chunk of chunks) out.push(chunk);
        current = rest;
        continue;
      }
      if (!current) current = word;
      else if (`${current} ${word}`.length <= maxChars) current += ` ${word}`;
      else {
        out.push(current);
        current = word;
      }
    }
    if (current) out.push(current);
  }
  return out.length ? out : [""];
}

export function approxTextWidth(text: string, fontSize: number): number {
  return Math.ceil(text.length * fontSize * 0.6);
}
