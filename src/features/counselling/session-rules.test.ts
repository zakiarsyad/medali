import { describe, expect, it } from "vitest";
import {
  DAY_IN_FUTURE,
  NEXT_BEFORE_DAY,
  NOTES_EMPTY,
  NOTES_TOO_LONG,
  PICK_NEXT_DAY,
  PICK_SESSION_CHOICES,
  PICK_SESSION_DAY,
} from "@/mental-health/session-words";
import { checkSession, kindOfWay, type SentSession } from "./session-rules";

const TODAY = "2026-10-20";

const SENT: SentSession = {
  day: "2026-10-19",
  kind: "individual_online",
  topic: "family",
  notes: "  Catatan uji.  ",
  followUp: "next_session",
  nextDay: "2026-10-26",
};

describe("a session Konselor sends", () => {
  it("is kept with its notes trimmed", () => {
    expect(checkSession(SENT, TODAY)).toEqual({
      ok: true,
      value: {
        day: "2026-10-19",
        kind: "individual_online",
        topic: "family",
        notes: "Catatan uji.",
        followUp: "next_session",
        nextDay: "2026-10-26",
      },
    });
  });

  it("may be of today, with no next session", () => {
    const checked = checkSession({ ...SENT, day: TODAY, nextDay: "" }, TODAY);
    expect(checked).toMatchObject({
      ok: true,
      value: { day: TODAY, nextDay: null },
    });
  });

  it("may set the next session on its own day", () => {
    const checked = checkSession({ ...SENT, nextDay: SENT.day }, TODAY);
    expect(checked.ok).toBe(true);
  });

  it("is refused a day in the future", () => {
    expect(checkSession({ ...SENT, day: "2026-10-21" }, TODAY)).toEqual({
      ok: false,
      error: DAY_IN_FUTURE,
    });
  });

  it.each(["", "2026-02-30", "kemarin", 20261019])(
    "is refused a day that is not one: %s",
    (day) => {
      expect(checkSession({ ...SENT, day }, TODAY)).toEqual({
        ok: false,
        error: PICK_SESSION_DAY,
      });
    },
  );

  it("is refused a next session before its day", () => {
    expect(checkSession({ ...SENT, nextDay: "2026-10-18" }, TODAY)).toEqual({
      ok: false,
      error: NEXT_BEFORE_DAY,
    });
  });

  it("is refused a next session that is no day", () => {
    expect(checkSession({ ...SENT, nextDay: "besok" }, TODAY)).toEqual({
      ok: false,
      error: PICK_NEXT_DAY,
    });
  });

  it.each(["", "   ", null, undefined, 7])(
    "is refused empty notes: %s",
    (notes) => {
      expect(checkSession({ ...SENT, notes }, TODAY)).toEqual({
        ok: false,
        error: NOTES_EMPTY,
      });
    },
  );

  it("is refused notes longer than 5000 characters", () => {
    expect(checkSession({ ...SENT, notes: "a".repeat(5001) }, TODAY)).toEqual({
      ok: false,
      error: NOTES_TOO_LONG,
    });
  });

  it.each([
    { kind: "phone" },
    { topic: "school" },
    { followUp: "none" },
    { kind: undefined },
  ])("is refused a choice not on the lists: %o", (wrong) => {
    expect(checkSession({ ...SENT, ...wrong }, TODAY)).toEqual({
      ok: false,
      error: PICK_SESSION_CHOICES,
    });
  });
});

describe("the Jenis a session for a schedule starts with", () => {
  it("follows its Cara", () => {
    expect(kindOfWay("in_person")).toBe("individual_in_person");
    expect(kindOfWay("online")).toBe("individual_online");
  });
});
