import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/character-grades";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/character-grades.module.css`, "utf8")}`;
const VIEW = readFileSync(`${FOLDER}/scheme-view.tsx`, "utf8");
const FORM = readFileSync(`${FOLDER}/scheme-form.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}

/** The rules of the style file that "Skema bobot" uses. */
const PANEL_RULES = [
  ".panelHead",
  ".sub",
  ".weights",
  ".weightBox",
  ".numberRow",
  ".bar",
  ".cell",
  ".subheading",
  ".letters",
  ".letterBox",
  ".passField",
  ".saveRow",
  ".note",
];

describe("Skema bobot on a phone", () => {
  it("stacks the four weights in one column when the screen has no room for two", () => {
    const weights = ruleOf(".weights");

    expect(VIEW).toMatch(
      /<div className=\{styles\.weights\}>\s*\{GRADE_PARTS\.map\(\(part\) => \(\s*<WeightBox/,
    );
    expect(weights).toContain("display: grid;");
    expect(weights).toContain("auto-fit");
    expect(weights).toContain("minmax(min(100%, var(--box-min-width)), 1fr)");
  });

  it("never makes a letter limit wider than the screen", () => {
    expect(VIEW).toContain("<div className={styles.letters}>");
    expect(ruleOf(".letters")).toContain(
      "minmax(min(100%, var(--score-box-width)), 1fr)",
    );
  });

  it("keeps a number box inside its box, however narrow", () => {
    expect(ruleOf(".numberInput")).toContain("max-width: 100%;");
  });

  it("lets every percent of the bar shrink, so its cells never widen the panel", () => {
    expect(VIEW).toContain("className={styles.bar}");
    expect(ruleOf(".bar")).toContain("overflow: hidden;");
    expect(ruleOf(".cell")).toContain("flex: 1 1 0;");
    expect(ruleOf(".cell")).toContain("min-width: 0;");
  });

  it("folds the head of the panel and the row of Simpan skema onto more lines instead of widening it", () => {
    expect(VIEW).toContain("<div className={styles.panelHead}>");
    expect(FORM).toContain("<div className={styles.saveRow}>");
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".saveRow")).toContain("flex-wrap: wrap;");
  });

  it("forces no width wider than a phone", () => {
    for (const selector of PANEL_RULES) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });
});
