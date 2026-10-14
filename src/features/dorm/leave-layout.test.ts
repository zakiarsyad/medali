import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/dorm";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/leave.module.css`, "utf8")}`;

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

describe("the leave form of a resident on a phone", () => {
  const FORM = read("leave-form.tsx");

  it("lays its fields out on the shared form grid, which is one column at phone width", () => {
    expect(FORM).toContain("<div className={shared.form}>");
  });

  it("puts Ketentuan under the form once they do not fit side by side", () => {
    expect(ruleOf(".sideBySide")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(".sideBySide > *")).toContain("min-width: 0;");
  });

  it("folds the words of a kind and never lets a field be wider than its room", () => {
    expect(ruleOf(".kind")).toContain("min-width: 0;");
    expect(ruleOf(".kind")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".field > *")).toContain("max-width: 100%;");
    expect(FORM).not.toMatch(/className=\{shared\.field\}/);
    expect(FORM).toMatch(/shared\.field\} \$\{styles\.field\}/);
  });

  it("shows Riwayat izin saya as a card that names every value", () => {
    const history = read("own-leave-view.tsx");

    expect(history).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Jenis",
      "Berangkat",
      "Kembali",
      "Keperluan",
      "Status",
    ]) {
      expect(history).toContain(`<td data-title="${title}">`);
    }
  });
});

describe("the request cards of staff on a phone", () => {
  it("stack in one column, and fold every long word and the row of badges", () => {
    expect(read("staff-leave-screen.tsx")).toContain(
      "<ul className={styles.cards}>",
    );
    expect(ruleOf(".cards")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(".card")).toContain("min-width: 0;");
    expect(ruleOf(".card")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".cardHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".badges")).toContain("flex-wrap: wrap;");
  });
});

describe("the screen parts of Perizinan asrama that run in the browser", () => {
  const PARTS = [
    `${FOLDER}/leave-form.tsx`,
    `${FOLDER}/cancel-leave-button.tsx`,
    `${FOLDER}/leave-filters.tsx`,
  ];

  it("are found", () => {
    const browserFiles = browserFilesIn(FOLDER);

    for (const path of PARTS) expect(browserFiles).toContain(path);
  });

  it.each(PARTS)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
