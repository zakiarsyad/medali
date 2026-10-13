import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { attendanceRowsFor, filledRowsFor } from "./visible-attendance";

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "account-1", roles, studyProgramId, studentId: null };
}

const OWN_GROUPS = {
  kind: "some",
  studyProgramIds: [],
  menteesOf: ["account-1"],
  studentIds: [],
};

describe("attendanceRowsFor", () => {
  it("gives Kepala Unit and Direktur every group", () => {
    expect(attendanceRowsFor(account(["head_of_unit"]))).toEqual({
      kind: "all",
    });
    expect(attendanceRowsFor(account(["director"]))).toEqual({ kind: "all" });
  });

  it("keeps Ketua Program Studi to the groups of their program", () => {
    expect(attendanceRowsFor(account(["head_of_program"], 4))).toEqual({
      ...OWN_GROUPS,
      studyProgramIds: [4],
      menteesOf: [],
    });
  });

  it("keeps Pengasuh to the groups they hold", () => {
    expect(attendanceRowsFor(account(["mentor"]))).toEqual(OWN_GROUPS);
  });

  it.each(["upk_staff", "student", "counsellor", "dorm_manager"] as const)(
    "gives %s no attendance at all",
    (role) => {
      expect(attendanceRowsFor(account([role]))).toBeNull();
    },
  );
});

describe("filledRowsFor", () => {
  it("lets Pengasuh fill in for the groups they hold", () => {
    expect(filledRowsFor(account(["mentor"]))).toEqual(OWN_GROUPS);
  });

  it.each([
    "head_of_unit",
    "director",
    "head_of_program",
    "upk_staff",
  ] as const)("gives %s nothing to fill in", (role) => {
    expect(filledRowsFor(account([role], 4))).toBeNull();
  });

  it("lets Pengasuh who is also Kepala Unit fill in only for the groups they hold", () => {
    expect(filledRowsFor(account(["mentor", "head_of_unit"]))).toEqual(
      OWN_GROUPS,
    );
  });
});
