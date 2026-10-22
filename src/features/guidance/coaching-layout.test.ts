import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/guidance";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/coaching-list.module.css`, "utf8")}`;

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

describe("Pembinaan karakter on a phone", () => {
  it("shows each student as a card that names every value", () => {
    const TABLE = read("coaching-table.tsx");
    expect(TABLE).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Mahasiswa",
      "Pengasuh",
      "Tingkat",
      "Aspek terlemah",
      "Rerata",
      "Status",
    ]) {
      expect(TABLE).toContain(`data-title="${title}"`);
    }
  });

  it("keeps the status choice, its note and the note shown within the card", () => {
    expect(ruleOf("select.control")).toContain("max-width: 100%;");
    expect(ruleOf("select.control")).toContain("min-width: 0;");
    expect(ruleOf(".change")).toContain("min-width: 0;");
    expect(ruleOf(".field")).toContain("min-width: 0;");
    expect(ruleOf(".note")).toContain("overflow-wrap: anywhere;");
  });
});

describe("the screen parts of Pembinaan karakter that run in the browser", () => {
  const browserFiles = browserFilesIn(FOLDER).filter((path) =>
    path.replaceAll("\\", "/").includes("/coaching-"),
  );

  it("are found: the status choice and the message above the list at least", () => {
    // Folders are split by another sign on some computers.
    const names = browserFiles.map((path) => path.replaceAll("\\", "/"));
    expect(names).toContain(`${FOLDER}/coaching-status-cell.tsx`);
    expect(names).toContain(`${FOLDER}/coaching-message.tsx`);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
