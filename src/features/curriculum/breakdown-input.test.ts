import { describe, expect, it } from "vitest";
import {
  ACTIVITIES_MAX,
  ACTIVITY_MAX_LENGTH,
  parseBreakdown,
  type SentBreakdown,
  TEXT_MAX_LENGTH,
} from "./breakdown-input";
import { SENT_BREAKDOWN } from "./test-records";

function refusal(changes: Partial<SentBreakdown>): string | null {
  const parsed = parseBreakdown({ ...SENT_BREAKDOWN, ...changes });
  return parsed.ok ? null : parsed.error;
}

describe("parseBreakdown", () => {
  it("takes a filled form, with the indicators in the order of their levels", () => {
    const parsed = parseBreakdown({
      tahap: "2",
      valueKey: "D",
      text: "  Teks uji.  ",
      activities: ["  Kegiatan uji  ", "Kegiatan uji kedua"],
      indicatorCodes: ["D3", "D1", "D3"],
    });

    expect(parsed).toEqual({
      ok: true,
      value: {
        tahap: 2,
        valueKey: "D",
        text: "Teks uji.",
        activities: ["Kegiatan uji", "Kegiatan uji kedua"],
        indicatorCodes: ["D1", "D3"],
      },
    });
  });

  it("drops the empty kegiatan acuan rows and the repeated ones", () => {
    const parsed = parseBreakdown({
      ...SENT_BREAKDOWN,
      activities: ["", "Kegiatan uji", "   ", "Kegiatan uji"],
    });

    expect(parsed.ok && parsed.value.activities).toEqual(["Kegiatan uji"]);
  });

  it("takes a form without any kegiatan acuan", () => {
    const parsed = parseBreakdown({ ...SENT_BREAKDOWN, activities: [] });

    expect(parsed.ok && parsed.value.activities).toEqual([]);
  });

  it.each(["0", "5", "", "2.5", "dua", " 1"])(
    "refuses the tahap %j",
    (tahap) => {
      expect(refusal({ tahap })).toBe("Tahap harus 1 sampai 4.");
    },
  );

  it.each(["", "X", "m", "MD"])("refuses the nilai %j", (valueKey) => {
    expect(refusal({ valueKey })).toBe("Nilai MEDALI tidak dikenal.");
  });

  it("refuses a form without a ticked indicator", () => {
    expect(refusal({ indicatorCodes: [] })).toBe(
      "Pilih minimal satu indikator tahap.",
    );
  });

  it.each([
    ["of another nilai", "E2"],
    ["that does not exist", "M5"],
    ["that is not a code", "M"],
  ])("refuses an indicator %s", (_what, code) => {
    expect(refusal({ indicatorCodes: ["M2", code] })).toBe(
      "Indikator tahap harus dari indikator utama nilai ini.",
    );
  });

  it("holds the text to its longest length", () => {
    expect(refusal({ text: "a".repeat(TEXT_MAX_LENGTH) })).toBeNull();
    expect(refusal({ text: "a".repeat(TEXT_MAX_LENGTH + 1) })).toBe(
      "Penjabaran tugas paling banyak 500 karakter.",
    );
  });

  it("holds a kegiatan acuan to its longest length", () => {
    const longest = "a".repeat(ACTIVITY_MAX_LENGTH);

    expect(refusal({ activities: [longest] })).toBeNull();
    expect(refusal({ activities: [`${longest}a`] })).toBe(
      "Kegiatan acuan paling banyak 100 karakter.",
    );
  });

  it("holds the kegiatan acuan to their largest number", () => {
    const rows = Array.from({ length: ACTIVITIES_MAX + 1 }, (_, n) => `K${n}`);

    expect(refusal({ activities: rows.slice(1) })).toBeNull();
    expect(refusal({ activities: rows })).toBe(
      "Kegiatan acuan paling banyak 20 baris.",
    );
  });
});
