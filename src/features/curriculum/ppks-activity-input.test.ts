import { describe, expect, it } from "vitest";
import {
  parsePpksActivity,
  type SentPpksActivity,
} from "./ppks-activity-input";

const SENT: SentPpksActivity = {
  semester: "3",
  name: "  Kegiatan uji  ",
  valueKeys: ["D", "M"],
  indicatorCodes: ["D2", "M1"],
  target: "",
  isRequired: true,
  description: "  Deskripsi uji.  ",
};

function refusal(changes: Partial<SentPpksActivity>): string | null {
  const parsed = parsePpksActivity({ ...SENT, ...changes });
  return parsed.ok ? null : parsed.error;
}

describe("parsePpksActivity", () => {
  it("gives the checked activity, trimmed, in the order of the word MEDALI", () => {
    expect(parsePpksActivity(SENT)).toEqual({
      ok: true,
      value: {
        semester: 3,
        name: "Kegiatan uji",
        valueKeys: ["M", "D"],
        indicatorCodes: ["M1", "D2"],
        targetParticipants: null,
        isRequired: true,
        description: "Deskripsi uji.",
      },
    });
  });

  it("keeps a value or an indicator sent twice only once", () => {
    const parsed = parsePpksActivity({
      ...SENT,
      valueKeys: ["M", "M"],
      indicatorCodes: ["M1", "M1"],
    });
    expect(parsed.ok && parsed.value.valueKeys).toEqual(["M"]);
    expect(parsed.ok && parsed.value.indicatorCodes).toEqual(["M1"]);
  });

  it.each(["", "  ", "ab", " ab "])("refuses the name '%s'", (name) => {
    expect(refusal({ name })).toBe("Isi nama kegiatan.");
  });

  it("refuses a name longer than 100 characters", () => {
    expect(refusal({ name: "a".repeat(101) })).toBe(
      "Nama kegiatan paling banyak 100 karakter.",
    );
    expect(refusal({ name: "a".repeat(100) })).toBeNull();
  });

  it("refuses an activity with no nilai", () => {
    expect(refusal({ valueKeys: [], indicatorCodes: [] })).toBe(
      "Pilih minimal satu nilai MEDALI.",
    );
  });

  it("refuses a nilai that is not one of the six", () => {
    expect(refusal({ valueKeys: ["M", "X"] })).toBe(
      "Nilai MEDALI tidak dikenal.",
    );
  });

  it("refuses an activity with no indicator", () => {
    expect(refusal({ indicatorCodes: [] })).toBe(
      "Pilih minimal satu indikator utama.",
    );
  });

  it.each(["M5", "X1", "m1", ""])(
    "refuses the indicator '%s', which is not a main indicator",
    (code) => {
      expect(refusal({ indicatorCodes: ["M1", code] })).toBe(
        "Indikator utama tidak dikenal.",
      );
    },
  );

  it("refuses an indicator of a nilai that is not chosen", () => {
    expect(refusal({ indicatorCodes: ["M1", "E1"] })).toBe(
      "Indikator utama harus dari nilai MEDALI yang dipilih.",
    );
  });

  it.each(["1", "8"])("takes semester %s", (semester) => {
    expect(refusal({ semester })).toBeNull();
  });

  it.each(["", "0", "9", "1.5", "-1", "dua"])(
    "refuses semester '%s'",
    (semester) => {
      expect(refusal({ semester })).toBe("Semester harus 1 sampai 8.");
    },
  );

  it.each([
    ["0", 0],
    [" 120 ", 120],
  ])("takes the target '%s'", (target, kept) => {
    const parsed = parsePpksActivity({ ...SENT, target });
    expect(parsed.ok && parsed.value.targetParticipants).toBe(kept);
  });

  it.each(["-1", "1.5", "banyak", "1e3", "1000000"])(
    "refuses the target '%s'",
    (target) => {
      expect(refusal({ target })).toBe(
        "Target peserta harus bilangan bulat dari 0 sampai 999999.",
      );
    },
  );

  it("keeps an activity that is not required as not required", () => {
    const parsed = parsePpksActivity({ ...SENT, isRequired: false });
    expect(parsed.ok && parsed.value.isRequired).toBe(false);
  });

  it("takes an empty description and refuses one longer than 500 characters", () => {
    expect(refusal({ description: " " })).toBeNull();
    expect(refusal({ description: "a".repeat(501) })).toBe(
      "Deskripsi paling banyak 500 karakter.",
    );
  });
});
