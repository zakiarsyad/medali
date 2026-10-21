import { describe, expect, it } from "vitest";
import {
  HANDLING_NOTE_LENGTH,
  HANDLING_NOTE_NEEDED,
  parseHandlingNote,
} from "./proposal-input";

describe("parseHandlingNote", () => {
  it("keeps a note without the spaces around it", () => {
    expect(parseHandlingNote("  Diteruskan ke Pembinaan.  ")).toEqual({
      ok: true,
      value: "Diteruskan ke Pembinaan.",
    });
  });

  it.each([[""], ["   "], [null], [42], [undefined]])(
    "refuses an empty note or what is no text: %s",
    (sent) => {
      expect(parseHandlingNote(sent)).toEqual({
        ok: false,
        error: HANDLING_NOTE_NEEDED,
      });
    },
  );

  it("refuses a note under 5 or over 1,000 letters", () => {
    for (const sent of ["Oke.", "a".repeat(1001)]) {
      expect(parseHandlingNote(sent)).toEqual({
        ok: false,
        error: HANDLING_NOTE_LENGTH,
      });
    }
    expect(parseHandlingNote("a".repeat(1000)).ok).toBe(true);
    expect(parseHandlingNote("Lanjut").ok).toBe(true);
  });
});
