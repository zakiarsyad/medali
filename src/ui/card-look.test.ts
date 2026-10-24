import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rulesOf } from "./css-rules";
import { cardCopies } from "./look-copies";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_STYLES = "src/ui/data-screen.module.css";

/** The cards of every screen, which all take the shared card look. */
const CARDS: Record<string, string> = {
  "src/features/activities/activities.module.css": ".card",
  "src/features/counselling/counselling.module.css": ".card",
  "src/features/curriculum/curriculum.module.css": ".box",
  "src/features/dorm/activities.module.css": ".card",
  "src/features/dorm/cleaning.module.css": ".box",
  "src/features/dorm/leave.module.css": ".card",
  "src/features/dorm/rooms.module.css": ".card",
  "src/features/dorm/violations.module.css": ".card",
  "src/features/mentoring/mentoring.module.css": ".card",
  "src/features/siku/siku.module.css": ".card",
};

/**
 * Boxes the check leaves alone, by file, because they are not cards: the
 * number boxes at the top of a screen, the tiles of Dashboard, a sum, a
 * photo card whose photo reaches its edges, and the boxes of the shared
 * frame: the sign-in box, an empty page and the drop area of a file
 * upload.
 */
const LEFT_ALONE: Record<string, string[]> = {
  "src/features/activities/verification.module.css": [".photoCard"],
  "src/features/character-grades/character-grades.module.css": [".weightBox"],
  "src/features/dashboard/dashboard.module.css": [".card", ".tile"],
  "src/features/dorm/rooms.module.css": [".number"],
  "src/features/dorm/tasks.module.css": [".number, .numberOn"],
  "src/features/siku/siku.module.css": [".sum"],
  "src/features/students/new-students.module.css": [".number"],
  "src/ui/bare-screen.module.css": [".box"],
  "src/ui/empty-page.module.css": [".empty"],
  "src/ui/file-upload.module.css": [".drop"],
  "src/ui/number-cards.module.css": [".number"],
};

function sharedRule(selector: string): Map<string, string> {
  const rule = rulesOf(readFileSync(SHARED_STYLES, "utf8")).find(
    (found) => found.selector === selector,
  );
  return rule?.declarations ?? new Map();
}

const STYLE_IMPORT = /import (\w+) from "\.\/([\w-]+\.module\.css)";/g;
const CLASS_LIST = /className=\{`([^`]*)`\}/g;
const CLASS_PART = /\$\{(\w+)\.(\w+)\}/g;
const CARD_LAYOUT = ["display", "flex-direction", "gap", "padding"];

function folderOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

/**
 * The classes that a screen puts on a card beside its card class, where
 * that class changes how the card lays out its lines: in the same style
 * file it wins over the shared card or not by load order alone.
 */
function cardLayoutChanges(code: string, folder: string): string[] {
  const styleFiles = new Map<string, string>();
  for (const [, name = "", file = ""] of code.matchAll(STYLE_IMPORT)) {
    styleFiles.set(name, `${folder}/${file}`);
  }
  const found: string[] = [];
  for (const [list = ""] of code.matchAll(CLASS_LIST)) {
    const parts = [...list.matchAll(CLASS_PART)];
    for (const [, name = "", card = ""] of parts) {
      const path = styleFiles.get(name);
      if (path === undefined || CARDS[path] !== `.${card}`) continue;
      const rules = rulesOf(readFileSync(path, "utf8"));
      for (const [, other = "", beside = ""] of parts) {
        if (other !== name || beside === card) continue;
        const rule = rules.find((one) => one.selector === `.${beside}`);
        const changes = CARD_LAYOUT.some((property) =>
          rule?.declarations.has(property),
        );
        if (changes) found.push(`${card} with ${beside}`);
      }
    }
  }
  return found;
}

function screenStylesheets(): string[] {
  return sourceFilesEndingWith(".css").filter(
    (path) => path !== SHARED_STYLES && path !== "src/ui/tokens.css",
  );
}

describe("cardCopies", () => {
  it.each([
    [".card { padding: var(--space-lg); }"],
    [".photoCard { border: 0; }"],
    [
      ".tile { border: var(--line-width) solid var(--line); border-radius: var(--radius-lg); }",
    ],
    [
      ".tile { border: var(--line-width) solid var(--line); box-shadow: var(--shadow); }",
    ],
    [
      '.card { composes: card from "../../ui/data-screen.module.css"; gap: 0; }',
    ],
  ])("finds a card look of its own in %s", (stylesheet) => {
    expect(cardCopies(stylesheet)).toHaveLength(1);
  });

  it.each([
    [
      '.card { composes: card from "../../ui/data-screen.module.css"; margin: 0; }',
    ],
    ['.box { composes: card from "../ui/data-screen.module.css"; }'],
    ['.card { composes: card from "./data-screen.module.css"; }'],
    [".cards { display: grid; }"],
    [".cardHead { display: flex; }"],
    [
      ".chip { border: var(--line-width) solid var(--line); border-radius: var(--radius-md); }",
    ],
    ["/* .card { padding: 0; } */"],
  ])("leaves %s alone", (stylesheet) => {
    expect(cardCopies(stylesheet)).toEqual([]);
  });
});

describe("the shared card", () => {
  const card = sharedRule(".card");

  it("takes the shared inner space, corner, line gap and no shadow", () => {
    expect(card.get("padding")).toBe("var(--card-padding)");
    expect(card.get("border-radius")).toBe("var(--card-radius)");
    expect(card.get("gap")).toBe("var(--card-gap)");
    expect(card.get("box-shadow")).toBe("var(--card-shadow)");
  });

  it("has a thin line on a white background, its lines one under another", () => {
    expect(card.get("border")).toBe("var(--line-width) solid var(--line)");
    expect(card.get("background")).toBe("var(--surface)");
    expect(card.get("display")).toBe("flex");
    expect(card.get("flex-direction")).toBe("column");
  });

  it("breaks long words, so a card never pushes a phone screen sideways", () => {
    expect(card.get("min-width")).toBe("0");
    expect(card.get("overflow-wrap")).toBe("anywhere");
  });
});

describe("the cards of every screen", () => {
  it.each(Object.entries(CARDS))(
    "%s takes the shared card for %s",
    (path, selector) => {
      const rule = rulesOf(readFileSync(path, "utf8")).find(
        (found) => found.selector === selector,
      );

      expect(rule?.declarations.get("composes")).toMatch(
        /^card from "(\.\.\/)+ui\/data-screen\.module\.css"$/,
      );
    },
  );

  it.each([...new Set(Object.keys(CARDS).map(folderOf))])(
    "%s gives no card another way to lay out its lines",
    (folder) => {
      const changes = sourceFilesEndingWith(".tsx")
        .filter((path) => folderOf(path) === folder)
        .flatMap((path) =>
          cardLayoutChanges(readFileSync(path, "utf8"), folder).map(
            (change) => `${path}: ${change}`,
          ),
        );

      expect(changes).toEqual([]);
    },
  );

  it.each(screenStylesheets())("%s draws no card of its own", (path) => {
    const copies = cardCopies(readFileSync(path, "utf8"));

    expect(copies).toEqual(LEFT_ALONE[path] ?? []);
  });
});
