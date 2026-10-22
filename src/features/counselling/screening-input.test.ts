import { describe, expect, it } from "vitest";
import {
  DATE_MISSING,
  FUTURE_DATE,
  NOTE_TOO_LONG,
  PICK_STUDENT,
  scoreOutOfRange,
  UNKNOWN_INSTRUMENT,
} from "@/mental-health/screening-words";
import {
  checkScores,
  checkScreening,
  type SentScreening,
} from "./screening-input";

const TODAY = "2026-10-16";
const STUDENT = "00000000-0000-4000-8000-000000000001";

const DASS: SentScreening = {
  studentId: STUDENT,
  screenedOn: TODAY,
  instrument: "dass21",
  depression: "6",
  anxiety: "3",
  stress: "8",
  srqYes: "",
  selfHarm: false,
  note: "  Cemas menjelang ujian.  ",
};

const SRQ: SentScreening = {
  ...DASS,
  instrument: "srq20",
  depression: "",
  anxiety: "",
  stress: "",
  srqYes: "7",
};

describe("a sent screening", () => {
  it("keeps a DASS-21 with its sums, its level and the trimmed note", () => {
    expect(checkScreening(DASS, TODAY)).toEqual({
      ok: true,
      value: {
        studentId: STUDENT,
        screenedOn: TODAY,
        scores: {
          instrument: "dass21",
          depression: 6,
          anxiety: 3,
          stress: 8,
          selfHarm: false,
        },
        note: "Cemas menjelang ujian.",
      },
    });
  });

  it("keeps an SRQ-20 with its number of ya, and leaves out the DASS-21 sums", () => {
    const checked = checkScreening(
      { ...SRQ, depression: "99", selfHarm: true },
      TODAY,
    );
    expect(checked).toMatchObject({
      ok: true,
      value: { scores: { instrument: "srq20", srqYes: 7, selfHarm: true } },
    });
  });

  it("takes a date before today", () => {
    expect(
      checkScreening({ ...DASS, screenedOn: "2026-09-01" }, TODAY).ok,
    ).toBe(true);
  });

  it.each([
    ["no student", { studentId: "" }, PICK_STUDENT],
    ["a student id that is not one", { studentId: "bukan-id" }, PICK_STUDENT],
    ["no date", { screenedOn: "" }, DATE_MISSING],
    ["a date that does not exist", { screenedOn: "2026-02-30" }, DATE_MISSING],
    ["a date after today", { screenedOn: "2026-10-17" }, FUTURE_DATE],
    ["an unknown instrument", { instrument: "phq9" }, UNKNOWN_INSTRUMENT],
    [
      "a Depresi sum over 21",
      { depression: "22" },
      scoreOutOfRange("Depresi", 21),
    ],
    [
      "a Kecemasan sum under 0",
      { anxiety: "-1" },
      scoreOutOfRange("Kecemasan", 21),
    ],
    [
      "a Stres sum with a fraction",
      { stress: "2.5" },
      scoreOutOfRange("Stres", 21),
    ],
    [
      "an empty Depresi sum",
      { depression: "" },
      scoreOutOfRange("Depresi", 21),
    ],
    ["a note over 1000 characters", { note: "a".repeat(1001) }, NOTE_TOO_LONG],
  ] as const)("refuses %s, saying why", (_, wrong, error) => {
    expect(checkScreening({ ...DASS, ...wrong }, TODAY)).toEqual({
      ok: false,
      error,
    });
  });

  it.each(["21", "-1", "", "x"])("refuses an SRQ-20 of %s", (srqYes) => {
    expect(checkScreening({ ...SRQ, srqYes }, TODAY)).toEqual({
      ok: false,
      error: scoreOutOfRange('Jumlah jawaban "ya" SRQ-20', 20),
    });
  });

  it("refuses what is not text at all, as only a hand-made request sends", () => {
    const sent = { ...DASS, depression: 6 } as unknown as SentScreening;
    expect(checkScreening(sent, TODAY).ok).toBe(false);
  });
});

describe("the scores as they are typed", () => {
  it("give the scores once each one is in range", () => {
    expect(checkScores(DASS)).toMatchObject({
      ok: true,
      value: { instrument: "dass21", depression: 6 },
    });
    expect(checkScores({ ...DASS, stress: "30" }).ok).toBe(false);
  });
});
