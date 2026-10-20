import { describe, expect, it } from "vitest";
import { START_PARAMS } from "./grade-address";
import { type GradeInput, gradeListOf, gradeRowOf } from "./grade-list";
import { STARTING_SCHEME } from "./scheme-ids";

function input(
  nim: string,
  name: string,
  more: Partial<GradeInput> = {},
): GradeInput {
  return {
    student: { id: `id-${nim}`, name, nim, program: "Prodi Uji" },
    attendance: { percent: 90, attended: 9, counted: 10 },
    mentoring: 80,
    siku: { score: 66, adjusted: true, note: "SIKU 65 +1" },
    skpm: 72,
    ...more,
  };
}

const NO_ATTENDANCE = { percent: null, attended: 0, counted: 0 };

const ROWS = [
  input("9987100101", "Ani Lulus"),
  input("9987100102", "Budi Gagal", { skpm: 0 }),
  input("9987100103", "Citra Kosong", { attendance: NO_ATTENDANCE }),
  input("9987100104", "Dodi Tanpa Pengasuh", { mentoring: null }),
].map((each) => gradeRowOf(each, STARTING_SCHEME));

function namesOf(rows: readonly { student: { name: string } }[]): string[] {
  return rows.map((row) => row.student.name);
}

describe("gradeRowOf", () => {
  it("gives the grade of the student's four parts", () => {
    expect(ROWS[0]?.grade).toEqual({
      complete: true,
      final: 77,
      letter: "B",
      passes: true,
    });
    expect(ROWS[2]?.grade).toEqual({ complete: false });
  });
});

describe("gradeListOf", () => {
  it("keeps every student with no search and no filter", () => {
    const list = gradeListOf(ROWS, START_PARAMS);

    expect(list.matching).toBe(4);
    expect(list.page).toBe(1);
  });

  it("narrows to those whose worked-out grade does not pass, leaving Belum lengkap out", () => {
    const list = gradeListOf(ROWS, { ...START_PARAMS, filter: "failing" });

    expect(namesOf(list.rows)).toEqual(["Budi Gagal"]);
  });

  it("narrows to those with a missing part", () => {
    const list = gradeListOf(ROWS, { ...START_PARAMS, filter: "incomplete" });

    expect(namesOf(list.rows)).toEqual(["Citra Kosong", "Dodi Tanpa Pengasuh"]);
  });

  it("finds by a part of the name in any case, or of the NIM", () => {
    const byName = gradeListOf(ROWS, { ...START_PARAMS, query: "citra" });
    const byNim = gradeListOf(ROWS, { ...START_PARAMS, query: "00104" });

    expect(namesOf(byName.rows)).toEqual(["Citra Kosong"]);
    expect(namesOf(byNim.rows)).toEqual(["Dodi Tanpa Pengasuh"]);
  });

  it("shows 25 a page, and the last page when the address asks for more", () => {
    const many = Array.from({ length: 30 }, (_, place) =>
      gradeRowOf(
        input(
          `99871001${String(place).padStart(2, "0")}`,
          `Mahasiswa ${place}`,
        ),
        STARTING_SCHEME,
      ),
    );

    const first = gradeListOf(many, START_PARAMS);
    const beyond = gradeListOf(many, { ...START_PARAMS, page: 9 });

    expect(first.rows).toHaveLength(25);
    expect(beyond.page).toBe(2);
    expect(namesOf(beyond.rows)).toEqual([
      "Mahasiswa 25",
      "Mahasiswa 26",
      "Mahasiswa 27",
      "Mahasiswa 28",
      "Mahasiswa 29",
    ]);
  });
});
