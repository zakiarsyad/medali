import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { AddedStudent } from "./added-students";
import { StudentNumbers } from "./student-numbers";
import { StudentTable } from "./student-table";

vi.mock("./actions", () => ({}));

function student(nim: string, group: AddedStudent["group"]): AddedStudent {
  return {
    nim,
    name: "Mahasiswa Contoh",
    email: null,
    sex: "female",
    studyProgram: "D3 Pajak",
    entryPath: "regular",
    className: null,
    cohortYear: 2026,
    status: "active",
    isAffirmation: false,
    isSeedling: false,
    isInternational: false,
    isBlended: false,
    inputAt: null,
    inputBy: null,
    inputSource: "form",
    fileId: null,
    dorm: null,
    group,
  };
}

const GROUP = {
  cohortYear: 2026,
  entryPath: "regular",
  number: 1,
  programCode: "D3PJK",
  mentorName: "Pengasuh Contoh",
} as const;

function tableOf(group: AddedStudent["group"]): string {
  return renderToStaticMarkup(
    <StudentTable students={[student("9900003301", group)]} query="" />,
  );
}

/** The cell of the column, which a phone shows as a line with its title. */
function groupCellOf(table: string): string {
  return (
    table.match(/<td data-title="Kelompok pengasuhan">.*?<\/td>/)?.[0] ?? ""
  );
}

test("the list has the column Kelompok pengasuhan after Asrama", () => {
  expect(tableOf(null)).toContain(
    "<th>Asrama</th><th>Kelompok pengasuhan</th>",
  );
});

test("the column shows the code of the group with its mentor under it", () => {
  const cell = groupCellOf(tableOf(GROUP));

  expect(cell).toContain("KP 26-D3PJK-01<small");
  expect(cell).toContain(">Pengasuh Contoh</small>");
});

test("the column writes a dash for a group without a mentor", () => {
  const cell = groupCellOf(tableOf({ ...GROUP, mentorName: null }));

  expect(cell).toContain(">-</small>");
});

test("the column says Belum ditetapkan for a student in no group", () => {
  const cell = groupCellOf(tableOf(null));

  expect(cell).toContain(">Belum ditetapkan</span>");
  expect(cell).not.toContain("KP ");
});

test("the numbers hold Belum punya kelompok pengasuhan, with where to set it", () => {
  const numbers = renderToStaticMarkup(
    <StudentNumbers
      counts={{
        total: 10,
        active: 9,
        added: 4,
        addedActive: 3,
        addedResidents: 1,
        addedWithoutGroup: 2,
      }}
    />,
  );

  expect(numbers).toMatch(
    /Belum punya kelompok pengasuhan<\/dt><dd[^>]*>2<\/dd><dd[^>]*>atur di Pengasuh &gt; Penetapan<\/dd>/,
  );
});
