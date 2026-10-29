import { cardTheme, escapeXml, mixHex, seededRandom, type BaseCardOptions, wrap } from "../escape.js";

export interface ContributionsOptions extends BaseCardOptions {
  title?: string;
  /** 0-4 contribution level per day; `weeks[weekIndex][dayIndex]`. */
  weeks?: number[][];
  /** Deterministic sample data when `weeks` is omitted. */
  seed?: number;
  /** Sample density (0-1) used with `seed`. */
  density?: number;
  /** Optional total shown under the title, e.g. "1 337 contributions". */
  total?: number;
}

const CELL = 12;
const GAP = 3;
const WEEKS = 52;
const DAYS = 7;

/** Five-level palette derived from the theme (empty -> accent). */
export function levelColors(bg: string, accent: string): string[] {
  return [
    mixHex(bg, accent, 0.15),
    mixHex(bg, accent, 0.4),
    mixHex(bg, accent, 0.62),
    accent,
    mixHex(accent, "#ffffff", 0.25),
  ];
}

/**
 * Deterministic demo data: one level per day for the past 52 weeks, driven by
 * a seeded PRNG so the same seed always renders the same graph.
 */
export function randomWeeks(seed: number, density = 0.4): number[][] {
  const rand = seededRandom(seed);
  const weeks: number[][] = [];
  for (let w = 0; w < WEEKS; w += 1) {
    const days: number[] = [];
    for (let d = 0; d < DAYS; d += 1) {
      if (rand() > density) {
        days.push(0);
        continue;
      }
      const roll = rand();
      days.push(roll < 0.45 ? 1 : roll < 0.75 ? 2 : roll < 0.92 ? 3 : 4);
    }
    weeks.push(days);
  }
  return weeks;
}

function normalizeWeeks(weeks: unknown, seed = 1, density = 0.4): number[][] {
  if (!Array.isArray(weeks) || !weeks.length) {
    const safeDensity = Number.isFinite(density) && density > 0 && density < 1 ? density : 0.4;
    return randomWeeks(Number.isFinite(seed) ? Math.trunc(seed) : 1, safeDensity);
  }
  const out: number[][] = [];
  for (let w = 0; w < Math.min(WEEKS, weeks.length); w += 1) {
    const week = Array.isArray(weeks[w]) ? weeks[w] : [];
    const days: number[] = [];
    for (let d = 0; d < DAYS; d += 1) {
      const level = Number(week[d]);
      days.push(Number.isFinite(level) ? Math.max(0, Math.min(4, Math.trunc(level))) : 0);
    }
    out.push(days);
  }
  return out;
}

export function contributions(options: ContributionsOptions): string {
  const theme = cardTheme(options);
  const weeks = normalizeWeeks(options.weeks, options.seed, options.density);
  const colors = levelColors(theme.bg2, theme.accent);
  const left = 28;
  const top = 56;
  const gridWidth = weeks.length * (CELL + GAP) - GAP;
  const width = left + gridWidth + 170;
  const height = top + DAYS * (CELL + GAP) - GAP + 46;
  const rects: string[] = [];
  for (let w = 0; w < weeks.length; w += 1) {
    for (let d = 0; d < DAYS; d += 1) {
      const level = weeks[w][d];
      const x = left + w * (CELL + GAP);
      const y = top + d * (CELL + GAP);
      rects.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${colors[level]}"/>`);
    }
  }
  const totalText =
    options.total !== undefined && Number.isFinite(options.total)
      ? `${options.total} contributions`
      : "";
  const legendX = left;
  const legendY = height - 20;
  const swatchStart = legendX + 40;
  const legend = colors
    .map(
      (color, i) =>
        `<rect x="${swatchStart + i * (CELL + GAP + 6)}" y="${legendY}" width="${CELL}" height="${CELL}" rx="3" fill="${color}"/>`,
    )
    .join("");
  const inner = `
  <rect width="${width}" height="${height}" rx="16" fill="${theme.bg}" stroke="${theme.line}"/>
  <text x="28" y="34" fill="${theme.text}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700">${escapeXml(options.title ?? "Contributions")}</text>
  <text x="${width - 28}" y="34" text-anchor="end" fill="${theme.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12">${escapeXml(totalText)}</text>
  ${rects.join("\n  ")}
  <text x="${legendX}" y="${legendY + CELL - 3}" fill="${theme.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11">Less</text>
  ${legend}
  <text x="${swatchStart + colors.length * (CELL + GAP + 6) + 6}" y="${legendY + CELL - 3}" fill="${theme.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11">More</text>
`;
  return wrap(options.title ?? "contributions", inner, width, height, options);
}
