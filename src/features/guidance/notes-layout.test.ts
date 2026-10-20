import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/guidance";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/violation-notes.module.css`, "utf8")}`;

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

describe("Catatan pelanggaran on a phone", () => {
  it("puts the form and Ketentuan side by side only where both fit, one under the other on a phone", () => {
    expect(read("note-writing.tsx")).toContain(
      "<div className={styles.parts}>",
    );
    expect(ruleOf(".parts")).toContain("display: grid;");
    expect(ruleOf(".parts")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(".parts > *")).toContain("min-width: 0;");
  });

  it("lays the form out on the shared form grid, one column on a phone, never wider than its room", () => {
    const FORM = read("note-form.tsx");
    expect(FORM).toContain("<div className={shared.form}>");
    expect(ruleOf(".field")).toContain("min-width: 0;");
    expect(ruleOf(".field > *")).toContain("max-width: 100%;");
    expect(ruleOf(".full")).toContain("grid-column: 1 / -1;");
  });

  it("folds a long found name and the student's box instead of widening the page", () => {
    expect(STYLES).toMatch(
      /\.found button,\s*\.picked \{[^}]*overflow-wrap: anywhere;/,
    );
    expect(ruleOf(".box")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".terms li")).toContain("overflow-wrap: anywhere;");
  });

  it("shows each note as a card that names every value", () => {
    const LIST = read("note-list.tsx");
    expect(LIST).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Tanggal",
      "Mahasiswa",
      "Kategori",
      "Uraian",
      "Hukuman",
      "Berlaku",
    ]) {
      expect(LIST).toContain(`data-title="${title}"`);
    }
  });
});

describe("the screen parts of Catatan pelanggaran that run in the browser", () => {
  const browserFiles = browserFilesIn(FOLDER);

  it("are found: the form and Hapus at least", () => {
    // Folders are split by another sign on some computers.
    const names = browserFiles.map((path) => path.replaceAll("\\", "/"));
    expect(names).toContain(`${FOLDER}/note-form.tsx`);
    expect(names).toContain(`${FOLDER}/remove-note-button.tsx`);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
