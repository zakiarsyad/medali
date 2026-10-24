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

  it.each(screenStylesheets())("%s draws no card of its own", (path) => {
    const copies = cardCopies(readFileSync(path, "utf8"));

    expect(copies).toEqual(LEFT_ALONE[path] ?? []);
  });
});
