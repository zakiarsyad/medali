import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/counselling";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/counselling.module.css`, "utf8")}`;
const SHARED = `\n${readFileSync("src/ui/data-screen.module.css", "utf8")}`;

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

/** What a rule of a style file holds, without the breaks between its lines. */
function ruleOf(selector: string, styles = STYLES): string {
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

/** The rules that place the parts of Konseling, by the style file that holds them. */
const LAYOUT_RULES: [string, string[]][] = [
  [
    STYLES,
    [
      ".parts",
      ".warnBox",
      ".stack",
      ".status",
      ".found",
      ".found button",
      ".picked",
    ],
  ],
  [SHARED, [".actions"]],
];

describe("Konseling on a phone", () => {
  it("puts the notice and Persetujuan konseling one under the other, in one column", () => {
    expect(read("counselling-screen.tsx")).toContain(
      "<div className={styles.parts}>",
    );
    expect(ruleOf(".parts")).toContain("display: grid;");
    expect(ruleOf(".parts")).not.toContain("grid-template-columns");
  });

  it("folds the long words of a notice instead of widening the page", () => {
    expect(read("warn-box.tsx")).toContain("className={styles.warnBox}");
    expect(ruleOf(".warnBox")).toContain("overflow-wrap: anywhere;");
  });
});

describe("Persetujuan konseling of Konselor on a phone", () => {
  const PANEL = read("counsellor-consent-panel.tsx");
  const PICKER = read("consent-student-picker.tsx");

  it("lays its lines out one under the other", () => {
    expect(PANEL).toMatch(
      /className=\{`\$\{shared\.panel\} \$\{styles\.stack\}`\}/,
    );
    expect(ruleOf(".stack")).toContain("display: grid;");
    expect(ruleOf(".stack")).not.toContain("grid-template-columns");
  });

  it("folds a long name of a student found, and keeps each one inside the panel", () => {
    expect(PICKER).toContain("<div className={styles.found}>");
    expect(ruleOf(".found")).toContain("flex-direction: column;");
    expect(ruleOf(".found button")).toContain("max-width: 100%;");
    expect(ruleOf(".found button")).toContain("overflow-wrap: anywhere;");
  });

  it("folds the name of the student picked, and puts Ganti mahasiswa under it when there is no room", () => {
    expect(PICKER).toContain("<div className={styles.picked}>");
    expect(ruleOf(".picked")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".picked")).toContain("overflow-wrap: anywhere;");
  });

  it("puts the second button under the first when both do not fit", () => {
    expect(PANEL).toContain("<div className={shared.actions}>");
    expect(ruleOf(".actions", SHARED)).toContain("flex-wrap: wrap;");
  });

  it("puts the date and the Konselor of a status under its badge when there is no room", () => {
    expect(read("consent-badge.tsx")).toContain("className={styles.status}");
    expect(ruleOf(".status")).toContain("flex-wrap: wrap;");
  });
});

describe("Persetujuan konseling of the student on a phone", () => {
  const BOX = read("own-consent-box.tsx");

  it("lays its lines out one under the other", () => {
    expect(BOX).toMatch(
      /className=\{`\$\{shared\.panel\} \$\{styles\.stack\}`\}/,
    );
  });

  it("folds the text of a waiting request, and puts Tolak under Setujui when both do not fit", () => {
    expect(BOX).toContain("<div className={styles.warnBox}>");
    expect(BOX).toContain("<div className={shared.actions}>");
    expect(ruleOf(".actions", SHARED)).toContain("flex-wrap: wrap;");
  });
});

describe("the style files of Konseling", () => {
  it("force no width wider than a phone", () => {
    for (const [styles, selectors] of LAYOUT_RULES) {
      for (const selector of selectors) {
        const rule = ruleOf(selector, styles);
        expect(rule, selector).not.toBe("");
        expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
        expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
        expect(rule, selector).not.toContain("nowrap");
      }
    }
  });
});
