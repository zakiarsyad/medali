import { describe, expect, it } from "vitest";
import { groupCode } from "@/ui/group-code";
import { type FormedGroup, formGroups, type NewStudent } from "./form-groups";
import { ASSIGNMENT_METHODS } from "./methods";

const PAJAK = 7;
const AKUNTANSI = 2;

function students(
  count: number,
  studyProgramId: number,
  entryPath: NewStudent["entryPath"] = "regular",
): NewStudent[] {
  return Array.from({ length: count }, (_, place) => {
    const nim = `${entryPath === "regular" ? 1 : 2}${studyProgramId}${String(place).padStart(3, "0")}`;
    return {
      id: `student-${nim}`,
      nim,
      sex: place % 2 === 0 ? "male" : "female",
      province: place % 3 === 0 ? "Bali" : "Aceh",
      className: `1-0${(place % 2) + 1}`,
      studyProgramId,
      entryPath,
    };
  });
}

function sizes(groups: FormedGroup[]): number[] {
  return groups.map((group) => group.studentIds.length);
}

describe("formGroups", () => {
  it("forms the groups of each program studi and jalur apart, numbered from 1", () => {
    const everyone = [
      ...students(60, PAJAK),
      ...students(34, AKUNTANSI),
      ...students(12, PAJAK, "transfer"),
    ];

    const groups = formGroups(everyone, 30, "by_nim");

    expect(
      groups.map(({ studentIds, ...group }) => ({
        ...group,
        members: studentIds.length,
      })),
    ).toEqual([
      {
        studyProgramId: AKUNTANSI,
        entryPath: "regular",
        number: 1,
        members: 34,
      },
      { studyProgramId: PAJAK, entryPath: "regular", number: 1, members: 30 },
      { studyProgramId: PAJAK, entryPath: "regular", number: 2, members: 30 },
      { studyProgramId: PAJAK, entryPath: "transfer", number: 1, members: 12 },
    ]);
  });

  it("puts only students of the group's own program studi and jalur in it", () => {
    const everyone = [
      ...students(40, PAJAK),
      ...students(26, AKUNTANSI),
      ...students(5, AKUNTANSI, "transfer"),
    ];
    const byId = new Map(everyone.map((student) => [student.id, student]));

    for (const group of formGroups(everyone, 30, "balanced")) {
      for (const id of group.studentIds) {
        expect(byId.get(id)).toMatchObject({
          studyProgramId: group.studyProgramId,
          entryPath: group.entryPath,
        });
      }
    }
  });

  it.each(ASSIGNMENT_METHODS)(
    "puts every student in one group, by %s",
    (method) => {
      const everyone = [...students(61, PAJAK), ...students(34, AKUNTANSI)];

      const placed = formGroups(everyone, 30, method).flatMap(
        (group) => group.studentIds,
      );

      expect(placed.sort()).toEqual(everyone.map((s) => s.id).sort());
    },
  );

  it("makes as many groups as the target size asks for", () => {
    const everyone = students(90, PAJAK);

    expect(sizes(formGroups(everyone, 30, "by_nim"))).toEqual([30, 30, 30]);
    expect(sizes(formGroups(everyone, 35, "by_nim"))).toEqual([30, 30, 30]);
    expect(sizes(formGroups(students(100, PAJAK), 25, "by_nim"))).toEqual([
      25, 25, 25, 25,
    ]);
  });

  it("uses a target size outside 25 to 35 as its nearest end", () => {
    const everyone = students(100, PAJAK);

    expect(sizes(formGroups(everyone, 5, "by_nim"))).toEqual(
      sizes(formGroups(everyone, 25, "by_nim")),
    );
  });

  it("splits by the method asked", () => {
    const everyone = students(60, PAJAK);
    const first = (method: (typeof ASSIGNMENT_METHODS)[number]) =>
      formGroups(everyone, 30, method)[0]?.studentIds.slice(0, 3);

    // Urut NIM keeps the first three together.
    expect(first("by_nim")).toEqual([
      "student-17000",
      "student-17001",
      "student-17002",
    ]);
    // Kelas 1-01 holds the even places.
    expect(first("by_class")).toEqual([
      "student-17000",
      "student-17002",
      "student-17004",
    ]);
    // Putra from Aceh come first, dealt out in a snake over the two groups.
    expect(first("balanced")).toEqual([
      "student-17002",
      "student-17010",
      "student-17014",
    ]);
  });

  it("numbers the groups so their codes read like KP 26-D3PJK-01", () => {
    const groups = formGroups(
      [...students(60, PAJAK), ...students(12, PAJAK, "transfer")],
      30,
      "by_nim",
    );

    const codes = groups.map((group) =>
      groupCode({ ...group, cohortYear: 2026, programCode: "D3PJK" }),
    );

    expect(codes).toEqual([
      "KP 26-D3PJK-01",
      "KP 26-D3PJK-02",
      "KP 26-D3PJK-AJ-01",
    ]);
  });

  it("forms no group of nobody", () => {
    expect(formGroups([], 30, "balanced")).toEqual([]);
  });
});
