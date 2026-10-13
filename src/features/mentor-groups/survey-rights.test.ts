import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { maySurveyBeManagedBy, surveyRightsFor } from "./survey-rights";

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "akun-uji", roles, studyProgramId, studentId: null };
}

describe("maySurveyBeManagedBy", () => {
  it("lets Kepala Unit manage the survey periods", () => {
    expect(maySurveyBeManagedBy(account(["head_of_unit"]))).toBe(true);
  });

  it.each([
    "director",
    "head_of_program",
    "upk_staff",
    "mentor",
    "student",
  ] as const)("refuses %s, who may not manage them", (role) => {
    expect(maySurveyBeManagedBy(account([role]))).toBe(false);
  });
});

describe("surveyRightsFor", () => {
  it("gives Kepala Unit the form and the students of every program", () => {
    expect(surveyRightsFor(account(["head_of_unit"]))).toEqual({
      mayManage: true,
      respondents: { kind: "all" },
    });
  });

  it.each(["director", "upk_staff"] as const)(
    "lets %s only read, and counts the students of every program",
    (role) => {
      expect(surveyRightsFor(account([role]))).toEqual({
        mayManage: false,
        respondents: { kind: "all" },
      });
    },
  );

  it("lets Ketua Program Studi only read, and counts the students of their program", () => {
    expect(surveyRightsFor(account(["head_of_program"], 7))).toEqual({
      mayManage: false,
      respondents: {
        kind: "some",
        studyProgramIds: [7],
        menteesOf: [],
        studentIds: [],
      },
    });
  });

  it("counts no student for Ketua Program Studi without a program", () => {
    expect(surveyRightsFor(account(["head_of_program"])).respondents).toEqual({
      kind: "some",
      studyProgramIds: [],
      menteesOf: [],
      studentIds: [],
    });
  });

  it("adds no student through a role that does not open Pengasuh", () => {
    const both = account(["head_of_program", "counsellor"], 7);

    expect(surveyRightsFor(both).respondents).toMatchObject({
      kind: "some",
      studyProgramIds: [7],
    });
  });
});
