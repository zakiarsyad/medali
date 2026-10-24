import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/fitness";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/fitness.module.css`, "utf8")}`;
const SCREEN = readFileSync(`${FOLDER}/fitness-screen.tsx`, "utf8");
const LIST = readFileSync(`${FOLDER}/fitness-list-table.tsx`, "utf8");
const PANEL = readFileSync(`${FOLDER}/category-panel.tsx`, "utf8");
const LIMITS = readFileSync(`${FOLDER}/limits-view.tsx`, "utf8");
const FORM = readFileSync(`${FOLDER}/score-form.tsx`, "utf8");

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
  ".limits",
  ".limitBox",
  ".saveRow",
  ".full",
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

  it("draws Kategori with the shared bars, which fit a phone", () => {
    expect(PANEL).toContain("<CategoryBars");
  });

  it("folds the limits of Ambang skor onto more lines, and keeps a number box inside its box", () => {
    expect(LIMITS).toContain("<div className={styles.limits}>");
    expect(ruleOf(".limits")).toContain(
      "minmax(min(100%, var(--score-box-width)), 1fr)",
    );
    expect(ruleOf(".numberInput")).toContain("max-width: 100%;");
  });

  it("makes each member of the group form a block of its own, with its fields in the shared form grid", () => {
    expect(FORM).toMatch(
      /className=\{`\$\{shared\.table\} \$\{shared\.stacked\}`\}/,
    );
    for (const title of [
      "Mahasiswa",
      "Skor saat ini",
      "Skor baru",
      "Kategori",
    ]) {
      expect(FORM).toContain(`data-title="${title}"`);
    }
    expect(FORM).toContain("<div className={shared.form}>");
    expect(FORM).toContain("<div className={styles.saveRow}>");
    expect(ruleOf(".saveRow")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".full")).toContain("min-width: 0;");
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

describe("Kesehatan jasmani on Profil saya on a phone", () => {
  const VIEW = readFileSync(`${FOLDER}/student-fitness-view.tsx`, "utf8");
  const OWN = readFileSync(`${FOLDER}/own-fitness-panel.tsx`, "utf8");

  it("puts the category under the title, and the score and the day under each other, when there is no room", () => {
    expect(VIEW).toContain("<div className={styles.panelHead}>");
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
    expect(VIEW).toContain("<dl className={styles.facts}>");
    expect(ruleOf(".facts")).toContain(
      "minmax(min(100%, var(--box-min-width)), 1fr)",
    );
  });

  it("folds the long words of the note and the line on who reads it inside its box", () => {
    expect(VIEW).toContain("styles.noteBoxWarn : styles.noteBox");
    expect(ruleOf(".noteBox")).toContain(
      'composes: note from "../../ui/data-screen.module.css";',
    );
    expect(ruleOf(".noteBoxWarn")).toContain(
      'composes: warningNote from "../../ui/data-screen.module.css";',
    );
  });

  it("forces no width wider than a phone, and sets no style in its code", () => {
    for (const selector of [
      ".panelHead",
      ".facts",
      ".noteBox",
      ".noteBoxWarn",
    ]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
    for (const code of [VIEW, OWN]) {
      expect(code).not.toContain("style=");
    }
  });
});
