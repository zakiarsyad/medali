import { describe, expect, it } from "vitest";
import { type ProgramGroup, programAverages } from "./program-averages";

/** A total of 480 is a Rerata of 80.0, 450 of 75.0, 487 of 81.2. */
function groupOf(
  programId: number,
  total: number | null,
  students: number,
): ProgramGroup {
  return { programId, name: `Prodi ${programId}`, total, students };
}

describe("programAverages", () => {
  it("averages each program's Rerata as each student's shows, highest first", () => {
    const averages = programAverages([
      groupOf(1, 450, 5),
      groupOf(2, 480, 3),
      groupOf(2, 487, 2),
      groupOf(2, null, 4),
    ]);

    expect(averages).toEqual([
      { programId: 2, name: "Prodi 2", students: 9, average: 80.5 },
      { programId: 1, name: "Prodi 1", students: 5, average: 75 },
    ]);
  });

  it("gives no average for a program with fewer than 5 assessed students, and puts it last", () => {
    const averages = programAverages([
      groupOf(1, 480, 4),
      groupOf(1, null, 10),
      groupOf(2, 450, 5),
    ]);

    expect(averages).toEqual([
      { programId: 2, name: "Prodi 2", students: 5, average: 75 },
      { programId: 1, name: "Prodi 1", students: 14, average: null },
    ]);
  });
});
