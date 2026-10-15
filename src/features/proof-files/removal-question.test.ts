import { describe, expect, it } from "vitest";
import { noCounts } from "./proof-kinds";
import { removalQuestion, removedWords } from "./removal-question";

describe("removalQuestion", () => {
  it("names how many files of each kind will go, and that they cannot come back", () => {
    const question = removalQuestion({
      ...noCounts(),
      attendance_photo: 1200,
      appeal_proof: 3,
    });

    expect(question.split("\n")).toEqual([
      "Hapus berkas lama berikut?",
      "Foto kehadiran kegiatan: 1.200 berkas",
      "Bukti advokasi pelanggaran: 3 berkas",
      "Berkas yang dihapus tidak dapat dikembalikan.",
    ]);
  });
});

describe("removedWords", () => {
  it("says how many files went", () => {
    expect(removedWords(7)).toBe("7 berkas dihapus.");
  });
});
