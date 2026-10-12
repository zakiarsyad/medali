import { describe, expect, it } from "vitest";
import { fillEmptyMentors, type GroupToFill } from "./fill-mentors";

const PAJAK = "Jurusan Pajak";
const AKUNTANSI = "Jurusan Akuntansi";

function group(programName: string, mentorId: string | null = null) {
  return { programName, mentorId };
}

function mentorIds(groups: GroupToFill[]): (string | null)[] {
  return groups.map((one) => one.mentorId);
}

describe("fillEmptyMentors", () => {
  it("gives each empty group the first unused mentor of its jurusan", () => {
    const pool = [
      { id: "akuntansi-1", unit: AKUNTANSI },
      { id: "pajak-1", unit: PAJAK },
      { id: "pajak-2", unit: PAJAK },
    ];
    const groups = [
      group("D3 Pajak"),
      group("D3 Pajak"),
      group("D3 Akuntansi"),
    ];

    expect(mentorIds(fillEmptyMentors(groups, pool))).toEqual([
      "pajak-1",
      "pajak-2",
      "akuntansi-1",
    ]);
  });

  it("takes the first unused mentor of any unit when none of the jurusan is left", () => {
    const pool = [
      { id: "upk", unit: "Unit Pembangunan Karakter" },
      { id: "pajak-1", unit: PAJAK },
      { id: "tanpa-unit", unit: null },
    ];
    const groups = [group("D3 Pajak"), group("D3 Pajak"), group("D3 Pajak")];

    expect(mentorIds(fillEmptyMentors(groups, pool))).toEqual([
      "pajak-1",
      "upk",
      "tanpa-unit",
    ]);
  });

  it("leaves a mentor already chosen alone, and gives that mentor to no other group", () => {
    const pool = [
      { id: "pajak-1", unit: PAJAK },
      { id: "pajak-2", unit: PAJAK },
    ];
    const groups = [group("D3 Pajak"), group("D3 Pajak", "pajak-1")];

    expect(mentorIds(fillEmptyMentors(groups, pool))).toEqual([
      "pajak-2",
      "pajak-1",
    ]);
  });

  it("keeps a chosen mentor who is not in the pool", () => {
    const groups = [group("D3 Pajak", "di-luar")];

    expect(mentorIds(fillEmptyMentors(groups, []))).toEqual(["di-luar"]);
  });

  it("leaves the groups empty that the pool has no mentor left for", () => {
    const pool = [{ id: "pajak-1", unit: PAJAK }];
    const groups = [group("D3 Pajak"), group("D3 Pajak")];

    expect(mentorIds(fillEmptyMentors(groups, pool))).toEqual([
      "pajak-1",
      null,
    ]);
  });

  it("keeps everything else of a group, and does not change what it was given", () => {
    const groups = [{ ...group("D3 Pajak"), id: "kelompok-1", number: 1 }];

    const filled = fillEmptyMentors(groups, [{ id: "pajak-1", unit: PAJAK }]);

    expect(filled).toEqual([
      {
        id: "kelompok-1",
        number: 1,
        programName: "D3 Pajak",
        mentorId: "pajak-1",
      },
    ]);
    expect(groups[0]?.mentorId).toBe(null);
  });
});
