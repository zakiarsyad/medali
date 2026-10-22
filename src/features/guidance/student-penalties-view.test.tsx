import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentPenalty } from "./student-penalties";
import { StudentPenaltiesView } from "./student-penalties-view";

function penalty(more: Partial<StudentPenalty> = {}): StudentPenalty {
  return {
    id: crypto.randomUUID(),
    day: "2026-09-01",
    category: "light",
    level: 1,
    status: "imposed",
    description: "Terlambat mengikuti apel pagi tiga kali",
    hasSocialWork: true,
    ...more,
  };
}

function shown(penalties: StudentPenalty[]): string {
  return renderToStaticMarkup(<StudentPenaltiesView penalties={penalties} />);
}

describe("Riwayat pelanggaran disiplin", () => {
  it("shows how many records there are and, for a Ringan one, the date, Kategori and Jenjang, status, Uraian, penalty, kerja sosial and the limit of 70", () => {
    const box = shown([penalty()]);

    expect(box).toContain("Riwayat pelanggaran disiplin");
    expect(box).toContain("1 catatan");
    expect(box).toContain("1 Sep 2026");
    expect(box).toContain("Ringan · jenjang pertama");
    expect(box).toContain("Dijatuhkan");
    expect(box).toContain("Terlambat mengikuti apel pagi tiga kali");
    expect(box).toContain(
      "Hukuman: teguran lisan tertulis, kerja sosial 7 hari, nilai karakter paling tinggi 70.",
    );
  });

  it("gives a Sedang one the limit of 70 too", () => {
    const box = shown([
      penalty({ category: "medium", level: 2, status: "serving" }),
    ]);

    expect(box).toContain("Sedang · jenjang kedua");
    expect(box).toContain("Sedang dijalani");
    expect(box).toContain(
      "Hukuman: peringatan kesatu tertulis, kerja sosial 30 hari, nilai karakter paling tinggi 70.",
    );
  });

  it("gives a Berat one its kerja sosial without the limit of 70, and one without kerja sosial neither", () => {
    const box = shown([
      penalty({ category: "heavy", level: 1, status: "served" }),
      penalty({
        category: "heavy",
        level: 3,
        status: "set",
        hasSocialWork: false,
      }),
    ]);

    expect(box).toContain("2 catatan");
    expect(box).toContain("Selesai dijalani");
    expect(box).toContain(
      "Hukuman: diberhentikan sementara sebagai mahasiswa selama 2 semester, kerja sosial 8 bulan.",
    );
    expect(box).toContain(
      "Hukuman: diberhentikan dengan tidak hormat secara permanen.",
    );
    expect(box).not.toContain("paling tinggi 70");
  });

  it("shows the first 10 records and folds the rest behind Tampilkan semua", () => {
    const many = Array.from({ length: 12 }, (_, place) =>
      penalty({ description: `Uraian uji ${place + 1}.` }),
    );

    const box = shown(many);

    expect(box).toContain("12 catatan");
    expect(box).toContain("Tampilkan semua (12)");
    const folded = box.slice(box.indexOf("<details"));
    expect(folded).toContain("Uraian uji 11.");
    expect(folded).toContain("Uraian uji 12.");
    expect(folded).not.toContain("Uraian uji 10.");
  });

  it("folds nothing for 10 records", () => {
    const ten = Array.from({ length: 10 }, () => penalty());

    expect(shown(ten)).not.toContain("Tampilkan semua");
  });
});
