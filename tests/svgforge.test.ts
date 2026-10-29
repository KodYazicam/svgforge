import { mkdtempSync, writeFileSync, readFileSync, existsSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { banner } from "../src/cards/banner.js";
import { stats } from "../src/cards/stats.js";
import { skills } from "../src/cards/skills.js";
import { terminal } from "../src/cards/terminal.js";
import { badge } from "../src/cards/badge.js";
import { divider } from "../src/cards/divider.js";
import { progress } from "../src/cards/progress.js";
import { donut } from "../src/cards/donut.js";
import { chart } from "../src/cards/chart.js";
import { links, assertSafeUrl } from "../src/cards/links.js";
import { quote } from "../src/cards/quote.js";
import { code } from "../src/cards/code.js";
import { project } from "../src/cards/project.js";
import { wave } from "../src/cards/wave.js";
import { timeline } from "../src/cards/timeline.js";
import { contributions, levelColors, randomWeeks } from "../src/cards/contrib.js";
import { counter } from "../src/cards/counter.js";
import { sparkline } from "../src/cards/sparkline.js";
import { gauge } from "../src/cards/gauge.js";
import { radar } from "../src/cards/radar.js";
import { columns } from "../src/cards/columns.js";
import { figure } from "../src/cards/figure.js";
import { mark } from "../src/cards/mark.js";
import { renderManifest, renderCard, safeOutputPath, substituteVars, CARD_TYPES, type Card } from "../src/render.js";
import { rating } from "../src/cards/rating.js";
import { escapeXml, THEMES, resolveTheme, applyOverrides, isValidColor, mixHex, seededRandom, scaleSvg, wrapLines } from "../src/escape.js";
import { run } from "../src/cli.js";
import { invokedDirectly } from "../src/main.js";

describe("cards", () => {
  it("escapes XML in titles", () => {
    const svg = banner({ title: "A&B <C>", subtitle: '"hi"' });
    expect(svg).toContain("A&amp;B &lt;C&gt;");
    expect(svg).toContain("&quot;hi&quot;");
    expect(svg).toContain("<svg");
  });

  it("renders stats, skills, terminal, badge", () => {
    expect(stats({ items: [{ label: "Stars", value: 12 }] })).toContain("Stars");
    expect(skills({ items: [{ name: "TS", level: 80 }] })).toContain("rect");
    expect(terminal({ lines: ["$ ls", "ok"] })).toContain("$ ls");
    expect(badge({ label: "license", value: "KYAL-1.0" })).toContain("KYAL-1.0");
  });

  it("clamps skill bars and namespaces banner gradients", () => {
    const svg = skills({ items: [{ name: "X", level: 150 }] });
    expect(svg).toContain('width="464"');
    expect(escapeXml("<")).toBe("&lt;");
    const a = banner({ title: "one" });
    const b = banner({ title: "two" });
    const idA = a.match(/id="(grad-[^"]+)"/)?.[1];
    const idB = b.match(/id="(grad-[^"]+)"/)?.[1];
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);
  });

  it("renders the nine new card types", () => {
    expect(divider({ label: "sections" })).toContain("sections");
    expect(divider({})).toContain("divider");
    expect(progress({ title: "v2", value: 68 })).toContain("68%");
    expect(progress({ value: "150%" })).toContain("100%");
    expect(progress({ value: "abc" })).toContain("0%");
    const donutSvg = donut({ items: [{ label: "Code", value: 55 }, { label: "Docs", value: 45 }], center: "100%" });
    expect(donutSvg).toContain("stroke-dasharray");
    expect(donutSvg).toContain("55 · 55%");
    expect(chart({ items: [{ label: "Mon", value: 12 }, { label: "Tue", value: 34 }], unit: "k" })).toContain("34k");
    const linksSvg = links({ items: [{ text: "GitHub", url: "https://github.com" }] });
    expect(linksSvg).toContain('href="https://github.com"');
    const quoteSvg = quote({ text: "one two three four five six seven eight nine ten eleven twelve", author: "me" });
    expect(quoteSvg).toContain("— me");
    expect(quoteSvg.split("&#10;").length).toBeGreaterThanOrEqual(1);
    const codeSvg = code({
      lang: "ts",
      lineNumbers: true,
      lines: ['const name = "svgforge"; // build', 'function run() { return 1; }'],
    });
    expect(codeSvg).toContain("svgforge");
    expect(codeSvg).toContain("&#8212;".length ? "const" : "const");
    expect(codeSvg).toContain(">1</text>");
    const projectSvg = project({
      name: "ctxpack",
      description: "Pack a codebase into LLM-ready context with budget and redaction.",
      host: "github.com/KodYazicam/ctxpack",
      items: [{ label: "Stars", value: 12 }],
      tags: ["TypeScript"],
    });
    expect(projectSvg).toContain("ctxpack");
    expect(projectSvg).toContain("Stars");
    const waveSvg = wave({ title: "svgforge", subtitle: "v2" });
    expect(waveSvg).toContain("<clipPath");
    expect(wave({ title: "x", animate: true })).toContain("<animateTransform");
  });

  it("renders timeline milestones and contributions grids", () => {
    const timelineSvg = timeline({
      title: "Releases",
      items: [
        { date: "2026-09-01", label: "v1.0" },
        { date: "2026-09-28", label: "v2.0" },
      ],
    });
    expect(timelineSvg).toContain("v1.0");
    expect(timelineSvg).toContain("2026-09-01");
    expect(timelineSvg).toContain("<circle");
    const weeks = randomWeeks(42);
    expect(weeks).toHaveLength(52);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(randomWeeks(42)).toEqual(weeks);
    const contribSvg = contributions({ title: "Contributions", weeks, total: 1337 });
    expect(contribSvg).toContain("1337");
    expect(contribSvg).toContain("rect");
    expect(contributions({ title: "Contributions", seed: 42, total: 1337 })).toBe(contribSvg);
    const colors = levelColors("#0f0c29", "#a78bfa");
    expect(colors).toHaveLength(5);
    expect(colors.every((color) => /^#[0-9a-f]{6}$/.test(color))).toBe(true);
  });

  it("badge supports flat, outline, plastic styles", () => {
    const flat = badge({ label: "a", value: "b" });
    expect(flat).toContain(themeAccent2());
    const outline = badge({ label: "a", value: "b", style: "outline" });
    expect(outline).toContain('fill="none"');
    const plastic = badge({ label: "a", value: "b", style: "plastic" });
    expect(plastic).toContain("linearGradient");
    expect(() => badge({ label: "a", value: "b", labelColor: "nope" })).toThrow(/label color/);
  });

  it("terminal honors custom prompt and caret", () => {
    expect(terminal({ lines: ["> run"], prompt: ">" })).not.toContain("&#36;");
    const caretSvg = terminal({ lines: ["$ x"], caret: true });
    expect(caretSvg).toContain("<animate");
  });

  it("banner supports tag, logo, gradient, flat", () => {
    expect(banner({ title: "x", tag: "v2" })).toContain("V2");
    expect(banner({ title: "x", logo: "S" })).toContain(">S</text>");
    expect(banner({ title: "x", flat: true })).not.toContain("linearGradient");
    expect(banner({ title: "x", gradient: ["#111111", "#222222"] })).toContain("#111111");
    expect(() => banner({ title: "x", gradient: ["red", "blue"] })).toThrow(/gradient/);
  });

  it("skills showValue is opt-in", () => {
    const svg = skills({ items: [{ name: "TS", level: 90 }] });
    expect(svg).not.toContain("90%");
    const shown = skills({ items: [{ name: "TS", level: 90 }], showValue: true });
    expect(shown).toContain("90%");
  });
});

function themeAccent2(): string {
  return resolveTheme("midnight").accent2;
}

describe("themes and overrides", () => {
  it("ships twenty-two themes", () => {
    expect(Object.keys(THEMES)).toHaveLength(22);
    expect(resolveTheme("gruvbox").bg).toBe("#282828");
    expect(resolveTheme("catppuccin-latte").name).toBe("catppuccin-latte");
    expect(resolveTheme("paper").bg).toBe("#fafafa");
    expect(resolveTheme("github-light").bg).toBe("#ffffff");
    expect(resolveTheme("rose-pine").name).toBe("rose-pine");
    expect(resolveTheme("kanagawa").bg).toBe("#1f1f28");
    expect(resolveTheme("material").accent).toBe("#82aaff");
    expect(Object.keys(THEMES)).toHaveLength(22);
    expect(resolveTheme("nope").name).toBe("midnight");
  });

  it("mixHex blends and seededRandom is stable", () => {
    expect(mixHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 1)).toBe("#ffffff");
    const first = seededRandom(7);
    const second = seededRandom(7);
    const a = [first(), first(), first()];
    const b = [second(), second(), second()];
    expect(a).toEqual(b);
    expect(a[0]).not.toBe(a[1]);
  });

  it("applies and validates color overrides", () => {
    const theme = applyOverrides(resolveTheme("midnight"), { bg: "#123456", fg: "#abcdef" });
    expect(theme.bg).toBe("#123456");
    expect(theme.text).toBe("#abcdef");
    expect(() => applyOverrides(resolveTheme("midnight"), { bg: "red" })).toThrow(/invalid color/);
    expect(isValidColor("#abc")).toBe(true);
    expect(isValidColor("#aabbccdd")).toBe(true);
    expect(isValidColor("red")).toBe(false);
  });

  it("color overrides flow into cards", () => {
    const svg = banner({ title: "x", bg: "#123456", accent2: "#abcdef", flat: true });
    expect(svg).toContain("#123456");
    expect(svg).toContain("#abcdef");
    expect(banner({ title: "x", theme: "paper", flat: true })).toContain("#fafafa");
    expect(banner({ title: "x", accent: "#0fedcb", tag: "v2" })).toContain("#0fedcb");
  });

  it("wraps long text", () => {
    expect(wrapLines("aaa bbb ccc", 7)).toEqual(["aaa bbb", "ccc"]);
    expect(wrapLines("abcdefghijkl", 5)).toEqual(["abcde", "fghij", "kl"]);
  });
});

describe("links safety", () => {
  it("rejects non-http urls", () => {
    expect(() => assertSafeUrl("ftp://x")).toThrow(/http/);
    expect(() => links({ items: [{ text: "x", url: "javascript:alert(1)" }] })).toThrow(/http/);
    expect(links({ items: [{ text: "x", url: "https://ok.example" }] })).toContain("https://ok.example");
    expect(links({ items: [{ text: "x" }], link: false })).not.toContain("href");
  });
});

describe("manifest + cli", () => {
  it.skipIf(process.platform === "win32")("recognises an npm bin symlink as the entry point", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-bin-"));
    const target = join(dir, "cli.js");
    writeFileSync(target, "// cli\n");
    const link = join(dir, "svgforge");
    symlinkSync(target, link);
    const previous = process.argv[1];
    process.argv[1] = link;
    try {
      expect(invokedDirectly(pathToFileURL(target).href)).toBe(true);
    } finally {
      process.argv[1] = previous;
    }
  });

  it("renders a json manifest to files", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-"));
    const manifest = join(dir, "m.json");
    writeFileSync(
      manifest,
      JSON.stringify({
        theme: "tokyonight",
        cards: [
          { type: "banner", title: "ctxpack", subtitle: "pack", out: "banner.svg" },
          { type: "badge", label: "license", value: "KYAL-1.0", out: "badge.svg" },
        ],
      }),
    );
    expect(run(["render", manifest, "-o", dir])).toBe(0);
    expect(readFileSync(join(dir, "banner.svg"), "utf8")).toContain("ctxpack");
    expect(run(["themes"])).toBe(0);
    expect(run(["--help"])).toBe(0);
    expect(run(["types"])).toBe(0);
  });

  it("substitutes manifest vars and --set overrides", () => {
    const out = renderManifest({
      vars: { tool: "ctxpack", n: 12 },
      cards: [
        { type: "banner", title: "{{tool}}", subtitle: "v{{n}}" },
        { type: "stats", items: [{ label: "{{tool}}", value: "{{n}}" }] },
      ],
    });
    expect(out[0].svg).toContain("ctxpack");
    expect(out[0].svg).toContain("v12");
    expect(out[1].svg).toContain("ctxpack");
    const substituted = substituteVars({ a: "{{x}}", b: ["{{x}}"], c: { d: "{{x}}" } }, { x: "y" });
    expect(substituted).toEqual({ a: "y", b: ["y"], c: { d: "y" } });
    const dir = mkdtempSync(join(tmpdir(), "svgforge-"));
    const manifest = join(dir, "m.json");
    writeFileSync(
      manifest,
      JSON.stringify({ vars: { tool: "ctxpack" }, cards: [{ type: "banner", title: "{{tool}}", out: "b.svg" }] }),
    );
    expect(run(["render", manifest, "-o", dir, "--set", "tool=svgforge"])).toBe(0);
    expect(readFileSync(join(dir, "b.svg"), "utf8")).toContain("svgforge");
  });

  it("renderManifest assigns default filenames for every type", () => {
    const out = renderManifest({ cards: [{ type: "banner", title: "x" }] });
    expect(out[0].file).toBe("banner-1.svg");
    expect(out[0].svg).toContain("x");
    expect(CARD_TYPES).toHaveLength(32);
  });

  it("rejects path traversal in manifest out", () => {
    expect(() =>
      renderManifest({
        cards: [{ type: "banner", title: "x", out: "../evil.svg" }],
      }),
    ).toThrow(/traversal/);
    expect(() => safeOutputPath("/tmp/out", "../evil.svg")).toThrow(/traversal/);
  });

  it("demo writes one svg per card type", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-demo-"));
    expect(run(["demo", "-o", dir])).toBe(0);
    for (const type of CARD_TYPES) {
      expect(existsSync(join(dir, `${type}.svg`))).toBe(true);
    }
  });

  it("rejects invalid flag values from the cli", () => {
    expect(run(["banner", "--title", "x", "--bg", "red"])).toBe(1);
    expect(run(["banner", "--title", "x", "--width", "abc"])).toBe(1);
    expect(run(["badge", "--label", "a", "--value", "b", "--style", "nope"])).toBe(1);
    expect(run(["unknown"])).toBe(1);
  });

  it("renders the extra card types and rejects bad input", () => {
    expect(counter({ title: "downloads", value: 1337, suffix: "/mo" })).toContain("1337/mo");
    expect(sparkline({ values: [1, 4, 2, 8], unit: "k" })).toContain("8k");
    expect(gauge({ value: 64, unit: "%" })).toContain("64%");
    expect(radar({ items: [{ label: "A", value: 90 }, { label: "B", value: 40 }, { label: "C", value: 70 }] })).toContain("A");
    expect(columns({ items: [{ label: "Mon", value: 3 }, { label: "Tue", value: 9 }] })).toContain("Mon");
    expect(rating({ value: 4.5, count: 5 })).toContain("4.5/5");
    expect(figure({ url: "https://example.com/a.svg", caption: "cap" })).toContain("https://example.com/a.svg");
    expect(mark({ letter: "K" })).toContain(">K</text>");
    expect(() => sparkline({ values: [1] })).toThrow(/two numbers/);
    expect(() => radar({ items: [{ label: "A", value: 1 }] })).toThrow(/three axes/);
    expect(() => figure({ url: "http://insecure.example/x.png" })).toThrow(/https/);
    expect(() => mark({ letter: "" })).toThrow(/letter/);
    const scaled = scaleSvg(banner({ title: "x" }), 0.5);
    expect(scaled).toContain('width="440"');
    expect(scaled).toContain('viewBox="0 0 880 160"');
    expect(stats({ items: [{ label: "A", value: 1 }], borderWidth: 0 })).toContain('stroke-width="0"');
  });

  it("renders every card type as one svg document", () => {
    const samples: Card[] = [
      { type: "banner", title: "t" },
      { type: "stats", items: [{ label: "A", value: 1 }] },
      { type: "skills", items: [{ name: "TS", level: 80 }] },
      { type: "terminal", lines: ["$ ok"] },
      { type: "badge", label: "a", value: "b" },
      { type: "divider", label: "x" },
      { type: "progress", value: 40 },
      { type: "donut", items: [{ label: "A", value: 1 }, { label: "B", value: 2 }] },
      { type: "chart", items: [{ label: "A", value: 2 }] },
      { type: "links", items: [{ text: "GitHub", url: "https://github.com" }] },
      { type: "quote", text: "hi" },
      { type: "code", lines: ["const x = 1;"] },
      { type: "project", name: "svgforge" },
      { type: "wave", title: "w" },
      { type: "timeline", items: [{ date: "2026", label: "now" }] },
      { type: "contributions", weeks: [[0, 1, 2, 3, 4, 1, 0]], total: 11 },
      { type: "counter", value: 9 },
      { type: "sparkline", values: [1, 2, 3] },
      { type: "gauge", value: 50 },
      { type: "radar", items: [{ label: "A", value: 1 }, { label: "B", value: 2 }, { label: "C", value: 3 }] },
      { type: "columns", items: [{ label: "A", value: 1 }] },
      { type: "rating", value: 4.5 },
      { type: "figure", url: "https://example.com/a.svg" },
      { type: "mark", letter: "K" },
      { type: "profile", name: "Ada" },
      { type: "steps", items: ["one", "two"] },
      { type: "pills", tags: ["ts"] },
      { type: "callout", text: "note" },
      { type: "compare", left: "a", right: "b", items: [{ label: "x", left: "1", right: "2" }] },
      { type: "social", items: [{ name: "GitHub", handle: "@a" }] },
      { type: "checklist", items: [{ text: "done", done: true }] },
      { type: "cover", title: "svgforge", shadow: true },
    ];
    expect(samples.map((card) => card.type).sort()).toEqual([...CARD_TYPES].sort());
    for (const card of samples) {
      const svg = renderCard({ ...card, shadow: true, theme: "paper" });
      expect(svg.startsWith("<?xml"), card.type).toBe(true);
      expect(svg.match(/<svg /g)?.length, card.type).toBe(1);
      expect(svg.includes("</svg>"), card.type).toBe(true);
      expect(svg.includes("feDropShadow"), card.type).toBe(true);
      expect(svg.includes("undefined"), card.type).toBe(false);
      expect(svg.includes("NaN"), card.type).toBe(false);
      const width = Number(svg.match(/width="(\d+)"/)?.[1]);
      const height = Number(svg.match(/height="(\d+)"/)?.[1]);
      expect(width, card.type).toBeGreaterThan(20);
      expect(height, card.type).toBeGreaterThan(20);
    }
    expect(rating({ value: 4.5 })).toContain("<path");
    const faded = renderCard({ type: "badge", label: "a", value: "b", opacity: 0.4 });
    expect(faded).toContain('opacity="0.4"');
    expect(renderCard({ type: "cover", title: "x", shadow: true }).match(/feDropShadow/g)?.length).toBe(1);
    expect(run(["banner", "--title", "x", "--opacity", "40"])).toBe(0);
    expect(run(["banner", "--title", "x", "--opacity", "200"])).toBe(1);
  });

  it("cli renders timeline and contributions", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-"));
    expect(run(["timeline", "--item", "2026-09-01=v1.0", "-o", join(dir, "t.svg")])).toBe(0);
    expect(readFileSync(join(dir, "t.svg"), "utf8")).toContain("v1.0");
    expect(run(["contributions", "--seed", "42", "--total", "10", "-o", join(dir, "c.svg")])).toBe(0);
    expect(readFileSync(join(dir, "c.svg"), "utf8")).toContain("10");
    expect(run(["contributions"])).toBe(1);
    expect(run(["timeline"])).toBe(1);
  });
});
