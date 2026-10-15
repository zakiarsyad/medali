import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/fitness";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/fitness.module.css`, "utf8")}`;
const SCREEN = readFileSync(`${FOLDER}/fitness-screen.tsx`, "utf8");
const LIST = readFileSync(`${FOLDER}/fitness-list-table.tsx`, "utf8");
const PANEL = readFileSync(`${FOLDER}/category-panel.tsx`, "utf8");
const LIMITS = readFileSync(`${FOLDER}/limits-view.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}

/** The rules that place the parts of the tab. */
const LAYOUT_RULES = [
  ".sideBySide",
  ".bars",
  ".bar",
  ".barLabel",
  ".limits",
  ".limitBox",
  ".saveRow",
];

describe("Penilaian jasmani on a phone", () => {
  it("stacks the input and Kategori in one column when the screen has no room for two", () => {
    const sides = ruleOf(".sideBySide");

    expect(SCREEN).toContain("<div className={styles.sideBySide}>");
    expect(sides).toContain("auto-fit");
    expect(sides).toContain("minmax(min(100%, var(--column-min-width)), 1fr)");
    expect(ruleOf(".sideBySide > *")).toContain("min-width: 0;");
  });

  it("makes each student of Hasil tes kebugaran a block of its own", () => {
    expect(LIST).toMatch(
      /className=\{`\$\{shared\.table\} \$\{shared\.stacked\}`\}/,
    );
    for (const title of ["Mahasiswa", "Tes", "Skor", "Kategori"]) {
      expect(LIST).toContain(`data-title="${title}"`);
    }
  });

  it("lets every column of a bar of Kategori shrink, so a bar never widens the panel", () => {
    expect(PANEL).toContain("className={styles.bar}");
    expect(ruleOf(".bar")).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;",
    );
    expect(ruleOf(".barLabel")).toContain("overflow-wrap: anywhere;");
  });

  it("folds the limits of Ambang skor onto more lines, and keeps a number box inside its box", () => {
    expect(LIMITS).toContain("<div className={styles.limits}>");
    expect(ruleOf(".limits")).toContain(
      "minmax(min(100%, var(--score-box-width)), 1fr)",
    );
    expect(ruleOf(".numberInput")).toContain("max-width: 100%;");
  });

  it("forces no width wider than a phone", () => {
    for (const selector of LAYOUT_RULES) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });
});
