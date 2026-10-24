import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { statusBadgeCopies } from "./badge-copies";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_LOOK_FILES = [
  "src/ui/data-screen.module.css",
  "src/ui/tokens.css",
];

/**
 * Rules the check leaves alone, by file: a note box that is not a badge,
 * and the "Penuh" chip of a room on Kamar, which is not a `.badge` and has
 * a look of its own.
 */
const LEFT_ALONE: Record<string, string[]> = {
  "src/features/dorm/leave.module.css": [".warning"],
  "src/features/dorm/rooms.module.css": [".full"],
};

function screenStylesheets(): string[] {
  return sourceFilesEndingWith(".css").filter(
    (path) => !SHARED_LOOK_FILES.includes(path),
  );
}

describe("statusBadgeCopies", () => {
  it.each([
    [".a { border-color: var(--ok); color: var(--ok); }"],
    [".a { border: var(--line-width) solid var(--warn); color: var(--warn); }"],
    [".a { border: var(--line-width) solid var(--bad); color: var(--bad); }"],
    [".a { color: var(--category-colour); }"],
    [".a { background: var(--bad); color: var(--surface); }"],
  ])("finds a badge colour of its own in %s", (stylesheet) => {
    expect(statusBadgeCopies(stylesheet)).toEqual([".a"]);
  });

  it("finds the text colours of a badge whose border takes the colour of its text", () => {
    const stylesheet = `
      .status { border: var(--line-width) solid currentColor; }
      .active { color: var(--ok); }
      .onLeave { color: var(--warn); }
    `;

    expect(statusBadgeCopies(stylesheet)).toEqual([".active", ".onLeave"]);
  });

  it.each([
    [".a { color: var(--bad); }"],
    [".a { border: var(--line-width) solid var(--warn); color: var(--ink); }"],
    [".a { background: var(--bad); }"],
    ["/* .a { border-color: var(--ok); color: var(--ok); } */"],
  ])("leaves %s alone", (stylesheet) => {
    expect(statusBadgeCopies(stylesheet)).toEqual([]);
  });
});

describe("screen styles", () => {
  const stylesheets = screenStylesheets();

  it("has style files to check", () => {
    expect(stylesheets.length).toBeGreaterThan(0);
  });

  it.each(stylesheets)(
    "%s leaves the status colours of a badge to the shared look",
    (path) => {
      const copies = statusBadgeCopies(readFileSync(path, "utf8"));

      expect(copies).toEqual(LEFT_ALONE[path] ?? []);
    },
  );
});
