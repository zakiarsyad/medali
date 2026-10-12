// Sample NIMs of this file: 9900002400 to 9900002499. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OwnProfileScreen } from "./own-profile-screen";
import type { StudentFacts } from "./student-facts";

const STUDENT: StudentFacts = {
  id: "00000000-0000-4000-8000-000000000092",
  nim: "9900002401",
  name: "Profil Uji Layar",
  status: "active",
  isAffirmation: true,
  isSeedling: false,
  isInternational: false,
  isBlended: true,
  studyProgram: "Prodi Uji Layar",
  entryPath: "regular",
  originAgency: null,
  cohortYear: 2025,
  className: null,
  province: "Bali",
  sex: "female",
};

const PERIOD = { startYear: 2026, term: "odd" } as const;

function screenOf(student: StudentFacts, period = PERIOD): string {
  return renderToStaticMarkup(
    <OwnProfileScreen student={student} period={period} />,
  );
}

describe("OwnProfileScreen", () => {
  it("shows the name as the title, the line under it and the status", () => {
    const screen = screenOf(STUDENT);

    expect(screen).toMatch(/<h1[^>]*>Profil Uji Layar<\/h1>/);
    expect(screen).toContain(
      "9900002401 · Prodi Uji Layar · Semester 3, tahap penumbuhan",
    );
    expect(screen).toMatch(/<span[^>]*>Aktif<\/span>/);
  });

  it("shows the facts of the first card, with the category tags", () => {
    const screen = screenOf(STUDENT);

    expect(screen).toContain("<dt>Angkatan</dt><dd>2025 · Reguler</dd>");
    expect(screen).toContain(
      "<dt>Provinsi (domisili sesuai NIK)</dt><dd>Bali</dd>",
    );
    expect(screen).toContain(
      "<dt>Semester · tahap</dt><dd>Semester 3 · Tahap Penumbuhan (tingkat 2)</dd>",
    );
    expect(screen).toContain("<dt>Kelas</dt><dd>Belum tercatat</dd>");
    expect(screen).toContain("<dt>Jenis kelamin</dt><dd>Perempuan</dd>");
    expect(screen).toMatch(/<span[^>]*>Afirmasi<\/span>/);
    expect(screen).toMatch(/<span[^>]*>Blended learning<\/span>/);
    expect(screen).not.toContain("Pembibitan");
    expect(screen).not.toContain("Instansi asal");
  });

  it("shows Instansi asal for an alih program student only", () => {
    const screen = screenOf({
      ...STUDENT,
      entryPath: "transfer",
      originAgency: "Direktorat Jenderal Pajak",
    });

    expect(screen).toContain(
      "<dt>Instansi asal</dt><dd>Direktorat Jenderal Pajak</dd>",
    );
  });

  it("says Tidak aktif under the name of a student on Cuti, who keeps their semester in the card", () => {
    const screen = screenOf({ ...STUDENT, status: "on_leave" });

    expect(screen).toContain("9900002401 · Prodi Uji Layar · Tidak aktif");
    expect(screen).toContain("Semester 3 · Tahap Penumbuhan (tingkat 2)");
    expect(screen).toMatch(/<span[^>]*>Cuti<\/span>/);
  });

  it("holds nothing that changes the record, and says who corrects it", () => {
    const screen = screenOf(STUDENT);

    expect(screen).not.toMatch(/<(form|button|input|select|textarea|a)\b/);
    expect(screen).toContain(
      "Data ini berasal dari data kampus. Bila ada yang keliru, hubungi Unit Pembangunan Karakter.",
    );
  });

  it("shows no Asrama and no Pengasuh line", () => {
    const screen = screenOf(STUDENT);

    expect(screen).not.toContain("Asrama");
    expect(screen).not.toContain("Pengasuh");
  });
});
