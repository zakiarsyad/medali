import { describe, expect, it } from "vitest";
import { type SplitStudent, splitStudents } from "./split-students";

function student(
  nim: string,
  sex: SplitStudent["sex"] = "male",
  province: string | null = "Bali",
  className: string | null = "1-01",
): SplitStudent {
  return { nim, sex, province, className };
}

function nims(groups: SplitStudent[][]): string[][] {
  return groups.map((group) => group.map((one) => one.nim));
}

describe("splitStudents by NIM", () => {
  it("sorts by NIM and cuts into runs of students who follow each other", () => {
    const students = ["06", "02", "05", "01", "04", "03"].map((n) =>
      student(n),
    );

    expect(nims(splitStudents(students, 2, "by_nim"))).toEqual([
      ["01", "02", "03"],
      ["04", "05", "06"],
    ]);
    expect(nims(splitStudents(students, 3, "by_nim"))).toEqual([
      ["01", "02"],
      ["03", "04"],
      ["05", "06"],
    ]);
  });

  it("gives the first run the student that does not divide evenly", () => {
    const students = ["1", "2", "3", "4", "5", "6", "7"].map((n) => student(n));

    expect(nims(splitStudents(students, 3, "by_nim"))).toEqual([
      ["1", "2", "3"],
      ["4", "5"],
      ["6", "7"],
    ]);
  });
});

describe("splitStudents by academic class", () => {
  it("sorts by kelas and then NIM, so a kelas stays together", () => {
    const students = [
      student("01", "male", "Bali", "1-02"),
      student("02", "male", "Bali", "1-01"),
      student("03", "male", "Bali", "1-02"),
      student("04", "male", "Bali", "1-01"),
    ];

    expect(nims(splitStudents(students, 2, "by_class"))).toEqual([
      ["02", "04"],
      ["01", "03"],
    ]);
  });

  it("puts students without a kelas first", () => {
    const students = [
      student("01", "male", "Bali", "1-01"),
      student("02", "male", "Bali", null),
    ];

    expect(nims(splitStudents(students, 2, "by_class"))).toEqual([
      ["02"],
      ["01"],
    ]);
  });
});

describe("splitStudents balanced", () => {
  it("sorts putra first, then by provinsi and NIM, and deals out in a snake", () => {
    const students = [
      student("01", "female", "Bali"),
      student("02", "male", "Riau"),
      student("03", "male", "Bali"),
      student("04", "female", "Aceh"),
      student("05", "male", "Bali"),
      student("06", "female", "Bali"),
      student("07", "male", "Aceh"),
    ];
    // Sorted: 07 (putra, Aceh), 03, 05 (putra, Bali), 02 (putra, Riau),
    // 04 (putri, Aceh), 01, 06 (putri, Bali).

    expect(nims(splitStudents(students, 3, "balanced"))).toEqual([
      ["07", "01", "06"],
      ["03", "04"],
      ["05", "02"],
    ]);
  });

  it("turns round at the end of every row", () => {
    const students = ["1", "2", "3", "4", "5", "6", "7", "8"].map((n) =>
      student(n),
    );

    expect(nims(splitStudents(students, 2, "balanced"))).toEqual([
      ["1", "4", "5", "8"],
      ["2", "3", "6", "7"],
    ]);
  });

  it("gives each group its share of putra and putri", () => {
    const men = Array.from({ length: 30 }, (_, n) => student(`1${n + 10}`));
    const women = Array.from({ length: 30 }, (_, n) =>
      student(`2${n + 10}`, "female"),
    );

    const groups = splitStudents([...women, ...men], 2, "balanced");

    for (const group of groups) {
      expect(group.filter((one) => one.sex === "male")).toHaveLength(15);
      expect(group.filter((one) => one.sex === "female")).toHaveLength(15);
    }
  });

  it("reads a student without a provinsi as the first of their jenis kelamin", () => {
    const students = [
      student("01", "male", "Aceh"),
      student("02", "male", null),
    ];

    expect(nims(splitStudents(students, 2, "balanced"))).toEqual([
      ["02"],
      ["01"],
    ]);
  });
});

describe("splitStudents", () => {
  it.each(["balanced", "by_nim", "by_class"] as const)(
    "puts every student in one group, by %s",
    (method) => {
      const students = Array.from({ length: 61 }, (_, n) =>
        student(String(1000 + n), n % 3 === 0 ? "female" : "male"),
      );

      const groups = splitStudents(students, 2, method);
      const placed = groups.flat().map((one) => one.nim);

      expect(groups).toHaveLength(2);
      expect(placed.sort()).toEqual(students.map((one) => one.nim).sort());
      expect(Math.abs((groups[0]?.length ?? 0) - 30.5)).toBe(0.5);
    },
  );

  it.each(["balanced", "by_nim", "by_class"] as const)(
    "makes one group of everyone when one is asked, by %s",
    (method) => {
      const students = [student("2"), student("1")];

      expect(nims(splitStudents(students, 1, method))).toEqual([["1", "2"]]);
    },
  );

  it("does not change the list it was given", () => {
    const students = [student("2"), student("1")];

    splitStudents(students, 1, "by_nim");

    expect(students.map((one) => one.nim)).toEqual(["2", "1"]);
  });

  it("makes no group when none is asked", () => {
    expect(splitStudents([student("1")], 0, "by_nim")).toEqual([]);
  });
});
