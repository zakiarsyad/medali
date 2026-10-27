import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FormState } from "./form-message";
import { SAVE_NOT_SENT } from "./save-not-sent";
import { sourceFilesEndingWith } from "./source-files";
import { keptWhenNotSent } from "./use-save-state";

const TYPED = new FormData();
TYPED.set("name", "Budi Santoso");

describe("a save that is sent", () => {
  it("gives what the server answered", async () => {
    const answer: FormState = { error: null, done: "Pengguna ditambahkan." };
    const save = keptWhenNotSent(
      async () => answer,
      () => {},
    );

    expect(await save({ error: null, done: null }, TYPED)).toBe(answer);
  });

  it("says under the button that it did not arrive, and keeps the rest of what the form holds", async () => {
    const lost = new TypeError("Failed to fetch");
    const rethrown: unknown[] = [];
    const save = keptWhenNotSent(
      async (): Promise<FormState & { picked: string }> => {
        throw lost;
      },
      (error) => rethrown.push(error),
    );

    const after = await save(
      { error: null, done: "Tersimpan.", picked: "2" },
      TYPED,
    );

    expect(rethrown).toEqual([lost]);
    expect(after).toEqual({ error: SAVE_NOT_SENT, done: null, picked: "2" });
    expect(SAVE_NOT_SENT).toBe(
      "Data tidak terkirim. Periksa koneksi internet, lalu coba lagi.",
    );
  });

  it("throws again what is no failure, such as a move to another page", async () => {
    const moved = new Error("NEXT_REDIRECT");
    const save = keptWhenNotSent(
      async (): Promise<FormState> => {
        throw moved;
      },
      (error) => {
        throw error;
      },
    );

    await expect(save({ error: null, done: null }, TYPED)).rejects.toBe(moved);
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
