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

describe("the appeal form of a resident on a phone", () => {
  const FORM = read("appeal-form.tsx");

  it("lays its fields out in one column on the shared form grid, never wider than their room", () => {
    expect(FORM).toContain("<form className={shared.form}");
    expect(
      FORM.match(/shared\.field\} \$\{styles\.field\} \$\{styles\.full\}/g),
    ).toHaveLength(2);
    expect(ruleOf(".full")).toContain("grid-column: 1 / -1;");
  });

  it("lets the camera be picked for the proof", () => {
    expect(FORM).toContain('const TAKEN_KINDS = "image/*,application/pdf";');
    expect(FORM).toContain("accept={TAKEN_KINDS}");
  });
});

describe("the cards of Advokasi masuk on a phone", () => {
  it("stand in one column when two do not fit, and fold a long word", () => {
    expect(ruleOf(".cards")).toContain(
      "minmax(min(100%, var(--card-min-width)), 1fr)",
    );
    expect(ruleOf(".card")).toContain("overflow-wrap: anywhere;");
  });

  it("fold Catatan BAM and the two decisions onto lines of their own", () => {
    expect(ruleOf(".decide")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".decideNote")).toContain("min-width: 0;");
  });
});

describe("the lists of Pelanggaran on a phone", () => {
  it("show each violation, each waiting row and each student as a card that names every value", () => {
    for (const name of [
      "violation-lists.tsx",
      "violation-schedule-table.tsx",
      "violation-rekap.tsx",
      "own-violation-table.tsx",
    ]) {
      expect(read(name)).toMatch(/<table className=.*shared\.stacked/);
    }
  });

  it("fold a heading and its choice under each other", () => {
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".panelHead > *")).toContain("max-width: 100%;");
  });
});

describe("the screen parts of Pelanggaran that run in the browser", () => {
  const PARTS = [
    `${FOLDER}/violation-form.tsx`,
    `${FOLDER}/violation-schedule-table.tsx`,
    `${FOLDER}/rekap-filters.tsx`,
    `${FOLDER}/appeal-form.tsx`,
    `${FOLDER}/own-violation-table.tsx`,
    `${FOLDER}/appeal-cards.tsx`,
    `${FOLDER}/appeal-decide.tsx`,
  ];

  it("are found", () => {
    const browserFiles = browserFilesIn(FOLDER);

    for (const path of PARTS) expect(browserFiles).toContain(path);
  });

  it.each(PARTS)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
