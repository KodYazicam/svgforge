import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { banner } from "../src/cards/banner.js";
import { stats } from "../src/cards/stats.js";
import { skills } from "../src/cards/skills.js";
import { terminal } from "../src/cards/terminal.js";
import { badge } from "../src/cards/badge.js";
import { renderManifest } from "../src/render.js";
import { escapeXml } from "../src/escape.js";
import { run } from "../src/cli.js";

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

  it("clamps skill bars", () => {
    const svg = skills({ items: [{ name: "X", level: 150 }] });
    expect(svg).toContain("svg");
    expect(escapeXml("<")).toBe("&lt;");
  });
});

describe("manifest + cli", () => {
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
  });

  it("renderManifest assigns default filenames", () => {
    const out = renderManifest({
      cards: [{ type: "banner", title: "x" }],
    });
    expect(out[0].file).toBe("banner-1.svg");
    expect(out[0].svg).toContain("x");
  });
});
