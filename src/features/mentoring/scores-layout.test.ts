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
      "Nilai akhir",
      "Keterangan",
    ]) {
      expect(TABLE).toContain(`<td data-title="${title}">`);
    }
    expect(TABLE).toMatch(/<td\s+key=\{name\}\s+data-title=\{name\}/);
  });

  it("shows the form and the list that only reads in the one table, so both are cards", () => {
    for (const file of ["score-boxes.tsx", "score-list.tsx"]) {
      const code = readFileSync(`src/features/mentoring/${file}`, "utf8");

      expect(code).toContain("<ScoreTable");
      expect(code).not.toContain("<table");
    }
  });

  it("never makes a choice of an indicator wider than its card, so the six stack with no sideways scroll", () => {
    const choice = ruleOf(".indicatorChoice");

    expect(choice).toContain("width: 100%;");
    expect(choice).toContain("max-width: 100%;");
    expect(choice).toContain("min-width: 0;");
    expect(ruleOf(".indicatorCell")).toContain("min-width: 0;");
  });

  it("gives each indicator its own line on a card, named by the indicator", () => {
    expect(TABLE).toContain("data-title={name}");
  });

  it("folds the names and sentences of the panel Indikator penilaian and its save instead of widening the page", () => {
    expect(ruleOf(".indicator")).toContain("min-width: 0;");
    expect(ruleOf(".indicator")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".saveIndicators")).toContain("flex-wrap: wrap;");
  });

  it("folds what a row says of its box, the button with its message, and the rubric instead of widening the page", () => {
    expect(ruleOf(".boxFault")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".saveScores")).toContain("flex-wrap: var(--save-bar-wrap);");
    expect(ruleOf(".band")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".bandSentence")).toContain("min-width: 0;");
  });
});
