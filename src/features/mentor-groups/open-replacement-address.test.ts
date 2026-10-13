import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { replacementAddress } from "./evaluation-address";
import { openReplacementAddress } from "./open-replacement-address";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a01";

function account(roles: RoleId[]): AccountForAccess {
  return { id: "account-1", roles, studyProgramId: 7, studentId: null };
}

describe("openReplacementAddress", () => {
  it("gives Kepala Unit the form of a replacement with the group chosen", () => {
    expect(openReplacementAddress(account(["head_of_unit"]), GROUP_ID)).toBe(
      replacementAddress(GROUP_ID),
    );
  });

  it("gives every other role no button, the roles that only read among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    for (const reader of ["director", "upk_staff", "head_of_program"]) {
      expect(others).toContain(reader);
    }
    for (const role of others) {
      expect(openReplacementAddress(account([role]), GROUP_ID)).toBeNull();
    }
  });
});
