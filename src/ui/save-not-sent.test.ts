import { readFileSync } from "node:fs";
import { forbidden, notFound, redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import {
  faultMessage,
  refusedSave,
  SAVE_FAILED,
  SAVE_NOT_SENT,
  sentOr,
} from "./save-not-sent";
import { sourceFilesEndingWith } from "./source-files";

// The app turns on "Akses ditolak"; the checks run without its settings.
vi.stubEnv("__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS", "true");

function thrownBy(run: () => void): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
}

describe("faultMessage", () => {
  it("says the data was not sent when the browser could not reach the server", () => {
    expect(faultMessage(new TypeError("Failed to fetch"))).toBe(SAVE_NOT_SENT);
  });

  it.each([
    [
      "a fault on the server",
      new Error("An error occurred in the Server Components render."),
    ],
    [
      "a save the server no longer knows",
      new Error('Server Action "abc" was not found on the server.'),
    ],
    ["something thrown that is no error", "gagal"],
  ])("says the data could not be saved after %s", (_kind, fault) => {
    expect(faultMessage(fault)).toBe(SAVE_FAILED);
    expect(SAVE_FAILED).toBe(
      "Data tidak dapat disimpan. Muat ulang halaman, lalu coba lagi.",
    );
  });

  it.each([
    ["a move to another page", () => redirect("/masuk")],
    ["not found", () => notFound()],
    ["Akses ditolak", () => forbidden()],
  ])("throws again %s", (_kind, run) => {
    const moved = thrownBy(run);

    expect(() => faultMessage(moved)).toThrow();
  });
});

describe("a save sent from the screen's own code", () => {
  it("gives what the server answered", async () => {
    const answer = { error: null, done: "Tersimpan." };

    expect(await sentOr(async () => answer, refusedSave)).toBe(answer);
  });

  it("gives the refused answer with the words of the fault", async () => {
    const answer = await sentOr(async () => {
      throw new TypeError("Failed to fetch");
    }, refusedSave);

    expect(answer).toEqual({ error: SAVE_NOT_SENT, done: null });
  });

  it("throws again a move to another page", async () => {
    const moved = thrownBy(() => redirect("/masuk"));

    await expect(
      sentOr(async () => {
        throw moved;
      }, refusedSave),
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
      "await sentOr(() => removeRowAction(id), refusedSave)",
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
