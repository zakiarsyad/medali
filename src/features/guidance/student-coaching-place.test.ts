import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "@/ui/source-files";

const PANEL = "<StudentCoachingPanel ";

/** Every page that opens a student's whole detail, with its source. */
const DETAIL_PAGES = sourceFilesEndingWith("page.tsx")
  .map((path) => ({ path, source: readFileSync(path, "utf8") }))
  .filter(({ source }) => source.includes("morePanelsOf="));

/** The panels a page gives the whole detail, up to the small detail's. */
function wholeDetailPanels(source: string): string {
  const start = source.indexOf("morePanelsOf=");
  const brief = source.indexOf("briefPanelsOf=", start);
  return source.slice(start, brief === -1 ? undefined : brief);
}

/** The panels a page gives the small detail; empty when it has none. */
function smallDetailPanels(source: string): string {
  const brief = source.indexOf("briefPanelsOf=");
  if (brief === -1) return "";
  return source.slice(brief);
}

describe("where Pembinaan (level) sits", () => {
  it("has pages to check", () => {
    expect(DETAIL_PAGES.length).toBeGreaterThan(0);
  });

  it.each(DETAIL_PAGES)(
    "$path puts it under Riwayat per semester and above Kesehatan jasmani in the whole detail",
    ({ source }) => {
      const panels = wholeDetailPanels(source);
      const history = panels.indexOf("<ScoreHistoryPanel ");
      const coaching = panels.indexOf(PANEL);
      const fitness = panels.indexOf("<StudentFitnessPanel ");

      expect(history).toBeGreaterThan(-1);
      expect(coaching).toBeGreaterThan(history);
      expect(fitness).toBeGreaterThan(coaching);
    },
  );

  it.each(DETAIL_PAGES)(
    "$path leaves it out of the small detail of Penilai Mahasiswa, Konselor and Pembina Disiplin Mahasiswa",
    ({ source }) => {
      expect(smallDetailPanels(source)).not.toContain(PANEL);
    },
  );
});
