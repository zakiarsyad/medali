import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/mentoring";
const STYLES = readFileSync(`${FOLDER}/mentoring.module.css`, "utf8");
const TOKENS = readFileSync("src/ui/tokens.css", "utf8");
const PHONE_START = TOKENS.indexOf("@media (max-width:");
const AT_ANY_WIDTH = TOKENS.slice(0, PHONE_START);
const ON_A_PHONE = TOKENS.slice(
  PHONE_START,
  TOKENS.indexOf("@media (prefers-color-scheme:"),
);

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

/** What a form holds from the opening tag of a part to the end of the form. */
function fromPart(file: string, opening: string): string {
  const code = readFileSync(`${FOLDER}/${file}`, "utf8");
  const start = code.indexOf(opening);
  if (start === -1) return "";
  return code.slice(start, code.indexOf("</form>", start));
}

describe("the bar with the save button of a form with a card per mentee", () => {
  it("rests under the form at any width, with no line and no room of its own", () => {
    expect(AT_ANY_WIDTH).toContain("--save-bar-position: static;");
    expect(AT_ANY_WIDTH).toContain("--save-bar-padding: 0;");
    expect(AT_ANY_WIDTH).toContain("--save-bar-line: 0;");
    expect(AT_ANY_WIDTH).toContain("--save-bar-margin: var(--space-md);");
    expect(AT_ANY_WIDTH).toContain("--above-save-bar: 0;");
  });

  it("stays at the bottom of the screen on a phone, on the colour of its panel so no card shows through", () => {
    const bar = ruleOf(".saveBar");

    expect(ON_A_PHONE).toContain("--save-bar-position: sticky;");
    expect(bar).toContain("position: var(--save-bar-position);");
    expect(bar).toContain("bottom: 0;");
    expect(bar).toContain("background: var(--surface);");
    expect(bar).toContain(
      "border-top: var(--save-bar-line) solid var(--line);",
    );
  });

  it("stands as far under the last mentee on a phone as at any width: its room is inside it there, not above it", () => {
    const bar = ruleOf(".saveBar");

    expect(bar).toContain("margin-top: var(--save-bar-margin);");
    expect(bar).toContain("padding: var(--save-bar-padding);");
    expect(ON_A_PHONE).toContain("--save-bar-margin: 0;");
    expect(ON_A_PHONE).toContain("--save-bar-padding: var(--space-md) 0;");
  });
});

describe("the bar of Daftar hadir pertemuan", () => {
  const BAR = fromPart("attendance-form.tsx", "styles.saveBar");

  it("is a part of the form beside its fields, not inside their grid, so it can stay in view while they scroll", () => {
    const form = readFileSync(`${FOLDER}/attendance-form.tsx`, "utf8");
    const grid = form.slice(form.indexOf("<div className={shared.form}>"));
    const listToBar = grid.slice(
      grid.indexOf("<MemberList"),
      grid.indexOf("styles.saveBar"),
    );

    expect(form).not.toMatch(/<form[^>]*className=\{shared\.form\}/);
    expect(grid).toContain("<MemberList");
    // Two parts end between the list and the bar: the line of the list, and the grid.
    expect(listToBar.match(/<\/div>/g)).toHaveLength(2);
  });

  it("holds Simpan daftar hadir, Tutup, the running count and the message of a save", () => {
    for (const part of [
      "Simpan daftar hadir",
      "Tutup",
      "countWords(counts",
      "<FormMessage state={state} />",
    ]) {
      expect(BAR).toContain(part);
    }
  });

  it("shows the message under the buttons at any width, and above them on a phone, so the buttons do not move", () => {
    const bar = ruleOf(".saveAttendance");

    expect(bar).toContain("display: flex;");
    expect(bar).toContain("flex-direction: var(--save-bar-direction);");
    expect(bar).toContain("gap: var(--space-md);");
    expect(AT_ANY_WIDTH).toContain("--save-bar-direction: column;");
    expect(ON_A_PHONE).toContain("--save-bar-direction: column-reverse;");
  });

  it("keeps a choice that is brought into view above the bar, not behind it", () => {
    expect(ruleOf(".mark input")).toContain(
      "scroll-margin-bottom: var(--above-save-bar);",
    );
    expect(ON_A_PHONE).toMatch(/--above-save-bar: calc\([^;]+\);/);
  });
});

describe("the bar of Nilai anak asuh", () => {
  const BAR = fromPart("score-form.tsx", "styles.saveBar");

  it("holds the save button and the message of a save, under the scores", () => {
    const form = readFileSync(`${FOLDER}/score-form.tsx`, "utf8");

    expect(form.indexOf("<ScoreBoxes")).toBeLessThan(
      form.indexOf("styles.saveBar"),
    );
    expect(BAR).toContain("saveButtonWords(sentIds.length)");
    expect(BAR).toContain("<FormMessage state={state} />");
  });

  it("keeps the message beside the button, and takes its room above from the bar, so it is not counted twice", () => {
    const row = ruleOf(".saveScores");

    expect(BAR).toContain("styles.saveScores");
    expect(row).toContain("display: flex;");
    expect(row).not.toContain("margin-top");
  });

  it("folds a message with no room beside the button under it at any width, and above it on a phone, so the button does not move", () => {
    expect(ruleOf(".saveScores")).toContain("flex-wrap: var(--save-bar-wrap);");
    expect(AT_ANY_WIDTH).toContain("--save-bar-wrap: wrap;");
    expect(ON_A_PHONE).toContain("--save-bar-wrap: wrap-reverse;");
  });

  it("keeps the choice being made above the bar, not behind it", () => {
    expect(ruleOf(".indicatorChoice")).toContain(
      "scroll-margin-bottom: var(--above-save-bar);",
    );
  });
});
