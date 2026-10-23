import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import {
  mayResultsBeFixedBy,
  maySurveyBeManagedBy,
  surveyResultRowsFor,
  surveyRightsFor,
} from "./survey-rights";

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "akun-uji", roles, studyProgramId, studentId: null };
}

const OWN_PROGRAM = {
  kind: "some",
  studyProgramIds: [7],
  menteesOf: [],
  studentIds: [],
} as const;

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

describe("mayResultsBeFixedBy", () => {
  it("lets Kepala Unit fix the results", () => {
    expect(mayResultsBeFixedBy(account(["head_of_unit"]))).toBe(true);
  });

  it.each([
    "director",
    "head_of_program",
    "upk_staff",
    "mentor",
    "student",
  ] as const)("refuses %s, who may not fix them", (role) => {
    expect(mayResultsBeFixedBy(account([role]))).toBe(false);
  });
});

describe("surveyResultRowsFor", () => {
  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "lets %s read the results of every group",
    (role) => {
      expect(surveyResultRowsFor(account([role]))).toEqual({ kind: "all" });
    },
  );

  it("lets Ketua Program Studi read the results of their program's groups only", () => {
    expect(surveyResultRowsFor(account(["head_of_program"], 7))).toEqual(
      OWN_PROGRAM,
    );
  });

  it.each(["mentor", "student", "counsellor"] as const)(
    "gives %s no results",
    (role) => {
      expect(surveyResultRowsFor(account([role]))).toBe(null);
    },
  );

  it("adds no group through another role of the account", () => {
    const both = account(["head_of_program", "dorm_manager"], 7);

    expect(surveyResultRowsFor(both)).toEqual(OWN_PROGRAM);
  });
});

describe("surveyRightsFor", () => {
  it("gives Kepala Unit the form, the students and the results of every program", () => {
    expect(surveyRightsFor(account(["head_of_unit"]))).toEqual({
      mayManage: true,
      respondents: { kind: "all" },
      results: { kind: "all" },
      mayFix: true,
    });
  });

  it.each(["director", "upk_staff"] as const)(
    "lets %s only read, and counts the students of every program",
    (role) => {
      expect(surveyRightsFor(account([role]))).toEqual({
        mayManage: false,
        respondents: { kind: "all" },
        results: { kind: "all" },
        mayFix: false,
      });
    },
  );

  it("lets Ketua Program Studi only read, and counts the students of their program", () => {
    expect(surveyRightsFor(account(["head_of_program"], 7))).toEqual({
      mayManage: false,
      respondents: OWN_PROGRAM,
      results: OWN_PROGRAM,
      mayFix: false,
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
