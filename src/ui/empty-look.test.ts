import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rulesOf } from "./css-rules";
import { emptyCopies } from "./look-copies";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_STYLES = "src/ui/data-screen.module.css";
const SHARED_IMPORT = /import (\w+) from "[^"]*data-screen\.module\.css";/;
const EMPTY_LOOKS = new Set(["empty", "emptySection", "emptyCell"]);
const EMPTY_WORDS = String.raw`(?:Belum|Tidak) ada\b`;
const EMPTY_CONSTANT = new RegExp(
  String.raw`const ([A-Z_]+)\s*=\s*"${EMPTY_WORDS}[^"]*"`,
  "g",
);

/**
 * Lines that say "Belum ada" or "Tidak ada" the check leaves alone, by
 * file, because they are not a list or a section with nothing in it: the
 * hint inside a name picker while typing, a note or a warning, the
 * sign-in page, a choice in a list of choices, a line inside a number
 * card, the parts a grade still waits for, and a page that cannot be used
 * until a period runs.
 */
const LEFT_ALONE: Record<string, string[]> = {
  "src/app/(app)/page.tsx": [
    "Belum ada akun yang masuk. Masuk dengan akun kampus untuk membuka menu.",
  ],
  "src/features/accounts/student-search.tsx": [
    "Tidak ada mahasiswa aktif yang cocok. Mahasiswa yang sudah memegang",
  ],
  "src/features/activities/participant-field.tsx": [
    "Tidak ada kelas yang cocok.",
  ],
  "src/features/activities/record-student-field.tsx": ["NOBODY_FOUND"],
  "src/features/character-assessment/student-picker.tsx": ["NOBODY_FOUND"],
  "src/features/character-grades/student-grade-view.tsx": ["Belum ada:"],
  "src/features/counselling/consent-student-picker.tsx": ["NOBODY_FOUND"],
  "src/features/counselling/counsellor-sharing-panel.tsx": [
    "NO_SCREENING_OR_SESSION",
  ],
  "src/features/dashboard/grade-card.tsx": ["NO_GRADES"],
  "src/features/dashboard/mentee-progress-box.tsx": ["NO_RUNNING_PERIOD"],
  "src/features/dorm/mental-health-mark-fields.tsx": ["NO_MARK_WORDS"],
  "src/features/dorm/violation-form.tsx": ["NOBODY_FOUND"],
  "src/features/fitness/student-fitness-view.tsx": ["NO_NOTE_YET"],
  "src/features/guidance/note-form.tsx": ["NOBODY_FOUND", "NO_ACTIVE_NOTE"],
  "src/features/guidance/penalty-form.tsx": ["NOBODY_FOUND"],
  "src/features/mentor-groups/evaluation-panel.tsx": [
    "Belum ada periode akademik yang berjalan, sehingga evaluasi belum bisa",
  ],
  "src/features/mentor-groups/survey-results-view.tsx": ["Belum ada responden"],
  "src/features/mentoring/group-picker.tsx": [
    "Tidak ada kelompok yang cocok. Ketik kode kelompok atau nama pengasuh.",
  ],
  "src/features/mentoring/meetings-screen.tsx": [
    "Belum ada periode akademik yang berjalan, sehingga daftar hadir",
  ],
  "src/features/mentoring/mentee-picker.tsx": [
    "Tidak ada anak asuh aktif yang cocok. Hanya mahasiswa aktif dari",
  ],
  "src/features/mentoring/scores-screen.tsx": [
    "Belum ada periode akademik yang berjalan, sehingga nilai pengasuhan",
  ],
  "src/features/siku/siku-form.tsx": ["NOBODY_FOUND"],
};

/** The table cells with no value, by file, which take the empty cell look. */
const CELLS: Record<string, string[]> = {
  "src/features/counselling/referral-panel.tsx": ["NO_ACTIVE_SCHEDULE"],
  "src/features/counselling/shared-table.tsx": ["NOT_SCREENED"],
  "src/features/dorm/cleaning-schedule-board.tsx": ["Belum ada kamar bertugas"],
  "src/features/fitness/fitness-list-table.tsx": ["NOTE_MISSING", "NO_NOTE"],
  "src/features/skpm/skpm-list-table.tsx": ["NO_DATA"],
  "src/health-notes/sick-table.tsx": ["NOTE_MISSING"],
};

interface EmptyLine {
  /** The constant it shows, or its words up to the end of their line. */
  text: string;
  /** What its class is drawn from, such as "shared.empty", or "" for none. */
  className: string;
}

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

function codeFiles(): string[] {
  return [
    ...sourceFilesEndingWith(".ts"),
    ...sourceFilesEndingWith(".tsx"),
  ].filter((path) => !path.includes(".test."));
}

/** The names of the constants that hold a "Belum ada" or "Tidak ada" text. */
function emptyConstants(): string[] {
  return codeFiles().flatMap((path) =>
    [...readFileSync(path, "utf8").matchAll(EMPTY_CONSTANT)].map(
      ([, name = ""]) => name,
    ),
  );
}

/** Each element of a screen that shows an empty text as its first child. */
function emptyLinesOf(source: string, constants: string[]): EmptyLine[] {
  const element = new RegExp(
    String.raw`<\w+([^<>]*)>\s*(?:\{(${constants.join("|")})\}|(${EMPTY_WORDS}[^<{\n]*))`,
    "g",
  );
  return [...source.matchAll(element)].map(
    ([, attributes = "", constant, words]) => ({
      text: constant ?? words?.trim() ?? "",
      className: /className=\{([\w.]+)\}/.exec(attributes)?.[1] ?? "",
    }),
  );
}

/** The shared empty look a line takes, or "" for a look of its own. */
function sharedLookOf(line: EmptyLine, source: string): string {
  const shared = SHARED_IMPORT.exec(source)?.[1];
  const [from, look = ""] = line.className.split(".");
  if (from !== shared || !EMPTY_LOOKS.has(look)) return "";
  return look;
}

/** The empty texts of a screen that take the given shared look. */
function linesTaking(look: string, path: string, constants: string[]) {
  const source = readFileSync(path, "utf8");
  return emptyLinesOf(source, constants)
    .filter((line) => sharedLookOf(line, source) === look)
    .map((line) => line.text)
    .sort();
}

describe("emptyCopies", () => {
  it.each([
    [".empty { padding: var(--space-xl); color: var(--muted); }"],
    [".none { margin: 0; color: var(--muted); }"],
    [".rowsEmpty { text-align: center; }"],
    [
      '.none { composes: emptySection from "../../ui/data-screen.module.css"; font-size: var(--text-sm); }',
    ],
  ])("finds an empty look of its own in %s", (stylesheet) => {
    expect(emptyCopies(stylesheet)).toHaveLength(1);
  });

  it.each([
    [
      '.empty { composes: empty from "../../ui/data-screen.module.css"; margin: 0; }',
    ],
    [".sub { color: var(--muted); font-size: var(--text-md); }"],
    [".notes:empty { display: none; }"],
    ["/* .empty { color: var(--muted); } */"],
  ])("leaves %s alone", (stylesheet) => {
    expect(emptyCopies(stylesheet)).toEqual([]);
  });
});

describe("emptyLinesOf", () => {
  it("finds a text written out and a constant, with the class of each", () => {
    const source = [
      "<p className={shared.empty}>Belum ada catatan.</p>",
      "<li className={styles.quiet}>{NO_ROOMS}</li>",
      "<p>Tidak ada.</p>",
    ].join("\n");

    expect(emptyLinesOf(source, ["NO_ROOMS"])).toEqual([
      { text: "Belum ada catatan.", className: "shared.empty" },
      { text: "NO_ROOMS", className: "styles.quiet" },
      { text: "Tidak ada.", className: "" },
    ]);
  });

  it("leaves other lines alone", () => {
    const source = [
      "<p className={shared.empty}>{NO_ROOMS}</p>",
      "<p className={shared.detail}>Belum diasesmen</p>",
      "<p>Semua tugas sudah beres. Tidak ada yang menunggu.</p>",
    ].join("\n");

    expect(emptyLinesOf(source, [])).toEqual([]);
  });
});

describe("the shared empty looks", () => {
  it("draw a whole empty list centred and muted, with space around it", () => {
    const list = sharedRule(".empty");

    expect(Object.fromEntries(list)).toEqual({
      padding: "var(--empty-list-padding)",
      color: "var(--empty-list-ink)",
      "font-size": "var(--empty-list-text)",
      "text-align": "var(--empty-list-align)",
    });
  });

  it("draw one empty section small, muted and left-aligned", () => {
    const section = sharedRule(".emptySection");

    expect(Object.fromEntries(section)).toEqual({
      margin: "0",
      padding: "var(--empty-section-padding)",
      color: "var(--empty-section-ink)",
      "font-size": "var(--empty-section-text)",
      "text-align": "var(--empty-section-align)",
    });
  });

  it("mute a table cell with no value, at the size of the other cells", () => {
    const cell = sharedRule(".emptyCell");

    expect(Object.fromEntries(cell)).toEqual({
      color: "var(--empty-section-ink)",
    });
  });
});

describe("the empty texts of every screen", () => {
  const constants = emptyConstants();
  const screens = sourceFilesEndingWith(".tsx").filter(
    (path) => !path.includes(".test."),
  );

  it("finds the empty texts it checks", () => {
    expect(constants).toEqual(
      expect.arrayContaining(["NO_REQUESTS", "NO_REKAP", "EMPTY_LIST"]),
    );
  });

  it.each(screens)("%s shows each empty text in a shared look", (path) => {
    const leftAlone = [...(LEFT_ALONE[path] ?? [])].sort();

    expect(linesTaking("", path, constants)).toEqual(leftAlone);
  });

  it.each(screens)("%s mutes each table cell with no value", (path) => {
    const cells = [...(CELLS[path] ?? [])].sort();

    expect(linesTaking("emptyCell", path, constants)).toEqual(cells);
  });

  it.each(screenStylesheets())("%s draws no empty look of its own", (path) => {
    expect(emptyCopies(readFileSync(path, "utf8"))).toEqual([]);
  });
});

describe("the empty sections side by side", () => {
  it("take one look on Penilaian › SIKU for a student", () => {
    const breakdown = readFileSync(
      "src/features/siku/siku-breakdown.tsx",
      "utf8",
    );
    const requests = readFileSync(
      "src/features/siku/own-request-list.tsx",
      "utf8",
    );

    expect(breakdown).toContain(
      "<p className={shared.emptySection}>{NONE_YET[kind]}</p>",
    );
    expect(requests).toContain(
      "<p className={shared.emptySection}>{NO_REQUESTS}</p>",
    );
  });
});

describe("Predikat on Pengasuh › Survei", () => {
  it("is muted while a group has none, such as Belum ada responden", () => {
    const table = readFileSync(
      "src/features/mentor-groups/survey-results-table.tsx",
      "utf8",
    );

    expect(table).toContain(
      "<span className={shared.emptyCell}>{missingResultWords(result)}</span>",
    );
  });
});
