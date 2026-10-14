import { describe, expect, it } from "vitest";
import type { MarkedParticipant } from "./announced-attendance";
import {
  type AcceptedClarification,
  attendanceWithClarifications,
  clarifiedNote,
  historyWithClarifications,
  tallyWithClarifications,
} from "./clarification-effect";
import type { HistoryEntry } from "./history";

function accepted(
  more: Partial<AcceptedClarification> = {},
): AcceptedClarification {
  return {
    key: "2026-10-13 a",
    studentId: "ani",
    isAbsent: true,
    acceptedAs: "present",
    reason: "sick",
    ...more,
  };
}

describe("clarifiedNote", () => {
  it("names the accepted reason before the note BAM wrote", () => {
    expect(clarifiedNote("", "sick")).toBe("Klarifikasi: Sakit");
    expect(clarifiedNote("Terlambat", "family_matter")).toBe(
      "Klarifikasi: Urusan keluarga mendesak · Terlambat",
    );
  });
});

describe("tallyWithClarifications", () => {
  it("makes an absence accepted as present count as Hadir", () => {
    expect(
      tallyWithClarifications(
        { present: 3, absent: 2 },
        [accepted()],
        new Set(),
      ),
    ).toEqual({ present: 4, absent: 1 });
  });

  it("leaves an absence accepted as leave out of the percentage, as Izin", () => {
    expect(
      tallyWithClarifications(
        { present: 3, absent: 2 },
        [accepted({ acceptedAs: "leave" })],
        new Set(),
      ),
    ).toEqual({ present: 3, absent: 1 });
  });

  it("takes the count as it is now: a mark BAM made Hadir since stays one Hadir", () => {
    expect(
      tallyWithClarifications(
        { present: 3, absent: 2 },
        [accepted({ isAbsent: false })],
        new Set(),
      ),
    ).toEqual({ present: 3, absent: 2 });
  });

  it("leaves a mark that approved leave covers to the leave", () => {
    expect(
      tallyWithClarifications(
        { present: 3, absent: 2 },
        [accepted()],
        new Set(["2026-10-13 a"]),
      ),
    ).toEqual({ present: 3, absent: 2 });
  });
});

describe("historyWithClarifications", () => {
  const entry: HistoryEntry = {
    activityId: "a",
    day: "2026-10-13",
    name: "Apel pagi uji",
    startTime: "05:30",
    status: "absent",
    note: "",
  };

  it("makes an accepted absence Hadir or Izin, with the reason in the note", () => {
    const present = new Map([["2026-10-13 a", accepted()]]);
    const leave = new Map([
      ["2026-10-13 a", accepted({ acceptedAs: "leave" })],
    ]);

    expect(historyWithClarifications([entry], present)).toEqual([
      { ...entry, status: "present", note: "Klarifikasi: Sakit" },
    ]);
    expect(historyWithClarifications([entry], leave)[0]?.status).toBe("leave");
  });

  it("leaves Izin of approved leave and what is not announced as they are", () => {
    const shown = new Map([["2026-10-13 a", accepted()]]);
    const onLeave = { ...entry, status: "leave" as const };
    const notAnnounced = { ...entry, status: "not_announced" as const };

    expect(historyWithClarifications([onLeave, notAnnounced], shown)).toEqual([
      onLeave,
      notAnnounced,
    ]);
  });
});

describe("attendanceWithClarifications", () => {
  const absentAni: MarkedParticipant = {
    studentId: "ani",
    name: "Ani",
    nim: "1",
    status: "absent",
    note: "",
  };
  const base = {
    announcedAt: new Date("2026-10-13T00:00:00Z"),
    announcedBy: "BAM Uji",
    present: 9,
    absent: 1,
    marked: [absentAni],
  };

  it("counts an absence accepted as present as Hadir, and lists it with the reason", () => {
    const shown = attendanceWithClarifications(
      base,
      [{ ...accepted(), name: "Ani", nim: "1", note: "" }],
      new Set(),
    );

    expect(shown).toMatchObject({ present: 10, absent: 0 });
    expect(shown.marked).toEqual([
      { ...absentAni, status: "present", note: "Klarifikasi: Sakit" },
    ]);
  });

  it("counts an absence accepted as leave as neither, and lists it as Izin", () => {
    const shown = attendanceWithClarifications(
      base,
      [
        {
          ...accepted({ acceptedAs: "leave" }),
          name: "Ani",
          nim: "1",
          note: "",
        },
      ],
      new Set(),
    );

    expect(shown).toMatchObject({ present: 9, absent: 0 });
    expect(shown.marked[0]?.status).toBe("leave");
  });

  it("leaves a participant whose approved leave covers the activity to the leave", () => {
    const shown = attendanceWithClarifications(
      base,
      [{ ...accepted(), name: "Ani", nim: "1", note: "" }],
      new Set(["ani"]),
    );

    expect(shown).toEqual(base);
  });
});
