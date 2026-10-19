import { describe, expect, it } from "vitest";
import { checkRegistration, checkStudentDay } from "./schedule-rules";
import {
  PICK_FROM_LIST,
  PICK_FROM_TOMORROW,
  STORY_TOO_LONG,
  TICK_CONSENT,
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
