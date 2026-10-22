import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/academic-periods";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/periods.module.css`, "utf8")}`;
const LIST = readFileSync(`${FOLDER}/period-list.tsx`, "utf8");
const STEP = readFileSync(`${FOLDER}/close-step.tsx`, "utf8");
const FORM = readFileSync(`${FOLDER}/close-semester-form.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

/** The rules the list and the closing step use. */
const RULES = [
  ".list",
  ".item",
  ".name",
  ".state",
  ".dates",
  ".step",
  ".facts",
  ".factsHeading",
  ".closeForm",
];

describe("Periode akademik and the closing step on a phone", () => {
  it("folds each period's row into a card, with the step under it over the whole width", () => {
    expect(LIST).toContain("<li className={styles.item}>");
    expect(ruleOf(".item")).toContain("flex-wrap: wrap;");
    expect(STEP).toContain("<section className={styles.step}>");
    expect(ruleOf(".step")).toContain("flex: 1 1 100%;");
    expect(ruleOf(".step")).toContain("min-width: 0;");
  });

  it("folds the long state of a closed period instead of widening the card", () => {
    expect(LIST).toContain("className={styles.state}");
    expect(ruleOf(".state")).toContain("overflow-wrap: anywhere;");
  });

  it("puts the counts, weights and letter limits on more lines when there is no room", () => {
    expect(STEP).toContain("<ul className={styles.facts}>");
    expect(ruleOf(".facts")).toContain("flex-wrap: wrap;");
    expect(FORM).toContain("className={styles.closeForm}");
    expect(ruleOf(".closeForm")).toContain("display: grid;");
  });

  it("forces no width wider than a phone", () => {
    for (const selector of RULES) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });
});
