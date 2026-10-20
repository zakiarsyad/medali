import { describe, expect, it } from "vitest";
import {
  DAY_IN_FUTURE,
  DAY_IN_NO_PERIOD,
  DESCRIPTION_TOO_LONG,
  NEEDS_DESCRIPTION,
  NEEDS_OTHER_PUNISHMENT,
  NEEDS_PUNISHMENT,
  NEEDS_STUDENT,
  NO_DAY,
  OTHER_PUNISHMENT_TOO_LONG,
  parseNote,
  REMARK_TOO_LONG,
  type SentNote,
} from "./note-input";

const STUDENT = "6f1c2a52-3c3e-4a43-9a43-6c5b0c1f7a10";
const TODAY = "2026-10-20";
const PERIODS = [{ startsOn: "2026-08-01" }, { startsOn: "2026-02-01" }];

function sent(more: Partial<SentNote> = {}): SentNote {
  return {
    studentId: STUDENT,
    day: TODAY,
    description: "Terlambat mengikuti apel pagi",
    punishment: "warning",
    otherPunishment: "",
    remark: "",
    ...more,
  };
}

function refused(error: string) {
  return { ok: false, error };
}

describe("parseNote", () => {
  it("keeps a note with nothing wrong, its texts without spaces around them", () => {
    expect(
      parseNote(
        sent({
          description: "  Membuat kegaduhan di ruang belajar ",
          remark: " Sudah diingatkan. ",
        }),
        TODAY,
        PERIODS,
      ),
    ).toEqual({
      ok: true,
      value: {
        studentId: STUDENT,
        day: TODAY,
        description: "Membuat kegaduhan di ruang belajar",
        punishment: "warning",
        otherPunishment: "",
        remark: "Sudah diingatkan.",
      },
    });
  });

  it("keeps Hukuman lainnya with what it is, and drops that text for any other punishment", () => {
    const other = parseNote(
      sent({ punishment: "other", otherPunishment: " Menyapu halaman " }),
      TODAY,
      PERIODS,
    );
    expect(other.ok && other.value.otherPunishment).toBe("Menyapu halaman");
    const warning = parseNote(
      sent({ otherPunishment: "Menyapu halaman" }),
      TODAY,
      PERIODS,
    );
    expect(warning.ok && warning.value.otherPunishment).toBe("");
  });

  it.each([
    ["no student", sent({ studentId: "" }), NEEDS_STUDENT],
    ["no Tanggal", sent({ day: "" }), NO_DAY],
    ["a Tanggal that is no day", sent({ day: "2026-02-30" }), NO_DAY],
    ["a Tanggal in the future", sent({ day: "2026-10-21" }), DAY_IN_FUTURE],
    [
      "a Tanggal before every academic period",
      sent({ day: "2026-01-31" }),
      DAY_IN_NO_PERIOD,
    ],
    [
      "an Uraian under 5 letters",
      sent({ description: "  Tela  " }),
      NEEDS_DESCRIPTION,
    ],
    [
      "an Uraian over 300 characters",
      sent({ description: "a".repeat(301) }),
      DESCRIPTION_TOO_LONG,
    ],
    [
      "a punishment off the list",
      sent({ punishment: "tks" }),
      NEEDS_PUNISHMENT,
    ],
    [
      "Hukuman lainnya with no text",
      sent({ punishment: "other", otherPunishment: "  " }),
      NEEDS_OTHER_PUNISHMENT,
    ],
    [
      "Hukuman lainnya over 100 characters",
      sent({ punishment: "other", otherPunishment: "a".repeat(101) }),
      OTHER_PUNISHMENT_TOO_LONG,
    ],
    [
      "a Keterangan over 500 characters",
      sent({ remark: "a".repeat(501) }),
      REMARK_TOO_LONG,
    ],
  ])("refuses %s", (_, note, error) => {
    expect(parseNote(note, TODAY, PERIODS)).toEqual(refused(error));
  });

  it("refuses every Tanggal while no academic period is stored", () => {
    expect(parseNote(sent(), TODAY, [])).toEqual(refused(DAY_IN_NO_PERIOD));
  });
});
