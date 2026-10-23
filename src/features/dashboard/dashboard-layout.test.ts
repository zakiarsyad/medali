import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dashboard";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/dashboard.module.css`, "utf8")}`;
const SECTION = readFileSync(`${FOLDER}/physical-section.tsx`, "utf8");
const GRADES = readFileSync(`${FOLDER}/grade-section.tsx`, "utf8");
const MEMBERS = readFileSync(`${FOLDER}/mentee-table.tsx`, "utf8");

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

describe("section 2 of the Dashboard on a phone", () => {
  it("stacks its two panels in one column when the screen has no room for two", () => {
    expect(GRADES).toContain("<div className={styles.panels}>");
  });

  it("lets each bar shrink to the width of a phone", () => {
    expect(ruleOf(".bar")).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;",
    );
    expect(ruleOf(".facts")).toContain("repeat(2, minmax(0, 1fr))");
    for (const selector of [".bars", ".bar", ".barLabel", ".facts"]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });
});

describe("the Anak asuh table of Dashboard anak asuh on a phone", () => {
  it("shows each anak asuh as a block, the six nilai in two rows of three", () => {
    expect(MEMBERS).toContain("shared.stacked");
    expect(ruleOf("table.menteeTable > tbody > tr")).toContain(
      "grid-template-columns: repeat(3, minmax(0, 1fr));",
    );
    expect(ruleOf("table.menteeTable td:not(.valueCell)")).toContain(
      "grid-column: 1 / -1;",
    );
  });

  it("puts the title of each nilai above it, so three fit side by side", () => {
    expect(ruleOf("table.menteeTable td.valueCell[data-title]")).toContain(
      "padding: var(--stacked-above-cell-padding);",
    );
    const title = ruleOf("table.menteeTable td.valueCell[data-title]::before");
    expect(title).toContain("float: none;");
    expect(title).toContain("width: auto;");
    expect(title).toContain("margin-left: 0;");
  });
});
