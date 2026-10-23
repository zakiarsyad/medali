import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/character-grades";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/character-grades.module.css`, "utf8")}`;
const VIEW = readFileSync(`${FOLDER}/student-grade-view.tsx`, "utf8");
const PANEL = readFileSync(`${FOLDER}/own-grade-panel.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("Nilai karakter (KEP-220) on Profil saya on a phone", () => {
  it("lets the head wrap, and each bar shrink to the width of the screen", () => {
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".partBar")).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;",
    );
    expect(ruleOf(".partMeter")).toContain("width: 100%;");
  });

  it("forces no width wider than a phone", () => {
    for (const selector of [".panelHead", ".partBars", ".partBar", ".note"]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
    for (const code of [VIEW, PANEL]) {
      expect(code).not.toContain("style=");
    }
  });
});
