import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { BAM_ROLES } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import { menteeAccountOf, menteeScopeOf } from "./mentee-scope";

function accountOf(roles: RoleId[]): AccountForAccess {
  return { id: "x", roles, studyProgramId: 3, studentId: null };
}

describe("menteeScopeOf", () => {
  it("gives Pengasuh their own anak asuh, read as themselves", () => {
    const scope = menteeScopeOf(accountOf(["mentor"]));

    expect(scope?.mentorIds).toEqual(["x"]);
    expect(scope?.mentees).toBeTruthy();
    expect(scope?.shared?.readerId).toBe("x");
    expect(scope?.notes).toBeTruthy();
    expect(scope?.illnesses).toBeTruthy();
  });

  it("keeps the limits of Pengasuh for a person who is also Kepala Unit or Ketua Program Studi", () => {
    const alone = menteeScopeOf(accountOf(["mentor"]));
    for (const role of [
      "head_of_unit",
      "director",
      "head_of_program",
    ] as const) {
      const both = menteeScopeOf(accountOf(["mentor", role]));

      expect(both?.mentorIds).toEqual(["x"]);
      expect(both?.mentees).toEqual(alone?.mentees);
      expect(both?.shared?.reach).toEqual(alone?.shared?.reach);
      expect(both?.notes).toEqual(alone?.notes);
      expect(both?.illnesses).toEqual(alone?.illnesses);
      expect(both?.detail).toEqual(alone?.detail);
      expect(menteeAccountOf(accountOf(["mentor", role])).roles).toEqual([
        "mentor",
      ]);
    }
  });

  it("refuses every role without the right, so none of the numbers is read", () => {
    const refused: RoleId[] = [
      "head_of_unit",
      "director",
      "head_of_program",
      "counsellor",
      "student",
      "upk_staff",
      "assessor",
      ...BAM_ROLES,
    ];
    for (const role of refused) {
      expect(menteeScopeOf(accountOf([role]))).toBeNull();
    }
  });
});
