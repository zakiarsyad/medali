import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/activities";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/activities.module.css`, "utf8")}`;

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the student's Kegiatan karakter on a phone", () => {
  it("puts the cards in one column: a card is never wider than the screen", () => {
    expect(ruleOf(".cards")).toContain("display: grid;");
    expect(ruleOf(".cards")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(".card")).toContain("min-width: 0;");
  });

  it("folds a long name, and the badge under it, instead of widening a card", () => {
    expect(ruleOf(".card")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".cardHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".tags")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".comingItem")).toContain("overflow-wrap: anywhere;");
  });

  it("makes each schedule of the history a card of its own, every value named", () => {
    const history = readFileSync(`${FOLDER}/attendance-history.tsx`, "utf8");

    expect(history).toMatch(/<table className=.*shared\.stacked/);
    for (const title of ["Tanggal", "Kegiatan", "Status", "Keterangan"]) {
      expect(history).toContain(`<td data-title="${title}">`);
    }
  });
});
