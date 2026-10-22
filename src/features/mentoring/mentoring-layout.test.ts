import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLES = readFileSync(
  "src/features/mentoring/mentoring.module.css",
  "utf8",
);
const NOTE_STYLES = readFileSync(
  "src/mentoring/mentoring-notes.module.css",
  "utf8",
);

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string, styles = STYLES): string {
  const start = styles.indexOf(`${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the tab Catatan pendampingan on a phone", () => {
  it("puts the form and the list in one column when the screen has no room for two", () => {
    const columns = ruleOf(".columns");

    expect(columns).toContain("display: grid;");
    expect(columns).toContain("auto-fit");
  });

  it("never makes a column wider than the screen, so nothing scrolls sideways", () => {
    expect(ruleOf(".columns")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(".columns > *")).toContain("min-width: 0;");
  });

  it("folds a long word of a note, a long choice and the rows of tags instead of widening the page", () => {
    expect(ruleOf(".text", NOTE_STYLES)).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".fit")).toContain("max-width: 100%;");
    for (const row of [".offered", ".panelHead", ".counts"]) {
      expect(ruleOf(row)).toContain("flex-wrap: wrap;");
    }
    expect(ruleOf(".itemTitle", NOTE_STYLES)).toContain("flex-wrap: wrap;");
  });
});
