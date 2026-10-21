import { describe, expect, it } from "vitest";
import { STARTING_VERSION } from "./saved-version";
import { codesOf, stageBreakdown } from "./stage-breakdown";

describe("stageBreakdown", () => {
  it("gives the six values in the order of the word MEDALI", () => {
    const names = stageBreakdown(1, new Map()).map((value) => value.name);

    expect(names).toEqual([
      "Mandiri",
      "Empati",
      "Disiplin",
      "Adaptif",
      "Loyal",
      "Integritas",
    ]);
  });

  it("starts with the text and the one kegiatan acuan of the prototype", () => {
    expect(stageBreakdown(1, new Map())[0]).toEqual({
      key: "M",
      name: "Mandiri",
      text: "Lokakarya mengatur waktu, keuangan pribadi, dan target belajar semester.",
      activities: ["Manajemen diri mahasiswa baru"],
      indicatorCodes: ["M1"],
      version: STARTING_VERSION,
    });
    expect(stageBreakdown(4, new Map())[5]).toEqual({
      key: "I",
      name: "Integritas",
      text: "Peran calon pegawai dalam membangun WBK/WBBM.",
      activities: ["Zona integritas"],
      indicatorCodes: ["I4"],
      version: STARTING_VERSION,
    });
  });

  it.each([1, 2, 3, 4])(
    "starts tahap %i with the main indicator of its own level",
    (tahapNo) => {
      for (const value of stageBreakdown(tahapNo, new Map())) {
        expect(value.indicatorCodes).toEqual([`${value.key}${tahapNo}`]);
        expect(value.text.trim()).not.toBe("");
        expect(value.activities).toHaveLength(1);
      }
    },
  );

  it("starts every tahap and nilai with a text of its own", () => {
    const texts = [1, 2, 3, 4].flatMap((tahapNo) =>
      stageBreakdown(tahapNo, new Map()).map((value) => value.text),
    );

    expect(new Set(texts).size).toBe(24);
  });

  it("shows saved content in place of the starting one, and keeps the rest", () => {
    const saved = {
      text: "Teks uji",
      activities: ["Kegiatan uji", "Kegiatan uji kedua"],
      indicatorCodes: ["D1", "D3"],
      version: "2026-10-21T03:00:00.000Z",
    };

    const shown = stageBreakdown(2, new Map([["D", saved]]));

    expect(shown[2]).toEqual({ key: "D", name: "Disiplin", ...saved });
    expect(shown[1]?.activities).toEqual(["Pengabdian masyarakat"]);
  });
});

describe("codesOf", () => {
  it("gives the four codes of a nilai, from level 1 to level 4", () => {
    expect(codesOf("L")).toEqual(["L1", "L2", "L3", "L4"]);
  });
});
