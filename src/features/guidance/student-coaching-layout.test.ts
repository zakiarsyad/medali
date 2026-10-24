import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/guidance";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/student-coaching.module.css`, "utf8")}`;
const VIEW = readFileSync(`${FOLDER}/student-coaching-view.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("Pembinaan (level) on a phone", () => {
  it("is one column, with no table and nothing held wide", () => {
    expect(VIEW).not.toContain("<table");
    expect(VIEW).not.toContain("style=");
    for (const selector of [".panel", ".panelHead", ".text"]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toContain("grid-template-columns");
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toMatch(/(^|[^-])width:/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });

  it("breaks a long note and lets the badge fold under the title", () => {
    expect(ruleOf(".text")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
  });
});
