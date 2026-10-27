import { readFileSync } from "node:fs";
import { forbidden, redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import type { FormState } from "./form-message";
import { SAVE_FAILED, SAVE_NOT_SENT } from "./save-not-sent";
import { sourceFilesEndingWith } from "./source-files";
import { keptWhenNotSent } from "./use-save-state";

const TYPED = new FormData();
TYPED.set("name", "Budi Santoso");

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

function throwing(fault: unknown) {
  return keptWhenNotSent(async (): Promise<FormState & { picked: string }> => {
    throw fault;
  });
}

describe("a save that is sent", () => {
  it("gives what the server answered", async () => {
    const answer: FormState = { error: null, done: "Pengguna ditambahkan." };
    const save = keptWhenNotSent(async () => answer);

    expect(await save({ error: null, done: null }, TYPED)).toBe(answer);
  });

  it("says under the button that it did not arrive, and keeps the rest of what the form holds", async () => {
    const save = throwing(new TypeError("Failed to fetch"));

    const after = await save(
      { error: null, done: "Tersimpan.", picked: "2" },
      TYPED,
    );

    expect(after).toEqual({ error: SAVE_NOT_SENT, done: null, picked: "2" });
  });

  it("says it could not be saved when the server failed, and keeps the rest", async () => {
    const save = throwing(new Error("Server Action not found"));

    const after = await save({ error: null, done: null, picked: "2" }, TYPED);

    expect(after).toEqual({ error: SAVE_FAILED, done: null, picked: "2" });
  });

  it.each([
    ["a move to another page", () => redirect("/masuk")],
    ["Akses ditolak", () => forbidden()],
  ])("throws again %s", async (_kind, run) => {
    const moved = thrownBy(run);

    await expect(
      throwing(moved)({ error: null, done: null, picked: "" }, TYPED),
    ).rejects.toBe(moved);
  });
});

describe("every form that saves through the server", () => {
  const screens = sourceFilesEndingWith(".tsx").filter(
    (path) => !path.endsWith(".test.tsx"),
  );

  it("has forms to check", () => {
    expect(screens).toContain("src/features/accounts/add-account-form.tsx");
  });

  it.each(screens)(
    "%s keeps its typed values when the save does not arrive",
    (path) => {
      expect(readFileSync(path, "utf8")).not.toContain("useActionState");
    },
  );
});

/**
 * Forms that hand their save to the browser as `action`. The browser puts
 * such a form back on its first values whenever the save runs, also when
 * it is refused, so only a form with nothing to lose may, or one that
 * keeps what was typed itself.
 */
const SENT_BY_THE_BROWSER: Record<string, string> = {
  "src/auth/sign-in-button.tsx": "A button with no field.",
  "src/features/accounts/hand-over-head-button.tsx": "Only a hidden field.",
  "src/features/accounts/remove-account-button.tsx": "Only hidden fields.",
  "src/features/accounts/remove-bam-button.tsx": "Only a hidden field.",
  "src/features/dorm/room-button.tsx": "Only a hidden field.",
  "src/features/mentor-groups/cancel-replacement-button.tsx":
    "Only a hidden field.",
  "src/features/proof-files/remove-old-button.tsx": "A button with no field.",
  "src/features/students/remove-student-button.tsx": "Only a hidden field.",
  "src/features/students/student-form.tsx":
    "Draws its fields anew from what it keeps after each send.",
  "src/features/curriculum/indicator-form.tsx":
    "Keeps every typed text in its own state.",
};

const HANDS_ACTION_TO_BROWSER = /<form[^>]*\saction=\{/;

describe("every form with a save state", () => {
  const forms = sourceFilesEndingWith(".tsx").filter((path) =>
    readFileSync(path, "utf8").includes("useSaveState("),
  );

  it("finds a form that hands its save to the browser", () => {
    expect(HANDS_ACTION_TO_BROWSER.test("<form\n  action={save}>")).toBe(true);
    expect(
      HANDS_ACTION_TO_BROWSER.test(
        "<form onSubmit={(event) => sendForm(event, save)}>",
      ),
    ).toBe(false);
  });

  it.each(forms.filter((path) => !(path in SENT_BY_THE_BROWSER)))(
    "%s sends from the screen's code, so a refused save keeps what was picked",
    (path) => {
      expect(readFileSync(path, "utf8")).not.toMatch(HANDS_ACTION_TO_BROWSER);
    },
  );

  it.each(Object.keys(SENT_BY_THE_BROWSER))("%s still exists", (path) => {
    expect(forms).toContain(path);
  });
});
