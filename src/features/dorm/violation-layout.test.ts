import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/dorm";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/violations.module.css`, "utf8")}`;

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the form of BAM on a phone", () => {
  const FORM = read("violation-form.tsx");

  it("lays its fields out on the shared form grid, which is one column at phone width", () => {
    expect(FORM).toContain("<div className={shared.form}>");
    expect(FORM).toMatch(
      /shared\.form\} \$\{styles\.full\} \$\{styles\.next\}/,
    );
  });

  it("never lets a field be wider than its room, and folds the day and hour of the announcement", () => {
    expect(ruleOf(".field")).toContain("min-width: 0;");
    expect(ruleOf(".field > *")).toContain("max-width: 100%;");
    expect(FORM).not.toMatch(/className=\{shared\.field\}/);
    expect(ruleOf(".when")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".when > *")).toContain("min-width: 0;");
  });

  it("folds a long found name instead of widening the page", () => {
    expect(STYLES).toMatch(
      /\.found button,\s*\.picked \{[^}]*overflow-wrap: anywhere;/,
    );
  });

  it("shows the list under the form as a card that names every value", () => {
    expect(FORM).toMatch(/<table className=.*shared\.stacked/);
    for (const title of ["Mahasiswa", "Alasan", "Hukuman"]) {
      expect(FORM).toContain(`data-title="${title}"`);
    }
  });
});

describe("the screen parts of Pelanggaran that run in the browser", () => {
  const PARTS = [
    `${FOLDER}/violation-form.tsx`,
    `${FOLDER}/violation-schedule-table.tsx`,
  ];

  it("are found", () => {
    const browserFiles = browserFilesIn(FOLDER);

    for (const path of PARTS) expect(browserFiles).toContain(path);
  });

  it.each(PARTS)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
