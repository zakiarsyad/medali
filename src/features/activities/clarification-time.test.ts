import { describe, expect, it } from "vitest";
import {
  CLARIFICATION_ACTION_WORDS,
  CLARIFICATION_BADGE_WORDS,
  CLARIFICATION_DAYS,
  clarificationCell,
  clarificationDeadline,
  clarificationTimeOpen,
  mayBeClarified,
  takesClarification,
} from "./clarification-time";

/** Held on 1 October, with photos taken until the end of 3 October. */
const SCHEDULE = {
  endsOn: "2026-10-01",
  uploadCount: 2,
  uploadUnit: "day",
} as const;
const LAST_UPLOAD_DAY = "2026-10-03";
const FIRST_ABSENT_DAY = "2026-10-04";
const LAST_CLARIFICATION_DAY = "2026-10-10";
const DAY_AFTER = "2026-10-11";

describe("clarificationDeadline", () => {
  it("is the seventh day after the last upload day", () => {
    expect(CLARIFICATION_DAYS).toBe(7);
    expect(clarificationDeadline(SCHEDULE)).toBe(LAST_CLARIFICATION_DAY);
  });

  it("counts from the last day itself when photos are taken only then", () => {
    expect(clarificationDeadline({ ...SCHEDULE, uploadCount: 0 })).toBe(
      "2026-10-08",
    );
  });

  it("counts an upload range in weeks", () => {
    const range = { ...SCHEDULE, uploadCount: 1, uploadUnit: "week" } as const;

    expect(clarificationDeadline(range)).toBe("2026-10-15");
  });

  it("crosses the end of a month and of a year", () => {
    const range = { ...SCHEDULE, endsOn: "2026-12-28", uploadCount: 0 };

    expect(clarificationDeadline(range)).toBe("2027-01-04");
  });
});

describe("clarificationTimeOpen", () => {
  it.each([
    ["while photos are still taken", LAST_UPLOAD_DAY],
    ["on the day after the last upload day", FIRST_ABSENT_DAY],
    ["on the seventh day after the last upload day", LAST_CLARIFICATION_DAY],
  ])("is open %s", (_when, today) => {
    expect(clarificationTimeOpen(SCHEDULE, today)).toBe(true);
  });

  it.each([
    ["on the eighth day", DAY_AFTER],
    ["a year later", "2027-10-04"],
  ])("is over %s", (_when, today) => {
    expect(clarificationTimeOpen(SCHEDULE, today)).toBe(false);
  });
});

describe("mayBeClarified", () => {
  it("is yes for a rejected photo, also while photos are still taken", () => {
    expect(mayBeClarified("rejected", SCHEDULE, LAST_UPLOAD_DAY)).toBe(true);
    expect(mayBeClarified("rejected", SCHEDULE, FIRST_ABSENT_DAY)).toBe(true);
  });

  it("is yes with nothing sent once the upload time has closed", () => {
    expect(mayBeClarified(null, SCHEDULE, FIRST_ABSENT_DAY)).toBe(true);
  });

  it("is no with nothing sent while a photo can still be sent", () => {
    expect(mayBeClarified(null, SCHEDULE, LAST_UPLOAD_DAY)).toBe(false);
  });

  it.each(["waiting", "valid", "dispensation"] as const)(
    "is no for an attendance that is %s",
    (status) => {
      expect(mayBeClarified(status, SCHEDULE, FIRST_ABSENT_DAY)).toBe(false);
    },
  );
});

describe("clarificationCell", () => {
  function cell(more: Partial<Parameters<typeof clarificationCell>[0]>) {
    return clarificationCell({
      attendance: null,
      schedule: SCHEDULE,
      today: FIRST_ABSENT_DAY,
      newest: null,
      ...more,
    });
  }
  const NOTHING = {
    badge: null,
    note: "",
    file: null,
    removed: null,
    action: null,
  };
  const FILE = {
    clarificationId: "00000000-0000-4000-8000-0000000000d1",
    name: "surat-keterangan.pdf",
  };

  it("offers to ask when the student was absent and the time is open", () => {
    expect(cell({})).toEqual({ ...NOTHING, action: "ask" });
  });

  it("offers to ask when the photo was rejected and the time is open", () => {
    expect(cell({ attendance: "rejected" })).toEqual({
      ...NOTHING,
      action: "ask",
    });
  });

  it("offers to ask up to the end of the seventh day, and says the time is over after it", () => {
    expect(cell({ today: LAST_CLARIFICATION_DAY }).action).toBe("ask");
    expect(cell({ today: DAY_AFTER })).toEqual({
      ...NOTHING,
      action: "closed",
    });
  });

  it.each(["waiting", "valid", "dispensation"] as const)(
    "shows nothing for an attendance that is %s and was never clarified",
    (attendance) => {
      expect(cell({ attendance })).toEqual(NOTHING);
      expect(cell({ attendance, today: DAY_AFTER })).toEqual(NOTHING);
    },
  );

  it("shows nothing while a photo can still be sent", () => {
    expect(cell({ today: LAST_UPLOAD_DAY })).toEqual(NOTHING);
  });

  it("shows a clarification that waits, with nothing to press", () => {
    const newest = {
      status: "submitted",
      note: "",
      file: null,
      removed: null,
    } as const;

    expect(cell({ newest })).toEqual({
      badge: "submitted",
      note: "",
      file: null,
      removed: null,
      action: null,
    });
  });

  it("shows an accepted clarification beside the attendance it gave", () => {
    const newest = {
      status: "accepted",
      note: "Surat sesuai.",
      file: null,
      removed: null,
    } as const;

    expect(cell({ attendance: "valid", newest })).toEqual({
      badge: "accepted",
      note: "",
      file: null,
      removed: null,
      action: null,
    });
    expect(cell({ attendance: "dispensation", newest }).badge).toBe("accepted");
  });

  it("shows a rejected clarification with its note, and offers to ask again while the time is open", () => {
    const newest = {
      status: "rejected",
      note: "Surat tidak terbaca.",
      file: null,
      removed: null,
    } as const;

    expect(cell({ newest })).toEqual({
      badge: "rejected",
      note: "Surat tidak terbaca.",
      file: null,
      removed: null,
      action: "ask_again",
    });
    expect(cell({ attendance: "rejected", newest }).action).toBe("ask_again");
  });

  it("offers no second try once the time is over: the rejection and its note stay", () => {
    const newest = {
      status: "rejected",
      note: "Surat tidak terbaca.",
      file: null,
      removed: null,
    } as const;

    expect(cell({ newest, today: DAY_AFTER })).toEqual({
      badge: "rejected",
      note: "Surat tidak terbaca.",
      file: null,
      removed: null,
      action: null,
    });
  });

  it("offers no second try when the attendance was given in the meantime", () => {
    const newest = {
      status: "rejected",
      note: "Surat tidak terbaca.",
      file: null,
      removed: null,
    } as const;

    expect(cell({ attendance: "valid", newest }).action).toBeNull();
    expect(cell({ attendance: "waiting", newest }).action).toBeNull();
  });

  it.each(["submitted", "accepted", "rejected"] as const)(
    "shows the file of a clarification that is %s, for the student to open",
    (status) => {
      const newest = { status, note: "", file: FILE, removed: null };

      expect(cell({ newest }).file).toEqual(FILE);
      expect(cell({ newest, today: DAY_AFTER }).file).toEqual(FILE);
    },
  );
});

describe("takesClarification", () => {
  const SHOWN = { badge: null, note: "", file: null, removed: null };

  it("is yes for a first and for a second try", () => {
    expect(takesClarification({ ...SHOWN, action: "ask" })).toBe(true);
    expect(takesClarification({ ...SHOWN, action: "ask_again" })).toBe(true);
  });

  it("is no once the time is over, and where there is nothing to press", () => {
    expect(takesClarification({ ...SHOWN, action: "closed" })).toBe(false);
    expect(takesClarification({ ...SHOWN, action: null })).toBe(false);
  });
});

describe("the words of the Klarifikasi cell", () => {
  it("are those of the prototype", () => {
    expect(CLARIFICATION_ACTION_WORDS).toEqual({
      ask: "Ajukan klarifikasi",
      ask_again: "Ajukan ulang",
      closed: "Batas klarifikasi lewat",
    });
    expect(CLARIFICATION_BADGE_WORDS).toEqual({
      submitted: "Klarifikasi diajukan",
      accepted: "Klarifikasi diterima",
      rejected: "Klarifikasi ditolak",
    });
  });
});
