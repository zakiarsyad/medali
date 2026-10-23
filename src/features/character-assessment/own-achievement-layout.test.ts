import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SCORES = "src/character-scores";
const FOLDER = "src/features/character-assessment";
// Each starts with a break, so the first rule is found like every other.
const MEDAL_STYLES = `\n${readFileSync(`${SCORES}/character-scores.module.css`, "utf8")}`;
const CARD_STYLES = `\n${readFileSync(`${FOLDER}/character-assessment.module.css`, "utf8")}`;
const MEDAL = readFileSync(`${SCORES}/medal.tsx`, "utf8");
const CARD = readFileSync(`${FOLDER}/student-achievement-view.tsx`, "utf8");
const HISTORY = readFileSync(`${FOLDER}/score-history-view.tsx`, "utf8");

/** What a rule of a style file holds, without the breaks between its lines. */
function ruleOf(styles: string, selector: string): string {
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("Capaian karakter and Riwayat per semester on Profil saya on a phone", () => {
  it("shrinks the medal to the width of the screen, keeping its proportions", () => {
    expect(MEDAL).toContain("viewBox={VIEW_BOX}");
    expect(MEDAL).not.toMatch(/<svg[^>]*\swidth=/);
    const medal = ruleOf(MEDAL_STYLES, ".medal");
    expect(medal).toContain("width: 100%;");
    expect(medal).toContain("max-width: var(--medal-width);");
    expect(medal).toContain("height: auto;");
  });

  it("lets the head of each card wrap, and forces no width wider than a phone", () => {
    const head = ruleOf(CARD_STYLES, ".panelHead");
    expect(head).toContain("flex-wrap: wrap;");
    for (const rule of [head, ruleOf(CARD_STYLES, ".sub")]) {
      expect(rule).not.toBe("");
      expect(rule).not.toMatch(/min-width: (?!0;)/);
      expect(rule).not.toContain("nowrap");
    }
  });

  it("sets no width of its own in the screen code of either card", () => {
    for (const view of [CARD, HISTORY, MEDAL]) {
      expect(view).not.toContain("style=");
    }
  });
});
