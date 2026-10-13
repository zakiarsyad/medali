import { describe, expect, it } from "vitest";
import {
  activityNote,
  levelNote,
  removalQuestion,
  ticksOfValues,
  toggled,
  versionOf,
  wordsOf,
} from "./ppks-activities";

describe("wordsOf", () => {
  it("gives the words of the PPKS activities of a semester", () => {
    expect(wordsOf(3)).toEqual({
      heading: "Program kegiatan PPKS semester 3",
      addButton: "Tambah kegiatan PPKS",
      newTitle: "Kegiatan PPKS semester 3",
      empty: "Belum ada kegiatan PPKS untuk semester ini.",
    });
  });

  it("gives the words of the special and additional activities when there is no semester", () => {
    expect(wordsOf(null)).toEqual({
      heading: "Kegiatan khusus dan tambahan",
      addButton: "Tambah kegiatan khusus",
      newTitle: "Kegiatan khusus atau tambahan",
      empty: "Belum ada kegiatan khusus atau tambahan.",
    });
  });
});

describe("levelNote", () => {
  it("marks the indicator level of the semester", () => {
    expect(levelNote(2, 3)).toBe(" (level semester ini)");
    expect(levelNote(2, 4)).toBe(" (level semester ini)");
  });

  it("marks no other level", () => {
    expect(levelNote(1, 3)).toBe("");
    expect(levelNote(3, 4)).toBe("");
  });

  it.each([1, 2, 3, 4])(
    "marks no level %s when there is no semester",
    (level) => {
      expect(levelNote(level, null)).toBe("");
    },
  );
});

describe("versionOf", () => {
  it("differs for two moments one millisecond apart", () => {
    const first = versionOf(new Date("2026-10-13T08:00:00.000Z"));
    const next = versionOf(new Date("2026-10-13T08:00:00.001Z"));
    expect(first).not.toBe(next);
  });

  it("is the same for the same moment", () => {
    const moment = "2026-10-13T08:00:00.000Z";
    expect(versionOf(new Date(moment))).toBe(versionOf(new Date(moment)));
  });
});

describe("activityNote", () => {
  it("gives the description alone for a required activity", () => {
    expect(activityNote("Latihan uji.", true)).toBe("Latihan uji.");
  });

  it("adds tidak wajib for an activity that is not required", () => {
    expect(activityNote("Latihan uji.", false)).toBe(
      "Latihan uji. · tidak wajib",
    );
  });

  it("gives only tidak wajib when there is no description", () => {
    expect(activityNote("", false)).toBe("tidak wajib");
  });

  it("gives nothing for a required activity with no description", () => {
    expect(activityNote("", true)).toBe("");
  });
});

describe("removalQuestion", () => {
  it("asks about the activity by its name", () => {
    expect(removalQuestion("Latihan uji")).toBe(
      'Hapus kegiatan "Latihan uji" dari daftar?',
    );
  });
});

describe("toggled", () => {
  it("puts in what is not in the list", () => {
    expect(toggled(["M"], "D")).toEqual(["M", "D"]);
  });

  it("takes out what is in the list", () => {
    expect(toggled(["M", "D"], "M")).toEqual(["D"]);
  });
});

describe("ticksOfValues", () => {
  it("drops the ticks of a nilai that is no longer chosen", () => {
    expect(ticksOfValues(["M1", "D2", "M4"], ["D"])).toEqual(["D2"]);
  });

  it("keeps every tick while its nilai stays chosen", () => {
    expect(ticksOfValues(["M1", "D2"], ["M", "D", "I"])).toEqual(["M1", "D2"]);
  });
});
