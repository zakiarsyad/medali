import { describe, expect, it } from "vitest";
import {
  DAY_IN_FUTURE,
  DAY_IN_NO_PERIOD,
  NEEDS_STUDENT,
  NO_DAY,
} from "./note-input";
import {
  DECISION_NUMBER_TOO_LONG,
  DESCRIPTION_TOO_SHORT,
  NEEDS_CONFIRMATION,
  NEEDS_JENJANG,
  NEEDS_OTHER_FORM,
  NEEDS_PLACE,
  NEEDS_SOCIAL_WORK_FORM,
  NEEDS_START,
  parsePenalty,
  type SentPenalty,
  START_BEFORE_DAY,
} from "./penalty-input";

const STUDENT = "00000000-0000-4000-8000-000000000701";
const TODAY = "2026-10-20";
const PERIODS = [{ startsOn: "2026-08-01" }];

function sent(more: Partial<SentPenalty> = {}): SentPenalty {
  return {
    studentId: STUDENT,
    day: "2026-10-12",
    description: "  Terlambat mengikuti apel pagi tiga kali.  ",
    category: "light",
    level: "1",
    decisionNumber: " KEP-01/UJI ",
    socialWorkForms: ["grounds"],
    socialWorkOther: "",
    socialWorkPlace: "campus",
    socialWorkStart: "2026-10-14",
    confirmed: false,
    ...more,
  };
}

function refusal(more: Partial<SentPenalty>): string | null {
  const parsed = parsePenalty(sent(more), TODAY, PERIODS);
  return parsed.ok ? null : parsed.error;
}

describe("parsePenalty", () => {
  it("keeps a Ringan pertama penalty as Dijatuhkan, with its kerja sosial ending 7 days on", () => {
    expect(parsePenalty(sent(), TODAY, PERIODS)).toEqual({
      ok: true,
      value: {
        studentId: STUDENT,
        day: "2026-10-12",
        description: "Terlambat mengikuti apel pagi tiga kali.",
        category: "light",
        level: 1,
        status: "imposed",
        decisionNumber: "KEP-01/UJI",
        socialWorkForms: ["grounds"],
        socialWorkOther: "",
        socialWorkPlace: "campus",
        socialWorkStartsOn: "2026-10-14",
        socialWorkEndsOn: "2026-10-20",
      },
    });
  });

  it("keeps each Bentuk once, in the order of the list, and the text of lainnya", () => {
    const parsed = parsePenalty(
      sent({
        socialWorkForms: ["other", "staff_help", "other"],
        socialWorkOther: " Menata arsip ",
      }),
      TODAY,
      PERIODS,
    );
    expect(parsed.ok && parsed.value.socialWorkForms).toEqual([
      "staff_help",
      "other",
    ]);
    expect(parsed.ok && parsed.value.socialWorkOther).toBe("Menata arsip");
  });

  it("leaves out the kerja sosial of a penalty that ends the status, and keeps it as Ditetapkan once ticked", () => {
    const parsed = parsePenalty(
      sent({ category: "heavy", level: "3", confirmed: true }),
      TODAY,
      PERIODS,
    );
    expect(parsed).toEqual({
      ok: true,
      value: expect.objectContaining({
        status: "set",
        socialWorkForms: [],
        socialWorkOther: "",
        socialWorkPlace: null,
        socialWorkStartsOn: null,
        socialWorkEndsOn: null,
      }),
    });
  });

  it("gives Berat jenjang pertama 8 months of kerja sosial", () => {
    const parsed = parsePenalty(
      sent({ category: "heavy", level: "1", socialWorkStart: "2026-10-15" }),
      TODAY,
      PERIODS,
    );
    expect(parsed.ok && parsed.value.socialWorkEndsOn).toBe("2027-06-14");
  });

  it.each([
    ["no student", { studentId: "" }, NEEDS_STUDENT],
    ["no Tanggal", { day: "" }, NO_DAY],
    ["a Tanggal after today", { day: "2026-10-21" }, DAY_IN_FUTURE],
    ["a Tanggal in no period", { day: "2026-07-31" }, DAY_IN_NO_PERIOD],
    [
      "an Uraian under 5 letters",
      { description: " Tela " },
      DESCRIPTION_TOO_SHORT,
    ],
    [
      "a Nomor keputusan too long",
      { decisionNumber: "a".repeat(101) },
      DECISION_NUMBER_TOO_LONG,
    ],
    ["a Kategori not on the list", { category: "parah" }, NEEDS_JENJANG],
    ["a Jenjang not on the list", { level: "4" }, NEEDS_JENJANG],
    ["no Bentuk", { socialWorkForms: [] }, NEEDS_SOCIAL_WORK_FORM],
    [
      "a Bentuk not on the list",
      { socialWorkForms: ["menyanyi"] },
      NEEDS_SOCIAL_WORK_FORM,
    ],
    ["lainnya with no text", { socialWorkForms: ["other"] }, NEEDS_OTHER_FORM],
    ["no Lokasi", { socialWorkPlace: "" }, NEEDS_PLACE],
    ["no Mulai", { socialWorkStart: "" }, NEEDS_START],
    [
      "a Mulai before the Tanggal",
      { socialWorkStart: "2026-10-11" },
      START_BEFORE_DAY,
    ],
    [
      "a penalty that ends the status without the tick",
      { category: "heavy", level: "2" },
      NEEDS_CONFIRMATION,
    ],
  ])("refuses %s", (_, more, error) => {
    expect(refusal(more)).toBe(error);
  });
});
