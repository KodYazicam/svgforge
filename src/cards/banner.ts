import { escapeXml, resolveTheme, svgId, wrap } from "../escape.js";

export interface BannerOptions {
  title: string;
  subtitle?: string;
  theme?: string;
  width?: number;
  height?: number;
}

export function banner(options: BannerOptions): string {
  const theme = resolveTheme(options.theme);
  const width = options.width ?? 880;
  const height = options.height ?? 160;
  const gid = svgId(`${options.title}|${theme.name}`, "grad");
  const inner = `
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.bg}"/>
      <stop offset="55%" stop-color="${theme.line}"/>
      <stop offset="100%" stop-color="${theme.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="16" fill="url(#${gid})"/>
  <circle cx="${width - 70}" cy="40" r="90" fill="${theme.accent2}" fill-opacity="0.18"/>
  <text x="44" y="72" fill="${theme.text}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="40" font-weight="700">${escapeXml(options.title)}</text>
  <text x="44" y="112" fill="${theme.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18">${escapeXml(options.subtitle ?? "")}</text>
`;
  return wrap(options.title, inner, width, height);
}
