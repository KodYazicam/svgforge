import { posix, relative, resolve, sep } from "node:path";
import { banner, type BannerOptions } from "./cards/banner.js";
import { stats, type StatsOptions } from "./cards/stats.js";
import { skills, type SkillsOptions } from "./cards/skills.js";
import { terminal, type TerminalOptions } from "./cards/terminal.js";
import { badge, type BadgeOptions } from "./cards/badge.js";
import { divider, type DividerOptions } from "./cards/divider.js";
import { progress, type ProgressOptions } from "./cards/progress.js";
import { donut, type DonutOptions } from "./cards/donut.js";
import { chart, type ChartOptions } from "./cards/chart.js";
import { links, type LinksOptions } from "./cards/links.js";
import { quote, type QuoteOptions } from "./cards/quote.js";
import { code, type CodeOptions } from "./cards/code.js";
import { project, type ProjectOptions } from "./cards/project.js";
import { wave, type WaveOptions } from "./cards/wave.js";
import { timeline, type TimelineOptions } from "./cards/timeline.js";
import { contributions, type ContributionsOptions } from "./cards/contrib.js";
import { counter, type CounterOptions } from "./cards/counter.js";
import { sparkline, type SparklineOptions } from "./cards/sparkline.js";
import { gauge, type GaugeOptions } from "./cards/gauge.js";
import { radar, type RadarOptions } from "./cards/radar.js";
import { columns, type ColumnsOptions } from "./cards/columns.js";
import { rating, type RatingOptions } from "./cards/rating.js";
import { figure, type FigureOptions } from "./cards/figure.js";
import { mark, type MarkOptions } from "./cards/mark.js";
import { profile, type ProfileOptions } from "./cards/profile.js";
import { steps, type StepsOptions } from "./cards/steps.js";
import { pills, type PillsOptions } from "./cards/pills.js";
import { callout, type CalloutOptions } from "./cards/callout.js";
import { compare, type CompareOptions } from "./cards/compare.js";
import { social, type SocialOptions } from "./cards/social.js";
import { checklist, type ChecklistOptions } from "./cards/checklist.js";
import { cover, type CoverOptions } from "./cards/cover.js";

export type Card =
  | ({ type: "banner"; out?: string } & BannerOptions)
  | ({ type: "stats"; out?: string } & StatsOptions)
  | ({ type: "skills"; out?: string } & SkillsOptions)
  | ({ type: "terminal"; out?: string } & TerminalOptions)
  | ({ type: "badge"; out?: string } & BadgeOptions)
  | ({ type: "divider"; out?: string } & DividerOptions)
  | ({ type: "progress"; out?: string } & ProgressOptions)
  | ({ type: "donut"; out?: string } & DonutOptions)
  | ({ type: "chart"; out?: string } & ChartOptions)
  | ({ type: "links"; out?: string } & LinksOptions)
  | ({ type: "quote"; out?: string } & QuoteOptions)
  | ({ type: "code"; out?: string } & CodeOptions)
  | ({ type: "project"; out?: string } & ProjectOptions)
  | ({ type: "wave"; out?: string } & WaveOptions)
  | ({ type: "timeline"; out?: string } & TimelineOptions)
  | ({ type: "contributions"; out?: string } & ContributionsOptions)
  | ({ type: "counter"; out?: string } & CounterOptions)
  | ({ type: "sparkline"; out?: string } & SparklineOptions)
  | ({ type: "gauge"; out?: string } & GaugeOptions)
  | ({ type: "radar"; out?: string } & RadarOptions)
  | ({ type: "columns"; out?: string } & ColumnsOptions)
  | ({ type: "rating"; out?: string } & RatingOptions)
  | ({ type: "figure"; out?: string } & FigureOptions)
  | ({ type: "mark"; out?: string } & MarkOptions)
  | ({ type: "profile"; out?: string } & ProfileOptions)
  | ({ type: "steps"; out?: string } & StepsOptions)
  | ({ type: "pills"; out?: string } & PillsOptions)
  | ({ type: "callout"; out?: string } & CalloutOptions)
  | ({ type: "compare"; out?: string } & CompareOptions)
  | ({ type: "social"; out?: string } & SocialOptions)
  | ({ type: "checklist"; out?: string } & ChecklistOptions)
  | ({ type: "cover"; out?: string } & CoverOptions);

export const CARD_TYPES = [
  "banner",
  "stats",
  "skills",
  "terminal",
  "badge",
  "divider",
  "progress",
  "donut",
  "chart",
  "links",
  "quote",
  "code",
  "project",
  "wave",
  "timeline",
  "contributions",
  "counter",
  "sparkline",
  "gauge",
  "radar",
  "columns",
  "rating",
  "figure",
  "mark",
  "profile",
  "steps",
  "pills",
  "callout",
  "compare",
  "social",
  "checklist",
  "cover",
] as const;

export interface Manifest {
  $schema?: string;
  theme?: string;
  vars?: Record<string, string | number>;
  cards: Card[];
}

const VAR_RE = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

function substituteString(value: string, vars: Record<string, string | number>): string {
  return value.replace(VAR_RE, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}

export function substituteVars<T>(value: T, vars: Record<string, string | number> | undefined): T {
  if (!vars || Object.keys(vars).length === 0) return value;
  if (typeof value === "string") return substituteString(value, vars) as unknown as T;
  if (Array.isArray(value)) return value.map((item) => substituteVars(item, vars)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[substituteString(key, vars)] = substituteVars(item, vars);
    }
    return out as unknown as T;
  }
  return value;
}

export function renderCard(card: Card, fallbackTheme?: string): string {
  const theme = card.theme ?? fallbackTheme;
  switch (card.type) {
    case "banner":
      return banner({ ...card, theme });
    case "stats":
      return stats({ ...card, theme });
    case "skills":
      return skills({ ...card, theme });
    case "terminal":
      return terminal({ ...card, theme });
    case "badge":
      return badge({ ...card, theme });
    case "divider":
      return divider({ ...card, theme });
    case "progress":
      return progress({ ...card, theme });
    case "donut":
      return donut({ ...card, theme });
    case "chart":
      return chart({ ...card, theme });
    case "links":
      return links({ ...card, theme });
    case "quote":
      return quote({ ...card, theme });
    case "code":
      return code({ ...card, theme });
    case "project":
      return project({ ...card, theme });
    case "wave":
      return wave({ ...card, theme });
    case "timeline":
      return timeline({ ...card, theme });
    case "contributions":
      return contributions({ ...card, theme });
    case "counter":
      return counter({ ...card, theme });
    case "sparkline":
      return sparkline({ ...card, theme });
    case "gauge":
      return gauge({ ...card, theme });
    case "radar":
      return radar({ ...card, theme });
    case "columns":
      return columns({ ...card, theme });
    case "rating":
      return rating({ ...card, theme });
    case "figure":
      return figure({ ...card, theme });
    case "mark":
      return mark({ ...card, theme });
    case "profile":
      return profile({ ...card, theme });
    case "steps":
      return steps({ ...card, theme });
    case "pills":
      return pills({ ...card, theme });
    case "callout":
      return callout({ ...card, theme });
    case "compare":
      return compare({ ...card, theme });
    case "social":
      return social({ ...card, theme });
    case "checklist":
      return checklist({ ...card, theme });
    case "cover":
      return cover({ ...card, theme });
    default: {
      const never: never = card;
      throw new Error(`unknown card type: ${(never as Card).type}`);
    }
  }
}

export function safeOutputPath(baseDir: string, file: string): string {
  if (!file || file.includes("\0") || posix.isAbsolute(file) || file.startsWith("/") || /^[A-Za-z]:[\\/]/.test(file)) {
    throw new Error(`refusing absolute output path: ${file}`);
  }
  const target = resolve(baseDir, file);
  const rel = relative(resolve(baseDir), target);
  if (!rel || rel.startsWith("..") || rel.split(sep).includes("..")) {
    throw new Error(`refusing path traversal in out: ${file}`);
  }
  return target;
}

const CARD_TYPE_SET = new Set<string>(CARD_TYPES);

export class ManifestError extends Error {
  constructor(message: string, readonly path: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export interface PreparedCard {
  resolved: Card;
  file: string;
  type: string;
}

/**
 * Substitute vars and validate every card's type and output path without
 * rendering. Shared by `renderManifest` and `svgforge validate`.
 */
export function prepareManifest(manifest: Manifest): PreparedCard[] {
  if (!manifest?.cards || !Array.isArray(manifest.cards)) {
    throw new ManifestError("manifest must contain a cards array", "manifest.cards");
  }
  const prepared = manifest.cards.map((card, index) => {
    if (!card || typeof card !== "object" || !("type" in card)) {
      throw new ManifestError(`card ${index + 1} is missing type`, `manifest.cards[${index}]`);
    }
    if (card.out !== undefined && typeof card.out !== "string") {
      throw new ManifestError(`card ${index + 1} out must be a string`, `manifest.cards[${index}].out`);
    }
    const resolved = substituteVars(card, manifest.vars);
    const type = (resolved as { type?: unknown }).type;
    if (!CARD_TYPE_SET.has(String(type))) {
      throw new ManifestError(`card ${index + 1} has unknown type: ${String(type)}`, `manifest.cards[${index}].type`);
    }
    const file = substituteString(card.out ?? `${card.type}-${index + 1}.svg`, manifest.vars ?? {});
    if (file.includes("..") || posix.isAbsolute(file) || file.startsWith("/") || /^[A-Za-z]:[\\/]/.test(file)) {
      throw new ManifestError(`refusing path traversal in out: ${file}`, `manifest.cards[${index}].out`);
    }
    return { resolved, file, type: String(type) };
  });
  const seen = new Map<string, number>();
  prepared.forEach(({ file }, index) => {
    const key = posix.normalize(file);
    const first = seen.get(key);
    if (first !== undefined) {
      throw new ManifestError(
        `duplicate output path "${file}" (cards ${first + 1} and ${index + 1})`,
        `manifest.cards[${index}].out`,
      );
    }
    seen.set(key, index);
  });
  return prepared;
}

export function renderManifest(manifest: Manifest): Array<{ file: string; svg: string }> {
  return prepareManifest(manifest).map(({ resolved, file }) => ({ file, svg: renderCard(resolved, manifest.theme) }));
}
