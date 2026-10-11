import { describe, expect, it } from "vitest";
import { previewOf } from "./file-preview";
import type { FileRows } from "./student-file";
import type { StudentInput } from "./student-input";

const programs = [{ id: 3, name: "Prodi Uji Satu" }];

function student(nim: string): StudentInput {
  return {
    nim,
    name: "Pratinjau Uji",
    studyProgramId: 3,
    entryPath: "regular",
    sex: "male",
    cohortYear: 2026,
    className: null,
    province: null,
    originAgency: null,
    status: "active",
    isAffirmation: false,
    isSeedling: false,
    isInternational: false,
    isBlended: false,
  };
}

function rows(ready: number, skipped: number): FileRows {
  return {
    ready: Array.from({ length: ready }, (_, index) => ({
      row: index + 2,
      student: student(String(9900000600 + index)),
    })),
    skipped: Array.from({ length: skipped }, (_, index) => ({
      row: ready + index + 2,
      nim: "",
      reason: "NIM harus 10 digit angka.",
    })),
    repeated: 2,
  };
}

describe("previewOf", () => {
  it("shows a row in the words of the screen, in the order of the template", () => {
    const filled: StudentInput = {
      ...student("9900000601"),
      entryPath: "transfer",
      sex: "female",
      className: "1-01",
      province: "Riau",
      originAgency: "Direktorat Jenderal Pajak",
      status: "on_leave",
      isSeedling: true,
    };
    const file = {
      ready: [
        { row: 2, student: student("9900000600") },
        { row: 3, student: filled },
      ],
      skipped: [],
      repeated: 0,
    };

    expect(previewOf(file, programs).firstRows).toEqual([
      [
        "9900000600",
        "Pratinjau Uji",
        "Prodi Uji Satu",
        "Reguler",
        "L",
        "2026",
        "",
        "-",
        "-",
        "-",
        "-",
        "-",
        "Aktif",
      ],
      [
        "9900000601",
        "Pratinjau Uji",
        "Prodi Uji Satu",
        "Alih program",
        "P",
        "2026",
        "1-01",
        "Riau",
        "Direktorat Jenderal Pajak",
        "-",
        "ya",
        "-",
        "Cuti",
      ],
    ]);
  });

  it("counts every row, and shows the first 6 ready and the first 30 skipped", () => {
    const preview = previewOf(rows(8, 31), programs);

    expect(preview).toMatchObject({ ready: 8, skipped: 31, repeated: 2 });
    expect(preview.firstRows.map((cells) => cells[0])).toEqual([
      "9900000600",
      "9900000601",
      "9900000602",
      "9900000603",
      "9900000604",
      "9900000605",
    ]);
    expect(preview.firstSkipped).toHaveLength(30);
    expect(preview.firstSkipped[0]?.row).toBe(10);
  });
});
