import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/dorm";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/cleaning.module.css`, "utf8")}`;

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

describe("Jadwal pembersihan on a phone", () => {
  const BOARD = read("cleaning-schedule-board.tsx");

  it("shows each place as a card that names every value", () => {
    expect(BOARD).toMatch(/<table className=.*shared\.stacked/);
    for (const title of ["Tempat", "Kamar bertugas", "Status"]) {
      expect(BOARD).toContain(`data-title="${title}"`);
    }
  });

  it("folds the room picked and Tugaskan under each other, never wider than the card", () => {
    expect(ruleOf(".assign")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".assign")).toContain("min-width: 0;");
    expect(ruleOf(".assign select")).toContain("max-width: 100%;");
    expect(ruleOf(".ownLine")).toContain("flex-wrap: wrap;");
  });

  it("names the judgement of each duty on its card", () => {
    expect(read("cleaning-duty-parts.tsx")).toContain('data-title="Penilaian"');
  });

  it("folds Catatan, Memenuhi and Tidak memenuhi under each other, never wider than the card", () => {
    expect(read("cleaning-judge-form.tsx")).toContain(
      "className={styles.judge}",
    );
    expect(ruleOf(".judge")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".judge")).toContain("min-width: 0;");
    expect(ruleOf(".judge input")).toContain("min-width: 0;");
    expect(ruleOf(".judge input")).toContain("max-width: 100%;");
    expect(ruleOf(".sentBack")).toContain("overflow-wrap: anywhere;");
  });
});

describe("Skor kebersihan kamar on a phone", () => {
  it("shows each room as a card that names every value", () => {
    const ranking = read("cleaning-ranking.tsx");

    expect(ranking).toMatch(/<table className=.*shared\.stacked/);
    for (const title of ["No", "Kamar", "+", "−", "Skor"]) {
      expect(ranking).toContain(`data-title="${title}"`);
    }
  });
});

describe("the duties of a resident's room on a phone", () => {
  it("show each duty as a card that names every value, and a room name that folds", () => {
    const view = read("cleaning-resident-view.tsx");

    expect(view).toMatch(/<table className=.*shared\.stacked/);
    for (const title of ["Tanggal", "Tempat", "Status"]) {
      expect(view).toContain(`data-title="${title}"`);
    }
    expect(ruleOf(".roomValue")).toContain("overflow-wrap: anywhere;");
  });
});

describe("Tempat pembersihan on a phone", () => {
  it("stacks the dorms in one column, each a card", () => {
    expect(read("cleaning-places-board.tsx")).toContain(
      "<ul className={styles.boxes}>",
    );
    expect(ruleOf(".boxes")).toContain("composes: cards");
    expect(ruleOf(".place")).toContain("composes: resident");
  });
});

describe("the screen parts of Pembersihan asrama that run in the browser", () => {
  const PARTS = [
    `${FOLDER}/cleaning-places-board.tsx`,
    `${FOLDER}/cleaning-place-form.tsx`,
    `${FOLDER}/cleaning-schedule-board.tsx`,
    `${FOLDER}/cleaning-day-switch.tsx`,
    `${FOLDER}/cleaning-judge-form.tsx`,
    `${FOLDER}/cleaning-validate-buttons.tsx`,
  ];

  it("are found", () => {
    const browserFiles = browserFilesIn(FOLDER);

    for (const path of PARTS) expect(browserFiles).toContain(path);
  });

  it.each(PARTS)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
