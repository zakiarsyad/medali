import { describe, expect, it } from "vitest";
import {
  DAY_IN_FUTURE,
  NO_DAY,
  NO_REASON,
  parseRequest,
  REPORT_TOO_LONG,
  REPORT_TOO_SHORT,
  type RequestDraft,
} from "./request-input";
import { NO_PHOTO, TOO_MANY_PHOTOS } from "./request-photo";

const TODAY = "2026-10-15";

const DRAFT: RequestDraft = {
  reason: "knowledge_sharing",
  day: "2026-10-14",
  report: "Mengisi sesi berbagi pengetahuan literasi keuangan.",
  photoCount: 1,
};

function refusal(draft: Partial<RequestDraft>) {
  return parseRequest({ ...DRAFT, ...draft }, TODAY);
}

describe("parseRequest", () => {
  it("takes a gain reason, a day up to today, a report of 20 characters or more and 1 to 3 photos", () => {
    expect(parseRequest(DRAFT, TODAY)).toEqual({
      ok: true,
      value: {
        reason: "knowledge_sharing",
        day: "2026-10-14",
        report: "Mengisi sesi berbagi pengetahuan literasi keuangan.",
      },
    });
    expect(refusal({ day: TODAY, photoCount: 3 }).ok).toBe(true);
  });

  it("takes an activity of any age", () => {
    expect(refusal({ day: "2001-01-01" }).ok).toBe(true);
  });

  it.each([
    ["no reason", { reason: "" }, NO_REASON],
    ["a loss reason", { reason: "student_violation" }, NO_REASON],
    ["an unknown reason", { reason: "lainnya" }, NO_REASON],
    ["no day", { day: "" }, NO_DAY],
    ["a day that is no day", { day: "2026-02-30" }, NO_DAY],
    ["a day after today", { day: "2026-10-16" }, DAY_IN_FUTURE],
    ["a report of 19 characters", { report: "a".repeat(19) }, REPORT_TOO_SHORT],
    [
      "a report that is 20 characters only with its spaces",
      { report: `  ${"a".repeat(19)}  ` },
      REPORT_TOO_SHORT,
    ],
    [
      "a report of 1,001 characters",
      { report: "a".repeat(1001) },
      REPORT_TOO_LONG,
    ],
    ["no photo", { photoCount: 0 }, NO_PHOTO],
    ["four photos", { photoCount: 4 }, TOO_MANY_PHOTOS],
  ])("refuses %s with its message", (_what, draft, error) => {
    expect(refusal(draft)).toEqual({ ok: false, error });
  });

  it("names the first thing missing, in the order of the form", () => {
    expect(refusal({ reason: "", day: "", report: "", photoCount: 0 })).toEqual(
      { ok: false, error: NO_REASON },
    );
    expect(refusal({ day: "", report: "", photoCount: 0 })).toEqual({
      ok: false,
      error: NO_DAY,
    });
    expect(refusal({ report: "", photoCount: 0 })).toEqual({
      ok: false,
      error: REPORT_TOO_SHORT,
    });
  });

  it("keeps the report without the spaces around it, and a report of 1,000 characters", () => {
    const parsed = refusal({ report: `  ${"a".repeat(1000)}\n` });

    expect(parsed.ok && parsed.value.report).toBe("a".repeat(1000));
  });

  it("counts an emoji as one letter, as the database does", () => {
    expect(refusal({ report: "Mengajar 🙏🙏🙏🙏🙏🙏" })).toEqual({
      ok: false,
      error: REPORT_TOO_SHORT,
    });
    expect(refusal({ report: "🙏".repeat(1000) }).ok).toBe(true);
    expect(refusal({ report: "🙏".repeat(1001) })).toEqual({
      ok: false,
      error: REPORT_TOO_LONG,
    });
  });

  it("leaves out a character the database cannot keep", () => {
    const parsed = refusal({ report: `${"a".repeat(20)}\u0000` });

    expect(parsed.ok && parsed.value.report).toBe("a".repeat(20));
  });
});
