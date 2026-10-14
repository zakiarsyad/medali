import { describe, expect, it } from "vitest";
import {
  ALREADY_BACK,
  ITMK_NOT_RECORDED,
  LEAVE_NOT_APPROVED,
  LEAVE_NOT_STARTED,
  NEEDS_NO_REPORT,
  RECORD_NOT_APPROVED,
  REPORT_STILL_WAITS,
  RETURN_BEFORE_START,
  RETURN_IN_FUTURE,
  RETURN_RECORDED_FIRST,
  reportNotOpen,
} from "./return-messages";
import {
  isOut,
  type LatestReport,
  lateMinutes,
  ownReturnOf,
  type ReturningLeave,
  recordFault,
  reportFault,
  reportOpensAt,
  timelinessOf,
} from "./return-rules";

/** A time on campus, such as 2026-10-14T16:00, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

const OUTING: ReturningLeave & { returnedAt: Date | null } = {
  kind: "outing",
  status: "approved",
  startsAt: on("2026-10-14T09:00"),
  endsAt: on("2026-10-14T16:00"),
  returnedAt: null,
};

function report(more: Partial<LatestReport> = {}): LatestReport {
  return {
    status: "waiting",
    sentAt: on("2026-10-14T15:50"),
    rejectionNote: "",
    ...more,
  };
}

describe("reportOpensAt", () => {
  it("opens 30 minutes before the return time", () => {
    expect(reportOpensAt(OUTING)).toEqual(on("2026-10-14T15:30"));
  });

  it("never opens before the leave starts", () => {
    const short = {
      startsAt: on("2026-10-14T15:45"),
      endsAt: on("2026-10-14T16:00"),
    };

    expect(reportOpensAt(short)).toEqual(on("2026-10-14T15:45"));
  });
});

const ON_TIME = { late: false, words: "Tepat waktu" };

describe("lateMinutes and timelinessOf", () => {
  it("counts a return at or before the return time as on time", () => {
    expect(lateMinutes(on("2026-10-14T16:00"), OUTING.endsAt)).toBe(0);
    expect(timelinessOf(on("2026-10-14T15:10"), OUTING.endsAt)).toEqual(
      ON_TIME,
    );
  });

  it("counts the minutes after it, a part of a minute as a whole one", () => {
    const tenSecondsLate = new Date(OUTING.endsAt.getTime() + 10_000);

    expect(lateMinutes(tenSecondsLate, OUTING.endsAt)).toBe(1);
    expect(timelinessOf(on("2026-10-14T16:25"), OUTING.endsAt)).toEqual({
      late: true,
      words: "Terlambat 25 menit",
    });
  });
});

describe("reportFault", () => {
  it("lets a report of approved Izin pesiar or Izin khusus through once it opens, also late", () => {
    for (const now of ["2026-10-14T15:30", "2026-10-15T08:00"]) {
      expect(reportFault(OUTING, on(now))).toBeNull();
      expect(reportFault({ ...OUTING, kind: "special" }, on(now))).toBeNull();
    }
  });

  it("refuses a report before it opens, saying when it opens", () => {
    expect(reportFault(OUTING, on("2026-10-14T15:29"))).toEqual(
      reportNotOpen("14 Okt 2026, 15.30"),
    );
  });

  it("refuses a report of ITMK, of leave that is Selesai, and of leave that is not approved", () => {
    const now = on("2026-10-14T16:00");

    expect(reportFault({ ...OUTING, kind: "skip_activities" }, now)).toEqual(
      NEEDS_NO_REPORT,
    );
    expect(reportFault({ ...OUTING, status: "completed" }, now)).toEqual(
      ALREADY_BACK,
    );
    for (const status of ["submitted", "rejected", "cancelled"] as const) {
      expect(reportFault({ ...OUTING, status }, now)).toEqual(
        LEAVE_NOT_APPROVED,
      );
    }
  });
});

describe("isOut", () => {
  it("counts approved Izin pesiar or Izin khusus that has started and has no return or report", () => {
    expect(isOut(OUTING, false, on("2026-10-14T09:00"))).toBe(true);
    expect(isOut(OUTING, false, on("2026-10-15T09:00"))).toBe(true);
    expect(
      isOut({ ...OUTING, kind: "special" }, false, on("2026-10-14T12:00")),
    ).toBe(true);
  });

  it("does not count leave before its start, with a report that waits, ITMK, or leave that is not approved", () => {
    const now = on("2026-10-14T12:00");

    expect(isOut(OUTING, false, on("2026-10-14T08:59"))).toBe(false);
    expect(isOut(OUTING, true, now)).toBe(false);
    expect(isOut({ ...OUTING, kind: "skip_activities" }, false, now)).toBe(
      false,
    );
    for (const status of ["completed", "submitted", "cancelled"] as const) {
      expect(isOut({ ...OUTING, status }, false, now)).toBe(false);
    }
  });
});

describe("recordFault", () => {
  const NOW = on("2026-10-14T16:30");

  it("lets a return between the start and now through, late or early", () => {
    for (const at of [
      "2026-10-14T09:00",
      "2026-10-14T12:00",
      "2026-10-14T16:30",
    ]) {
      expect(recordFault(OUTING, false, on(at), NOW)).toBeNull();
    }
  });

  it("refuses a time in the future or before the departure", () => {
    expect(recordFault(OUTING, false, on("2026-10-14T16:31"), NOW)).toEqual(
      RETURN_IN_FUTURE,
    );
    expect(recordFault(OUTING, false, on("2026-10-14T08:59"), NOW)).toEqual(
      RETURN_BEFORE_START,
    );
  });

  it("refuses leave that is not out: back already, with a report that waits, not started, or not approved", () => {
    const at = on("2026-10-14T16:00");

    expect(
      recordFault({ ...OUTING, status: "completed" }, false, at, NOW),
    ).toEqual(RETURN_RECORDED_FIRST);
    expect(recordFault(OUTING, true, at, NOW)).toEqual(REPORT_STILL_WAITS);
    expect(recordFault(OUTING, false, at, on("2026-10-14T08:00"))).toEqual(
      LEAVE_NOT_STARTED,
    );
    expect(
      recordFault({ ...OUTING, status: "rejected" }, false, at, NOW),
    ).toEqual(RECORD_NOT_APPROVED);
    expect(
      recordFault({ ...OUTING, kind: "skip_activities" }, false, at, NOW),
    ).toEqual(ITMK_NOT_RECORDED);
  });
});

describe("ownReturnOf", () => {
  it("says when the report opens, before that", () => {
    expect(ownReturnOf(OUTING, null, on("2026-10-14T15:29"))).toEqual({
      kind: "opens",
      at: "14 Okt 2026, 15.30",
    });
  });

  it("offers the report from 30 minutes before the return time, also long after it", () => {
    for (const now of ["2026-10-14T15:30", "2026-10-15T08:00"]) {
      expect(ownReturnOf(OUTING, null, on(now))).toEqual({
        kind: "open",
        rejectionNote: null,
      });
    }
  });

  it("shows a report that waits with how late it was sent", () => {
    const sent = report({ sentAt: on("2026-10-14T16:12") });

    expect(ownReturnOf(OUTING, sent, on("2026-10-14T16:20"))).toEqual({
      kind: "sent",
      status: "waiting",
      sentAt: "14 Okt 2026, 16.12",
      timeliness: { late: true, words: "Terlambat 12 menit" },
    });
    expect(
      ownReturnOf(
        OUTING,
        { ...sent, status: "verified" },
        on("2026-10-14T17:00"),
      ).kind,
    ).toBe("sent");
  });

  it("offers a new report after a rejection, with its note", () => {
    const rejected = report({
      status: "rejected",
      rejectionNote: "Foto buram.",
    });

    expect(ownReturnOf(OUTING, rejected, on("2026-10-14T16:00"))).toEqual({
      kind: "open",
      rejectionNote: "Foto buram.",
    });
  });

  it("shows the actual return of leave that is Selesai", () => {
    const back = {
      ...OUTING,
      status: "completed" as const,
      returnedAt: on("2026-10-14T15:55"),
    };

    expect(ownReturnOf(back, null, on("2026-10-15T08:00"))).toEqual({
      kind: "back",
      returnedAt: "14 Okt 2026, 15.55",
      timeliness: ON_TIME,
    });
  });

  it("asks no report for ITMK, nor for leave that is not approved", () => {
    const now = on("2026-10-14T16:00");

    expect(
      ownReturnOf({ ...OUTING, kind: "skip_activities" }, null, now),
    ).toEqual({ kind: "none" });
    for (const status of ["submitted", "rejected", "cancelled"] as const) {
      expect(ownReturnOf({ ...OUTING, status }, null, now)).toEqual({
        kind: "none",
      });
    }
  });
});
