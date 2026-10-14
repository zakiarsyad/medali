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

  it("folds the long name of a sent file in the history, on a line of its own under the badge", () => {
    const history = readFileSync(`${FOLDER}/history-table-view.tsx`, "utf8");

    expect(history).toContain("styles.sentFile");
    expect(ruleOf(".sentFile")).toContain("display: block;");
    expect(ruleOf(".sentFile")).toContain("overflow-wrap: anywhere;");
  });

  it("makes each schedule of the history a card of its own, every value named", () => {
    const history = readFileSync(`${FOLDER}/history-table-view.tsx`, "utf8");

    expect(history).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Tanggal",
      "Kegiatan",
      "Status",
      "Keterangan",
      "Klarifikasi",
    ]) {
      expect(history).toContain(`<td data-title="${title}">`);
    }
  });

  it("gives the form of a clarification and its answer the whole width of their card: their cells carry no title", () => {
    const history = readFileSync(`${FOLDER}/history-table-view.tsx`, "utf8");

    expect(history.match(/<td colSpan=\{TITLES\.length\}>/g)).toHaveLength(2);
  });

  it("puts the form of a clarification in one column: no field is wider than the room it has", () => {
    const form = readFileSync(`${FOLDER}/clarification-form-view.tsx`, "utf8");

    expect(form).toMatch(/<form className=\{shared\.form\}/);
    expect(form.match(/\$\{shared\.field\} \$\{styles\.fits\}/g)).toHaveLength(
      3,
    );
    expect(ruleOf(".fits")).toContain("min-width: 0;");
    expect(ruleOf(".fits input,\n.fits textarea")).toContain(
      "max-width: 100%;",
    );
    expect(ruleOf(".fits select")).toContain("max-width: 100%;");
    expect(ruleOf(".full")).toContain("grid-column: 1 / -1;");
  });
});
