import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rulesOf } from "./css-rules";
import { headingCopies } from "./look-copies";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_STYLES = "src/ui/data-screen.module.css";

/** The section headings inside the pages, which all take the shared look. */
const HEADINGS: [string, string][] = [
  ["src/features/academic-periods/periods.module.css", ".factsHeading"],
  ["src/features/character-grades/character-grades.module.css", ".subheading"],
  ["src/features/counselling/counselling.module.css", ".subHeading"],
  ["src/features/curriculum/curriculum.module.css", ".boxTitle"],
  ["src/features/dorm/cleaning.module.css", ".dormTitle"],
  ["src/features/dorm/dashboard.module.css", ".subheading"],
  ["src/features/fitness/fitness.module.css", ".subheading"],
  [
    "src/features/guidance/discipline-penalties.module.css",
    ".conditionsHeading",
  ],
  ["src/features/mentor-groups/mentor-groups.module.css", ".subheading"],
  ["src/features/siku/siku.module.css", ".subheading"],
  ["src/features/skpm/skpm.module.css", ".subheading"],
];

/**
 * Headings the check leaves alone, by file, because they are not section
 * headings inside a page: the heading of a Dashboard section, a level
 * above, the title of one card or one item of a list, and the folded
 * history of a penetapan.
 */
const LEFT_ALONE: Record<string, string[]> = {
  "src/features/cohort-assignments/cohort-assignments.module.css": [
    ".logTitle",
  ],
  "src/features/dashboard/dashboard.module.css": [".sectionTitle"],
  "src/features/mentoring/mentoring.module.css": [".cardTitle"],
  "src/mentoring/mentoring-notes.module.css": [".itemTitle"],
};

function screenStylesheets(): string[] {
  return sourceFilesEndingWith(".css").filter(
    (path) => path !== SHARED_STYLES && path !== "src/ui/tokens.css",
  );
}

describe("headingCopies", () => {
  it.each([
    [".subheading { font-size: var(--text-base); }"],
    [".boxTitle { font-weight: var(--weight-heavy); }"],
    [".factsHeading { color: var(--muted); }"],
    [
      '.subHeading { composes: sectionHeading from "../../ui/data-screen.module.css"; color: var(--ink); }',
    ],
  ])("finds a heading look of its own in %s", (stylesheet) => {
    expect(headingCopies(stylesheet)).toHaveLength(1);
  });

  it.each([
    [
      '.subheading { composes: sectionHeading from "../../ui/data-screen.module.css"; margin: 0; }',
    ],
    [".sectionHead { display: flex; }"],
    [".title { font-size: var(--text-title); }"],
    ["/* .subheading { font-size: 13px; } */"],
  ])("leaves %s alone", (stylesheet) => {
    expect(headingCopies(stylesheet)).toEqual([]);
  });
});

describe("the shared section heading", () => {
  const heading =
    rulesOf(readFileSync(SHARED_STYLES, "utf8")).find(
      (rule) => rule.selector === ".sectionHeading",
    )?.declarations ?? new Map<string, string>();

  it("takes the shared size, weight and colour", () => {
    expect(heading.get("font-size")).toBe("var(--section-heading-text)");
    expect(heading.get("font-weight")).toBe("var(--section-heading-weight)");
    expect(heading.get("color")).toBe("var(--section-heading-ink)");
  });

  it("sets no space around it, which each screen keeps for itself", () => {
    expect(heading.has("margin")).toBe(false);
  });
});

describe("the section headings of every page", () => {
  it.each(HEADINGS)("%s takes the shared heading for %s", (path, selector) => {
    const rule = rulesOf(readFileSync(path, "utf8")).find(
      (found) => found.selector === selector,
    );

    expect(rule?.declarations.get("composes")).toMatch(
      /^sectionHeading from "(\.\.\/)+ui\/data-screen\.module\.css"$/,
    );
  });

  it.each(screenStylesheets())(
    "%s gives no heading a look of its own",
    (path) => {
      const copies = headingCopies(readFileSync(path, "utf8"));

      expect(copies).toEqual(LEFT_ALONE[path] ?? []);
    },
  );
});
