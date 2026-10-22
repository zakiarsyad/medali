import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/character-grades";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/character-grades.module.css`, "utf8")}`;
const SHARED = `\n${readFileSync("src/ui/data-screen.module.css", "utf8")}`;
const CHOICE = readFileSync(`${FOLDER}/semester-choice.tsx`, "utf8");
const SCREEN = readFileSync(`${FOLDER}/character-grade-screen.tsx`, "utf8");
const TABLE = readFileSync(`${FOLDER}/grade-list-table.tsx`, "utf8");

/** What a rule of a style file holds, without the breaks between its lines. */
function ruleOf(styles: string, selector: string): string {
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the grades of a closed semester on a phone", () => {
  it("puts the choice Semester above the numbers and the cards of the list", () => {
    const choice = SCREEN.indexOf("{semester}");

    expect(choice).toBeGreaterThan(SCREEN.indexOf("<TabLinks"));
    expect(choice).toBeLessThan(SCREEN.indexOf("{numbers}"));
    expect(choice).toBeLessThan(SCREEN.indexOf("<GradeListTable"));
  });

  it("keeps the choice inside the screen: its row wraps and nothing in it is wider than the screen", () => {
    expect(CHOICE).toContain("<div className={shared.filters}>");
    expect(ruleOf(SHARED, ".filters")).toContain("flex-wrap: wrap;");
    expect(ruleOf(SHARED, ".filters > *")).toContain("max-width: 100%;");
    expect(CHOICE).toMatch(
      /<select[^>]*className=\{`\$\{shared\.input\} \$\{styles\.choice\}`\}/s,
    );
    expect(ruleOf(STYLES, ".choice")).toContain("max-width: 100%;");
  });

  it("shows each student of the fixed grades as a card, as the live list does", () => {
    expect(TABLE).toMatch(
      /<table className=\{`\$\{shared\.table\} \$\{shared\.stacked\}`\}>/,
    );
    expect(SCREEN.match(/<GradeListTable/g)).toHaveLength(1);
  });
});
