// Sample NIMs of this file: 9900400200 to 9900400299.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ListedStudent } from "./student-list";
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

function tableOf(student: ListedStudent): string {
  return renderToStaticMarkup(
    <StudentListTable
      students={[student]}
      period={null}
      detailAddressOf={() => "/mahasiswa"}
    />,
  );
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

  it("shows no dorm for a student who lives in none", () => {
    expect(tableOf({ ...RESIDENT, dorm: null })).not.toContain("Asrama");
  });
});
