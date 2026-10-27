import { readFileSync } from "node:fs";
import { redirect } from "next/navigation";
import { describe, expect, it } from "vitest";
import { NOT_SENT, SAVE_NOT_SENT, sentOr } from "./save-not-sent";
import { sourceFilesEndingWith } from "./source-files";

function thrownBy(run: () => void): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
}

describe("a save sent from the screen's own code", () => {
  it("gives what the server answered", async () => {
    const answer = { error: null, done: "Tersimpan." };

    expect(await sentOr(async () => answer, NOT_SENT)).toBe(answer);
  });

  it("gives the refused answer when it does not arrive", async () => {
    const answer = await sentOr(async () => {
      throw new TypeError("Failed to fetch");
    }, NOT_SENT);

    expect(answer).toEqual({ error: SAVE_NOT_SENT, done: null });
  });

  it("throws again a move to another page", async () => {
    const moved = thrownBy(() => redirect("/masuk"));

    await expect(
      sentOr(async () => {
        throw moved;
      }, NOT_SENT),
    ).rejects.toBe(moved);
  });
});

const ACTION_AWAITED = /await ([A-Za-z]\w*Action)\(([^)]*)/g;

/**
 * What only reads, such as a search, the detail of a row, or the preview of
 * a picked file. A read that does not arrive loses nothing typed.
 */
const READ =
  /^(read|open|lookUp|preview|search|scheduleCount|scheduleSession|describe|groupMembers|groupPicks|noteStudentBox|penaltyHistory)/;

/** The save inside a form's `useSaveState`, which gives it its first argument. */
const KEPT_BY_SAVE_STATE = /^before\b/;

/** A part that turns a send that did not arrive into its own refusal. */
const HANDLES_ITS_OWN = /\bcatch\b/;

function unwrappedSaves(code: string): string[] {
  if (HANDLES_ITS_OWN.test(code)) return [];
  const found: string[] = [];
  for (const [, name = "", args = ""] of code.matchAll(ACTION_AWAITED)) {
    if (READ.test(name) || KEPT_BY_SAVE_STATE.test(args)) continue;
    found.push(name);
  }
  return found;
}

describe("unwrappedSaves", () => {
  it("finds a save awaited straight from the server", () => {
    expect(unwrappedSaves("const after = await removeRowAction(id);")).toEqual([
      "removeRowAction",
    ]);
  });

  it.each([
    [
      "sent through sentOr",
      "await sentOr(() => removeRowAction(id), NOT_SENT)",
    ],
    ["kept by useSaveState", "const after = await addRowAction(before, form);"],
    ["a read", "setOpened(await openRowDetailAction(id));"],
  ])("finds none %s", (_kind, code) => {
    expect(unwrappedSaves(code)).toEqual([]);
  });
});

describe("every part of a screen that saves", () => {
  const parts = [
    ...sourceFilesEndingWith(".tsx"),
    ...sourceFilesEndingWith(".ts"),
  ].filter((path) => !/\.test\.tsx?$/.test(path));

  it("has parts to check", () => {
    expect(parts).toContain("src/features/dorm/cancel-leave-button.tsx");
  });

  it.each(
    parts.filter((path) => readFileSync(path, "utf8").includes('"use client"')),
  )("%s keeps its values when a save does not arrive", (path) => {
    expect(unwrappedSaves(readFileSync(path, "utf8"))).toEqual([]);
  });
});
