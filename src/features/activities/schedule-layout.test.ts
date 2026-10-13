import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/activities";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/activities.module.css`, "utf8")}`;
const TABLE = readFileSync(`${FOLDER}/schedule-table.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the tab Kegiatan PPKS on a phone", () => {
  it("makes each schedule a card of its own: the list is one that stacks its rows", () => {
    expect(TABLE).toMatch(/<table className=.*shared\.stacked/);
  });

  it("names every value of a card, so it reads without the head of the table", () => {
    for (const title of ["Jadwal", "Kegiatan", "Sasaran", "Status"]) {
      expect(TABLE).toContain(`<td data-title="${title}">`);
    }
  });

  it("folds the heading with the tahap choice, and the choice itself, instead of widening the page", () => {
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".choices")).toContain("flex-wrap: wrap;");
  });
});
