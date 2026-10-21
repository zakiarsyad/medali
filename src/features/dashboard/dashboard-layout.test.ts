import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dashboard";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/dashboard.module.css`, "utf8")}`;
const SECTION = readFileSync(`${FOLDER}/physical-section.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}

describe("section 3 of the Dashboard on a phone", () => {
  it("stacks its two panels in one column when the screen has no room for two", () => {
    expect(SECTION).toContain("<div className={styles.panels}>");
    expect(ruleOf(".panels")).toContain(
      "minmax(min(var(--column-min-width), 100%), 1fr)",
    );
    expect(ruleOf(".panels > *")).toContain("min-width: 0;");
  });

  it("forces no width wider than a phone", () => {
    for (const selector of [".panels", ".meanings", ".meaning", ".note"]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });
});
