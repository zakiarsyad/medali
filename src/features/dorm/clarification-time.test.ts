import { describe, expect, it } from "vitest";
import {
  type ClarificationCell,
  clarificationCell,
  clarificationDeadline,
  clarificationOpen,
  type ShownClarification,
  shownNote,
  takesClarification,
  waitingCount,
} from "./clarification-time";

/** A Wednesday; its clarification time ends on the Wednesday after. */
const DAY = "2026-10-14";

function newest(more: Partial<ShownClarification> = {}): ShownClarification {
  return {
    id: "00000000-0000-4000-8000-00000000c1a1",
    status: "submitted",
    note: "",
    fileName: "surat.pdf",
    ...more,
  };
}

describe("clarificationDeadline", () => {
  it("is the seventh day after the activity", () => {
    expect(clarificationDeadline(DAY)).toBe("2026-10-21");
    expect(clarificationDeadline("2026-12-28")).toBe("2027-01-04");
  });
});

describe("clarificationOpen", () => {
  it("is open from the activity's day to the end of the seventh day after it, on campus", () => {
    expect(clarificationOpen(DAY, DAY)).toBe(true);
    expect(clarificationOpen(DAY, "2026-10-21")).toBe(true);
  });

  it("is closed from the eighth day on", () => {
    expect(clarificationOpen(DAY, "2026-10-22")).toBe(false);
    expect(clarificationOpen(DAY, "2026-11-30")).toBe(false);
  });
});

describe("clarificationCell", () => {
  function cellOf(
    status: Parameters<typeof clarificationCell>[0]["status"],
    today: string,
    shown: ShownClarification | null,
  ): ClarificationCell {
    return clarificationCell({ status, day: DAY, today, newest: shown });
  }

  it("offers Ajukan klarifikasi for Tidak hadir within the seven days", () => {
    expect(cellOf("absent", "2026-10-21", null)).toEqual({
      badge: null,
      note: "",
      file: null,
      action: "ask",
    });
  });

  it("says Batas klarifikasi lewat for Tidak hadir after them", () => {
    expect(cellOf("absent", "2026-10-22", null).action).toBe("closed");
  });

  it.each(["present", "leave", "not_announced"] as const)(
    "offers nothing for %s",
    (status) => {
      expect(cellOf(status, DAY, null)).toEqual({
        badge: null,
        note: "",
        file: null,
        action: null,
      });
    },
  );

  it.each(["submitted", "verified", "accepted"] as const)(
    "shows a clarification that is %s with its file, and offers nothing more",
    (status) => {
      const shown = newest({ status });

      expect(cellOf("absent", DAY, shown)).toEqual({
        badge: status,
        note: "",
        file: { clarificationId: shown.id, name: "surat.pdf" },
        action: null,
      });
    },
  );

  it.each(["rejected", "closed"] as const)(
    "shows a clarification that is %s with its note, and offers Ajukan ulang while the absence stands and the time is open",
    (status) => {
      const shown = newest({ status, note: "Tidak ada surat klinik." });

      expect(cellOf("absent", "2026-10-21", shown)).toMatchObject({
        badge: status,
        note: "Tidak ada surat klinik.",
        action: "ask_again",
      });
      expect(cellOf("absent", "2026-10-22", shown).action).toBeNull();
      expect(cellOf("present", DAY, shown).action).toBeNull();
    },
  );

  it("names no file where none is kept", () => {
    expect(cellOf("absent", DAY, newest({ fileName: null })).file).toBeNull();
  });
});

describe("takesClarification", () => {
  it("is true only for a cell that offers to send one", () => {
    const cell = { badge: null, note: "", file: null };

    expect(takesClarification({ ...cell, action: "ask" })).toBe(true);
    expect(takesClarification({ ...cell, action: "ask_again" })).toBe(true);
    expect(takesClarification({ ...cell, action: "closed" })).toBe(false);
    expect(takesClarification({ ...cell, action: null })).toBe(false);
  });
});

describe("shownNote", () => {
  it("is the note of Pengelola Asrama when they rejected it, else the note of BAM", () => {
    expect(shownNote("rejected", "Layak.", "Surat tidak sah.")).toBe(
      "Surat tidak sah.",
    );
    expect(shownNote("rejected", "Tidak ada surat.", "")).toBe(
      "Tidak ada surat.",
    );
  });

  it("is the note of the closing for a closed one", () => {
    expect(shownNote("closed", "", "Ketidakhadiran dibatalkan.")).toBe(
      "Ketidakhadiran dibatalkan.",
    );
  });

  it.each(["submitted", "verified", "accepted"] as const)(
    "is empty for one that is %s",
    (status) => {
      expect(shownNote(status, "Dikonfirmasi.", "Sesuai.")).toBe("");
    },
  );
});

describe("waitingCount", () => {
  it("counts those that wait for BAM or for Pengelola Asrama", () => {
    expect(
      waitingCount([
        "submitted",
        "verified",
        "accepted",
        "rejected",
        "closed",
        "submitted",
      ]),
    ).toBe(3);
    expect(waitingCount([])).toBe(0);
  });
});
