import { escapeXml, resolveTheme, wrap } from "../escape.js";

export interface BadgeOptions {
  label: string;
  value: string;
  theme?: string;
}

function textWidth(text: string): number {
  return Math.ceil(text.length * 7.2) + 20;
}

export function badge(options: BadgeOptions): string {
  const theme = resolveTheme(options.theme);
  const left = textWidth(options.label);
  const right = textWidth(options.value);
  const width = left + right;
  const height = 28;
  const inner = `
  <rect width="${width}" height="${height}" rx="6" fill="${theme.bg}"/>
  <rect width="${left}" height="${height}" rx="6" fill="${theme.bg2}"/>
  <rect x="${left - 6}" width="6" height="${height}" fill="${theme.bg2}"/>
  <rect x="${left}" width="${right}" height="${height}" fill="${theme.accent2}"/>
  <text x="${left / 2}" y="19" text-anchor="middle" fill="${theme.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12">${escapeXml(options.label)}</text>
  <text x="${left + right / 2}" y="19" text-anchor="middle" fill="${theme.text}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" font-weight="700">${escapeXml(options.value)}</text>
`;
  return wrap(`${options.label}: ${options.value}`, inner, width, height);
}
