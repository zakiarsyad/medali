import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dorm";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/activities.module.css`, "utf8")}`;

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

describe("the lists of Kegiatan asrama on a phone", () => {
  it.each([
    [
      "daily-table.tsx",
      ["Waktu", "Kegiatan", "Penanggung jawab", "Peserta", "Status"],
    ],
    [
      "routine-panel.tsx",
      [
        "Kegiatan",
        "Pola",
        "Waktu",
        "Penanggung jawab",
        "Berlaku",
        "Hari tanpa kegiatan",
      ],
    ],
    [
      "one-off-panel.tsx",
      ["Tanggal", "Kegiatan", "Waktu", "Penanggung jawab", "Peserta", "Status"],
    ],
  ])(
    "show each activity of %s as a card that names every value",
    (file, titles) => {
      const table = read(file);

      expect(table).toMatch(/<table className=.*shared\.stacked/);
      for (const title of titles) {
        expect(table).toContain(`<td data-title="${title}">`);
      }
    },
  );

  it("fold the switch, the head of a panel and the steps between days instead of widening the page", () => {
    expect(ruleOf(".toolbar")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".daySwitch")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".daySwitch input")).toContain("max-width: 100%;");
    expect(read("../dorm/rooms.module.css")).toMatch(
      /\.switch,\s*\.floors \{[^}]*flex-wrap: wrap;/,
    );
  });

  it("fold what Rincian opens, however long a word in it is", () => {
    expect(ruleOf(".detail")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".rundown li")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".facts")).toContain(
      "minmax(min(100%, var(--card-min-width)), 1fr)",
    );
  });
});

describe("Kegiatan asrama of a resident on a phone", () => {
  it("stacks the cards of Hari ini in one column: a card never asks for more than the screen has", () => {
    expect(read("resident-activities-view.tsx")).toContain(
      "<ul className={styles.cards}>",
    );
    expect(ruleOf(".cards")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(".card")).toContain(
      'composes: card from "../../ui/data-screen.module.css";',
    );
    expect(ruleOf(".card")).toContain(
      'composes: card from "../../ui/data-screen.module.css";',
    );
    expect(ruleOf(".cardHead")).toContain("flex-wrap: wrap;");
  });
});

describe("the activity form on a phone", () => {
  const FORM = read("activity-form.tsx");

  it("lays its fields out on the shared form grid, which is one column at phone width", () => {
    expect(FORM).toContain("<div className={shared.form}>");
  });

  it("never lets a list be wider than its field, however long a choice is", () => {
    expect(FORM).toMatch(/shared\.field\} \$\{styles\.fits\}/);
    expect(ruleOf(".fits")).toContain("min-width: 0;");
    expect(ruleOf(".fits select")).toContain("max-width: 100%;");
  });

  it("folds a line of Rincian kegiatan, the marked days and the buttons instead of widening the page", () => {
    expect(ruleOf(".line")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".lineTime")).toContain("max-width: 100%;");
    expect(ruleOf(".lineActivity")).toContain("max-width: 100%;");
    expect(ruleOf(".chips")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".pushedEnd")).toContain("flex-wrap: wrap;");
  });

  it("stops below the top bar when Ubah brings it into view", () => {
    const BOARD = read("activity-board.tsx");

    expect(BOARD).toContain("styles.formPanel");
    expect(BOARD).toContain("panel.current?.scrollIntoView(");
    expect(ruleOf(".formPanel")).toContain(
      "scroll-margin-top: var(--below-top-bar);",
    );
  });
});
