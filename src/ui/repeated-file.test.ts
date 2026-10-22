import { describe, expect, it } from "vitest";
import {
  repeatedFile,
  SAVE_AGAIN,
  saveAgainNote,
  savedBeforeNote,
} from "./repeated-file";

describe("the words of a file saved before", () => {
  it("warn with its day, and name the confirm", () => {
    const told = `Berkas dengan nama dan isi yang sama sudah disimpan pada 14 Okt 2026. Centang "${SAVE_AGAIN}", lalu simpan bila memang perlu.`;

    expect(SAVE_AGAIN).toBe("Tetap simpan berkas ini lagi");
    expect(savedBeforeNote("2026-10-14")).toBe(
      "Berkas dengan nama dan isi yang sama sudah disimpan pada 14 Okt 2026.",
    );
    expect(saveAgainNote("2026-10-14")).toBe(told);
    expect(repeatedFile("2026-10-14")).toEqual({ ok: false, error: told });
  });
});
