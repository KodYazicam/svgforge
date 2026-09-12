import { banner, type BannerOptions } from "./cards/banner.js";
import { stats, type StatsOptions } from "./cards/stats.js";
import { skills, type SkillsOptions } from "./cards/skills.js";
import { terminal, type TerminalOptions } from "./cards/terminal.js";
import { badge, type BadgeOptions } from "./cards/badge.js";

export type Card =
  | ({ type: "banner"; out?: string } & BannerOptions)
  | ({ type: "stats"; out?: string } & StatsOptions)
  | ({ type: "skills"; out?: string } & SkillsOptions)
  | ({ type: "terminal"; out?: string } & TerminalOptions)
  | ({ type: "badge"; out?: string } & BadgeOptions);

export interface Manifest {
  theme?: string;
  cards: Card[];
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
    default: {
      const never: never = card;
      throw new Error(`unknown card type: ${(never as Card).type}`);
    }
  }
}

export function renderManifest(manifest: Manifest): Array<{ file: string; svg: string }> {
  return manifest.cards.map((card, index) => {
    const file =
      card.out ??
      `${card.type}-${index + 1}.svg`;
    return { file, svg: renderCard(card, manifest.theme) };
  });
}
