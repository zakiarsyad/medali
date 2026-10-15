import { describe, expect, it } from "vitest";
import {
  ANNOUNCED_BEFORE_DAY,
  ANNOUNCEMENT_MISSING,
  ANNOUNCEMENT_TOO_FAR,
  DAY_IN_FUTURE,
  NEEDS_OTHER_PUNISHMENT,
  NEEDS_PUNISHMENT,
  NEEDS_REASON,
  NEEDS_ROWS,
  NEEDS_STUDENT,
  NO_DAY,
  NOT_FOR_YOURSELF,
  OTHER_PUNISHMENT_TOO_LONG,
  parseViolationRow,
  parseViolations,
  REASON_TOO_LONG,
  type SentViolationRow,
  TOO_MANY_ROWS,
} from "./violation-input";

const STUDENT = "00000000-0000-4000-8000-000000000001";
const OWN = "00000000-0000-4000-8000-000000000002";
// 10:00 on campus on 12 October 2026.
const NOW = new Date("2026-10-12T03:00:00Z");

function row(more: Partial<SentViolationRow> = {}): SentViolationRow {
  return {
    studentId: STUDENT,
    reason: "Terlambat apel pagi",
    punishment: "warning",
    otherPunishment: "",
    ...more,
  };
}

function sent(more = {}) {
  return {
    day: "2026-10-12",
    announceDay: "2026-10-12",
    announceTime: "21:00",
    rows: [row()],
    ...more,
  };
}

describe("parseViolationRow", () => {
  it("keeps a row with a student, a reason and a punishment, without spaces around the words", () => {
    expect(
      parseViolationRow(row({ reason: "  Keluar asrama tanpa izin " }), OWN),
    ).toEqual({
      ok: true,
      value: {
        studentId: STUDENT,
        reason: "Keluar asrama tanpa izin",
        punishment: "warning",
        otherPunishment: "",
      },
    });
  });

  it("refuses a row without a student, or with what is no student", () => {
    expect(parseViolationRow(row({ studentId: "" }), OWN)).toEqual({
      ok: false,
      error: NEEDS_STUDENT,
    });
    expect(parseViolationRow(row({ studentId: "x" }), OWN)).toEqual({
      ok: false,
      error: NEEDS_STUDENT,
    });
  });

  it("refuses a reason under 3 letters, not counting spaces around it", () => {
    expect(parseViolationRow(row({ reason: " ab  " }), OWN)).toEqual({
      ok: false,
      error: NEEDS_REASON,
    });
    expect(parseViolationRow(row({ reason: "abc" }), OWN).ok).toBe(true);
  });

  it("refuses a reason over 200 letters", () => {
    expect(parseViolationRow(row({ reason: "a".repeat(201) }), OWN)).toEqual({
      ok: false,
      error: REASON_TOO_LONG,
    });
  });

  it("refuses a punishment that is not in the list", () => {
    expect(parseViolationRow(row({ punishment: "fine" }), OWN)).toEqual({
      ok: false,
      error: NEEDS_PUNISHMENT,
    });
  });

  it("refuses an empty Hukuman lainnya, and one over 100 letters", () => {
    const other = { punishment: "other" };
    expect(
      parseViolationRow(row({ ...other, otherPunishment: "  " }), OWN),
    ).toEqual({ ok: false, error: NEEDS_OTHER_PUNISHMENT });
    expect(
      parseViolationRow(
        row({ ...other, otherPunishment: "a".repeat(101) }),
        OWN,
      ),
    ).toEqual({ ok: false, error: OTHER_PUNISHMENT_TOO_LONG });
    expect(
      parseViolationRow(
        row({ ...other, otherPunishment: " Menyapu aula " }),
        OWN,
      ),
    ).toMatchObject({ ok: true, value: { otherPunishment: "Menyapu aula" } });
  });

  it("drops the words of Hukuman lainnya for any other punishment", () => {
    expect(
      parseViolationRow(row({ otherPunishment: "Menyapu aula" }), OWN),
    ).toMatchObject({ ok: true, value: { otherPunishment: "" } });
  });

  it("refuses a row for the one who records it", () => {
    expect(parseViolationRow(row({ studentId: OWN }), OWN)).toEqual({
      ok: false,
      error: NOT_FOR_YOURSELF,
    });
    expect(parseViolationRow(row({ studentId: OWN }), null).ok).toBe(true);
  });
});

describe("parseViolations", () => {
  it("keeps the day, the announcement moment on campus and the rows", () => {
    expect(parseViolations(sent(), NOW, OWN)).toEqual({
      ok: true,
      value: {
        day: "2026-10-12",
        announcedAt: new Date("2026-10-12T14:00:00Z"),
        rows: [
          {
            studentId: STUDENT,
            reason: "Terlambat apel pagi",
            punishment: "warning",
            otherPunishment: "",
          },
        ],
      },
    });
  });

  it("refuses a violation day that is missing or after today", () => {
    expect(parseViolations(sent({ day: "" }), NOW, OWN)).toEqual({
      ok: false,
      error: NO_DAY,
    });
    expect(
      parseViolations(
        sent({ day: "2026-10-13", announceDay: "2026-10-13" }),
        NOW,
        OWN,
      ),
    ).toEqual({ ok: false, error: DAY_IN_FUTURE });
  });

  it("refuses an announcement day or hour that is missing", () => {
    for (const more of [{ announceDay: "" }, { announceTime: "25:00" }]) {
      expect(parseViolations(sent(more), NOW, OWN)).toEqual({
        ok: false,
        error: ANNOUNCEMENT_MISSING,
      });
    }
  });

  it("refuses an announcement before the violation day", () => {
    expect(
      parseViolations(
        sent({ day: "2026-10-11", announceDay: "2026-10-10" }),
        NOW,
        OWN,
      ),
    ).toEqual({ ok: false, error: ANNOUNCED_BEFORE_DAY });
  });

  it("takes an announcement hour that has passed as the moment of the save", () => {
    const parsed = parseViolations(
      sent({ day: "2026-10-11", announceDay: "2026-10-11" }),
      NOW,
      OWN,
    );

    expect(parsed).toMatchObject({ ok: true, value: { announcedAt: NOW } });
  });

  it("refuses an announcement more than 7 days after today", () => {
    expect(
      parseViolations(sent({ announceDay: "2026-10-20" }), NOW, OWN),
    ).toEqual({ ok: false, error: ANNOUNCEMENT_TOO_FAR });
    expect(
      parseViolations(sent({ announceDay: "2026-10-19" }), NOW, OWN).ok,
    ).toBe(true);
  });

  it("refuses a list that is empty or longer than 50 rows", () => {
    expect(parseViolations(sent({ rows: [] }), NOW, OWN)).toEqual({
      ok: false,
      error: NEEDS_ROWS,
    });
    const many = Array.from({ length: 51 }, () => row());
    expect(parseViolations(sent({ rows: many }), NOW, OWN)).toEqual({
      ok: false,
      error: TOO_MANY_ROWS,
    });
  });

  it("refuses the whole list when one row is refused", () => {
    const rows = [row(), row({ studentId: OWN })];
    expect(parseViolations(sent({ rows }), NOW, OWN)).toEqual({
      ok: false,
      error: NOT_FOR_YOURSELF,
    });
  });
});
