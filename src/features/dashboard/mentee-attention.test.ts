import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_BELOW,
  ATTENTION_SHOWN,
  attentionRows,
  averageWords,
  type MenteeFacts,
  reasonsOf,
} from "./mentee-attention";

const CALM: MenteeFacts = {
  studentId: "a",
  name: "Mahasiswa A",
  opensDetail: true,
  rerata: 80,
  coaching: null,
  grade: { letter: "B", passes: true },
  attendance: 90,
  penalty: null,
  fitness: "good",
  mental: null,
};

function words(facts: MenteeFacts): string[] {
  return reasonsOf(facts).map((reason) => reason.words);
}

describe("reasonsOf", () => {
  it("gives no reason to an anak asuh who is doing well", () => {
    expect(reasonsOf(CALM)).toEqual([]);
  });

  it("gives one tag per reason, in the prototype's order and words", () => {
    const all: MenteeFacts = {
      ...CALM,
      coaching: "intensive",
      grade: { letter: "D", passes: false },
      attendance: 74.6,
      penalty: "medium",
      fitness: "medical",
      mental: "severe",
    };

    expect(words(all)).toEqual([
      "Capaian: pembinaan intensif",
      "Nilai karakter D",
      "Kehadiran kegiatan 75%",
      "Hukuman disiplin sedang",
      "Jasmani: perlu tindak lanjut medis",
      "Mental: berat",
    ]);
  });

  it("gives Kehadiran kegiatan only under 75", () => {
    expect(ATTENDANCE_BELOW).toBe(75);
    expect(words({ ...CALM, attendance: 75 })).toEqual([]);
    expect(words({ ...CALM, attendance: 74.9 })).toEqual([
      "Kehadiran kegiatan 75%",
    ]);
    expect(words({ ...CALM, attendance: null })).toEqual([]);
  });

  it("gives Jasmani only for the two lower categories", () => {
    expect(words({ ...CALM, fitness: "excellent" })).toEqual([]);
    expect(words({ ...CALM, fitness: null })).toEqual([]);
    expect(words({ ...CALM, fitness: "attention" })).toEqual([
      "Jasmani: perlu perhatian",
    ]);
  });

  it("gives Mental only at Sedang or worse", () => {
    expect(words({ ...CALM, mental: "mild" })).toEqual([]);
    expect(words({ ...CALM, mental: "moderate" })).toEqual(["Mental: sedang"]);
  });

  it("gives Nilai karakter only below the minimum, not for a grade that is not complete", () => {
    expect(words({ ...CALM, grade: null })).toEqual([]);
    expect(words({ ...CALM, grade: { letter: "C", passes: true } })).toEqual(
      [],
    );
  });
});

describe("attentionRows", () => {
  it("leaves out an anak asuh without a reason, and puts most reasons first, then the lowest average", () => {
    const rows = attentionRows([
      { ...CALM, studentId: "calm" },
      { ...CALM, studentId: "one-high", rerata: 70, penalty: "light" },
      { ...CALM, studentId: "one-low", rerata: 60, penalty: "light" },
      {
        ...CALM,
        studentId: "two",
        rerata: 90,
        penalty: "light",
        fitness: "attention",
      },
      { ...CALM, studentId: "one-none", rerata: null, penalty: "light" },
    ]);

    expect(rows.map((row) => row.studentId)).toEqual([
      "two",
      "one-low",
      "one-high",
      "one-none",
    ]);
    expect(rows[0]?.reasons).toHaveLength(2);
  });

  it("shows 8 at first", () => {
    expect(ATTENTION_SHOWN).toBe(8);
  });
});

describe("averageWords", () => {
  it("names the MEDALI average, or says the anak asuh is not assessed", () => {
    expect(averageWords(81.7)).toBe("MEDALI 81,7");
    expect(averageWords(null)).toBe("belum diasesmen");
  });
});
