import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/mentor-groups";
const STYLES = readFileSync(`${FOLDER}/mentor-groups.module.css`, "utf8");

function codeOf(file: string): string {
  return readFileSync(`${FOLDER}/${file}`, "utf8");
}

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}

describe("the tab Evaluasi oleh mahasiswa on a phone", () => {
  it("puts the panel of the period and Komponen evaluasi pengasuhan in one column when the screen has no room for two, the panel first", () => {
    const columns = ruleOf(".sideBySide");
    const tab = codeOf("survey-tab.tsx");

    expect(columns).toContain("display: grid;");
    expect(columns).toContain("auto-fit");
    expect(tab).toMatch(
      /className=\{styles\.sideBySide\}>\s*\{panel\}\s*<SurveyComponents \/>/,
    );
  });

  it("never makes a column wider than the screen, so nothing scrolls sideways", () => {
    expect(ruleOf(".sideBySide")).toContain(
      "minmax(min(var(--column-min-width), 100%), 1fr)",
    );
    expect(ruleOf(".surveyFacts")).toContain(
      "minmax(min(var(--box-min-width), 100%), 1fr)",
    );
  });

  it("lays the form and the buttons of the period on the shared form grid, which stacks its fields in one column inside the panel", () => {
    for (const file of ["survey-open-form.tsx", "survey-controls.tsx"]) {
      const form = codeOf(file).match(/<form\b.*?noValidate/s);

      expect(form?.[0]).toContain("className={shared.form}");
    }
  });

  it("never lets a Periode with a long name be wider than its panel", () => {
    const choices =
      codeOf("survey-open-form.tsx").match(/<select\b.*?<\/select>/gs) ?? [];

    expect(ruleOf(".fit")).toContain("max-width: 100%;");
    expect(choices).toHaveLength(1);
    expect(choices[0]).toContain("styles.fit");
  });

  it("gives Periode and Keterangan the whole width of the form", () => {
    const form = codeOf("survey-open-form.tsx");
    const whole =
      form.match(
        /<label className=\{`\$\{shared\.field\} \$\{styles\.whole\}`\}>\s*([^\n<]+)/g,
      ) ?? [];

    expect(ruleOf(".whole")).toContain("grid-column: 1 / -1;");
    expect(whole).toHaveLength(2);
    expect(whole[0]).toContain("Periode");
    expect(whole[1]).toContain("Keterangan untuk mahasiswa (opsional)");
  });

  it("drops the status under the heading of the card where the two do not fit on one line", () => {
    const card = codeOf("survey-card-view.tsx");

    expect(card).toMatch(/className=\{styles\.panelHead\}>\s*<div>\s*<h2/);
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
  });

  it("folds a long note of the period inside its card", () => {
    expect(ruleOf(".surveyFacts dd")).toContain("overflow-wrap: anywhere;");
  });

  it("shows each group of Hasil evaluasi per kelompok as a card, with the title of each value in it", () => {
    const table = codeOf("survey-results-table.tsx");

    expect(table).toMatch(
      /className=\{`\$\{shared\.table\} \$\{shared\.stacked\}`\}/,
    );
    expect(table).toContain("className={shared.tableWrap}");
  });

  it("never lets the choice of period be wider than its panel, and lets it drop under the heading", () => {
    const view = codeOf("survey-results-view.tsx");
    const choice = view.match(/<select\s+name="periode".*?>/s);

    expect(choice?.[0]).toContain("styles.fit");
    expect(view).toMatch(
      /className=\{styles\.panelHead\}>\s*<div>\s*<h2 className=\{shared\.heading\}>Hasil evaluasi per kelompok/,
    );
  });

  it("puts the search and the filter of the results on the shared row of filters", () => {
    expect(codeOf("survey-results-view.tsx")).toMatch(
      /<div className=\{shared\.filters\}>\s*<input\s+name="q"/,
    );
  });

  it("stacks the averages per statement and the suggestions of a group where they do not fit side by side", () => {
    expect(codeOf("survey-group-detail-view.tsx")).toMatch(
      /<div className=\{styles\.sideBySide\}>\s*<div>\s*<h3 className=\{styles\.subheading\}>Rata-rata per pernyataan/,
    );
  });

  it("folds the button Tetapkan hasil evaluasi onto its own line instead of widening the panel", () => {
    const row = codeOf("survey-fix-part.tsx").match(
      /<div className=\{shared\.actions\}>.*?<\/div>/s,
    );

    expect(row?.[0]).toContain("Tetapkan hasil evaluasi");
  });

  it("folds the buttons of the period onto more lines instead of widening the panel", () => {
    const shared = readFileSync("src/ui/data-screen.module.css", "utf8");
    const actions = shared.match(/\.actions\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(actions).toContain("flex-wrap: wrap;");
    const row = codeOf("survey-controls.tsx").match(
      /<div className=\{shared\.actions\}>.*?<\/div>/s,
    );
    expect(row?.[0]).toContain("Tutup periode sekarang");
    expect(row?.[0]).toContain("Batalkan periode");
  });
});
