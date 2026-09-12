export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function wrap(id: string, inner: string, width: number, height: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(id)}">
${inner}
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
    muted: "#bd93f9",
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
};

export function resolveTheme(name?: string): Theme {
  return THEMES[name ?? "midnight"] ?? THEMES.midnight;
}
