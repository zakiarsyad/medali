import { describe, expect, it } from "vitest";
import {
  NOTE_NEEDED,
  NOTE_TOO_LONG,
  parseAppealDecision,
  UNKNOWN_DECISION,
} from "./appeal-decision";

describe("parseAppealDecision", () => {
  it("takes Terima with or without a note, without spaces around it", () => {
    expect(parseAppealDecision("accept", "")).toEqual({
      ok: true,
      value: { kind: "accept", note: "" },
    });
    expect(parseAppealDecision("accept", "  Izin tercatat.  ")).toEqual({
      ok: true,
      value: { kind: "accept", note: "Izin tercatat." },
    });
  });

  it("refuses Tolak without a note, also one of spaces only or no text", () => {
    for (const note of ["", "   ", undefined, 3]) {
      expect(parseAppealDecision("reject", note)).toEqual({
        ok: false,
        error: NOTE_NEEDED,
      });
    }
    expect(NOTE_NEEDED).toBe("Isi catatan alasan penolakan.");
    expect(parseAppealDecision("reject", "Tidak ada izin.")).toEqual({
      ok: true,
      value: { kind: "reject", note: "Tidak ada izin." },
    });
  });

  it("refuses a note over 500 letters, and a press it does not know", () => {
    expect(parseAppealDecision("accept", "a".repeat(501))).toEqual({
      ok: false,
      error: NOTE_TOO_LONG,
    });
    expect(parseAppealDecision("approve", "Catatan")).toEqual({
      ok: false,
      error: UNKNOWN_DECISION,
    });
  });
});
