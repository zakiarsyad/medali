import { describe, expect, it } from "vitest";
import {
  CONFIRMED,
  parseReplacement,
  type SentReplacement,
} from "./replacement-input";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a01";
const MENTOR_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a02";

const SENT: SentReplacement = {
  groupId: GROUP_ID,
  reason: "own_request",
  startsOn: "2026-10-13",
  newMentorId: MENTOR_ID,
  letterNumber: " ND-12/PKN/2026 ",
  oldMentorStatus: "reserve",
  note: " Atas permintaan yang bersangkutan. ",
  confirmed: CONFIRMED,
};

function refusal(more: Partial<SentReplacement>): string | null {
  const parsed = parseReplacement({ ...SENT, ...more });
  return parsed.ok ? null : parsed.error;
}

describe("parseReplacement", () => {
  it("takes a whole replacement, without the blanks around what was typed", () => {
    expect(parseReplacement(SENT)).toEqual({
      ok: true,
      value: {
        groupId: GROUP_ID,
        reason: "own_request",
        startsOn: "2026-10-13",
        newMentorId: MENTOR_ID,
        letterNumber: "ND-12/PKN/2026",
        oldMentorStatus: "reserve",
        note: "Atas permintaan yang bersangkutan.",
      },
    });
  });

  it("keeps no Keterangan when none was typed", () => {
    const parsed = parseReplacement({ ...SENT, note: "  " });

    expect(parsed).toMatchObject({ ok: true, value: { note: null } });
  });

  it("asks for a spare mentor when none is chosen", () => {
    expect(refusal({ newMentorId: "" })).toBe("Pilih pengasuh pengganti.");
  });

  it("asks for the tick when the box is not ticked", () => {
    expect(refusal({ confirmed: "" })).toBe(
      "Centang konfirmasi terlebih dahulu.",
    );
    expect(refusal({ confirmed: "no" })).toBe(
      "Centang konfirmasi terlebih dahulu.",
    );
  });

  it("asks for the mentor before the tick when both are missing", () => {
    expect(refusal({ newMentorId: "", confirmed: "" })).toBe(
      "Pilih pengasuh pengganti.",
    );
  });

  it("refuses a group or a mentor that has not the shape of an id", () => {
    expect(refusal({ groupId: "1 or 1=1" })).toBe("Pilih kelompok pengasuhan.");
    expect(refusal({ newMentorId: "1 or 1=1" })).toBe(
      "Pilih pengasuh pengganti.",
    );
  });

  it("refuses a reason and a status the form does not offer", () => {
    expect(refusal({ reason: "Bosan" })).toBe("Pilih alasan penggantian.");
    expect(refusal({ oldMentorStatus: "mentoring" })).toBe(
      "Pilih status pengasuh lama.",
    );
  });

  it("refuses a day that does not exist or is written another way", () => {
    const askForDay = "Isi tanggal efektif dengan tanggal yang benar.";

    expect(refusal({ startsOn: "" })).toBe(askForDay);
    expect(refusal({ startsOn: "2026-02-30" })).toBe(askForDay);
    expect(refusal({ startsOn: "13/10/2026" })).toBe(askForDay);
  });

  it("asks for the letter number, and refuses one that is too long", () => {
    expect(refusal({ letterNumber: "   " })).toBe(
      "Isi nomor surat keputusan atau nota dinas.",
    );
    expect(refusal({ letterNumber: "N".repeat(101) })).toBe(
      "Nomor surat keputusan atau nota dinas paling panjang 100 karakter.",
    );
    expect(refusal({ letterNumber: "N".repeat(100) })).toBeNull();
  });

  it("refuses a Keterangan longer than the field allows, counting a line break once", () => {
    expect(refusal({ note: "k".repeat(1001) })).toBe(
      "Keterangan paling panjang 1.000 karakter.",
    );
    expect(refusal({ note: `${"k".repeat(998)}\r\nk` })).toBeNull();
  });
});
