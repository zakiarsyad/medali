import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLES = readFileSync(
  "src/features/mentoring/mentoring.module.css",
  "utf8",
);

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the tab Pertemuan dan daftar hadir on a phone", () => {
  it("puts the four cards one under another when the screen has no room for more, never wider than the screen", () => {
    const cards = ruleOf(".cards");

    expect(cards).toContain("display: grid;");
    expect(cards).toContain("auto-fit");
    expect(cards).toContain("minmax(min(100%, var(--card-min-width)), 1fr)");
    expect(ruleOf(".card")).toContain("min-width: 0;");
  });

  it("folds the head and the lines of a card instead of widening it", () => {
    expect(ruleOf(".cardHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".cardLine")).toContain("overflow-wrap: anywhere;");
  });

  it("makes each member a card of its own: the choices fold under the name when there is no room beside it", () => {
    const member = ruleOf(".member");

    expect(member).toContain("display: flex;");
    expect(member).toContain("flex-wrap: wrap;");
    expect(ruleOf(".memberName")).toContain("flex: 1 1 var(--box-min-width);");
    expect(ruleOf(".marks")).toContain("flex: 2 1 var(--card-min-width);");
  });

  it("gives the four choices equal parts of the whole width, so none is cut off and nothing scrolls sideways", () => {
    const marks = ruleOf(".marks");

    expect(marks).toContain("display: grid;");
    expect(marks).toContain(
      "grid-template-columns: repeat(4, minmax(0, 1fr));",
    );
    expect(marks).toContain("min-width: 0;");
    expect(ruleOf(".memberName")).toContain("min-width: 0;");
    expect(ruleOf(".memberName")).toContain("overflow-wrap: anywhere;");
  });

  it("makes each choice large: the whole box is pressed, with room above and below its word", () => {
    const mark = ruleOf(".mark");

    expect(mark).toContain("padding: var(--space-md) var(--space-2xs);");
    expect(mark).toContain("cursor: pointer;");
    expect(mark).toContain("flex-wrap: wrap;");
  });

  it("uses no table for the members, so no row is wider than a phone", () => {
    const form = readFileSync(
      "src/features/mentoring/attendance-form.tsx",
      "utf8",
    );
    const view = readFileSync(
      "src/features/mentoring/attendance-view.tsx",
      "utf8",
    );

    expect(form).not.toContain("<table");
    expect(view).not.toContain("<table");
  });
});
