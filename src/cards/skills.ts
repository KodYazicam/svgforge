import { escapeXml, resolveTheme, wrap } from "../escape.js";

export interface SkillItem {
  name: string;
  level: number;
}

export interface SkillsOptions {
  title?: string;
  items: SkillItem[];
  theme?: string;
  width?: number;
}

export function skills(options: SkillsOptions): string {
  const theme = resolveTheme(options.theme);
  const width = options.width ?? 520;
  const height = 64 + options.items.length * 44;
  const barWidth = width - 56;
  const body = options.items
    .map((item, i) => {
      const y = 58 + i * 44;
      const pct = Math.max(0, Math.min(100, item.level));
      const filled = Math.round((barWidth * pct) / 100);
      return `
  <text x="28" y="${y}" fill="${theme.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">${escapeXml(item.name)}</text>
  <rect x="28" y="${y + 8}" width="${barWidth}" height="8" rx="4" fill="${theme.bg2}"/>
  <rect x="28" y="${y + 8}" width="${filled}" height="8" rx="4" fill="${theme.accent}"/>`;
    })
    .join("");
  const inner = `
  <rect width="${width}" height="${height}" rx="16" fill="${theme.bg}" stroke="${theme.line}"/>
  <text x="28" y="36" fill="${theme.text}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="700">${escapeXml(options.title ?? "Skills")}</text>
${body}
`;
  return wrap(options.title ?? "skills", inner, width, height);
}
