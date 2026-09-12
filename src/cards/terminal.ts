import { escapeXml, resolveTheme, wrap } from "../escape.js";

export interface TerminalOptions {
  title?: string;
  lines: string[];
  theme?: string;
  width?: number;
}

export function terminal(options: TerminalOptions): string {
  const theme = resolveTheme(options.theme);
  const width = options.width ?? 720;
  const lineHeight = 22;
  const height = 72 + options.lines.length * lineHeight;
  const body = options.lines
    .map((line, i) => {
      const y = 68 + i * lineHeight;
      const prompt = line.startsWith("$") || line.startsWith(">");
      const fill = prompt ? theme.accent : theme.text;
      return `<text x="24" y="${y}" fill="${fill}" font-family="ui-monospace, Menlo, monospace" font-size="14">${escapeXml(line)}</text>`;
    })
    .join("\n  ");
  const inner = `
  <rect width="${width}" height="${height}" rx="14" fill="${theme.bg}" stroke="${theme.line}"/>
  <circle cx="28" cy="24" r="6" fill="#ff5f56"/>
  <circle cx="48" cy="24" r="6" fill="#ffbd2e"/>
  <circle cx="68" cy="24" r="6" fill="#27c93f"/>
  <text x="96" y="28" fill="${theme.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12">${escapeXml(options.title ?? "terminal")}</text>
  ${body}
`;
  return wrap(options.title ?? "terminal", inner, width, height);
}
