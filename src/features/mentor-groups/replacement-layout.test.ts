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

describe("the tab Evaluasi dan penggantian on a phone", () => {
  it("puts the form and Alur penggantian in one column when the screen has no room for two, the form first", () => {
    const columns = ruleOf(".sideBySide");
    const tab = codeOf("evaluation-tab.tsx");

    expect(columns).toContain("display: grid;");
    expect(columns).toContain("auto-fit");
    expect(tab).toMatch(
      /className=\{styles\.sideBySide\}>\s*\{form\}\s*<ReplacementFlow \/>/,
    );
  });

  it("never makes a column wider than the screen, so nothing scrolls sideways", () => {
    expect(ruleOf(".sideBySide")).toContain(
      "minmax(min(var(--column-min-width), 100%), 1fr)",
    );
  });

  it("lays both forms on the shared form grid, which stacks its fields in one column inside the panel", () => {
    for (const file of ["evaluation-form.tsx", "replacement-form.tsx"]) {
      const form = codeOf(file).match(/<form\b.*?noValidate/s);

      expect(form?.[0]).toContain("className={shared.form}");
    }
  });

  it("keeps the switch inside the panel: it drops under the heading where the two do not fit on one line", () => {
    const panel = codeOf("form-panel.tsx");

    expect(panel).toMatch(
      /className=\{styles\.panelHead\}>\s*<h2[^>]*>.*<\/h2>\s*<FormPartLinks/s,
    );
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".parts")).toContain("display: flex;");
  });

  it("never lets a choice with a long name be wider than its panel", () => {
    expect(ruleOf(".fit")).toContain("max-width: 100%;");
    for (const file of [
      "group-choice.tsx",
      "evaluation-form.tsx",
      "replacement-form.tsx",
    ]) {
      const choices = codeOf(file).match(/<select\b.*?<\/select>/gs) ?? [];

      expect(choices.length).toBeGreaterThan(0);
      for (const choice of choices) {
        expect(choice).toContain("styles.fit");
      }
    }
  });

  it("gives the tick box, its sentence and each note of the form the whole width of the form", () => {
    const confirm = ruleOf(".confirm");

    expect(confirm).toContain("display: flex;");
    expect(confirm).toContain("grid-column: 1 / -1;");
    expect(ruleOf(".whole")).toContain("grid-column: 1 / -1;");
    const notes =
      codeOf("replacement-form.tsx").match(
        /className=\{`[^`]*outcome[^`]*`\}/g,
      ) ?? [];
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) {
      expect(note).toContain("styles.whole");
    }
  });

  it("makes each replacement of Riwayat penggantian a card: the list is one that stacks its rows, inside a wrap of its own", () => {
    const table = codeOf("replacement-table.tsx");

    expect(table).toMatch(/<div className=\{shared\.tableWrap\}>\s*<table/);
    expect(table).toMatch(/<table className=.*shared\.stacked/);
  });

  it("names every value of a card, so it reads without the head of the table", () => {
    const table = codeOf("replacement-table.tsx");

    for (const title of [
      "Tanggal efektif",
      "Kelompok",
      "Pengasuh lama",
      "Pengganti",
      "Alasan",
      "Surat",
      "Status",
    ]) {
      expect(table).toContain(`<th>${title}</th>`);
      expect(table).toContain(`<td data-title="${title}">`);
    }
  });
});

describe("the page of a group on a phone", () => {
  it("folds Evaluasi pengasuh and Ganti pengasuh onto two lines instead of widening the page", () => {
    const actions = ruleOf(".headActions");

    expect(actions).toContain("display: flex;");
    expect(actions).toContain("flex-wrap: wrap;");
  });
});
