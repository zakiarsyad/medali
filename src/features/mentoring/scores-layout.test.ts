import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLES = readFileSync(
  "src/features/mentoring/mentoring.module.css",
  "utf8",
);
const TABLE = readFileSync("src/features/mentoring/score-table.tsx", "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the tab Nilai pengasuhan on a phone", () => {
  it("makes each mentee a card of its own: the list is one that stacks its rows", () => {
    expect(TABLE).toMatch(/<table className=.*shared\.stacked/);
  });

  it("names every value of a card, so it reads without the head of the table", () => {
    for (const title of [
      "Anak asuh",
      "Kehadiran pengasuhan",
      "Nilai pengasuhan",
      "Keterangan",
    ]) {
      expect(TABLE).toContain(`<td data-title="${title}">`);
    }
  });

  it("shows the form and the list that only reads in the one table, so both are cards", () => {
    for (const file of ["score-boxes.tsx", "score-list.tsx"]) {
      const code = readFileSync(`src/features/mentoring/${file}`, "utf8");

      expect(code).toContain("<ScoreTable");
      expect(code).not.toContain("<table");
    }
  });

  it("never makes the box of a score wider than its card, so nothing scrolls sideways", () => {
    const box = ruleOf(".scoreBox");

    expect(box).toContain("width: var(--score-box-width);");
    expect(box).toContain("max-width: 100%;");
  });

  it("folds what a row says of its box, the button with its message, and the rubric instead of widening the page", () => {
    expect(ruleOf(".boxFault")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".saveScores")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".band")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".bandSentence")).toContain("min-width: 0;");
  });
});
