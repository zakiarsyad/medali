import { describe, expect, it } from "vitest";
import { countDraftStudents, type PlacedStudent } from "./draft-students";

function student(id: string, more: Partial<PlacedStudent> = {}): PlacedStudent {
  return { id, studyProgramId: 1, entryPath: "regular", ...more };
}

const GROUPS = [
  {
    studyProgramId: 1,
    entryPath: "regular" as const,
    members: [{ id: "s1" }, { id: "s2" }],
  },
  {
    studyProgramId: 2,
    entryPath: "regular" as const,
    members: [{ id: "s3" }],
  },
];

const WAITING = [
  student("s1"),
  student("s2"),
  student("s3", { studyProgramId: 2 }),
];

describe("countDraftStudents", () => {
  it("counts nobody while every waiting student is in a group of their program studi and jalur", () => {
    expect(countDraftStudents(GROUPS, WAITING)).toEqual({
      outsideDraft: 0,
      inWrongGroup: 0,
    });
  });

  it("counts the waiting students who are in no group of the draft", () => {
    const waiting = [...WAITING, student("s4"), student("s5")];

    expect(countDraftStudents(GROUPS, waiting)).toEqual({
      outsideDraft: 2,
      inWrongGroup: 0,
    });
  });

  it("counts the members whose program studi or jalur is not that of their group any more", () => {
    const waiting = [
      student("s1", { studyProgramId: 2 }),
      student("s2", { entryPath: "transfer" }),
      student("s3", { studyProgramId: 2 }),
    ];

    expect(countDraftStudents(GROUPS, waiting)).toEqual({
      outsideDraft: 0,
      inWrongGroup: 2,
    });
  });

  it("leaves a member who does not wait for a group any more to the check of the penetapan", () => {
    expect(countDraftStudents(GROUPS, [student("s1")])).toEqual({
      outsideDraft: 0,
      inWrongGroup: 0,
    });
  });
});
