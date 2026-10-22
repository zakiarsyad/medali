import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { BAM_ROLES } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import { dashboardScopeOf } from "./dashboard-scope";

function accountOf(roles: RoleId[]): AccountForAccess {
  return { id: "x", roles, studyProgramId: 3, studentId: null };
}

describe("dashboardScopeOf", () => {
  it("gives Kepala Unit and Direktur every student, with the choice of a program studi", () => {
    for (const role of ["head_of_unit", "director"] as const) {
      expect(dashboardScopeOf(accountOf([role]))?.picksProgram).toBe(true);
    }
  });

  it("gives Ketua Program Studi a scope without the choice of a program studi", () => {
    const scope = dashboardScopeOf(accountOf(["head_of_program"]));

    expect(scope).not.toBeNull();
    expect(scope?.picksProgram).toBe(false);
  });

  it("lets only Kepala Unit count the illnesses of the students", () => {
    expect(
      dashboardScopeOf(accountOf(["head_of_unit"]))?.illnesses,
    ).toBeTruthy();
    for (const role of ["director", "head_of_program"] as const) {
      expect(dashboardScopeOf(accountOf([role]))?.illnesses).toBeNull();
    }
  });

  it("gives a person who is also Pengasuh the scope of their staff role", () => {
    const scope = dashboardScopeOf(accountOf(["mentor", "director"]));

    expect(scope?.picksProgram).toBe(true);
  });

  it("lets the three roles read the counselling data published to them, as themselves", () => {
    for (const role of [
      "head_of_unit",
      "director",
      "head_of_program",
    ] as const) {
      const scope = dashboardScopeOf(accountOf([role]));

      expect(scope?.shared?.readerId).toBe("x");
      expect(scope?.shared?.reach).toBeTruthy();
    }
  });

  it("reads no data published to Pengasuh on the Dashboard of a person who is also Pengasuh", () => {
    const both = dashboardScopeOf(accountOf(["mentor", "head_of_program"]));
    const alone = dashboardScopeOf(accountOf(["head_of_program"]));

    expect(both?.shared?.reach).toEqual(alone?.shared?.reach);
  });

  it("refuses every role without the right, so none of the numbers is read", () => {
    const refused: RoleId[] = [
      "mentor",
      "counsellor",
      "student",
      "upk_staff",
      "dorm_manager",
      "assessor",
      "discipline_officer",
      ...BAM_ROLES,
    ];
    for (const role of refused) {
      expect(dashboardScopeOf(accountOf([role]))).toBeNull();
    }
  });
});
