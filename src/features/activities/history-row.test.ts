import { describe, expect, it } from "vitest";
import { historyRowOf } from "./history-row";
import {
  TEST_SENT_PHOTO,
  TEST_STUDENT_SCHEDULE,
} from "./test-student-schedules";

/** Held on 13 October, with photos taken until the end of 14 October. */
const SCHEDULE = TEST_STUDENT_SCHEDULE;
const UPLOAD_OPEN = "2026-10-14";
const ABSENT = "2026-10-15";
const LAST_CLARIFICATION_DAY = "2026-10-21";

describe("historyRowOf", () => {
  it("shows a schedule that still takes a photo, with its last upload day and nothing to clarify", () => {
    expect(historyRowOf(SCHEDULE, UPLOAD_OPEN, null)).toEqual({
      id: SCHEDULE.id,
      days: "13 Okt 2026",
      name: "Latihan dasar kepemimpinan organisasi",
      isRequired: true,
      status: "not_sent",
      uploadUntil: "14 Okt 2026",
      note: "",
      clarification: { badge: null, note: "", action: null },
    });
  });

  it("offers a clarification once the student is absent, up to the seventh day after the last upload day", () => {
    const absent = historyRowOf(SCHEDULE, ABSENT, null);
    const lastDay = historyRowOf(SCHEDULE, LAST_CLARIFICATION_DAY, null);
    const after = historyRowOf(SCHEDULE, "2026-10-22", null);

    expect(absent).toMatchObject({ status: "absent", uploadUntil: null });
    expect(absent.clarification.action).toBe("ask");
    expect(lastDay.clarification.action).toBe("ask");
    expect(after.clarification.action).toBe("closed");
  });

  it("shows a rejected photo with its reason as Keterangan, and offers a clarification", () => {
    const rejected = {
      ...SCHEDULE,
      attendance: {
        ...TEST_SENT_PHOTO,
        status: "rejected",
        note: "Foto buram",
      },
    } as const;

    expect(historyRowOf(rejected, ABSENT, null)).toMatchObject({
      status: "rejected",
      note: "Foto buram",
      clarification: { badge: null, note: "", action: "ask" },
    });
  });

  it("shows the attendance an accepted clarification gave, with its Keterangan and the badge", () => {
    const accepted = {
      ...SCHEDULE,
      attendance: {
        status: "dispensation",
        note: "Klarifikasi: Sakit",
        sentAt: null,
      },
    } as const;
    const newest = { status: "accepted", note: "" } as const;

    expect(historyRowOf(accepted, ABSENT, newest)).toMatchObject({
      status: "dispensation",
      note: "Klarifikasi: Sakit",
      clarification: { badge: "accepted", note: "", action: null },
    });
  });

  it("shows a rejected clarification with its note, and a second try while the time is open", () => {
    const newest = {
      status: "rejected",
      note: "Surat tidak terbaca.",
    } as const;

    expect(historyRowOf(SCHEDULE, ABSENT, newest).clarification).toEqual({
      badge: "rejected",
      note: "Surat tidak terbaca.",
      action: "ask_again",
    });
  });
});
