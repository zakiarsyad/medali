import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { statusBadgeCopies } from "./badge-copies";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_LOOK_FILES = [
  "src/ui/data-screen.module.css",
  "src/ui/tokens.css",
];

/** Rules that colour a box that is not a badge, such as a note, by file. */
const NOT_BADGES: Record<string, string[]> = {
  "src/features/dorm/leave.module.css": [".warning"],
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
  ])("finds a badge colour of its own in %s", (stylesheet) => {
    expect(statusBadgeCopies(stylesheet)).toEqual([".a"]);
  });

  it.each([
    [".a { color: var(--bad); }"],
    [".a { border: var(--line-width) solid var(--warn); color: var(--ink); }"],
    [".a { background: var(--bad); color: var(--surface); }"],
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

      expect(copies).toEqual(NOT_BADGES[path] ?? []);
    },
  );
});
