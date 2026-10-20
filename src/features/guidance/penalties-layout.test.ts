import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/guidance";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/discipline-penalties.module.css`, "utf8")}`;

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

describe("Pelanggaran disiplin on a phone", () => {
  it("lays the form out on the shared form grid, one column on a phone, beside Konsekuensi only where both fit", () => {
    const FORM = read("penalty-form.tsx");
    expect(FORM).toContain("<div className={notes.parts}>");
    expect(FORM).toContain("<div className={shared.form}>");
    expect(ruleOf(".choices")).toContain("min-width: 0;");
    expect(ruleOf(".choice")).toContain("overflow-wrap: anywhere;");
  });

  it("shows each penalty as a card that names every value", () => {
    const TABLE = read("penalty-table.tsx");
    expect(TABLE).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Mahasiswa",
      "Tanggal",
      "Hukuman",
      "Kerja sosial",
      "Status",
    ]) {
      expect(TABLE).toContain(`data-title="${title}"`);
    }
  });

  it("keeps the rules table whole, scrolling inside its own box", () => {
    const TABLE = read("penalty-rules-table.tsx");
    expect(TABLE).toContain("<div className={shared.tableWrap}>");
    expect(TABLE).toContain("styles.rules");
    expect(TABLE).not.toContain("shared.stacked");
    expect(ruleOf(".rules")).toContain(
      "min-width: var(--wide-table-min-width);",
    );
  });
});

describe("the screen parts of Pelanggaran disiplin that run in the browser", () => {
  const browserFiles = browserFilesIn(FOLDER).filter((path) =>
    path.replaceAll("\\", "/").includes("/penalty-"),
  );

  it("are found: the list with Rincian at least", () => {
    // Folders are split by another sign on some computers.
    const names = browserFiles.map((path) => path.replaceAll("\\", "/"));
    expect(names).toContain(`${FOLDER}/penalty-table.tsx`);
    expect(names).toContain(`${FOLDER}/penalty-form.tsx`);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
