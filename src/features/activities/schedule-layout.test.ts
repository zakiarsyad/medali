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

describe("the schedule form on a phone", () => {
  const FORM = readFileSync(`${FOLDER}/schedule-form.tsx`, "utf8");

  it("lays its fields out on the shared form grid, which is one column at phone width", () => {
    expect(FORM).toContain("<div className={shared.form}>");
  });

  it("never lets the list of activities be wider than its field, however long a name is", () => {
    expect(FORM).toMatch(/htmlFor=\{ACTIVITY_FIELD_ID\}\s+className=.*fits/);
    expect(ruleOf(".fits")).toContain("min-width: 0;");
    expect(ruleOf(".fits select")).toContain("max-width: 100%;");
  });

  it("folds the upload range, the facts of the activity and the head of the panel instead of widening the page", () => {
    expect(ruleOf(".uploadRange")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".uploadRange")).toContain("min-width: 0;");
    expect(ruleOf(".uploadCount")).toContain("max-width: 100%;");
    expect(ruleOf(".facts")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".addHead")).toContain("flex-wrap: wrap;");
  });

  it("folds the Peserta choices, the angkatan and the students picked, and scrolls the classes inside their own box", () => {
    expect(ruleOf(".modes")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".modes")).toContain("min-width: 0;");
    expect(ruleOf(".choices")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".chips")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".chip")).toContain("max-width: 100%;");
    expect(ruleOf(".classList")).toContain(
      "max-height: var(--class-list-height);",
    );
    expect(ruleOf(".classList")).toContain("overflow-y: auto;");
    expect(ruleOf(".classList")).toContain("overflow-x: hidden;");
    expect(ruleOf(".classList")).toContain("minmax(min(100%,");
  });

  it("folds Hapus jadwal with its message under the other buttons when there is no room beside them", () => {
    expect(ruleOf(".pushedEnd")).toContain("flex-wrap: wrap;");
  });
});

describe('the form that "Ubah" scrolls into view', () => {
  const BOARD = readFileSync(`${FOLDER}/schedule-board.tsx`, "utf8");
  const TOKENS = readFileSync("src/ui/tokens.css", "utf8");

  it("stops below the top bar, which stays at the top of the screen, not under it", () => {
    expect(BOARD).toMatch(/styles\.formPanel\}`\} ref=\{panel\}/);
    expect(BOARD).toContain("panel.current?.scrollIntoView(");
    expect(ruleOf(".formPanel")).toContain(
      "scroll-margin-top: var(--below-top-bar);",
    );
    expect(TOKENS).toMatch(/--below-top-bar: calc\([^;]+\);/);
  });
});
