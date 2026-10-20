import { describe, expect, it } from "vitest";
import {
  checkAnotherTime,
  checkProposal,
  checkRegistration,
  checkStudentDay,
  hasDayCome,
  hasPassed,
  scheduleAfter,
} from "./schedule-rules";
import {
  NOTE_TOO_LONG,
  PICK_FROM_LIST,
  PICK_FROM_TOMORROW,
  PICK_WEEKDAY,
  STORY_TOO_LONG,
  TICK_CONSENT,
  TIME_PASSED,
  WEEKDAYS_ONLY,
} from "./schedule-words";

// Selasa 20 October 2026 on campus.
const TODAY = "2026-10-20";

const SENT = {
  topic: "family",
  day: "2026-10-21",
  hour: "10:00",
  way: "online",
  story: "  Cerita singkat.  ",
  consented: true,
};

describe("checkRegistration", () => {
  it("takes a Senin to Jumat from tomorrow with the tick, and keeps the story trimmed", () => {
    expect(checkRegistration(SENT, TODAY)).toEqual({
      ok: true,
      value: {
        topic: "family",
        day: "2026-10-21",
        hour: "10:00",
        way: "online",
        story: "Cerita singkat.",
      },
    });
  });

  it("keeps no story when none was told", () => {
    const checked = checkRegistration({ ...SENT, story: "   " }, TODAY);
    expect(checked).toMatchObject({ ok: true, value: { story: null } });
  });

  it.each(["2026-10-20", "2026-10-19", "", "2026-02-30", 7])(
    "refuses the day %s as before tomorrow",
    (day) => {
      expect(checkRegistration({ ...SENT, day }, TODAY)).toEqual({
        ok: false,
        error: PICK_FROM_TOMORROW,
      });
    },
  );

  it.each(["2026-10-24", "2026-10-25"])("refuses %s, a weekend", (day) => {
    expect(checkRegistration({ ...SENT, day }, TODAY)).toEqual({
      ok: false,
      error: WEEKDAYS_ONLY,
    });
  });

  it.each([false, "yes", undefined])(
    "refuses a registration without the tick: %s",
    (consented) => {
      expect(checkRegistration({ ...SENT, consented }, TODAY)).toEqual({
        ok: false,
        error: TICK_CONSENT,
      });
    },
  );

  it("checks the day before the tick, as the prototype does", () => {
    const sent = { ...SENT, day: "2026-10-24", consented: false };
    expect(checkRegistration(sent, TODAY)).toMatchObject({
      error: WEEKDAYS_ONLY,
    });
  });

  it.each([
    { topic: "sport" },
    { hour: "09:00" },
    { way: "phone" },
    { topic: null },
  ])("refuses a choice that is not on the list: %o", (wrong) => {
    expect(checkRegistration({ ...SENT, ...wrong }, TODAY)).toEqual({
      ok: false,
      error: PICK_FROM_LIST,
    });
  });

  it("refuses a story longer than 1000 characters", () => {
    const sent = { ...SENT, story: "a".repeat(1001) };
    expect(checkRegistration(sent, TODAY)).toEqual({
      ok: false,
      error: STORY_TOO_LONG,
    });
    const longest = { ...SENT, story: "a".repeat(1000) };
    expect(checkRegistration(longest, TODAY).ok).toBe(true);
  });
});

describe("checkStudentDay", () => {
  it("takes a weekday from tomorrow", () => {
    expect(checkStudentDay("2026-10-23", TODAY)).toEqual({
      ok: true,
      value: "2026-10-23",
    });
  });

  it("refuses today and a weekend", () => {
    expect(checkStudentDay(TODAY, TODAY)).toMatchObject({
      error: PICK_FROM_TOMORROW,
    });
    expect(checkStudentDay("2026-10-31", TODAY)).toMatchObject({
      error: WEEKDAYS_ONLY,
    });
  });
});

describe("scheduleAfter", () => {
  it("lets Konselor approve or propose another time for a Diajukan request", () => {
    expect(scheduleAfter("approve", "submitted")).toBe("scheduled");
    expect(scheduleAfter("propose", "submitted")).toBe("proposed");
  });

  it("lets the student accept a proposal or ask for another time", () => {
    expect(scheduleAfter("accept", "proposed")).toBe("scheduled");
    expect(scheduleAfter("ask_another", "proposed")).toBe("submitted");
  });

  it("lets the student ask for another time for a Dijadwalkan session: back to Diajukan", () => {
    expect(scheduleAfter("ask_another", "scheduled")).toBe("submitted");
  });

  it.each(["submitted", "proposed", "scheduled"] as const)(
    "lets the student cancel a request that is %s",
    (current) => {
      expect(scheduleAfter("cancel", current)).toBe("cancelled");
    },
  );

  it("lets Konselor move a Dijadwalkan session, or mark it Selesai or Tidak hadir", () => {
    expect(scheduleAfter("reschedule", "scheduled")).toBe("scheduled");
    expect(scheduleAfter("mark_done", "scheduled")).toBe("done");
    expect(scheduleAfter("mark_missed", "scheduled")).toBe("missed");
  });

  it.each(["done", "missed", "cancelled"] as const)(
    "refuses every move from %s",
    (current) => {
      for (const move of [
        "approve",
        "propose",
        "accept",
        "ask_another",
        "cancel",
        "reschedule",
        "mark_done",
        "mark_missed",
      ] as const) {
        expect(scheduleAfter(move, current)).toBeNull();
      }
    },
  );

  it.each([
    ["approve", "proposed"],
    ["approve", "scheduled"],
    ["propose", "proposed"],
    ["propose", "scheduled"],
    ["accept", "submitted"],
    ["accept", "scheduled"],
    ["ask_another", "submitted"],
    ["reschedule", "submitted"],
    ["reschedule", "proposed"],
    ["mark_done", "submitted"],
    ["mark_done", "proposed"],
    ["mark_missed", "submitted"],
    ["mark_missed", "proposed"],
  ] as const)("refuses %s from %s", (move, current) => {
    expect(scheduleAfter(move, current)).toBeNull();
  });
});

describe("hasDayCome", () => {
  it("is true on the day of a session and after it", () => {
    expect(hasDayCome("2026-10-20", TODAY)).toBe(true);
    expect(hasDayCome("2026-10-19", TODAY)).toBe(true);
  });

  it("is false before the day of a session", () => {
    expect(hasDayCome("2026-10-21", TODAY)).toBe(false);
  });
});

describe("hasPassed", () => {
  // 10:00 on campus on Selasa 20 October 2026.
  const NOW = new Date("2026-10-20T03:00:00Z");

  it("is true for a time today that has begun, and for an earlier day", () => {
    expect(hasPassed("2026-10-20", "08:30", NOW)).toBe(true);
    expect(hasPassed("2026-10-20", "10:00", NOW)).toBe(true);
    expect(hasPassed("2026-10-19", "14:30", NOW)).toBe(true);
  });

  it("is false for a later time today and for a later day", () => {
    expect(hasPassed("2026-10-20", "13:00", NOW)).toBe(false);
    expect(hasPassed("2026-10-21", "08:30", NOW)).toBe(false);
  });
});

describe("checkProposal", () => {
  // 10:00 on campus on Selasa 20 October 2026.
  const NOW = new Date("2026-10-20T03:00:00Z");
  const SENT = {
    day: "2026-10-20",
    hour: "13:00",
    way: "online",
    message: "  Pesan uji.  ",
  };

  it("takes a coming time on Senin to Jumat, also later today, with the message trimmed", () => {
    expect(checkProposal(SENT, NOW)).toEqual({
      ok: true,
      value: {
        day: "2026-10-20",
        hour: "13:00",
        way: "online",
        message: "Pesan uji.",
      },
    });
  });

  it("refuses a weekend, a time already passed, and a choice not on the list", () => {
    expect(checkProposal({ ...SENT, day: "2026-10-24" }, NOW)).toEqual({
      ok: false,
      error: PICK_WEEKDAY,
    });
    expect(checkProposal({ ...SENT, hour: "08:30" }, NOW)).toEqual({
      ok: false,
      error: TIME_PASSED,
    });
    expect(checkProposal({ ...SENT, way: "phone" }, NOW)).toEqual({
      ok: false,
      error: PICK_FROM_LIST,
    });
    expect(checkProposal({ ...SENT, day: "kemarin" }, NOW)).toEqual({
      ok: false,
      error: PICK_WEEKDAY,
    });
  });

  it("refuses a message longer than 500 characters", () => {
    const sent = { ...SENT, message: "a".repeat(501) };
    expect(checkProposal(sent, NOW)).toEqual({
      ok: false,
      error: NOTE_TOO_LONG,
    });
  });
});

describe("checkAnotherTime", () => {
  it("takes a weekday from tomorrow with an optional reason", () => {
    const sent = { day: "2026-10-22", hour: "08:30", reason: "" };
    expect(checkAnotherTime(sent, TODAY)).toEqual({
      ok: true,
      value: { day: "2026-10-22", hour: "08:30", reason: null },
    });
  });

  it("refuses today, a weekend and an hour not on the list", () => {
    const sent = { day: TODAY, hour: "08:30", reason: "Alasan uji." };
    expect(checkAnotherTime(sent, TODAY)).toMatchObject({
      error: PICK_FROM_TOMORROW,
    });
    expect(
      checkAnotherTime({ ...sent, day: "2026-10-25" }, TODAY),
    ).toMatchObject({ error: WEEKDAYS_ONLY });
    expect(
      checkAnotherTime({ ...sent, day: "2026-10-22", hour: "07:00" }, TODAY),
    ).toMatchObject({ error: PICK_FROM_LIST });
  });
});
