import { describe, expect, it } from "vitest";
import {
  type GroupWithMembers,
  mayMoveBetween,
  moveMember,
  moveTargets,
} from "./move-member";

function group(
  id: string,
  studentIds: string[] = [],
  more: Partial<GroupWithMembers> = {},
): GroupWithMembers {
  return { id, studyProgramId: 7, entryPath: "regular", studentIds, ...more };
}

const DRAFT = [
  group("pajak-1", ["ani", "budi"]),
  group("pajak-2", ["candra"]),
  group("pajak-alih", ["dewi"], { entryPath: "transfer" }),
  group("akuntansi-1", ["eko"], { studyProgramId: 2 }),
];

describe("mayMoveBetween", () => {
  it("lets a member move to another group of the same program studi and jalur", () => {
    expect(mayMoveBetween(group("a"), group("b"))).toBe(true);
  });

  it("refuses the group the member is in already", () => {
    expect(mayMoveBetween(group("a"), group("a"))).toBe(false);
  });

  it("refuses a group of another program studi", () => {
    const other = group("b", [], { studyProgramId: 2 });

    expect(mayMoveBetween(group("a"), other)).toBe(false);
  });

  it("refuses a group of the other jalur", () => {
    const other = group("b", [], { entryPath: "transfer" });

    expect(mayMoveBetween(group("a"), other)).toBe(false);
  });
});

describe("moveTargets", () => {
  it("offers the other groups of the same program studi and jalur", () => {
    const targets = moveTargets(DRAFT, "pajak-1").map((one) => one.id);

    expect(targets).toEqual(["pajak-2"]);
  });

  it("offers none when the program studi and jalur have one group", () => {
    expect(moveTargets(DRAFT, "akuntansi-1")).toEqual([]);
    expect(moveTargets(DRAFT, "pajak-alih")).toEqual([]);
  });

  it("offers none for a group that is not of the draft", () => {
    expect(moveTargets(DRAFT, "tidak-ada")).toEqual([]);
  });
});

describe("moveMember", () => {
  it("takes the student out of their group and puts them last in the other", () => {
    const moved = moveMember(DRAFT, "ani", "pajak-2");

    expect(moved?.map((one) => one.studentIds)).toEqual([
      ["budi"],
      ["candra", "ani"],
      ["dewi"],
      ["eko"],
    ]);
  });

  it("does not change the groups it was given", () => {
    moveMember(DRAFT, "ani", "pajak-2");

    expect(DRAFT[0]?.studentIds).toEqual(["ani", "budi"]);
    expect(DRAFT[1]?.studentIds).toEqual(["candra"]);
  });

  it.each([
    ["a group of another program studi", "akuntansi-1"],
    ["a group of the other jalur", "pajak-alih"],
    ["the group the student is in", "pajak-1"],
    ["a group that is not of the draft", "tidak-ada"],
  ])("refuses a move to %s", (_what, toGroupId) => {
    expect(moveMember(DRAFT, "ani", toGroupId)).toBe(null);
  });

  it("refuses to move a student who is in no group of the draft", () => {
    expect(moveMember(DRAFT, "orang-lain", "pajak-2")).toBe(null);
  });
});
