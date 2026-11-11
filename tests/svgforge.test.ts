import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
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
import { escapeXml, THEMES, resolveTheme, applyOverrides, isValidColor, mixHex, seededRandom, scaleSvg, wrapLines, shadowFilter, shadowAttr, approxTextWidth, contrastRatio, relativeLuminance } from "../src/escape.js";
import { run } from "../src/cli.js";
import { invokedDirectly } from "../src/main.js";
import { createPreviewServer } from "../src/preview.js";

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
    expect(badge({ label: "license", value: "Apache-2.0" })).toContain("Apache-2.0");
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
    expect(contribSvg).toMatch(/<g fill="#[0-9a-f]{6}">/);
    expect((contribSvg.match(/<rect /g) ?? []).length).toBe(52 * 7 + 1 + 5);
    expect(Buffer.byteLength(contribSvg, "utf8")).toBeLessThan(22000);
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

  it("keeps motion opt-in and labels wrapped cards", () => {
    expect(wave({ title: "static" })).not.toContain("<animate");
    expect(terminal({ lines: ["$ echo hi"] })).not.toContain("<animate");
    expect(wave({ title: "animated", animate: true })).toContain("<animateTransform");
    expect(terminal({ lines: ["$ echo hi"], caret: true })).toContain("<animate");
    const svg = banner({ title: "A&B" });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="A&amp;B"');
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

describe("documentation coverage", () => {
  it("has a section, a manifest entry, and a rendered example for every card type", () => {
    const root = process.cwd();
    const doc = readFileSync(join(root, "ALL-SVG-FORMS.md"), "utf8");
    const demo = JSON.parse(readFileSync(join(root, "examples", "demo.json"), "utf8")) as {
      cards: Array<{ type: string; out: string }>;
    };
    const covered = new Set<string>();

    for (const type of CARD_TYPES) {
      const heading = `## ${type}`;
      const start = doc.indexOf(heading);
      expect(start, `missing section for ${type}`).toBeGreaterThanOrEqual(0);
      const next = doc.indexOf("\n## ", start + heading.length);
      const section = doc.slice(start, next === -1 ? undefined : next);

      expect(section, `${type} has no rendered example`).toContain("examples/");
      expect(section, `${type} has no shell command`).toContain("```bash");

      const demoCard = demo.cards.find((card) => card.type === type);
      expect(demoCard, `${type} is missing from examples/demo.json`).toBeTruthy();
      expect(
        existsSync(join(root, "examples", demoCard!.out)),
        `${demoCard!.out} is missing`,
      ).toBe(true);
      covered.add(type);
    }

    expect(covered.size).toBe(CARD_TYPES.length);
  });
});

interface ManifestSchema {
  $schema: string;
  $id: string;
  $defs: {
    card: {
      required: string[];
      properties: {
        type: { enum: string[] };
      };
    };
    outPath: { pattern: string };
  };
}

describe("manifest schema", () => {
  it("matches the renderer's card types and safe output paths", () => {
    const root = process.cwd();
    const schema = JSON.parse(
      readFileSync(join(root, "schema", "svgforge.schema.json"), "utf8"),
    ) as ManifestSchema;
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toContain("/schema/svgforge.schema.json");
    expect(schema.$defs.card.required).toEqual(["type"]);
    expect(schema.$defs.card.properties.type.enum).toEqual([...CARD_TYPES]);

    const out = new RegExp(schema.$defs.outPath.pattern);
    expect(out.test("banner.svg")).toBe(true);
    expect(out.test("nested/hero.svg")).toBe(true);
    expect(out.test("../evil.svg")).toBe(false);
    expect(out.test("nested/../evil.svg")).toBe(false);
    expect(out.test("/etc/passwd.svg")).toBe(false);
    expect(out.test("C:\\evil.svg")).toBe(false);

    const demo = JSON.parse(readFileSync(join(root, "examples", "demo.json"), "utf8")) as {
      cards: Array<{ type: string; out?: string }>;
    };
    for (const card of demo.cards) {
      expect(CARD_TYPES).toContain(card.type);
      if (card.out) expect(out.test(card.out)).toBe(true);
    }

    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { files: string[] };
    expect(pkg.files).toContain("schema");

    const rendered = renderManifest({
      $schema: schema.$id,
      cards: [{ type: "banner", title: "with schema" }],
    });
    expect(rendered[0].svg).toContain("with schema");
  });
});

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

  it("computes WCAG relative luminance and contrast", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
    expect(contrastRatio("#777777", "#ffffff")).toBeGreaterThan(4.47);
    expect(() => contrastRatio("red", "#ffffff")).toThrow(/invalid color/);
  });

  it("keeps every built-in theme at WCAG AA contrast", () => {
    for (const theme of Object.values(THEMES)) {
      expect(contrastRatio(theme.text, theme.bg), `${theme.name} text/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.text, theme.bg2), `${theme.name} text/bg2`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.muted, theme.bg), `${theme.name} muted/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.muted, theme.bg2), `${theme.name} muted/bg2`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.accent, theme.bg), `${theme.name} accent/bg`).toBeGreaterThanOrEqual(3);
    }
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
          { type: "badge", label: "license", value: "Apache-2.0", out: "badge.svg" },
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
    expect(run(["--version"])).toBe(0);
    expect(run(["banner", "--title", "x", "--scale", "2", "--border-width", "3"])).toBe(0);
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

  it("covers mark shapes, gradients, and syntax comments", () => {
    expect(mark({ letter: "AB", shape: "circle" })).toContain("<circle");
    const square = mark({ letter: "ABC", shape: "square", radius: 4, gradient: ["#111111", "#222222"] });
    expect(square).toContain("linearGradient");
    expect(square).toContain('rx="4"');
    expect(() => mark({ letter: "A", gradient: ["red", "#222222"] })).toThrow(/gradient/);
    expect(code({ lines: ["# comment", "print('x')"], lang: "python" })).toContain("comment");
    expect(code({ lines: ["// comment", "const x = 1;"], lineNumbers: true })).toContain('font-size="12"');
  });

  it("exposes shadow helpers and text width estimates", () => {
    expect(shadowFilter("demo", true)).toContain("feDropShadow");
    expect(shadowFilter("demo", false)).toBe("");
    expect(shadowAttr("demo", true)).toContain('filter="url(#demo)"');
    expect(shadowAttr("demo", false)).toBe("");
    expect(approxTextWidth("abc", 10)).toBe(18);
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

describe("init", () => {
  it("scaffolds a project whose manifest renders", () => {
    const parent = mkdtempSync(join(tmpdir(), "svgforge-init-"));
    const dir = join(parent, "site");
    expect(run(["init", dir])).toBe(0);
    expect(existsSync(join(dir, "assets"))).toBe(true);
    const manifestPath = join(dir, "svgforge.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      cards: Array<{ type: string; out?: string }>;
    };
    expect(manifest.cards.map((card) => card.type)).toEqual(["banner", "stats"]);
    expect(readFileSync(join(dir, "assets", "README.md"), "utf8")).toContain(
      "svgforge render svgforge.json -o assets",
    );

    expect(run(["render", manifestPath, "-o", join(dir, "assets")])).toBe(0);
    expect(readFileSync(join(dir, "assets", "banner.svg"), "utf8")).toContain("my-project");
    expect(readFileSync(join(dir, "assets", "stats.svg"), "utf8")).toContain("Apache-2.0");
    expect(existsSync(join(dir, "assets", "README.md"))).toBe(true);
  });

  it("preserves existing files unless --force", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-init-"));
    const custom = '{"cards":[]}\n';
    writeFileSync(join(dir, "svgforge.json"), custom);
    expect(run(["init", dir])).toBe(1);
    expect(readFileSync(join(dir, "svgforge.json"), "utf8")).toBe(custom);
    expect(existsSync(join(dir, "assets"))).toBe(false);

    expect(run(["init", dir, "--force"])).toBe(0);
    const manifest = JSON.parse(readFileSync(join(dir, "svgforge.json"), "utf8")) as { cards: unknown[] };
    expect(manifest.cards.length).toBe(2);
  });

  it("does not overwrite assets/README.md without --force", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-init-"));
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "assets", "README.md"), "keep me\n");
    expect(run(["init", dir])).toBe(1);
    expect(readFileSync(join(dir, "assets", "README.md"), "utf8")).toBe("keep me\n");
    expect(existsSync(join(dir, "svgforge.json"))).toBe(false);
    expect(run(["init", dir, "-f"])).toBe(0);
    expect(readFileSync(join(dir, "assets", "README.md"), "utf8")).toContain("Scaffolded by");
  });

  it("rejects unknown init flags", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-init-"));
    expect(run(["init", dir, "--nope"])).toBe(1);
    expect(existsSync(join(dir, "svgforge.json"))).toBe(false);
  });
});

async function withPreview(
  manifest: object,
  fn: (base: string, dir: string, server: Server) => Promise<void>,
  vars?: Record<string, string | number>,
): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "svgforge-preview-"));
  const manifestPath = join(dir, "svgforge.json");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const server = createPreviewServer(manifestPath, vars ? { vars } : undefined);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${address.port}`, dir, server);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  }
}

describe("preview server", () => {
  it("serves a gallery and rendered svg files", async () => {
    await withPreview(
      {
        theme: "midnight",
        cards: [
          { type: "banner", title: "Preview", out: "banner.svg" },
          { type: "badge", label: "a", value: "b", out: "nested/badge.svg" },
        ],
      },
      async (base) => {
        const page = await fetch(`${base}/`);
        expect(page.status).toBe(200);
        expect(page.headers.get("content-type")).toContain("text/html");
        expect(page.headers.get("x-content-type-options")).toBe("nosniff");
        expect(page.headers.get("content-security-policy")).toContain("default-src 'none'");
        const html = await page.text();
        expect(html).toContain("banner.svg");
        expect(html).toContain("nested/badge.svg");
        expect(html).toContain("<span>banner</span>");
        expect(html).toContain("/file?name=nested%2Fbadge.svg");

        const svg = await fetch(`${base}/file?name=${encodeURIComponent("nested/badge.svg")}`);
        expect(svg.status).toBe(200);
        expect(svg.headers.get("content-type")).toContain("image/svg+xml");
        expect(await svg.text()).toContain("<svg");

        const head = await fetch(`${base}/file?name=banner.svg`, { method: "HEAD" });
        expect(head.status).toBe(200);
        expect(await head.text()).toBe("");
      },
    );
  });

  it("picks up manifest edits and reports invalid manifests", async () => {
    await withPreview(
      { cards: [{ type: "banner", title: "Edit me", out: "banner.svg" }] },
      async (base, dir) => {
        const first = await (await fetch(`${base}/file?name=banner.svg`)).text();
        expect(first).toContain("Edit me");

        writeFileSync(
          join(dir, "svgforge.json"),
          JSON.stringify({ cards: [{ type: "banner", title: "Changed", out: "banner.svg" }] }),
        );
        const second = await (await fetch(`${base}/file?name=banner.svg`)).text();
        expect(second).toContain("Changed");

        writeFileSync(join(dir, "svgforge.json"), "{ nope");
        const broken = await fetch(`${base}/`);
        expect(broken.status).toBe(500);
        expect(await broken.text()).toContain("Manifest error");
      },
    );
  });

  it("applies --set var overrides", async () => {
    await withPreview(
      {
        vars: { user: "default" },
        cards: [{ type: "banner", title: "{{user}}", out: "banner.svg" }],
      },
      async (base) => {
        const svg = await (await fetch(`${base}/file?name=banner.svg`)).text();
        expect(svg).toContain("override");
        expect(svg).not.toContain(">default<");
      },
      { user: "override" },
    );
  });

  it("only serves declared outputs and escapes names", async () => {
    await withPreview(
      { cards: [{ type: "badge", label: "a", value: "b", out: 'quote"<.svg' }] },
      async (base) => {
        const html = await (await fetch(`${base}/`)).text();
        expect(html).toContain("quote&quot;&lt;.svg");
        expect(html).not.toContain('quote"<.svg');

        expect((await fetch(`${base}/file?name=${encodeURIComponent("../evil.svg")}`)).status).toBe(404);
        expect((await fetch(`${base}/file?name=${encodeURIComponent("/etc/passwd")}`)).status).toBe(404);
        expect((await fetch(`${base}/file?name=nope.svg`)).status).toBe(404);
        expect((await fetch(`${base}/nope`)).status).toBe(404);

        const post = await fetch(`${base}/`, { method: "POST" });
        expect(post.status).toBe(405);
        expect(post.headers.get("allow")).toBe("GET, HEAD");
      },
    );
  });
});

describe("cli coverage", () => {
  const cardCases: Array<[string, string[]]> = [
    ["banner", ["--title", "Coverage"]],
    ["stats", ["--item", "Stars=12"]],
    ["skills", ["--item", "TypeScript=90"]],
    ["terminal", ["--line", "$ echo hi"]],
    ["badge", ["--label", "license", "--value", "Apache-2.0"]],
    ["divider", ["--label", "sections"]],
    ["progress", ["--value", "50"]],
    ["donut", ["--item", "Code=55"]],
    ["chart", ["--item", "Mon=12"]],
    ["links", ["--item", "GitHub=https://github.com"]],
    ["quote", ["--text", "ship files"]],
    ["code", ["--line", "const x = 1;"]],
    ["project", ["--name", "svgforge"]],
    ["wave", ["--title", "Coverage"]],
    ["timeline", ["--item", "2026-01-01=v1"]],
    ["contributions", ["--seed", "42"]],
    ["counter", ["--value", "1337"]],
    ["sparkline", ["--values", "1,2,3"]],
    ["gauge", ["--value", "64"]],
    ["radar", ["--item", "A=1", "--item", "B=2", "--item", "C=3"]],
    ["columns", ["--item", "A=1"]],
    ["rating", ["--value", "4.5"]],
    ["figure", ["--url", "https://example.com/a.svg"]],
    ["mark", ["--letter", "K"]],
    ["profile", ["--name", "Ada"]],
    ["steps", ["--item", "one"]],
    ["pills", ["--tag", "ts"]],
    ["callout", ["--text", "note"]],
    ["compare", ["--item", "x|1|2"]],
    ["social", ["--item", "GitHub=@a"]],
    ["checklist", ["--item", "done:tests"]],
    ["cover", ["--title", "svgforge"]],
  ];

  it("runs every card command and writes one valid svg", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-cli-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(cardCases.map(([type]) => type).sort()).toEqual([...CARD_TYPES].sort());
      for (const [type, args] of cardCases) {
        const out = join(dir, `${type}.svg`);
        expect(run([type, ...args, "-o", out]), type).toBe(0);
        const svg = readFileSync(out, "utf8");
        expect(svg.startsWith("<?xml"), type).toBe(true);
        expect(svg.match(/<svg /g)?.length, type).toBe(1);
        expect(svg.includes("</svg>"), type).toBe(true);
        expect(svg.includes("undefined"), type).toBe(false);
        expect(svg.includes("NaN"), type).toBe(false);
      }
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });

  it("applies common flags, stdout output, and the --out alias", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-cli-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const write = vi.spyOn(process.stdout, "write").mockImplementation((() => true) as typeof process.stdout.write);
    try {
      const out = join(dir, "flags.svg");
      expect(
        run([
          "banner",
          "--title",
          "Flags",
          "--tag",
          "v1",
          "--logo",
          "K",
          "--theme",
          "paper",
          "--width",
          "600",
          "--height",
          "220",
          "--radius",
          "8",
          "--bg",
          "#123456",
          "--bg2",
          "#234567",
          "--fg",
          "#ffffff",
          "--muted",
          "#eeeeee",
          "--accent",
          "#abcdef",
          "--accent2",
          "#fedcba",
          "--line-color",
          "#333333",
          "--font",
          "Test Sans",
          "--shadow",
          "--opacity",
          "0.5",
          "--scale",
          "0.75",
          "-o",
          out,
        ]),
      ).toBe(0);
      const svg = readFileSync(out, "utf8");
      expect(svg).toContain('width="450"');
      expect(svg).toContain('height="165"');
      expect(svg).toContain('opacity="0.5"');
      expect(svg).toContain("feDropShadow");
      expect(svg).toContain("#123456");
      expect(svg).toContain("#234567");
      expect(svg).toContain("#abcdef");
      expect(svg).toContain("Test Sans");
      expect(svg).toContain('rx="8"');

      const statsOut = join(dir, "border.svg");
      expect(run(["stats", "--item", "A=1", "--border-width", "3", "--out", statsOut])).toBe(0);
      expect(readFileSync(statsOut, "utf8")).toContain('stroke-width="3"');

      const flatOut = join(dir, "flat.svg");
      expect(run(["wave", "--title", "Flat", "--flat", "-o", flatOut])).toBe(0);
      expect(readFileSync(flatOut, "utf8")).not.toContain("linearGradient");

      expect(run(["badge", "--label", "a", "--value", "b"])).toBe(0);
      const stdout = write.mock.calls.at(-1)?.[0];
      expect(String(stdout)).toContain("<svg");
    } finally {
      log.mockRestore();
      error.mockRestore();
      write.mockRestore();
    }
  });

  it("covers contributions --file and its validation", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-cli-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const weeks = join(dir, "weeks.json");
      writeFileSync(weeks, JSON.stringify({ weeks: [[0, 1, 2, 3, 4, 1, 0]] }));
      const out = join(dir, "contrib.svg");
      expect(run(["contributions", "--file", weeks, "--total", "10", "-o", out])).toBe(0);
      const svg = readFileSync(out, "utf8");
      expect(svg).toContain("10");

      const bad = join(dir, "bad.json");
      writeFileSync(bad, "{}");
      expect(run(["contributions", "--file", bad, "-o", out])).toBe(1);
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });

  it("rejects invalid invocations with exit code 1", () => {
    const dir = mkdtempSync(join(tmpdir(), "svgforge-cli-"));
    const manifest = join(dir, "m.json");
    writeFileSync(manifest, JSON.stringify({ cards: [{ type: "banner", title: "x", out: "b.svg" }] }));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const invalid: Array<[string, string[]]> = [
        ["stats without items", ["stats"]],
        ["skills without items", ["skills"]],
        ["terminal without lines", ["terminal"]],
        ["progress without value", ["progress"]],
        ["donut without items", ["donut"]],
        ["chart without items", ["chart"]],
        ["links without items", ["links"]],
        ["quote without text", ["quote"]],
        ["code without lines", ["code"]],
        ["timeline without items", ["timeline"]],
        ["contributions without seed", ["contributions"]],
        ["counter without value", ["counter"]],
        ["sparkline with one value", ["sparkline", "--values", "1"]],
        ["gauge without value", ["gauge"]],
        ["radar with two axes", ["radar", "--item", "A=1", "--item", "B=2"]],
        ["columns without items", ["columns"]],
        ["rating without value", ["rating"]],
        ["figure without url", ["figure"]],
        ["figure with bad fit", ["figure", "--url", "https://example.com/a.svg", "--fit", "stretch"]],
        ["mark without letter", ["mark"]],
        ["mark with bad shape", ["mark", "--letter", "K", "--shape", "star"]],
        ["profile without name", ["profile"]],
        ["steps without items", ["steps"]],
        ["pills without tags", ["pills"]],
        ["callout without text", ["callout"]],
        ["callout with bad tone", ["callout", "--text", "x", "--tone", "loud"]],
        ["compare without items", ["compare"]],
        ["social without items", ["social"]],
        ["checklist without items", ["checklist"]],
        ["cover without title", ["cover"]],
        ["badge with bad style", ["badge", "--style", "fancy"]],
        ["banner with bad gradient", ["banner", "--gradient", "#111111"]],
        ["banner with bad gradient color", ["banner", "--gradient", "#111111,red"]],
        ["banner with bad color", ["banner", "--bg", "red"]],
        ["banner with bad width", ["banner", "--width", "abc"]],
        ["banner with bad border width", ["banner", "--border-width", "-1"]],
        ["banner with bad opacity", ["banner", "--opacity", "200"]],
        ["banner with bad scale", ["banner", "--scale", "9"]],
        ["unknown command", ["nope"]],
        ["render without manifest", ["render"]],
        ["render with bad --set", ["render", manifest, "--set", "novalue"]],
        ["preview with bad port", ["preview", "--port", "abc"]],
        ["preview with out-of-range port", ["preview", "--port", "70000"]],
        ["preview with unknown flag", ["preview", "--watch"]],
        ["preview with two paths", ["preview", "a.json", "b.json"]],
        ["preview with bad --set", ["preview", "--set", "novalue"]],
        ["preview with empty --set key", ["preview", "--set", "=x"]],
        ["preview with missing --set value", ["preview", "--set"]],
      ];
      for (const [label, args] of invalid) {
        expect(run(args), label).toBe(1);
      }
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });
});
