import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { groupAddress } from "./group-list-address";
import { openGroupAddress } from "./open-group-address";

const GROUP = { id: "00000000-0000-4000-8000-000000000001", studyProgramId: 7 };

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "a", roles, studyProgramId, studentId: null };
}

describe("openGroupAddress", () => {
  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "gives %s the address of any group's page",
    (role) => {
      expect(openGroupAddress(account([role]), GROUP)).toBe(
        groupAddress(GROUP.id),
      );
    },
  );

  it("gives Ketua Program Studi the address of a group of their program", () => {
    expect(openGroupAddress(account(["head_of_program"], 7), GROUP)).toBe(
      groupAddress(GROUP.id),
    );
  });

  it("gives Ketua Program Studi none for a group of another program", () => {
    expect(openGroupAddress(account(["head_of_program"], 8), GROUP)).toBeNull();
    expect(openGroupAddress(account(["head_of_program"]), GROUP)).toBeNull();
  });

  it.each(["mentor", "student", "dorm_manager", "counsellor"] as const)(
    "gives %s none, who may not open Pengasuh",
    (role) => {
      expect(openGroupAddress(account([role], 7), GROUP)).toBeNull();
    },
  );
});
