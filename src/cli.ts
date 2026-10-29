#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { banner } from "./cards/banner.js";
import { stats } from "./cards/stats.js";
import { skills } from "./cards/skills.js";
import { terminal } from "./cards/terminal.js";
import { badge } from "./cards/badge.js";
import { divider } from "./cards/divider.js";
import { progress } from "./cards/progress.js";
import { donut } from "./cards/donut.js";
import { chart } from "./cards/chart.js";
import { links } from "./cards/links.js";
import { quote } from "./cards/quote.js";
import { code } from "./cards/code.js";
import { project } from "./cards/project.js";
import { wave } from "./cards/wave.js";
import { timeline } from "./cards/timeline.js";
import { contributions, randomWeeks } from "./cards/contrib.js";
import { counter } from "./cards/counter.js";
import { sparkline } from "./cards/sparkline.js";
import { gauge } from "./cards/gauge.js";
import { radar } from "./cards/radar.js";
import { columns } from "./cards/columns.js";
import { rating } from "./cards/rating.js";
import { figure } from "./cards/figure.js";
import { mark } from "./cards/mark.js";
import { profile } from "./cards/profile.js";
import { steps } from "./cards/steps.js";
import { pills } from "./cards/pills.js";
import { callout } from "./cards/callout.js";
import { compare } from "./cards/compare.js";
import { social } from "./cards/social.js";
import { checklist } from "./cards/checklist.js";
import { cover } from "./cards/cover.js";
import { CARD_TYPES, renderCard, renderManifest, safeOutputPath, substituteVars, type Card, type Manifest } from "./render.js";
import {
  isValidColor,
  parseNonNegativeInt,
  parsePositiveInt,
  parseOpacity,
  parseScale,
  scaleSvg,
  THEMES,
  type BaseCardOptions,
  type StyleOverrides,
} from "./escape.js";
import { invokedDirectly } from "./main.js";
import { packageVersion } from "./version.js";

function help(): string {
  return `
svgforge — generate GitHub README SVGs locally

Usage:
  svgforge <card-type> [flags] [-o file.svg]
  svgforge render manifest.json -o ./assets [--set key=value]
  svgforge demo [-o ./svgforge-demo]
  svgforge themes | types
  svgforge --help | --version

Card types (see below for their flags):
  banner stats skills terminal badge
  divider progress donut chart links quote code project wave
  timeline contributions
  counter sparkline gauge radar columns rating figure mark
  profile steps pills callout compare social checklist cover

Card flags:
  banner    --title --subtitle [--tag text] [--logo text] [--gradient #aabbcc,#111111]
  stats     --title --item Label=Value (repeat)
  skills    --title --item Name=0-100 (repeat) [--show-value]
  terminal  --title --line text (repeat) [--prompt $] [--caret]
  badge     --label --value [--style flat|outline|plastic] [--label-color #rrggbb]
  divider   [--label text]
  progress  --title --value 0-100 [--caption text] [--no-value]
  donut     --title --item Label=Value (repeat) [--center text] [--unit suffix]
  chart     --title --item Label=Value (repeat) [--unit suffix]
  links     --item Text=https://... (repeat) [--link]
  quote     --text --author
  code      --title --lang ts|py|sh [--line text (repeat)] [--line-numbers]
  project   --name --description --host --item Label=Value (repeat) --tag text (repeat)
  wave      --title --subtitle [--animate]
  timeline  --title --item Date=Label (repeat)
  contributions --title [--seed n --density 0.4 | --file weeks.json] [--total n]
  counter   --title --value [--prefix text] [--suffix text]
  sparkline --title --values 3,5,2,8 [--unit] [--smooth] [--no-area]
  gauge     --title --value [--min 0 --hi 100] [--unit]
  radar     --title --item Axis=0-100 (repeat, min 3) [--levels 4]
  columns   --title --item Label=Value (repeat) [--unit]
  rating    --title --value 0-5 [--count 5]
  figure    --url https://... [--caption] [--alt] [--fit cover|contain]
  mark      --letter K [--shape circle|square|squircle] [--gradient #a,#b]
  profile   --name --handle --bio [--avatar AB] --item Label=Value (repeat)
  steps     --title --item text (repeat)
  pills     --title --tag text (repeat)
  callout   --title --text [--tone info|tip|warn]
  compare   --left A --right B --item Label|left|right (repeat)
  social    --item Name=handle (repeat)
  checklist --title --item text  or  --item done:text (repeat)
  cover     --title --subtitle [--kicker]

Common flags (every card type):
  --theme <name>        one of \`svgforge themes\` (default midnight)
  --width <px>          card width            --height <px>  card height
  --radius <px>         corner radius
  --bg/--bg2/--fg/--muted/--accent/--accent2/--line-color <#rrggbb>
                        override theme colors
  --font <family>       override the font stack
  --flat                solid background instead of gradient
  --border-width <px>   card outline thickness (0 hides it)
  --shadow              soft drop shadow
  --opacity <0-1|0-100> fade the whole card
  --scale <0.1-4>       shrink/grow the rendered size (viewBox untouched)
  -o, --out <path>      output file (directory for render/demo)

Manifest:
  { "theme": "midnight", "vars": { "user": "KodYazicam" },
    "cards": [ { "type": "banner", "title": "{{user}}", "out": "banner.svg" } ] }
  {{var}} placeholders are replaced everywhere; --set overrides vars.

License: KYAL-1.0 — free to use, attribution required.
https://github.com/KodYazicam/svgforge
`.trim();
}

function take(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0) return args[idx + 1];
  return undefined;
}

function takeAll(args: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === name && args[i + 1]) out.push(args[i + 1]);
  }
  return out;
}

function has(args: string[], name: string): boolean {
  return args.includes(name);
}

interface Common {
  theme?: string;
  out?: string;
  width?: number;
  height?: number;
  radius?: number;
  font?: string;
  flat?: boolean;
  scale?: number;
  borderWidth?: number;
  shadow?: boolean;
  opacity?: number;
  overrides: StyleOverrides;
}

function parseCommon(argv: string[]): Common {
  const overrides: StyleOverrides = {};
  const colorFlags: Array<[keyof StyleOverrides, string]> = [
    ["bg", "--bg"],
    ["bg2", "--bg2"],
    ["fg", "--fg"],
    ["muted", "--muted"],
    ["accent", "--accent"],
    ["accent2", "--accent2"],
    ["line", "--line-color"],
  ];
  for (const [key, flag] of colorFlags) {
    const value = take(argv, flag);
    if (value !== undefined) {
      if (!isValidColor(value)) throw new Error(`invalid ${flag}: ${value} (use #rrggbb)`);
      overrides[key] = value;
    }
  }
  const width = take(argv, "--width");
  const height = take(argv, "--height");
  const radius = take(argv, "--radius");
  const scale = take(argv, "--scale");
  const borderWidth = take(argv, "--border-width");
  const opacity = take(argv, "--opacity");
  return {
    theme: take(argv, "--theme"),
    out: take(argv, "-o") ?? take(argv, "--out"),
    width: width !== undefined ? parsePositiveInt(width, "--width") : undefined,
    height: height !== undefined ? parsePositiveInt(height, "--height") : undefined,
    radius: radius !== undefined ? parsePositiveInt(radius, "--radius") : undefined,
    scale: scale !== undefined ? parseScale(scale, "--scale") : undefined,
    borderWidth: borderWidth !== undefined ? parseNonNegativeInt(borderWidth, "--border-width") : undefined,
    font: take(argv, "--font"),
    flat: has(argv, "--flat"),
    shadow: has(argv, "--shadow"),
    opacity: opacity !== undefined ? parseOpacity(opacity, "--opacity") : undefined,
    overrides,
  };
}

function base(common: Common): BaseCardOptions {
  return {
    theme: common.theme,
    width: common.width,
    height: common.height,
    radius: common.radius,
    font: common.font,
    flat: common.flat,
    borderWidth: common.borderWidth,
    shadow: common.shadow,
    opacity: common.opacity,
    ...common.overrides,
  };
}

function writeOut(target: string, svg: string): void {
  mkdirSync(dirname(resolve(target)), { recursive: true });
  writeFileSync(target, svg);
  console.log(`wrote ${target}`);
}

function emit(svg: string, out: string | undefined, scale?: number): number {
  const scaled = scale ? scaleSvg(svg, scale) : svg;
  if (out) writeOut(out, scaled);
  else process.stdout.write(scaled);
  return 0;
}

function parsePairItems(pairs: string[]): Array<{ label: string; value: string }> {
  return pairs.map((pair) => {
    const [label, ...rest] = pair.split("=");
    return { label, value: rest.join("=") };
  });
}

function demoCards(common: Common): Array<{ file: string; card: Card }> {
  const b = base(common);
  return [
    { file: "banner.svg", card: { ...b, type: "banner", title: "svgforge", subtitle: "Generate README SVGs locally" } },
    { file: "wave.svg", card: { ...b, type: "wave", title: "svgforge", subtitle: "one command, thirty-two cards" } },
    { file: "stats.svg", card: { ...b, type: "stats", title: "Stats", items: [{ label: "Cards", value: "32" }, { label: "Themes", value: "22" }, { label: "Deps", value: "0" }] } },
    { file: "skills.svg", card: { ...b, type: "skills", title: "Skills", items: [{ name: "TypeScript", level: 90 }, { name: "Python", level: 80 }] } },
    { file: "terminal.svg", card: { ...b, type: "terminal", title: "bash", lines: ["$ svgforge demo -o ./demo", "wrote demo/banner.svg", "wrote demo/wave.svg"] } },
    { file: "badge.svg", card: { ...b, type: "badge", label: "license", value: "KYAL-1.0" } },
    { file: "divider.svg", card: { ...b, type: "divider", label: "more cards" } },
    { file: "progress.svg", card: { ...b, type: "progress", title: "v2.0", value: 68, caption: "roadmap: 68 of 100 items" } },
    { file: "donut.svg", card: { ...b, type: "donut", title: "Time", items: [{ label: "Code", value: 55 }, { label: "Docs", value: 30 }, { label: "Tests", value: 15 }], center: "24h" } },
    { file: "chart.svg", card: { ...b, type: "chart", title: "Downloads", items: [{ label: "Mon", value: 12 }, { label: "Tue", value: 34 }, { label: "Wed", value: 28 }, { label: "Thu", value: 51 }] } },
    { file: "links.svg", card: { ...b, type: "links", items: [{ text: "GitHub", url: "https://github.com/KodYazicam/svgforge" }, { text: "Issues", url: "https://github.com/KodYazicam/svgforge/issues" }] } },
    { file: "quote.svg", card: { ...b, type: "quote", text: "No third-party render service. Your README images are files you commit.", author: "svgforge" } },
    { file: "code.svg", card: { ...b, type: "code", title: "demo.ts", lang: "ts", lineNumbers: true, lines: ["const cards = renderManifest(manifest);", "// writes one svg per card", "for (const c of cards) write(c.file, c.svg);"] } },
    { file: "project.svg", card: { ...b, type: "project", name: "svgforge", host: "github.com/KodYazicam/svgforge", description: "Thirty-two README card types from one offline CLI. Zero dependencies, no network.", items: [{ label: "Cards", value: "32" }, { label: "Themes", value: "22" }, { label: "Runtime deps", value: "0" }], tags: ["TypeScript", "Node 22+"] } },
    { file: "timeline.svg", card: { ...b, type: "timeline", title: "Releases", items: [{ date: "2026-09-01", label: "v1.0 — five card types" }, { date: "2026-09-26", label: "quote, timeline, contributions" }, { date: "2026-09-28", label: "v2.0 — overrides + manifest vars" }] } },
    { file: "contributions.svg", card: { ...b, type: "contributions", title: "Contributions", weeks: randomWeeks(42), total: 1337 } },
    { file: "counter.svg", card: { ...b, type: "counter", title: "npm downloads", value: 1337, prefix: "", suffix: "/mo" } },
    { file: "sparkline.svg", card: { ...b, type: "sparkline", title: "Traffic", values: [4, 9, 6, 12, 8, 15, 11, 18, 14, 22], unit: "k", smooth: true } },
    { file: "gauge.svg", card: { ...b, type: "gauge", title: "Coverage", value: 96, unit: "%" } },
    { file: "radar.svg", card: { ...b, type: "radar", title: "Skill spread", items: [{ label: "Frontend", value: 90 }, { label: "Backend", value: 85 }, { label: "DevOps", value: 70 }, { label: "Docs", value: 80 }, { label: "Testing", value: 75 }] } },
    { file: "columns.svg", card: { ...b, type: "columns", title: "Issues closed", items: [{ label: "Mon", value: 3 }, { label: "Tue", value: 7 }, { label: "Wed", value: 5 }, { label: "Thu", value: 9 }, { label: "Fri", value: 12 }] } },
    { file: "rating.svg", card: { ...b, type: "rating", title: "Community rating", value: 4.5, count: 5 } },
    { file: "figure.svg", card: { ...b, type: "figure", url: "https://raw.githubusercontent.com/KodYazicam/svgforge/main/examples/wave.svg", caption: "figure embeds any https image" } },
    { file: "mark.svg", card: { ...b, type: "mark", letter: "K" } },
    { file: "profile.svg", card: { ...b, type: "profile", name: "KodYazicam", handle: "@kodyazicam", bio: "Ships local tools.", avatar: "KY", items: [{ label: "Repos", value: "12" }, { label: "Cards", value: "32" }] } },
    { file: "steps.svg", card: { ...b, type: "steps", title: "Ship it", items: ["Clone", "npm ci", "npm run build", "Commit the SVG"] } },
    { file: "pills.svg", card: { ...b, type: "pills", title: "Stack", tags: ["TypeScript", "Node", "Python", "Discord", "SVG", "Linux"] } },
    { file: "callout.svg", card: { ...b, type: "callout", title: "No network", text: "The SVG is a file in your repo. GitHub serves it.", tone: "tip" } },
    { file: "compare.svg", card: { ...b, type: "compare", title: "Why local", left: "CDN card", right: "svgforge", items: [{ label: "Offline", left: "no", right: "yes" }, { label: "Rate limit", left: "yes", right: "no" }] } },
    { file: "social.svg", card: { ...b, type: "social", items: [{ name: "GitHub", handle: "@KodYazicam" }, { name: "Site", handle: "kodyazicam.dev" }] } },
    { file: "checklist.svg", card: { ...b, type: "checklist", title: "Release", items: [{ text: "Tests", done: true }, { text: "Examples", done: true }, { text: "Tag", done: false }] } },
    { file: "cover.svg", card: { ...b, type: "cover", kicker: "local svg", title: "svgforge", subtitle: "thirty-two cards, zero network" } },
  ];
}

export function run(argv: string[]): number {
  const cmd = argv[0];
  if (!cmd || cmd === "-h" || cmd === "--help") {
    console.log(help());
    return 0;
  }
  if (cmd === "-v" || cmd === "--version") {
    console.log(packageVersion());
    return 0;
  }
  if (cmd === "themes") {
    console.log(Object.keys(THEMES).join("\n"));
    return 0;
  }
  if (cmd === "types") {
    console.log(CARD_TYPES.join("\n"));
    return 0;
  }

  try {
    const common = parseCommon(argv);
    if (cmd === "banner") {
      const gradient = take(argv, "--gradient");
      let gradientPair: [string, string] | undefined;
      if (gradient) {
        const parts = gradient.split(",").map((part) => part.trim());
        if (parts.length !== 2) throw new Error("--gradient expects #rrggbb,#rrggbb");
        gradientPair = [parts[0], parts[1]];
      }
      return emit(
        banner({
          ...base(common),
          title: take(argv, "--title") ?? "svgforge",
          subtitle: take(argv, "--subtitle"),
          tag: take(argv, "--tag"),
          logo: take(argv, "--logo"),
          gradient: gradientPair,
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "stats") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({ label: item.label, value: item.value }));
      if (items.length === 0) throw new Error("stats needs --item Label=Value");
      return emit(
        stats({ ...base(common), title: take(argv, "--title") ?? "Stats", items }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "skills") {
      const items = takeAll(argv, "--item").map((pair) => {
        const [name, level] = pair.split("=");
        const n = Number(level);
        return { name, level: Number.isFinite(n) ? n : 0 };
      });
      if (items.length === 0) throw new Error("skills needs --item Name=level");
      return emit(
        skills({
          ...base(common),
          title: take(argv, "--title") ?? "Skills",
          items,
          showValue: has(argv, "--show-value"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "terminal") {
      const lines = takeAll(argv, "--line");
      if (lines.length === 0) throw new Error("terminal needs --line text");
      return emit(
        terminal({
          ...base(common),
          title: take(argv, "--title"),
          lines,
          prompt: take(argv, "--prompt"),
          caret: has(argv, "--caret"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "badge") {
      const style = take(argv, "--style");
      if (style !== undefined && !["flat", "outline", "plastic"].includes(style)) {
        throw new Error(`invalid --style: ${style} (flat | outline | plastic)`);
      }
      return emit(
        badge({
          ...base(common),
          label: take(argv, "--label") ?? "label",
          value: take(argv, "--value") ?? "value",
          style: style as "flat" | "outline" | "plastic" | undefined,
          labelColor: take(argv, "--label-color"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "divider") {
      return emit(divider({ ...base(common), label: take(argv, "--label") }), common.out, common.scale);
    }
    if (cmd === "progress") {
      const value = take(argv, "--value");
      if (value === undefined) throw new Error("progress needs --value 0-100");
      return emit(
        progress({
          ...base(common),
          title: take(argv, "--title") ?? "Progress",
          value,
          caption: take(argv, "--caption"),
          showValue: !has(argv, "--no-value"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "donut") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({
        label: item.label,
        value: Number(item.value),
      }));
      if (items.length === 0) throw new Error("donut needs --item Label=Value");
      return emit(
        donut({
          ...base(common),
          title: take(argv, "--title") ?? "Donut",
          items,
          center: take(argv, "--center"),
          unit: take(argv, "--unit"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "chart") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({
        label: item.label,
        value: Number(item.value),
      }));
      if (items.length === 0) throw new Error("chart needs --item Label=Value");
      return emit(
        chart({
          ...base(common),
          title: take(argv, "--title") ?? "Chart",
          items,
          unit: take(argv, "--unit"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "links") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({
        text: item.label,
        url: item.value || undefined,
      }));
      if (items.length === 0) throw new Error("links needs --item Text=URL");
      return emit(
        links({ ...base(common), items, link: has(argv, "--link") }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "quote") {
      const text = take(argv, "--text");
      if (text === undefined) throw new Error("quote needs --text");
      return emit(quote({ ...base(common), text, author: take(argv, "--author") }), common.out, common.scale);
    }
    if (cmd === "code") {
      const lines = takeAll(argv, "--line");
      if (lines.length === 0) throw new Error("code needs --line text");
      return emit(
        code({
          ...base(common),
          title: take(argv, "--title"),
          lang: take(argv, "--lang"),
          lines,
          lineNumbers: has(argv, "--line-numbers"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "project") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({ label: item.label, value: item.value }));
      return emit(
        project({
          ...base(common),
          name: take(argv, "--name") ?? "project",
          description: take(argv, "--description"),
          host: take(argv, "--host"),
          items,
          tags: takeAll(argv, "--tag"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "wave") {
      return emit(
        wave({
          ...base(common),
          title: take(argv, "--title") ?? "svgforge",
          subtitle: take(argv, "--subtitle"),
          animate: has(argv, "--animate"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "timeline") {
      const items = takeAll(argv, "--item").map((pair) => {
        const [date, ...rest] = pair.split("=");
        return { date, label: rest.join("=") };
      });
      if (items.length === 0) throw new Error("timeline needs --item Date=Label (repeat)");
      return emit(
        timeline({ ...base(common), title: take(argv, "--title") ?? "Timeline", items }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "contributions") {
      const file = take(argv, "--file");
      const seed = Number(take(argv, "--seed"));
      const density = Number(take(argv, "--density") ?? "0.4");
      let weeks: number[][];
      if (file) {
        const payload = JSON.parse(readFileSync(resolve(file), "utf8")) as unknown;
        const raw = Array.isArray(payload) ? payload : (payload as { weeks?: number[][] })?.weeks;
        if (!Array.isArray(raw)) {
          throw new Error("contributions --file expects a JSON array of weeks (or { weeks: [...] })");
        }
        weeks = raw;
      } else if (Number.isFinite(seed) && take(argv, "--seed") !== undefined) {
        weeks = randomWeeks(
          Math.trunc(seed),
          Number.isFinite(density) && density > 0 && density < 1 ? density : 0.4,
        );
      } else {
        throw new Error("contributions needs --seed <n> or --file <weeks.json>");
      }
      const total = Number(take(argv, "--total"));
      const explicitTitle = take(argv, "--title");
      const sampled = !file;
      return emit(
        contributions({
          ...base(common),
          title: explicitTitle ?? (sampled ? "Contributions (sample)" : undefined),
          weeks,
          total: Number.isFinite(total) ? total : undefined,
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "counter") {
      const value = take(argv, "--value");
      if (value === undefined) throw new Error("counter needs --value");
      return emit(
        counter({
          ...base(common),
          title: take(argv, "--title") ?? "Counter",
          value,
          prefix: take(argv, "--prefix"),
          suffix: take(argv, "--suffix"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "sparkline") {
      const values = (take(argv, "--values") ?? "")
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isFinite(n));
      if (values.length < 2) throw new Error("sparkline needs --values 3,5,2,8 (at least two numbers)");
      return emit(
        sparkline({
          ...base(common),
          title: take(argv, "--title") ?? "Sparkline",
          values,
          unit: take(argv, "--unit"),
          smooth: has(argv, "--smooth"),
          area: !has(argv, "--no-area"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "gauge") {
      const value = take(argv, "--value");
      if (value === undefined) throw new Error("gauge needs --value");
      const min = take(argv, "--min");
      const max = take(argv, "--hi") ?? take(argv, "--max");
      return emit(
        gauge({
          ...base(common),
          title: take(argv, "--title") ?? "Gauge",
          value,
          min: min !== undefined ? Number(min) : undefined,
          max: max !== undefined ? Number(max) : undefined,
          unit: take(argv, "--unit"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "radar") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({
        label: item.label,
        value: Number(item.value),
      }));
      if (items.length < 3) throw new Error("radar needs at least three --item Axis=level");
      const levels = take(argv, "--levels");
      return emit(
        radar({
          ...base(common),
          title: take(argv, "--title") ?? "Radar",
          items,
          levels: levels !== undefined ? Number(levels) : undefined,
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "columns") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({
        label: item.label,
        value: Number(item.value),
      }));
      if (items.length === 0) throw new Error("columns needs --item Label=Value");
      return emit(
        columns({
          ...base(common),
          title: take(argv, "--title") ?? "Columns",
          items,
          unit: take(argv, "--unit"),
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "rating") {
      const value = take(argv, "--value");
      if (value === undefined) throw new Error("rating needs --value (0–5)");
      const count = take(argv, "--count");
      return emit(
        rating({
          ...base(common),
          title: take(argv, "--title") ?? "Rating",
          value,
          count: count !== undefined ? Number(count) : undefined,
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "figure") {
      const url = take(argv, "--url");
      if (url === undefined) throw new Error("figure needs --url https://...");
      const fit = take(argv, "--fit");
      if (fit !== undefined && !["cover", "contain"].includes(fit)) {
        throw new Error(`invalid --fit: ${fit} (cover | contain)`);
      }
      return emit(
        figure({
          ...base(common),
          url,
          caption: take(argv, "--caption"),
          alt: take(argv, "--alt"),
          fit: fit as "cover" | "contain" | undefined,
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "mark") {
      const letter = take(argv, "--letter") ?? take(argv, "--text");
      if (letter === undefined) throw new Error("mark needs --letter K");
      const shape = take(argv, "--shape");
      if (shape !== undefined && !["circle", "square", "squircle"].includes(shape)) {
        throw new Error(`invalid --shape: ${shape} (circle | square | squircle)`);
      }
      const gradient = take(argv, "--gradient");
      let gradientPair: [string, string] | undefined;
      if (gradient) {
        const parts = gradient.split(",").map((part) => part.trim());
        if (parts.length !== 2) throw new Error("--gradient expects #rrggbb,#rrggbb");
        gradientPair = [parts[0], parts[1]];
      }
      return emit(
        mark({
          ...base(common),
          letter,
          shape: shape as "circle" | "square" | "squircle" | undefined,
          gradient: gradientPair,
        }),
        common.out,
        common.scale,
      );
    }
    if (cmd === "profile") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({ label: item.label, value: item.value }));
      const name = take(argv, "--name");
      if (!name) throw new Error("profile needs --name");
      return emit(profile({ ...base(common), name, handle: take(argv, "--handle"), bio: take(argv, "--bio"), avatar: take(argv, "--avatar"), items }), common.out, common.scale);
    }
    if (cmd === "steps") {
      const items = takeAll(argv, "--item");
      if (items.length === 0) throw new Error("steps needs --item text");
      return emit(steps({ ...base(common), title: take(argv, "--title"), items }), common.out, common.scale);
    }
    if (cmd === "pills") {
      const tags = takeAll(argv, "--tag");
      if (tags.length === 0) throw new Error("pills needs --tag text");
      return emit(pills({ ...base(common), title: take(argv, "--title"), tags }), common.out, common.scale);
    }
    if (cmd === "callout") {
      const text = take(argv, "--text");
      if (!text) throw new Error("callout needs --text");
      const tone = take(argv, "--tone");
      if (tone !== undefined && !["info", "tip", "warn"].includes(tone)) throw new Error(`invalid --tone: ${tone}`);
      return emit(callout({ ...base(common), title: take(argv, "--title"), text, tone: tone as "info" | "tip" | "warn" | undefined }), common.out, common.scale);
    }
    if (cmd === "compare") {
      const items = takeAll(argv, "--item").map((pair) => {
        const [label, left, ...rest] = pair.split("|");
        return { label, left: left ?? "", right: rest.join("|") };
      });
      if (items.length === 0) throw new Error("compare needs --item Label|left|right");
      return emit(compare({ ...base(common), title: take(argv, "--title"), left: take(argv, "--left") ?? "A", right: take(argv, "--right") ?? "B", items }), common.out, common.scale);
    }
    if (cmd === "social") {
      const items = parsePairItems(takeAll(argv, "--item")).map((item) => ({ name: item.label, handle: item.value }));
      if (items.length === 0) throw new Error("social needs --item Name=handle");
      return emit(social({ ...base(common), items }), common.out, common.scale);
    }
    if (cmd === "checklist") {
      const items = takeAll(argv, "--item").map((item) => item.startsWith("done:") ? { text: item.slice(5), done: true } : { text: item, done: false });
      if (items.length === 0) throw new Error("checklist needs --item text");
      return emit(checklist({ ...base(common), title: take(argv, "--title"), items }), common.out, common.scale);
    }
    if (cmd === "cover") {
      const title = take(argv, "--title");
      if (!title) throw new Error("cover needs --title");
      return emit(cover({ ...base(common), title, subtitle: take(argv, "--subtitle"), kicker: take(argv, "--kicker") }), common.out, common.scale);
    }
    if (cmd === "render") {
      const file = argv[1];
      if (!file) {
        console.error("render requires a manifest json");
        return 1;
      }
      const manifest = JSON.parse(readFileSync(resolve(file), "utf8")) as Manifest;
      const cliVars: Record<string, string | number> = {};
      for (const pair of takeAll(argv, "--set")) {
        const idx = pair.indexOf("=");
        if (idx <= 0) throw new Error(`--set expects key=value, got: ${pair}`);
        cliVars[pair.slice(0, idx)] = pair.slice(idx + 1);
      }
      const merged: Manifest = {
        ...manifest,
        vars: { ...(manifest.vars ?? {}), ...cliVars },
      };
      const dir = resolve(common.out ?? ".");
      mkdirSync(dir, { recursive: true });
      for (const item of renderManifest(merged)) {
        const target = safeOutputPath(dir, item.file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, item.svg);
        console.log(`wrote ${target}`);
      }
      return 0;
    }
    if (cmd === "demo") {
      const dir = resolve(common.out ?? "svgforge-demo");
      mkdirSync(dir, { recursive: true });
      for (const item of demoCards(common)) {
        const target = safeOutputPath(dir, item.file);
        writeFileSync(target, renderCard(item.card, common.theme));
        console.log(`wrote ${target}`);
      }
      return 0;
    }
    console.error(`unknown command: ${cmd}`);
    return 1;
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) process.exitCode = run(process.argv.slice(2));
