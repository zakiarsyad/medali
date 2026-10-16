import { describe, expect, it } from "vitest";
import { ILLNESSES } from "./health-ids";
import {
  categoryHint,
  ILLNESS_WORDS,
  noteText,
  savedNoteMessage,
} from "./health-words";

const EMPTY = { illnesses: [], otherHistory: "", medicine: "", advice: "" };

describe("noteText", () => {
  it("writes a note as the prototype does", () => {
    expect(
      noteText({
        illnesses: [
          { illness: "asthma", note: "sejak SMP" },
          { illness: "hypertension", note: "" },
        ],
        otherHistory: "Sinusitis",
        medicine: "Inhaler bila perlu",
        advice: "Bawa inhaler saat kegiatan fisik.",
      }),
    ).toBe(
      "Riwayat: Asma (sejak SMP), Hipertensi; Sinusitis. Obat: Inhaler bila perlu. Bawa inhaler saat kegiatan fisik.",
    );
  });

  it("writes Riwayat lain without an illness picked", () => {
    expect(noteText({ ...EMPTY, otherHistory: "Sinusitis" })).toBe(
      "Riwayat: Sinusitis.",
    );
  });

  it("leaves out what is empty", () => {
    expect(noteText({ ...EMPTY, advice: "Kondisi umum baik." })).toBe(
      "Kondisi umum baik.",
    );
    expect(noteText(EMPTY)).toBe("");
  });
});

describe("savedNoteMessage", () => {
  it("names the student and the category in small letters", () => {
    expect(savedNoteMessage("Mahasiswa Uji", "attention")).toBe(
      "Catatan kesehatan Mahasiswa Uji disimpan. Kategori: perlu perhatian.",
    );
  });

  it("says belum dites with no test and no category from the note", () => {
    expect(savedNoteMessage("Mahasiswa Uji", "untested")).toBe(
      "Catatan kesehatan Mahasiswa Uji disimpan. Kategori: belum dites.",
    );
  });
});

describe("categoryHint", () => {
  it("names the test's category and the final one", () => {
    expect(categoryHint("excellent", "attention")).toBe(
      "Hasil tes: prima. Kategori akhir: perlu perhatian.",
    );
    expect(categoryHint("untested", "untested")).toBe(
      "Hasil tes: belum dites. Kategori akhir: belum dites.",
    );
  });
});

it("names every illness in the prototype's words", () => {
  expect(ILLNESSES.map((illness) => ILLNESS_WORDS[illness])).toEqual([
    "Asma",
    "Hipertensi",
    "Diabetes melitus",
    "Penyakit jantung",
    "Gangguan lambung",
    "Alergi",
    "Epilepsi",
    "Cedera atau operasi tulang/sendi",
    "Penyakit menular",
    "Lainnya",
  ]);
});
