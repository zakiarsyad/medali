// Sample NIMs of this file: 9900400200 to 9900400299.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Sanction } from "@/discipline-penalties/sanction";
import type { ListedStudent } from "./student-list";
import type { ListScores } from "./student-list-scores";
import { StudentListTable } from "./student-list-table";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const RESIDENT: ListedStudent = {
  id: "00000000-0000-4000-8000-000000000091",
  nim: "9900400201",
  name: "Tabel Uji Penghuni",
  status: "active",
  isAffirmation: false,
  isSeedling: false,
  isInternational: false,
  isBlended: false,
  studyProgram: "Prodi Uji Tabel",
  entryPath: "regular",
  originAgency: null,
  cohortYear: 2026,
  className: null,
  province: null,
  mentorName: null,
  dorm: "dana_rakca",
};

const NOT_SCORED: ListScores = { rerata: null, grade: { complete: false } };

function tableOf(
  student: ListedStudent,
  scores = NOT_SCORED,
  sanction: Sanction | null = null,
): string {
  const sanctions = new Map<string, Sanction>();
  if (sanction !== null) sanctions.set(student.id, sanction);
  return renderToStaticMarkup(
    <StudentListTable
      students={[student]}
      scores={new Map([[student.id, scores]])}
      sanctions={sanctions}
      period={null}
      detailAddressOf={() => "/mahasiswa"}
    />,
  );
}

function cellOf(table: string, title: string): string {
  const start = table.indexOf(`data-title="${title}"`);
  return table.slice(start, table.indexOf("</td>", start));
}

describe("StudentListTable", () => {
  it("shows the dorm of a resident as a tag in the Mahasiswa cell", () => {
    const table = tableOf(RESIDENT);

    const cell = table.slice(
      table.indexOf('data-title="Mahasiswa"'),
      table.indexOf('data-title="Program studi"'),
    );
    expect(cell).toContain("Asrama Dana Rakca");
  });

  it("shows the badge of a suspended or dismissed student right after the NIM and status, before the other tags", () => {
    const table = tableOf(
      { ...RESIDENT, status: "inactive" },
      NOT_SCORED,
      "dismissed",
    );

    expect(cellOf(table, "Mahasiswa")).toMatch(
      /9900400201 · non aktif<\/small><span class="[^"]*">Diberhentikan permanen<\/span><span[^>]*>Asrama Dana Rakca/,
    );
  });

  it("shows no such badge for a student without one", () => {
    expect(tableOf(RESIDENT)).not.toContain("Diberhentikan");
  });

  it("shows no dorm for a student who lives in none", () => {
    expect(tableOf({ ...RESIDENT, dorm: null })).not.toContain("Asrama");
  });

  it("shows the predikat with Rerata, and the letter with Nilai akhir, each in a cell that folds into the card on a phone", () => {
    const table = tableOf(RESIDENT, {
      rerata: 80.3,
      grade: { complete: true, final: 77, letter: "B", passes: true },
    });

    const achievement = cellOf(table, "Capaian karakter (MEDALI)");
    expect(achievement).toContain("Perak");
    expect(achievement).toContain("Rerata 80,3");
    const grade = cellOf(table, "Nilai karakter (KEP-220)");
    expect(grade).toContain(">B<");
    expect(grade).toContain("77,0");
    expect(table).toContain("<th>Capaian karakter (MEDALI)</th>");
    expect(table).toContain("<th>Nilai karakter (KEP-220)</th>");
  });

  it("says Belum diasesmen and Belum lengkap for a student without either", () => {
    const table = tableOf(RESIDENT);

    expect(cellOf(table, "Capaian karakter (MEDALI)")).toContain(
      "Belum diasesmen",
    );
    expect(cellOf(table, "Nilai karakter (KEP-220)")).toContain(
      "Belum lengkap",
    );
  });
});
