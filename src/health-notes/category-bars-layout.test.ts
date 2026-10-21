import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/health-notes";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/health-notes.module.css`, "utf8")}`;
const BARS = readFileSync(`${FOLDER}/category-bars.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}

describe("the bars of the categories on a phone", () => {
  it("lets every column of a bar shrink, so a bar never widens its panel", () => {
    expect(BARS).toContain("className={styles.bar}");
    expect(ruleOf(".bar")).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;",
    );
    expect(ruleOf(".barLabel")).toContain("overflow-wrap: anywhere;");
  });

  it("forces no width wider than a phone", () => {
    for (const selector of [".bars", ".bar", ".barLabel"]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });
});
