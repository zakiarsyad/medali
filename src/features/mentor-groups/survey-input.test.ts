import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH } from "./evaluation-input";
import {
  ASK_FOR_DATES,
  ASK_FOR_END,
  ASK_FOR_PERIOD,
  ASK_FOR_WEIGHT,
  END_HAS_PASSED,
  ENDS_BEFORE_START,
  parseSurveyEnd,
  parseSurveyPeriod,
  type SentSurveyPeriod,
} from "./survey-input";

const TODAY = "2026-10-13";
const PERIOD_ID = "0b0b0b0b-1111-4222-8333-444444444444";

const SENT: SentSurveyPeriod = {
  periodId: PERIOD_ID,
  startsOn: "2026-10-13",
  endsOn: "2026-10-27",
  achievementWeight: "50",
  note: "",
};

function refusalOf(more: Partial<SentSurveyPeriod>): string | null {
  const parsed = parseSurveyPeriod({ ...SENT, ...more }, TODAY);
  return parsed.ok ? null : parsed.error;
}

describe("parseSurveyPeriod", () => {
  it("takes a period with both dates and a weight, and no note", () => {
    expect(parseSurveyPeriod(SENT, TODAY)).toEqual({
      ok: true,
      value: {
        periodId: PERIOD_ID,
        startsOn: "2026-10-13",
        endsOn: "2026-10-27",
        achievementWeight: 50,
        note: null,
      },
    });
  });

  it.each(["", "bukan-id"])("asks for the Periode when it is '%s'", (id) => {
    expect(refusalOf({ periodId: id })).toBe(ASK_FOR_PERIOD);
  });

  it.each(["", "2026-02-30", "13/10/2026"])(
    "asks for the dates when Tanggal dibuka is '%s'",
    (day) => {
      expect(refusalOf({ startsOn: day })).toBe(ASK_FOR_DATES);
    },
  );

  it.each(["", "2026-13-01", "besok"])(
    "asks for the dates when Tanggal ditutup is '%s'",
    (day) => {
      expect(refusalOf({ endsOn: day })).toBe(ASK_FOR_DATES);
    },
  );

  it("refuses a last day before the first day", () => {
    expect(refusalOf({ startsOn: "2026-10-20", endsOn: "2026-10-19" })).toBe(
      ENDS_BEFORE_START,
    );
  });

  it("refuses a last day that has passed, also when the first day is before it", () => {
    expect(refusalOf({ startsOn: "2026-10-01", endsOn: "2026-10-12" })).toBe(
      END_HAS_PASSED,
    );
  });

  it("takes a last day of today, and a period of one day", () => {
    expect(refusalOf({ startsOn: TODAY, endsOn: TODAY })).toBe(null);
  });

  it("takes a first day before today while the last day has not passed", () => {
    expect(refusalOf({ startsOn: "2026-10-01", endsOn: TODAY })).toBe(null);
  });

  it.each(["0000-01-01", "0000-12-31"])(
    "asks for the dates when Tanggal dibuka is %s, a year the database cannot keep",
    (day) => {
      expect(refusalOf({ startsOn: day })).toBe(ASK_FOR_DATES);
    },
  );

  it("takes a first day later than today", () => {
    expect(refusalOf({ startsOn: "2026-11-01", endsOn: "2026-11-15" })).toBe(
      null,
    );
  });

  it.each(["", "-1", "101", "50,5", "50.5", "lima puluh", "1000"])(
    "refuses the weight '%s'",
    (weight) => {
      expect(refusalOf({ achievementWeight: weight })).toBe(ASK_FOR_WEIGHT);
    },
  );

  it.each([
    ["0", 0],
    ["100", 100],
    [" 35 ", 35],
  ])("takes the weight '%s'", (typed, weight) => {
    const parsed = parseSurveyPeriod(
      { ...SENT, achievementWeight: typed },
      TODAY,
    );

    expect(parsed).toMatchObject({
      ok: true,
      value: { achievementWeight: weight },
    });
  });

  it("keeps a note without the room around it", () => {
    const parsed = parseSurveyPeriod(
      { ...SENT, note: "  Isi sebelum akhir bulan.  " },
      TODAY,
    );

    expect(parsed).toMatchObject({
      ok: true,
      value: { note: "Isi sebelum akhir bulan." },
    });
  });

  it("refuses a note longer than the field allows, and says how long it may be", () => {
    const refusal = refusalOf({ note: "a".repeat(NOTE_MAX_LENGTH + 1) });

    expect(refusal).toContain("Keterangan");
    expect(refusal).toContain("1.000");
  });

  it("takes a note as long as the field allows", () => {
    expect(refusalOf({ note: "a".repeat(NOTE_MAX_LENGTH) })).toBe(null);
  });

  it("says what is wrong with the dates before what is wrong with the weight", () => {
    expect(refusalOf({ endsOn: "", achievementWeight: "" })).toBe(
      ASK_FOR_DATES,
    );
  });
});

describe("parseSurveyEnd", () => {
  it("takes a real day", () => {
    expect(parseSurveyEnd("2026-10-31")).toEqual({
      ok: true,
      value: "2026-10-31",
    });
  });

  it.each(["", "2026-02-30", "31/10/2026", "besok"])(
    "asks for the date when it is '%s'",
    (sent) => {
      expect(parseSurveyEnd(sent)).toEqual({ ok: false, error: ASK_FOR_END });
    },
  );
});
