import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/students";
const STYLES = readFileSync(`${FOLDER}/new-students.module.css`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the choice Kelompok pengasuhan on a phone", () => {
  it("takes a whole row of the form, which is one column on a phone", () => {
    const field = readFileSync(`${FOLDER}/mentor-group-field.tsx`, "utf8");

    expect(ruleOf(".groupField")).toContain("grid-column: 1 / -1;");
    expect(field).toContain("<div className={styles.groupField}>");
  });

  it("narrows with the screen, so a long group line never makes the form wider", () => {
    expect(ruleOf(".groupField")).toContain("min-width: 0;");
  });
});

describe("the column Kelompok pengasuhan on a phone", () => {
  it("has its title in the cell, which the list shows as cards on a phone", () => {
    const table = readFileSync(`${FOLDER}/student-table.tsx`, "utf8");

    expect(table).toContain('<td data-title="Kelompok pengasuhan">');
    expect(table).toContain("shared.stacked");
  });
});
