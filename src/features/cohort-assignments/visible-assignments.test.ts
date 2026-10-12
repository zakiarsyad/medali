import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { onlyProgram } from "./test-records";
import { assignmentRowsFor, EVERY_ROW, isLimited } from "./visible-assignments";

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "account-1", roles, studyProgramId, studentId: null };
}

describe("assignmentRowsFor", () => {
  it.each<RoleId>(["head_of_unit", "upk_staff", "director"])(
    "lets %s read the penetapan of every program studi",
    (role) => {
      expect(assignmentRowsFor(account([role]))).toEqual(EVERY_ROW);
    },
  );

  it("holds Ketua Program Studi to the program studi of the account", () => {
    const limit = assignmentRowsFor(account(["head_of_program"], 7));

    expect(limit).toEqual(onlyProgram(7));
    expect(limit && isLimited(limit)).toBe(true);
  });

  it.each<RoleId>(["mentor", "student", "dorm_manager"])(
    "gives %s nothing to read, so the tab refuses the account",
    (role) => {
      expect(assignmentRowsFor(account([role], 7))).toBeNull();
    },
  );
});
