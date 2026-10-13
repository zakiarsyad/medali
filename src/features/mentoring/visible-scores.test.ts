import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { givenRowsFor, scoreRowsFor } from "./visible-scores";

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

describe("scoreRowsFor", () => {
  it("gives Kepala Unit and Direktur every group", () => {
    expect(scoreRowsFor(account(["head_of_unit"]))).toEqual({ kind: "all" });
    expect(scoreRowsFor(account(["director"]))).toEqual({ kind: "all" });
  });

  it("keeps Ketua Program Studi to the groups of their program", () => {
    expect(scoreRowsFor(account(["head_of_program"], 4))).toEqual({
      ...OWN_GROUPS,
      studyProgramIds: [4],
      menteesOf: [],
    });
  });

  it("keeps Pengasuh to the groups they hold", () => {
    expect(scoreRowsFor(account(["mentor"]))).toEqual(OWN_GROUPS);
  });

  it.each(["upk_staff", "student", "counsellor", "dorm_manager"] as const)(
    "gives %s no score at all",
    (role) => {
      expect(scoreRowsFor(account([role]))).toBeNull();
    },
  );
});

describe("givenRowsFor", () => {
  it("lets Pengasuh give scores in the groups they hold", () => {
    expect(givenRowsFor(account(["mentor"]))).toEqual(OWN_GROUPS);
  });

  it.each([
    "head_of_unit",
    "director",
    "head_of_program",
    "upk_staff",
  ] as const)("gives %s nobody to score", (role) => {
    expect(givenRowsFor(account([role], 4))).toBeNull();
  });

  it("lets Pengasuh who is also Kepala Unit give scores only in the groups they hold", () => {
    expect(givenRowsFor(account(["mentor", "head_of_unit"]))).toEqual(
      OWN_GROUPS,
    );
  });
});
