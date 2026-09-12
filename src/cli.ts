#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { banner } from "./cards/banner.js";
import { stats } from "./cards/stats.js";
import { skills } from "./cards/skills.js";
import { terminal } from "./cards/terminal.js";
import { badge } from "./cards/badge.js";
import { renderManifest, type Manifest } from "./render.js";
import { THEMES } from "./escape.js";
import { invokedDirectly } from "./main.js";

function help(): string {
  return `
svgforge — generate GitHub README SVGs locally

Usage:
  svgforge banner --title ctxpack --subtitle "Pack a codebase" -o banner.svg
  svgforge stats --title Stats --item Stars=12 --item Forks=3 -o stats.svg
  svgforge skills --item TypeScript=90 --item Python=80 -o skills.svg
  svgforge terminal --line "$ npx ctxpack ." --line "wrote prompt.md" -o term.svg
  svgforge badge --label license --value KYAL-1.0 -o badge.svg
  svgforge render manifest.json -o ./assets
  svgforge themes

Options:
  --theme <name>     midnight | tokyonight | dracula | nord | github
  -o, --out <path>   Output file or directory

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

function writeOut(target: string, svg: string): void {
  mkdirSync(dirname(resolve(target)), { recursive: true });
  writeFileSync(target, svg);
  console.log(`wrote ${target}`);
}

export function run(argv: string[]): number {
  const cmd = argv[0];
  if (!cmd || cmd === "-h" || cmd === "--help") {
    console.log(help());
    return 0;
  }
  if (cmd === "-v" || cmd === "--version") {
    console.log("1.0.0");
    return 0;
  }
  if (cmd === "themes") {
    console.log(Object.keys(THEMES).join("\n"));
    return 0;
  }

  const theme = take(argv, "--theme");
  const out = take(argv, "-o") ?? take(argv, "--out");

  try {
    if (cmd === "banner") {
      const svg = banner({
        title: take(argv, "--title") ?? "svgforge",
        subtitle: take(argv, "--subtitle"),
        theme,
      });
      if (out) writeOut(out, svg);
      else process.stdout.write(svg);
      return 0;
    }
    if (cmd === "stats") {
      const items = takeAll(argv, "--item").map((pair) => {
        const [label, ...rest] = pair.split("=");
        return { label, value: rest.join("=") };
      });
      const svg = stats({ title: take(argv, "--title") ?? "Stats", items, theme });
      if (out) writeOut(out, svg);
      else process.stdout.write(svg);
      return 0;
    }
    if (cmd === "skills") {
      const items = takeAll(argv, "--item").map((pair) => {
        const [name, level] = pair.split("=");
        const n = Number(level);
        return { name, level: Number.isFinite(n) ? n : 0 };
      });
      const svg = skills({ title: take(argv, "--title") ?? "Skills", items, theme });
      if (out) writeOut(out, svg);
      else process.stdout.write(svg);
      return 0;
    }
    if (cmd === "terminal") {
      const svg = terminal({
        title: take(argv, "--title"),
        lines: takeAll(argv, "--line"),
        theme,
      });
      if (out) writeOut(out, svg);
      else process.stdout.write(svg);
      return 0;
    }
    if (cmd === "badge") {
      const svg = badge({
        label: take(argv, "--label") ?? "label",
        value: take(argv, "--value") ?? "value",
        theme,
      });
      if (out) writeOut(out, svg);
      else process.stdout.write(svg);
      return 0;
    }
    if (cmd === "render") {
      const file = argv[1];
      if (!file) {
        console.error("render requires a manifest json");
        return 1;
      }
      const manifest = JSON.parse(readFileSync(resolve(file), "utf8")) as Manifest;
      const dir = out ?? ".";
      mkdirSync(dir, { recursive: true });
      for (const item of renderManifest(manifest)) {
        const target = join(dir, item.file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, item.svg);
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
