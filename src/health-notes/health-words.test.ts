import { describe, expect, it } from "vitest";
import { ILLNESSES } from "./health-ids";
import {
  categoryHint,
  examinerOf,
  ILLNESS_WORDS,
  illnessLine,
  listedHint,
  medicalHint,
  noteText,
  residenceHint,
  roomWords,
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

describe("examinerOf", () => {
  it("names Pemeriksa, or who saved the note when none is named", () => {
    const note = { examiner: null, savedBy: "Penilai Contoh" };
    expect(examinerOf(note)).toBe("Penilai Contoh");
    expect(examinerOf({ ...note, examiner: "dr. Contoh" })).toBe("dr. Contoh");
  });
});

describe("the hints of the recap's numbers", () => {
  const NUMBERS = {
    students: 6,
    dorm: 1,
    listed: 5,
    attention: 1,
    medical: 2,
    medicalWithoutNote: 2,
  };

  it("splits Mahasiswa aktif by where they live", () => {
    expect(residenceHint(NUMBERS)).toBe("1 asrama · 5 non asrama");
  });

  it("gives the share of the ill as a whole percent, 0 with no student", () => {
    expect(listedHint(NUMBERS, "mahasiswa")).toBe("83% mahasiswa");
    expect(listedHint({ ...NUMBERS, students: 0, listed: 0 }, "penghuni")).toBe(
      "0% penghuni",
    );
  });

  it("names the students of a list filtered by an illness as the list names them", () => {
    expect(illnessLine(3, "asthma", "mahasiswa asrama")).toBe(
      "3 mahasiswa asrama dengan riwayat asma.",
    );
  });

  it("tells how many in Perlu tindak lanjut medis have no note, or that all have one", () => {
    expect(medicalHint(NUMBERS)).toBe("2 belum punya catatan");
    expect(medicalHint({ ...NUMBERS, medicalWithoutNote: 0 })).toBe(
      "catatan lengkap",
    );
  });
});

describe("roomWords", () => {
  it("writes Non asrama, a room, or a resident not placed yet", () => {
    expect(roomWords(null, null)).toBe("Non asrama");
    expect(
      roomWords("dana_rakca", { dorm: "dana_rakca", floor: 2, number: "12" }),
    ).toBe("Dana Rakca, lantai 2, kamar 12");
    expect(roomWords("cipta_bakti", null)).toBe("Cipta Bakti, belum diplot");
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
