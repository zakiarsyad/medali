import { describe, expect, it } from "vitest";
import { COUNT_INCOMPLETE, parseCount, type SentCount } from "./count-input";

const ACTIVITY = "00000000-0000-4000-8000-00000000a001";
const ANI = "00000000-0000-4000-8000-0000000000a1";
const BUDI = "00000000-0000-4000-8000-0000000000b2";

const SENT: SentCount = {
  activityId: ACTIVITY,
  day: "2026-10-12",
  version: "0",
  intent: "draft",
  absentIds: [ANI],
  noteIds: [ANI, BUDI],
  noteTexts: ["Sakit", "  Terlambat  "],
};

describe("parseCount", () => {
  it("reads a draft with its absent and its notes", () => {
    expect(parseCount(SENT)).toEqual({
      ok: true,
      value: {
        activityId: ACTIVITY,
        day: "2026-10-12",
        version: 0,
        isAnnouncement: false,
        marks: {
          [ANI]: { isAbsent: true, note: "Sakit" },
          [BUDI]: { isAbsent: false, note: "Terlambat" },
        },
      },
    });
  });

  it("reads an announcement", () => {
    const parsed = parseCount({ ...SENT, intent: "announce", version: "3" });

    expect(parsed.ok && parsed.value.isAnnouncement).toBe(true);
    expect(parsed.ok && parsed.value.version).toBe(3);
  });

  it("leaves out a note that holds only spaces", () => {
    const parsed = parseCount({
      ...SENT,
      absentIds: [],
      noteIds: [BUDI],
      noteTexts: ["   "],
    });

    expect(parsed.ok && parsed.value.marks).toEqual({});
  });

  it.each<[string, Partial<SentCount>]>([
    ["an activity that is not a key", { activityId: "kegiatan" }],
    ["a day that is not one", { day: "2026-02-30" }],
    ["a version that is not a number", { version: "satu" }],
    ["an intent the form does not send", { intent: "hapus" }],
    ["a student who is not a key", { absentIds: ["ani"] }],
    ["a student absent twice", { absentIds: [ANI, ANI] }],
    [
      "a student with two notes",
      { noteIds: [ANI, ANI], noteTexts: ["a", "b"] },
    ],
    ["notes without their students", { noteIds: [ANI], noteTexts: [] }],
  ])("refuses %s", (_, change) => {
    expect(parseCount({ ...SENT, ...change })).toEqual(COUNT_INCOMPLETE);
  });

  it("refuses a note longer than 200 characters, and takes one of 200", () => {
    const longest = "a".repeat(200);

    expect(parseCount({ ...SENT, noteTexts: [longest, "b"] }).ok).toBe(true);
    expect(parseCount({ ...SENT, noteTexts: [`${longest}a`, "b"] })).toEqual({
      ok: false,
      error: "Catatan paling panjang 200 karakter.",
    });
  });

  it("refuses a note with a character the database keeps no text with", () => {
    expect(parseCount({ ...SENT, noteTexts: ["Sa\u0000kit", "b"] })).toEqual({
      ok: false,
      error:
        "Catatan memuat karakter yang tidak dapat disimpan. Ketik ulang catatan, lalu simpan lagi.",
    });
  });
});
