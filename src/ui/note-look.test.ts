import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rulesOf } from "./css-rules";
import { noteCopies } from "./look-copies";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_STYLES = "src/ui/data-screen.module.css";
const SHARED_PATH = String.raw`"(?:\.\.?/)+(?:ui/)?data-screen\.module\.css"`;

/** The notes of every screen, by file, and the shared look each takes. */
const NOTES: Record<string, Record<string, "note" | "warningNote">> = {
  "src/features/character-assessment/character-assessment.module.css": {
    ".note": "note",
  },
  "src/features/cohort-assignments/cohort-assignments.module.css": {
    ".note": "note",
    ".held": "warningNote",
  },
  "src/features/counselling/counselling.module.css": {
    ".warnBox": "warningNote",
  },
  "src/features/dashboard/dashboard.module.css": {
    ".progress": "note",
    ".progressWarn": "warningNote",
  },
  "src/features/dorm/activities.module.css": {
    ".note": "note",
    ".warnNote": "warningNote",
  },
  "src/features/dorm/clarifications.module.css": { ".flow": "note" },
  "src/features/dorm/cleaning.module.css": { ".note": "note" },
  "src/features/dorm/dorm-health.module.css": { ".readOnly": "note" },
  "src/features/dorm/leave.module.css": {
    ".note": "note",
    ".warning": "warningNote",
  },
  "src/features/dorm/rooms.module.css": { ".note": "note" },
  "src/features/dorm/tasks.module.css": {
    ".box": "note",
    ".watch": "warningNote",
  },
  "src/features/dorm/warnings.module.css": {
    ".box": "note",
    ".callBox": "warningNote",
  },
  "src/features/fitness/fitness.module.css": {
    ".readOnly": "note",
    ".noteBox": "note",
    ".noteBoxWarn": "warningNote",
  },
  "src/features/guidance/violation-notes.module.css": {
    ".box": "note",
    ".warnBox": "warningNote",
  },
  "src/features/mentor-groups/mentor-groups.module.css": {
    ".note": "note",
    ".warnedNote": "warningNote",
  },
  "src/features/siku/siku.module.css": { ".note": "note" },
  "src/features/skpm/skpm.module.css": { ".note": "note" },
  "src/ui/limit-note.module.css": { ".note": "warningNote" },
  "src/ui/tabbed-head.module.css": { ".note": "note" },
};

/**
 * Boxes the check leaves alone, by file, because they are not notes but
 * show facts or numbers, a choice, or the result of reading a file: the
 * facts of a period, an activity, a request or a meeting, a sum, the
 * outcome of an evaluation, and the switch, drop area and result of a
 * file upload.
 */
const LEFT_ALONE: Record<string, string[]> = {
  "src/features/academic-periods/periods.module.css": [".item"],
  "src/features/activities/activities.module.css": [".facts"],
  "src/features/activities/clarifications.module.css": [".flowLine"],
  "src/features/character-grades/character-grades.module.css": [".weightBox"],
  "src/features/curriculum/curriculum.module.css": [".stageIndicators"],
  "src/features/dorm/violations.module.css": [".next"],
  "src/features/mentor-groups/mentor-groups.module.css": [
    ".facts, .outcome",
    ".warned",
  ],
  "src/features/mentoring/mentoring.module.css": [".rubric"],
  "src/features/siku/siku.module.css": [".sum"],
  "src/ui/file-upload.module.css": [
    ".modes",
    ".drop",
    ".fileResult",
    ".fileWarn",
  ],
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

function notesOf(): [string, string, string][] {
  return Object.entries(NOTES).flatMap(([path, notes]) =>
    Object.entries(notes).map(([selector, look]): [string, string, string] => [
      path,
      selector,
      look,
    ]),
  );
}

describe("noteCopies", () => {
  it.each([
    [
      ".note { border: var(--line-width) solid var(--line); background: var(--surface2); }",
    ],
    [
      ".box { padding: var(--space-sm); border: var(--line-width) solid var(--line); background: var(--surface2); }",
    ],
    [".warnNote { border-color: var(--warn); }"],
    [".warning { border: var(--line-width) solid var(--warn); }"],
    [
      '.note { composes: note from "../../ui/data-screen.module.css"; padding: 0; }',
    ],
    [
      '.warn { composes: warningNote from "../ui/data-screen.module.css"; color: var(--ink); }',
    ],
  ])("finds a note look of its own in %s", (stylesheet) => {
    expect(noteCopies(stylesheet)).toHaveLength(1);
  });

  it.each([
    [
      '.note { composes: note from "../../ui/data-screen.module.css"; margin: 0; }',
    ],
    ['.warnNote { composes: warningNote from "./data-screen.module.css"; }'],
    [".note { margin: 0; color: var(--muted); font-size: var(--text-md); }"],
    [".countNote { flex: 1 1 var(--box-min-width); }"],
    [
      ".chip { border: var(--line-width) solid var(--line); background: var(--surface); }",
    ],
    [
      ".chosen { border: var(--line-width) solid var(--navy); background: var(--surface2); }",
    ],
    ["/* .note { border: var(--line-width) solid var(--warn); } */"],
  ])("leaves %s alone", (stylesheet) => {
    expect(noteCopies(stylesheet)).toEqual([]);
  });
});

describe("the shared note", () => {
  const note = sharedRule(".note, .warningNote");
  const warning = sharedRule(".warningNote");

  it("takes the shared inner space, text, colour and line", () => {
    expect(note.get("padding")).toBe("var(--note-padding)");
    expect(note.get("font-size")).toBe("var(--note-text)");
    expect(note.get("color")).toBe("var(--note-ink)");
    expect(note.get("border")).toBe(
      "var(--note-line) solid var(--note-line-colour)",
    );
  });

  it("is a muted box that breaks long words, so it never pushes a phone screen sideways", () => {
    expect(note.get("background")).toBe("var(--surface2)");
    expect(note.get("border-radius")).toBe("var(--radius-md)");
    expect(note.get("overflow-wrap")).toBe("anywhere");
  });

  it("sets no space around it, which each screen keeps for itself", () => {
    expect(note.has("margin")).toBe(false);
  });

  it("is the same box with the warning line for a warning note", () => {
    expect([...warning.keys()]).toEqual(["border-color"]);
    expect(warning.get("border-color")).toBe("var(--note-warning-line-colour)");
  });
});

describe("the notes of every screen", () => {
  it.each(notesOf())(
    "%s takes the shared look for %s: %s",
    (path, selector, look) => {
      const rule = rulesOf(readFileSync(path, "utf8")).find(
        (found) => found.selector === selector,
      );

      expect(rule?.declarations.get("composes")).toMatch(
        new RegExp(`^${look} from ${SHARED_PATH}$`),
      );
    },
  );

  it.each(screenStylesheets())("%s draws no note of its own", (path) => {
    const copies = noteCopies(readFileSync(path, "utf8"));

    expect(copies).toEqual(LEFT_ALONE[path] ?? []);
  });
});

describe("Belum diumumkan on Asrama › Kegiatan", () => {
  it("shows in the warning note until the count is announced", () => {
    const form = readFileSync("src/features/dorm/count-form.tsx", "utf8");
    const panel = readFileSync("src/features/dorm/count-panel.tsx", "utf8");

    expect(form).toContain(
      "className={state.isAnnounced ? styles.note : styles.warnNote}",
    );
    expect(panel).toContain("<p className={styles.warnNote}>");
  });
});
